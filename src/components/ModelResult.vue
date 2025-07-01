<template>
  <div class="card">
    <div class="text">
      <div>
        <span>采用模型</span>
        <a-button size="small" shape="round" style="margin-left: 10px">{{ model }}</a-button>
      </div>
      <!-- <div style="margin-top: 10px">
        <span>历史平均准确率</span>
        <a-button size="small" shape="round" style="margin-left: 10px">{{ Number(auc * 100).toFixed(1) }}%</a-button>
      </div> -->
    </div>
    <div class="chart">
      <svg :id="svgId" class="svg_model"></svg>
    </div>
  </div>
</template>


<script setup>
import * as d3 from "d3"
import { onMounted, computed, onUnmounted } from "vue"

const props = defineProps({
  model: {
    type: String,
  },
  auc: {
    type: Number,
  },
  index: {
    type: Number,
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['impute', 'repair'].includes(value)
  },
  impute: {
    type: Array,
  },
  origin: {
    type: Array,
  }
})

const svgId = computed(() => `svg_model_${props.type}_${props.index}`)

// 添加防抖函数
const debounce = (fn, delay) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 使用防抖处理窗口大小变化
const handleResize = debounce(() => {
  drawModel()
}, 200)

// 检查值是否为有效数字
const isValidNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

// 过滤无效的数据点
const filterValidData = (data) => {
  return data.filter(d => 
    d && 
    d.date instanceof Date && 
    !isNaN(d.date.getTime()) && 
    isValidNumber(d.value)
  )
}

const drawModel = () => {
  try {
    // 检查是否有数据
    if (!props.origin || !props.impute || props.origin.length === 0 || props.impute.length === 0) {
      return
    }

    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S")
    
    // 深拷贝数据，避免修改原始数据
    let originData = JSON.parse(JSON.stringify(props.origin))
    let imputeData = JSON.parse(JSON.stringify(props.impute))
    
    // 转换日期格式
    let dates = []
    imputeData.forEach(d => {
      if (typeof d.date === 'string') {
        d.date = parseTime(d.date)
        if (d.date) {
          dates.push(d.date)
        }
      }
    })
    
    // 确保日期转换成功
    if (dates.length === 0) {
      console.error('Failed to parse dates in imputeData')
      return
    }
    
    // 为原始数据分配日期
    originData.forEach((d, i) => {
      if (i < dates.length) {
        d.date = dates[i]
      } else {
        // 如果索引超出范围，使用最后一个有效日期
        d.date = dates[dates.length - 1]
      }
    })
    
    // 过滤无效数据
    originData = filterValidData(originData)
    imputeData = filterValidData(imputeData)
    
    // 再次检查过滤后的数据是否足够
    if (originData.length === 0 || imputeData.length === 0) {
      console.error('No valid data points after filtering')
      return
    }
    
    const svg = d3.select(`#${svgId.value}`)
    if (!svg.node()) {
      console.error('SVG element not found')
      return
    }
    
    const chartContainer = svg.node().parentNode
    const width = chartContainer.clientWidth
    const height = 80
    
    svg.attr("width", width)
       .attr("height", height)
       .attr("viewBox", [0, 0, width, height])
  
    const marginTop = 10
    const marginRight = 0
    const marginBottom = 1
    const marginLeft = 0
  
    // 确保x轴范围有效
    const xExtent = d3.extent(originData, d => d.date)
    if (xExtent[0] === undefined || xExtent[1] === undefined) {
      console.error('Invalid x extent')
      return
    }
    
    const x = d3.scaleTime(xExtent, [marginLeft, width - marginRight])
  
    // 确保y轴范围有效
    const yMin = Math.min(
      d3.min(originData, d => d.value) || 0, 
      d3.min(imputeData, d => d.value) || 0, 
      0
    )
    
    const yMax = Math.max(
      d3.max(originData, d => d.value) || 1, 
      d3.max(imputeData, d => d.value) || 1, 
      1
    )
    
    const y = d3.scaleLinear([yMin, yMax], [height - marginBottom, marginTop])
  
    // 声明线条生成器，并添加额外的验证
    const line = d3.line()
      .x(d => {
        const xVal = x(d.date)
        return isValidNumber(xVal) ? xVal : 0
      })
      .y(d => {
        const yVal = y(d.value)
        return isValidNumber(yVal) ? yVal : 0
      })
      .defined(d => d && d.date instanceof Date && !isNaN(d.date) && isValidNumber(d.value))
  
    svg.selectAll("*").remove()
    
    // 添加x轴
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 40).tickSizeOuter(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke-opacity", 0))
      .call(g => g.selectAll(".tick line").clone()
        .attr("y2", - (height - marginTop - marginBottom))
        .attr("stroke", "#393C41")
        .attr("stroke-opacity", 1))
      .call(g => g.selectAll(".tick text").remove())
  
    // 添加y轴
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(height / 10))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke-opacity", 0))
      .call(g => g.selectAll(".tick line").clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke", "#393C41")
        .attr("stroke-opacity", 1))
      .call(g => g.selectAll(".tick text").remove())
  
    // 添加模型预测线
    try {
      const imputePath = line(imputeData)
      if (imputePath) {
        svg.append("path")
          .attr("fill", "none")
          .attr("stroke", "#61FF00")
          .attr("stroke-opacity", 0.5)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", '5,5,5')
          .attr("d", imputePath)
      }
    } catch (error) {
      console.error('Error drawing impute data line:', error)
    }
  
    // 添加原始数据线
    try {
      const originPath = line(originData)
      if (originPath) {
        svg.append("path")
          .attr("fill", "none")
          .attr("stroke", "#81ABFC")
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 1)
          .attr("d", originPath)
      }
    } catch (error) {
      console.error('Error drawing origin data line:', error)
    }
  } catch (error) {
    console.error('Error in drawModel:', error)
  }
}

onMounted(() => {
  try {
    drawModel()
    window.addEventListener('resize', handleResize)
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})

onUnmounted(() => {
  try {
    window.removeEventListener('resize', handleResize)
  } catch (error) {
    console.error('Error in onUnmounted:', error)
  }
})
</script>

<style scoped lang="scss">
.card {
  height: 100%;
  border-radius: 5px;
  margin: 0 10px;
  padding: 10px 25px;
  background-color: #484d50;
  display: flex;
  flex-direction: row;
  border: 1px solid transparent;
  transition: border 0.3s;
}

.text {
  width: 190px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
}

.chart {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
}

.svg_model {
  width: 100%;
  height: calc(100% - 20px);
}

.card:hover {
  border-color: #b0c0ff;
  border-width: 1px;
}
</style>
