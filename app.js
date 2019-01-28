/***
 * 绘制相关的基础数据
 */
const BaseData = {
  width: 0, //画布宽
  height: 0, //canvas height
  svg: null, //main container
  linesSvg: null, //lines container
  nodes: null, //nodes info
  scale: -1, //路径距离单位和svg尺寸的比值
  svgSites: null, //svg Node map one node data
  nodesDistance: {}, //节点的距离信息{'1-2':1}
  nodesLines: [], //待绘制的节点连线信息[[node1,node2],[node3,node4]]
  allLinesSVg: null, //所有连线的line对象
  shortLineColor: "blue", //最短路径线段的颜色
  firstNodeNumInLine: [1, 5, 9, 12], //第一排第一个元素
  markers: {
    //初始化默认的marker
    start: "11",
    track: [[3, 12], [7, 11], [4, 13]]
  }
};
const APP = function() {};
APP.prototype.updateSize = () => {
  console.log($(".graph").width(), $(".graph").height());
  BaseData.width = $(".graph").width() || 800;
  BaseData.height = $(".graph").height() || 600;
  BaseData.scale = BaseData.width / 5;
};

const getPreNodeDistance = node => {
  let siteName = node.siteNo;
  let preName = parseInt(siteName) - 2 + "";
  if (node.nextMap[parseInt(siteName) - 1]) {
    return BaseData.nodes[preName];
  }
};

const getLineXY = (node, idx, type) => {
  if ("x1" == type) return 0;
  if ("y1" == type) return 0;
  if ("x2" == type) return BaseData.nodes[4].x;
  if ("y2" == type) return BaseData.nodes[4].y;
};
//计算相关坐标
APP.prototype.getXYInfo = (node, i, shape, isXais) => {
  let { siteNo, nextMap } = node;
  let yIncrement = BaseData.scale;
  let siteNoInt = parseInt(siteNo);
  if (siteNoInt <= 4) {
    yIncrement = 0;
  } else if (siteNoInt <= 8) {
    yIncrement = BaseData.scale * 1;
  } else if (siteNoInt <= 11) {
    yIncrement = BaseData.scale * 2;
  } else if (siteNoInt <= 15) {
    yIncrement = BaseData.scale * 3;
  }
  console.log("xy", node);
  if (shape == "circle") {
    let pre = getPreNodeDistance(node);
    console.log("getPreNodeDistance", node, pre);
    if (isXais) {
      if (i == 0) {
        node.x = 50;
      } else {
        if (pre) {
          if (node.siteNo == "10") {
            node.x = pre.x + BaseData.scale * 2;
          } else {
            node.x =
              pre.x +
              BaseData.scale * pre.nextMap[parseInt(pre.siteNo) + 1 + ""];
          }
        } else {
          node.x = 50;
        }
      }
      return node.x;
    } else {
      if (i == 0) {
        node.y = 50;
      } else {
        if (pre) {
          node.y = pre.y;
        } else {
          node.y = BaseData.nodes[0].y + yIncrement;
        }
      }
      return node.y;
    }
  }
};

const app = new APP();
/**
 * 获取Site数据
 */
function getPathInfo() {
  $.ajax({
    url: "map/init",
    type: "get",
    success(resp) {
      initNodes(resp);
      drawSites(BaseData.nodes);
    },
    error(err) {
      console.log(err);
    }
  });
}

/**
 *构造nodes数据
 *
 * @param {*} data
 */
function initNodes(data) {
  if (!data || Object.keys(data).length < 1) return;
  let origins = Object.keys(data);
  origins.sort((a, b) => {
    a = parseInt(a);
    b = parseInt(b);
    return a > b ? 1 : a < b ? -1 : 0;
  });
  let nodes = [];
  origins.forEach(key => {
    nodes.push(data[key]);
  });
  BaseData.nodes = nodes;
  /* 获取各点路径信息 */

  console.log(nodes);
}

/**
 *绘制Sites
 *
 * @param {*} sites
 */
function drawSites(sites) {
  if (!sites || sites.length < 1) {
    throw new Error("need nodes to drawSites Graph!");
  }
  if (!BaseData.svg) {
    BaseData.svg = d3
      .select(".graph")
      .append("svg")
      .attr("width", BaseData.width)
      .attr("height", BaseData.height);
  }

  BaseData.linesSvg = BaseData.svg
    .selectAll("g.lines")
    .data(["lines"])
    .enter()
    .append("g")
    .attr("class", d => d)
    .attr("id", d => d);

  BaseData.svgSites = BaseData.svg
    .selectAll("g.node")
    .data(sites)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("id", d => d.siteNo)
    .attr("transform", (d, i) => {
      let x = app.getXYInfo(d, i, "circle", true);
      let y = app.getXYInfo(d, i, "circle", false);
      return `translate(${x},${y})`;
    });

  //绘制圆环
  BaseData.svgSites
    .append("circle")
    .attr("r", 15)
    .attr("siteNo", d => d.siteNo)
    .attr("class", "site");
  //绘制文本
  BaseData.svgSites.append("text").text(d => d.siteNo);

  //绘制节点连线
  BaseData.nodesLines = [];
  BaseData.nodes.forEach((node, idx) => {
    node.useage = { bottom: true, left: true, right: true, top: true };
    let nodeMap = node.nextMap;
    let parentNodeName = node.siteNo;
    for (var key in nodeMap) {
      let nodeName = key;
      let nodeLength = nodeMap[nodeName];
      //计算各点的占用情况，某个点的上下左右是否有占用
      let currentNode = node;
      let nextNode = findNode(nodeName);
      markNodeUsage(currentNode, nextNode);
      //获取2点的对应关系，用于连线，如1-2，2-1只需要画一条线即可
      let lineName = [parentNodeName, nodeName]
        .sort((a, b) => {
          a = parseInt(a);
          b = parseInt(b);
          return a > b ? 1 : a < b ? -1 : 0;
        })
        .join("-");
      console.log("line-Name", lineName);
      if (BaseData.nodesDistance[lineName]) {
        console.info(BaseData.nodesDistance, lineName);
        continue;
      }
      BaseData.nodesDistance[lineName] = nodeLength;
      BaseData.nodesLines.push([node, findNode(nodeName)]);
    }
  });
  drawNodeLine();
  drawDefaultMaker();
}

//获取可用的marker位置，如果4个方式没有，返回一个可用的位置坐标
const getValiableMarkerPos = node => {
  const dx = (dy = 40);
  if (!node.useage) return { x: node.x, y: node.y - dy };
  let canUsePos = null;
  for (var key in node.useage) {
    if (node.useage[key]) {
      canUsePos = key;
      break;
    }
  }
  if (canUsePos == null) return { x: node.x, y: node.y };
  if (key == "top") return { x: node.x-12, y: node.y - dy };
  if (key == "left") return { x: node.x - dx, y: node.y-12 };
  if (key == "right") return { x: node.x + dx-24, y: node.y-12 };
  if (key == "bottom") return { x: node.x-12, y: node.y + dy -24 };
};
const drawDefaultMaker = () => {
  drawStartPosition(BaseData.markers.start);
};

const drawStartPosition = nodeName => {
  let node = findNode(nodeName);
  let xy = getValiableMarkerPos(node);
  console.log("xy", xy);
  let rectMarker = BaseData.svg
    .selectAll(`rect.marker`)
    .data(["A"])
    .enter()
    .append("rect")
    .attr("width", 25)
    .attr("height", 25)
    .attr("class", "marker start")
    .attr("transform", (d, i) => {
      return `translate(${xy.x},${xy.y})`;
    });

  rectMarker
    .append("text")
    .attr("class", "text")
    .attr("dx", 10)
    .attr("dy", 13)
    .text(d => {
      return d;
    });
};

//标记一个node在四个方向的占用情况
const markNodeUsage = (currentNode, nextNode) => {
  if (currentNode.x == nextNode.x) {
    if (currentNode.y > nextNode.y) currentNode.useage["top"] = false;
    else {
      currentNode.useage["bottom"] = false;
    }
  }
  if (currentNode.y == nextNode.y) {
    if (currentNode.x > nextNode.x) currentNode.useage["left"] = false;
    else {
      currentNode.useage["right"] = false;
    }
  }
};
/**
 * find node by siteNo
 */
function findNode(name) {
  return BaseData.nodes.find(i => {
    return i.siteNo == name;
  });
}

function drawNodeLine() {
  console.log("drawLine", BaseData.nodesLines);
  BaseData.allLinesSVg = BaseData.linesSvg
    .selectAll(".line")
    .data(BaseData.nodesLines)
    .enter()
    .append("line")
    .attr("class", "line")
    .attr("x1", d => {
      return d[0].x;
    })
    .attr("y1", d => {
      return d[0].y;
    })
    .attr("x2", d => {
      return d[1].x;
    })
    .attr("y2", d => {
      return d[1].y;
    });

  let lineGroup = BaseData.linesSvg
    .selectAll("g")
    .data(Object.keys(BaseData.nodesDistance))
    .enter()
    .append("g")
    .attr("class", "nodeLen")
    .on("click", d => {
      console.log("len click", d);
    });

  lineGroup.attr("transform", (d, i) => {
    let x = (y = -1);
    let nodesName = d.split("-");
    let node1 = findNode(nodesName[0]);
    let node2 = findNode(nodesName[1]);
    if (node1.y == node2.y) {
      x = node1.x + (node2.x - node1.x) / 2 - 10;
      y = node1.y - 10;
    } else if (node1.x == node2.x) {
      y = node1.y + (node2.y - node1.y) / 2 - 10;
      x = node1.x - 10;
    }
    return `translate(${x},${y})`;
  });
  lineGroup
    .append("rect")
    .attr("width", 25)
    .attr("height", 25)
    .attr("class", "distance")
    .attr("fill", "white");

  let lineGroupRect = lineGroup
    .append("text")
    .attr("class", "text")
    .attr("dx", 10)
    .attr("dy", 13)
    .text(d => {
      console.log("text", BaseData.nodesDistance[d]);
      return BaseData.nodesDistance[d];
    });
  console.log("userage", BaseData.nodes);
}

$(() => {
  app.updateSize();
  getPathInfo();
  console.log("app", BaseData);
});

//计算最短路径
getShortestPath = () => {};
