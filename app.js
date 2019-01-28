/***
 * 绘制相关的基础数据
 */
const BaseData = {
  width: 0,//画布宽
  height: 0,//canvas height
  svg: null,//main container
  nodes: null,//nodes info
  scale: -1,//路径距离单位和svg尺寸的比值
  svgSites: null,//svg Node map one node data
  nodesXY: {},
  firstNodeNumInLine:[1,5,9,12],//第一排第一个元素
}
const APP = function () { }
APP.prototype.updateSize = () => {
  console.log($('.graph').width(), $('.graph').height())
  BaseData.width = $('.graph').width() || 800
  BaseData.height = $('.graph').height() || 600
  BaseData.scale = BaseData.width / 5
}

const getPreNodeDistance=(node)=>{
  let siteName = node.siteNo;
  let preName = parseInt(siteName) - 2 + '';
  if(node.nextMap[parseInt(siteName) - 1]){
    return BaseData.nodes[preName];
  }
}

const getLineXY=(node,idx,type)=>{
  if('x1'==type) return 0
  if('y1'==type) return 0
  if('x2'==type) return BaseData.nodes[4].x
  if('y2'==type) return BaseData.nodes[4].y
}
//计算相关坐标
APP.prototype.getXYInfo = (node, i, shape, isXais) => {
  let { siteNo, nextMap }=node
  let yIncrement = BaseData.scale
  let siteNoInt = parseInt(siteNo)
  if (siteNoInt <= 4) {
    yIncrement = 0
  } else if (siteNoInt <= 8) {
    yIncrement = BaseData.scale * 1
  } else if (siteNoInt <= 11) {
    yIncrement = BaseData.scale * 2
  } else if (siteNoInt <= 15) {
    yIncrement = BaseData.scale * 3
  }
  console.log('xy', node)
  if (shape == 'circle') {
    let pre=getPreNodeDistance(node)
    console.log('getPreNodeDistance',node,pre)
    if (isXais) {
      if(i==0){
        node.x=50
      }else{
        if(pre){
          if(node.siteNo=='10'){
            node.x=pre.x+BaseData.scale*2
          }else{
            node.x=pre.x+BaseData.scale*pre.nextMap[(parseInt(pre.siteNo)+1)+'']
          }
        }else{
          node.x=50
        }
      }
      return node.x;
    } else {
      if(i==0){
        node.y=50
      }else{
        if(pre){
          node.y=pre.y
        }else{
          node.y=BaseData.nodes[0].y+yIncrement
        }
      }
      return node.y
    }
  }
}



const app = new APP()
/**
 * 获取Site数据
 */
function getPathInfo() {
  $.ajax({
    url: 'map/init',
    type: 'get',
    success(resp) {
      initNodes(resp)
      drawSites(BaseData.nodes)
    },
    error(err) {
      console.log(err)
    },
  })
}

/**
 *构造nodes数据
 *
 * @param {*} data
 */
function initNodes(data) {
  if (!data || Object.keys(data).length < 1) return
  let origins = Object.keys(data)
  origins.sort((a, b) => {
    a = parseInt(a)
    b = parseInt(b)
    return a > b ? 1 : a < b ? -1 : 0
  })
  let nodes = []
  origins.forEach((key) => {
    nodes.push(data[key])
  })
  BaseData.nodes = nodes
  /* 获取各点路径信息 */
  
  console.log(nodes)
}

/**
 *绘制Sites
 *
 * @param {*} sites
 */
function drawSites(sites) {

  if (!sites || sites.length < 1) {
    throw new Error('need nodes to drawSites Graph!')
  }
  if (!BaseData.svg) {
    BaseData.svg = d3.select('.graph')
      .append('svg')
      .attr('width', BaseData
        .width)
      .attr('height', BaseData.height)
  }

  BaseData.svgSites = BaseData.svg.selectAll('g')
    .data(sites)
    .enter()
    .append('g')
    .attr('id', d => d.siteNo)
    .attr('transform', (d, i) => {
      let x = app.getXYInfo(d, i, 'circle', true)
      let y = app.getXYInfo(d, i, 'circle', false)
      return `translate(${x},${y})`
    })

  //绘制圆环  
  BaseData.svgSites
    .append('circle')
    .attr('r', 15)
    .attr('class', 'site')
  //绘制文本
  BaseData.svgSites
    .append('text')
    .text(d => d.siteNo)
  //绘制连线
 /*  BaseData.svgSites
  .append('line')
  .attr('x1',(d,i)=>{
    return getLineXY(d,i,'x1')
  })
  .attr('y1',(d,i)=>{
    return getLineXY(d,i,'y1')
  })
  .attr('x2',(d,i)=>{
    return getLineXY(d,i,'x2')
  })
  .attr('y2',(d,i)=>{
    return getLineXY(d,i,'y2')
  }) */
}

$(() => {
  app.updateSize()
  getPathInfo()
  console.log('app', BaseData)
})