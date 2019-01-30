/***
 * 绘制相关的基础数据
 */
const BaseData = {
  shapeData: {
    "11": { siteNo: "11", nextMap: { "14": 1, "8": 1, "10": 1 } },
    "12": { siteNo: "12", nextMap: { "13": 2, "9": 2 } },
    "13": { siteNo: "13", nextMap: { "12": 2, "14": 1, "10": 2 } },
    "14": { siteNo: "14", nextMap: { "11": 1, "13": 1, "15": 1 } },
    "15": { siteNo: "15", nextMap: { "14": 1, "4": 3 } },
    "1": { siteNo: "1", nextMap: { "2": 1, "5": 1 } },
    "2": { siteNo: "2", nextMap: { "1": 1, "3": 2, "6": 2 } },
    "3": { siteNo: "3", nextMap: { "2": 2, "4": 1, "8": 2 } },
    "4": { siteNo: "4", nextMap: { "3": 1, "15": 3 } },
    "5": { siteNo: "5", nextMap: { "1": 1, "6": 1, "9": 1 } },
    "6": { siteNo: "6", nextMap: { "2": 2, "5": 1, "7": 1 } },
    "7": { siteNo: "7", nextMap: { "6": 1, "8": 1, "10": 1 } },
    "8": { siteNo: "8", nextMap: { "11": 1, "3": 2, "7": 1 } },
    "9": { siteNo: "9", nextMap: { "12": 2, "5": 1, "10": 3 } },
    "10": { siteNo: "10", nextMap: { "11": 1, "13": 2, "7": 1, "9": 3 } }
  },
  routeData: null, //实际的路径信息
  width: 0, //画布宽
  height: 0, //canvas height
  svg: null, //main container
  linesSvg: null, //lines container
  nodes: null, //nodes info
  scale: -1, //路径距离单位和svg尺寸的比值
  svgSites: null, //svg Node map one node data
  nodesDistance: {}, //节点的距离信息{'1-2':1}
  routeDistance: {},
  nodesLines: [], //待绘制的节点连线信息[[node1,node2],[node3,node4]]
  allLinesSVg: null, //所有连线的line对象
  shortLineColor: "blue", //最短路径线段的颜色
  firstNodeNumInLine: [1, 5, 9, 12], //第一排第一个元素
  markers: {
    //初始化默认的marker
    a: [{ node: 2, show: "A" }],
    v: [
      { node: 3, show: "V1" },
      { node: 7, show: "V2" },
      { node: 4, show: "V3" }
    ],
    s: [
      { node: 12, show: "S1" },
      { node: 11, show: "S2" },
      { node: 13, show: "S3" }
    ]
  },
  nodesXY: {} //各个node的坐标信息{1:[1,2],2:[50,10]}
};
const APP = function () { };
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
      updateRouteInfo(resp);
      BaseData.nodes = initNodes(BaseData.shapeData);
      drawSites(BaseData.nodes);
    },
    error(err) {
      console.log(err);
    }
  });
}

/**更新路径信息 */
function updateRouteInfo(resp) {
  BaseData.routeData = resp;
  BaseData.routeDistance = getRouteDistance(resp);
}

//获取真实的路径信息
function getRouteDistance(resp) {
  let distance = {};
  let nodes = initNodes(resp);
  nodes.forEach((node, idx) => {
    let nodeMap = node.nextMap;
    let parentNodeName = node.siteNo;
    for (var key in nodeMap) {
      let nodeName = key;
      let nodeLength = nodeMap[nodeName];
      //获取2点的对应关系，用于连线，如1-2，2-1只需要画一条线即可
      let lineName = [parentNodeName, nodeName]
        .sort((a, b) => {
          a = parseInt(a);
          b = parseInt(b);
          return a > b ? 1 : a < b ? -1 : 0;
        })
        .join("-");
      if (distance[lineName]) {
        console.info(distance, lineName);
        continue;
      }
      distance[lineName] = nodeLength;
    }
  });
  return distance;
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
  /* 获取各点路径信息 */

  console.log(nodes);
  return nodes;
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
      BaseData.nodesXY[d.siteNo] = [x, y];
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
    node.otherPosIncrement = 0
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

  //四个点均已繁忙，返回斜线方向的坐标
  if (canUsePos == null) {
    node.otherPosIncrement += 30
    return { x: node.x - dx, y: node.y - 60 + node.otherPosIncrement }
  }
  if (key == "top") return { x: node.x - 12, y: node.y - dy };
  if (key == "left") return { x: node.x - dx, y: node.y - 12 };
  if (key == "right") return { x: node.x + dx - 24, y: node.y - 12 };
  if (key == "bottom") return { x: node.x - 12, y: node.y + dy - 24 };
};
const drawDefaultMaker = () => {
  let dragEvent = d3
    .drag()
    .on("drag", function (d) {
      // console.log("drag", d, d3.event);
      let x = d3.event.x - 12.5;
      let y = d3.event.y - 12.5;
      d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
      let siteNO = isAssignNewNode(d3.event.x, d3.event.y)
      console.log('drag', siteNO)
      if (siteNO != undefined) {
        updateNodeHoverStatus(siteNO, 'hover')
      } else {
        updateNodeHoverStatus(null)
      }
    })
    .on("start", function (d) {
      console.log("dragstart", d);
      // d.preXY=d.xy
    })
    .on("end", function (d) {
      console.log("dragend", d, BaseData.nodesXY, d3.event);
      let newNode = isAssignNewNode(d3.event.x, d3.event.y);
      if (newNode) {
        moveMarker(d, newNode, d3.select(this));
      } else {
        //还原
        d3.select(this).attr(
          "transform",
          "translate(" + d.xy.x + "," + d.xy.y + ")"
        );
      }
      updateNodeHoverStatus(null)
    });
  drawMarker("start", BaseData.markers.a, dragEvent);
  drawMarker("v", BaseData.markers.v, dragEvent);
  drawMarker("s", BaseData.markers.s, dragEvent);
};


//更新node hover状态
function updateNodeHoverStatus(siteNO, className) {
  BaseData.svgSites.selectAll('circle')
    .classed('hover', d => {
      return (siteNO && d.siteNo == siteNO)
    })
}
//检查是否移动marker到圆中
function isAssignNewNode(x, y) {
  let nodesXY = BaseData.nodesXY
  for (let siteNo in nodesXY) {
    let nodeX = nodesXY[siteNo][0]
    let nodeY = nodesXY[siteNo][1]
    if (isInCircle(x, nodeX, y, nodeY)) {
      return siteNo
    }
  }
}

//检查坐标是否在圆内
function isInCircle(x1, x2, y1, y2) {
  let r = 15
  return Math.sqrt(
    Math.pow(x1 - x2, 2)
    +
    Math.pow(y1 - y2, 2)
  ) <= 15
}
//移动marker
function moveMarker(oldMarker, newMarker, dragTarget) {
  console.log('moveMarker', arguments)
  let newNode = findNode(newMarker);
  let pos = getValiableMarkerPos(newNode)
  console.log('new pos', pos)
  dragTarget.attr(
    "transform",
    "translate(" + pos.x + "," + pos.y + ")"
  );
  oldMarker.xy.x = pos.x
  oldMarker.xy.y = pos.y
  updateMarkerData(oldMarker, newMarker)
}

//更新baseData中的marker数据
function updateMarkerData(oldMarker, newMarker) {
  console.log('updateMarkerData', oldMarker, newMarker)
  oldMarker.node = newMarker
  return;
  let show = oldMarker.show[0].toLocaleLowerCase()
  let info = BaseData.markers[show]
  let target = info.find(i => i.node == oldMarker.node)
  target.node == newMarker
  console.log(BaseData.markers)
}

const drawMarker = (type, content, event) => {
  let rectMarker = BaseData.svg
    .selectAll(`g.${type}`)
    .data(content)
    .enter()
    .append("g")
    .attr("width", 25)
    .attr("height", 25)
    .attr("class", `marker ${type}`)
    .attr("transform", (d, i) => {
      let node = findNode(d.node);
      let xy = getValiableMarkerPos(node);
      d.xy = xy;
      console.log("xy", xy);
      return `translate(${xy.x},${xy.y})`;
    })
    .call(event);

  rectMarker
    .append("rect")
    .attr("width", 25)
    .attr("height", 25)
    .attr("fill", "white");
  rectMarker
    .append("text")
    .attr("class", "text")
    .attr("dx", 12)
    .attr("dy", 13)
    .text(d => d.show);
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

//绘制最短路径
function drwaPath(path, routes) {
  console.log(path, routes);
  BaseData.linesSvg
    .selectAll(".line")
    .data(BaseData.nodesLines)
    // .enter()
    .classed("shortest", d => {
      // in-shortest
      console.log("drwaPath", d, routes);
      let key1 = getDistanceKey(d[0].siteNo, d[1].siteNo);
      let isExist = routes.find(route => {
        route = route.split("-");
        let routeKey = getDistanceKey(route[0], route[1]);
        return routeKey == key1;
      });
      return isExist;
    });
  let totalDuration = makeAnim(path);
  setTimeout(() => {
    // clearAnim()
  }, totalDuration)
}

//清除路径动画
function clearAnim() {
  BaseData.linesSvg
    .selectAll(".line")
    .data(BaseData.nodesLines)
    // .enter()
    .classed("shortest", false);
  BaseData.svg
    .selectAll("circle.move").remove()
}

function getAnimDuration(node1Name, node2Name) {
  let node1 = findNode(node1Name);
  let node2 = findNode(node2Name);
  let key = getDistanceKey(node1Name, node2Name);
  console.log(key);
  let distance = BaseData.nodesDistance[key];
  let len = 1;
  if (node1.x == node2.x) {
    len = Math.abs(node1.y - node2.y) / 160;
  } else if (node1.y == node2.y) {
    len = Math.abs(node1.x - node2.x) / 160;
  }
  return duration * len;
}
/**
 *绘制轨迹移动动画
 *
 * @param {*} path
 */
const duration = 500; //单位：ms
function makeAnim(path) {
  let totalDuration = 0
  const linefunc = d3
    .line()
    .x(d => {
      let node = findNode(d);
      return node.x;
    })
    .y(d => {
      let node = findNode(d);
      return node.y;
    });

  let transitionFunc = s => {
    let secondNode = findNode(path[1]);
    let duration1 = getAnimDuration(path[0], path[1])
    totalDuration += duration1
    let tmp = s
      .transition() //使用d3.selection.transition函数来定义一个过渡
      .ease(d3.easeLinear)
      .duration(duration1) //使用duration函数来设置过渡效果的持续时间
      .attr("cx", secondNode.x)
      .attr("cy", secondNode.y);
    for (let idx = 2; idx < path.length; idx++) {
      let next = findNode(path[idx]);
      let durationAB = getAnimDuration(path[idx - 1], path[idx])
      totalDuration += durationAB
      tmp = tmp
        .transition()
        .ease(d3.easeLinear) //使用d3.selection.transition函数来定义一个过渡
        .duration(durationAB) //使用duration函数来设置过渡效果的持续时间
        .attr("cx", next.x)
        .attr("cy", next.y);
    }
    tmp.on('end', d => {
      console.log('animation end')
      setTimeout(() => { clearAnim() }, 1000)
    })
  };
  let start = findNode(path[0]);
  BaseData.animCircle = BaseData.svg
    .selectAll("circle.move")
    .data(["circle-move"]);

  let update = BaseData.animCircle;
  let enter = update.enter();
  enter
    .append("circle")
    .attr("class", "anim-path move")
    .attr("cx", start.x)
    .attr("cy", start.y)
    .attr("r", 10)
    .attr("fill", "green")
    .call(transitionFunc);

  update
    .attr("cx", start.x)
    .attr("cy", start.y)
    .attr("r", 10)
    .attr("fill", "green")
    .call(transitionFunc);

  return totalDuration
}
/**
 * find node by siteNo
 */
function findNode(name) {
  return BaseData.nodes.find(i => {
    return i.siteNo == name;
  });
}

/**
 *获取2个点的键名 如 1-2，2-1 返回 1,-2
 *
 * @param {*} node1Name
 * @param {*} node2Name
 */
function getDistanceKey(node1Name, node2Name) {
  let lineName = [node1Name, node2Name]
    .sort((a, b) => {
      a = parseInt(a);
      b = parseInt(b);
      return a > b ? 1 : a < b ? -1 : 0;
    })
    .join("-");
  return lineName;
}

function updateLine() {
  console.log("updateLine", BaseData.lineGroupRect);
  BaseData.lineGroupRect.data(BaseData.nodesLines).text(d => {
    let keyName = getDistanceKey(d[0].siteNo, d[1].siteNo);
    console.log(
      "text",
      BaseData.routeDistance,
      d,
      BaseData.routeDistance[keyName]
    );
    return BaseData.routeDistance[keyName];
  });
}

function drawNodeLine() {
  console.log("drawLine", BaseData.nodesLines);
  BaseData.allLinesSVg = BaseData.linesSvg
    .selectAll(".line")
    .data(BaseData.nodesLines)
    .enter()
    .append("line")
    .attr("class", d => `line ${getDistanceKey(d[0].siteNo, d[1].siteNo)}`)
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
    .on("click", updatePathLen);

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

  BaseData.lineGroupRect = lineGroup
    .append("text")
    .attr("class", "text")
    .attr("dx", 10)
    .attr("dy", 13)
    .text(d => {
      console.log("text", BaseData.routeDistance[d]);
      return BaseData.routeDistance[d];
    });
  console.log("userage", BaseData.nodes);
}

$(() => {
  app.updateSize();
  getPathInfo();
  bindEvt();
  console.log("app", BaseData);
});

//事件绑定
function bindEvt() {
  $("#calcShortestPathBtn").on("click", e => {
    let params = {
      maxOver: 2,
      paths: BaseData.markers.v.map((node, i) => {
        return {
          start: node.node,
          end: BaseData.markers.s[i].node
        };
      }),
      start: BaseData.markers.a[0].node
    };
    $.ajax({
      type: "post",
      url: "map/beacon",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(params),
      success(data) {
        showResult(data);
      },
      error(err) {
        console.log(err);
      }
    });
  });

}

/**
 *显示路径结果信息
 *
 * @param {*} data
 */
function showResult(data) {
  let distance = data.distance;
  let path = data.path;
  $(".distance").html(`最短路径距离:${distance}`);
  $(".path").html(`最短路线:${path.join("➝")}`);
  //获取路径连线信息
  let routes = [];
  let tmp = [];
  path.forEach((val, idx) => {
    if (idx + 1 == path.length) return;
    routes.push([val, path[idx + 1]].join("-"));
  });
  console.log(routes.join(","));
  //绘制最短路径
  drwaPath(path, routes);
}

let clickedPath = null;
function updatePathLen(route, a, b, c) {
  console.log(route, a, b, c, d3.event);
  clickedPath = route;
  BaseData.layerIdx = layer.prompt({ title: `输入${route}的节点距离`, formType: 0 }, function (pass, index) {
    console.log('pass', pass)
    let distance = pass;
    try {
      if (!new RegExp('^[0-9]*$').test(distance)) {
        layer.msg("非法输入,只能输入数字" + distance);
        return;
      }
    } catch (e) {
      layer.msg("非法输入 " + distance);
      return
    }
    let points = clickedPath.split("-");
    $.ajax({
      url: `map/modify?point1=${points[0]}&point2=${
        points[1]
        }&distance=${distance}`,
      type: "post",
      success(resp) {
        console.log(resp);
        updateRouteInfo(resp);
        updateLine();
      },
      error(err) {
        console.log(err);
      }
    });
    layer.close(index);
  });
}
