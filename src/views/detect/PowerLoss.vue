<template>
  <div class="powerloss-container">
    <div class="header-row">
      <div class="section-title">发电量损失</div>
    </div>
    <div class="content">
      <div ref="chart" class="chart"></div>
      <div v-if="props.selectString" class="side-info">
        <div class="trend card">
          <div class="trend-row">
            <span class="percent" :class="{ 'increase': percentChange > 0, 'decrease': percentChange < 0 }">
              {{ percentChange > 0 ? '+' : '' }}{{ percentChange }}%
            </span>
            <svg v-if="percentChange >= 0" class="arrow-up" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#FF6A00" d="M12 4l6 6h-4v6h-4v-6H6z"/>
            </svg>
            <svg v-else class="arrow-down" width="18" height="18" viewBox="0 0 24 24">
              <path fill="#00D97E" d="M12 20l-6-6h4V8h4v6h4z"/>
            </svg>
          </div>
          <span class="desc">（相比上周）<br/>预测增速趋势</span>
        </div>
        <div class="max-loss card">
          <div class="max-row">
            <svg class="icon-kwh" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#B5E3FF"/></svg>
            <span class="max-value">{{ formattedMaxLoss }}</span>
            <span class="unit">kwh</span>
          </div>
          <div class="desc">最大单日损失</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import { getPowerLoss } from '@/api/detect/detect'

const props = defineProps({
  stationName: String,
  date: String,
  selectString: String
})

const chart = ref(null)
const historyLoss = ref([])
const futureLoss = ref([])
const historyDates = ref([])
const futureDates = ref([])
const isLoading = ref(false)

// 计算增长百分比 - 修改为比较future_loss七天数据之和与history_loss最后七天之和
const percentChange = computed(() => {
  if (historyLoss.value.length < 7 || futureLoss.value.length === 0) return 0
  
  // 计算最近7天历史数据之和
  const lastSevenDaysSum = historyLoss.value.slice(-7).reduce((a, b) => a + b, 0)
  
  // 计算预测数据之和
  const futureDaysSum = futureLoss.value.reduce((a, b) => a + b, 0)
  
  // 计算增长百分比
  if (lastSevenDaysSum === 0) return 0
  
  const changePercent = Math.round(((futureDaysSum - lastSevenDaysSum) / lastSevenDaysSum) * 100)
  return changePercent
})

// 计算最大单日损失
const maxLoss = computed(() => {
  if (historyLoss.value.length === 0 && futureLoss.value.length === 0) return 0
  
  const allLoss = [...historyLoss.value, ...futureLoss.value]
  return Math.max(...allLoss)
})

// 格式化最大单日损失，保留一位小数，并转换为kWh
const formattedMaxLoss = computed(() => {
  return (maxLoss.value / 1000).toFixed(1)
})

// 累积计算方法
const calculateCumulative = (data) => {
  return data.reduce((acc, cur, i) => {
    acc.push((acc[i - 1] || 0) + cur)
    return acc
  }, [])
}

// 计算异常点
const calculateAnomalyPoints = (futureData, historyData) => {
  // 计算历史数据的平均每日损失
  const historyAvg = historyData.reduce((a, b) => a + b, 0) / historyData.length
  
  // 将未来数据与历史平均值比较
  return futureData.map((value) => {
    if (value > historyAvg) return 'red'    // 高于平均值显示红色
    if (value < historyAvg) return 'green'  // 低于平均值显示绿色
    return 'normal'                          // 等于平均值保持原色
  })
}

// 获取数据
const fetchData = async () => {
  d3.select(chart.value).selectAll('*').remove()
  if (!props.stationName || !props.selectString || !props.date) return
  
  try {
    isLoading.value = true
    const response = await getPowerLoss(props.stationName, props.selectString, props.date)
    
    historyLoss.value = response.history_loss || []
    futureLoss.value = response.future_loss || []
    historyDates.value = response.history_dates || []
    futureDates.value = response.future_dates || []
    
    drawChart()
  } catch (error) {
    console.error('获取功率损失数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 绘制图表
const drawChart = () => {
  if (!chart.value) return
  
  // 清空原有内容
  d3.select(chart.value).selectAll('*').remove()
  
  // 合并历史和预测数据
  const days = [...historyDates.value, ...futureDates.value]
  const allIncrements = [...historyLoss.value, ...futureLoss.value]
  const cumulative = calculateCumulative(allIncrements)
  
  // 异常点标记（预测区间）- 传入历史数据进行平均值计算
  const anomalyPoints = calculateAnomalyPoints(futureLoss.value, historyLoss.value)
  
  const width = 450
  const height = 240
  const margin = { top: 20, right: 12, bottom: 30, left: 35 }

  const svg = d3.select(chart.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', 'transparent')

  // 创建tooltip
  const tooltip = d3.select(chart.value)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background-color', 'rgba(50, 50, 50, 0.8)')
    .style('color', '#fff')
    .style('padding', '8px')
    .style('border-radius', '4px')
    .style('pointer-events', 'none')
    .style('font-size', '12px')
    .style('z-index', 10)

  // x轴
  const x = d3.scaleBand()
    .domain(days)
    .range([margin.left, width - margin.right])
    .paddingInner(0.2)
    .paddingOuter(0.1)

  // y轴
  const y = d3.scaleLinear()
    .domain([0, d3.max(cumulative) * 1.1])
    .range([height - margin.bottom, margin.top])

  // x轴绘制
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .tickFormat((d, i) => (i % 2 === 0 ? d : '')) // 隔一个显示一次
      .tickSizeOuter(0))
    .selectAll('text')
    .attr('fill', '#CECEF7')
    .attr('font-size', 12)
    .attr('transform', 'rotate(-30)')
    .attr('text-anchor', 'end')

  // y轴绘制
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6))
    .selectAll('text')
    .attr('fill', '#CECEF7')
    .attr('font-size', 12)
  svg.selectAll('.domain, .tick line')
    .attr('stroke', '#444')

  // 柱状图-历史
  svg.selectAll('.bar-history')
    .data(cumulative.slice(0, historyLoss.value.length))
    .enter()
    .append('rect')
    .attr('class', 'bar-history')
    .attr('x', (_, i) => x(days[i]))
    .attr('y', d => y(d))
    .attr('width', x.bandwidth())
    .attr('height', d => y(0) - y(d))
    .attr('fill', '#3A5AFF')
    .attr('rx', 2)
    .on('mouseover', function(event, d) {
      const i = cumulative.slice(0, historyLoss.value.length).indexOf(d)
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      tooltip.html(`日期: ${days[i]}<br/>累计损失: ${d.toFixed(1)} kwh<br/>单日损失: ${historyLoss.value[i].toFixed(1)} kwh`)
        .style('left', (event.pageX - chart.value.getBoundingClientRect().left + 5) + 'px')
        .style('top', (event.pageY - chart.value.getBoundingClientRect().top - 28) + 'px')
    })
    .on('mouseout', function() {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })

  // 柱状图-预测
  svg.selectAll('.bar-predict')
    .data(cumulative.slice(historyLoss.value.length))
    .enter()
    .append('rect')
    .attr('class', 'bar-predict')
    .attr('x', (_, i) => x(days[i + historyLoss.value.length]))
    .attr('y', d => y(d))
    .attr('width', x.bandwidth())
    .attr('height', d => y(0) - y(d))
    .attr('fill', '#6EC6FF')
    .attr('rx', 2)
    .on('mouseover', function(event, d) {
      const i = cumulative.slice(historyLoss.value.length).indexOf(d)
      const realIndex = i + historyLoss.value.length
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      tooltip.html(`日期: ${days[realIndex]}<br/>累计损失: ${d.toFixed(1)} kwh<br/>单日损失: ${futureLoss.value[i].toFixed(1)} kwh<br/>预测值`)
        .style('left', (event.pageX - chart.value.getBoundingClientRect().left + 5) + 'px')
        .style('top', (event.pageY - chart.value.getBoundingClientRect().top - 28) + 'px')
    })
    .on('mouseout', function() {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })

  // 折线图-累计损失
  const line = d3.line()
    .x((_, i) => x(days[i]) + x.bandwidth() / 2)
    .y(d => y(d))

  svg.append('path')
    .datum(cumulative)
    .attr('fill', 'none')
    .attr('stroke', '#B5E3FF')
    .attr('stroke-width', 2)
    .attr('d', line)

  // 折线点 - 缩小圆点大小
  svg.selectAll('.dot')
    .data(cumulative)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (_, i) => x(days[i]) + x.bandwidth() / 2)
    .attr('cy', d => y(d))
    .attr('r', 4) // 将圆点大小从6减小到4
    .attr('fill', (d, i) => {
      if (i >= historyLoss.value.length) {
        const idx = i - historyLoss.value.length
        if (anomalyPoints[idx] === 'red') return '#FF4B4B'
        if (anomalyPoints[idx] === 'green') return '#00D97E'
        return '#B5E3FF'
      }
      return '#B5E3FF'
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .on('mouseover', function(event, d) {
      const i = cumulative.indexOf(d)
      const isHistory = i < historyLoss.value.length
      const dailyValue = isHistory 
        ? historyLoss.value[i] 
        : futureLoss.value[i - historyLoss.value.length]
      
      tooltip.transition()
        .duration(200)
        .style('opacity', .9)
      
      let tooltipContent = `日期: ${days[i]}<br/>累计损失: ${d.toFixed(1)} kwh<br/>单日损失: ${dailyValue.toFixed(1)} kwh`
      
      // 为预测点添加与历史平均值的比较
      if (!isHistory) {
        const historyAvg = historyLoss.value.reduce((a, b) => a + b, 0) / historyLoss.value.length
        const comparison = dailyValue > historyAvg ? '高于' : (dailyValue < historyAvg ? '低于' : '等于')
        tooltipContent += `<br/>预测值 (${comparison}历史平均)`
      }
      
      tooltip.html(tooltipContent)
        .style('left', (event.pageX - chart.value.getBoundingClientRect().left + 5) + 'px')
        .style('top', (event.pageY - chart.value.getBoundingClientRect().top - 28) + 'px')
    })
    .on('mouseout', function() {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })

  // 图例
  const legendData = [
    { name: '历史损失发电量', color: '#3A5AFF' },
    { name: '预测损失发电量', color: '#6EC6FF' }
  ]
  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top - 20})`)
  legend.selectAll('rect')
    .data(legendData)
    .enter()
    .append('rect')
    .attr('x', (_, i) => i * 140)
    .attr('width', 18)
    .attr('height', 10)
    .attr('fill', d => d.color)
    .attr('y', 0)
  legend.selectAll('text')
    .data(legendData)
    .enter()
    .append('text')
    .attr('x', (_, i) => i * 140 + 24)
    .attr('y', 10)
    .attr('fill', '#CECEF7')
    .attr('font-size', 13)
    .text(d => d.name)
}

// 监听参数变化，重新获取数据
watch(() => [props.stationName, props.selectString, props.date], fetchData)

// 组件挂载时获取数据
onMounted(fetchData)
</script>

<style scoped>
.powerloss-container {
  height: 100%;
  /* 透明背景，无边框 */
  background: transparent;
  border-radius: 0;
  padding: 0 1.5em 1em 0; /* 减小底部内边距 */
  /* margin: 0 auto; */
  max-width: 100%;
  box-sizing: border-box;
}
.header-row {
  height: 15%;
  display: flex;
  align-items: flex-start;
  height: 2.5em; /* 减小高度 */
  background: transparent;
}
.section-title {
  font-size: 1.125em;
  font-weight: bold;
  color: #CECEF7;
  line-height: 2.5em;
}
.content {
  height: 85%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  background: transparent;
  margin-top: 1em;
  gap: 1.5em; /* 增加更多间隔，从1em到1.5em */
}
.chart {
  width: 55%; /* 减小图表宽度，从58%到55% */
  height: 100%;
  background: transparent;
  position: relative;
  padding-left: 0.5em;
}
.side-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 30%; /* 进一步缩小宽度，从33%到30% */
  height: 100%;
  background: transparent;
  position: relative; 
  margin-left: auto;
  padding-right: 1.5em; /* 增加右侧内边距，从1em到1.5em */
}
.card {
  background: rgba(54,59,64,1);
  border: 1.5px solid #4A4E55;
  border-radius: 0.6em; /* 再减小圆角 */
  box-shadow: 0 0.125em 0.3em 0 rgba(0,0,0,0.03); /* 减小阴影 */
  padding: 0.5em 0 0.35em 0; /* 进一步减小内边距 */
  margin-bottom: 0.6em; /* 减小底部间距 */
  color: #fff;
  text-align: center;
  width: 65%; /* 再缩小卡片宽度，从70%到65% */
  margin-left: auto;
  margin-right: 0; /* 确保靠右对齐 */
}
.trend-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2em; /* 减小间距 */
}
.trend .percent {
  font-size: 1.3em; /* 减小字体，从1.4em到1.3em */
  font-weight: bold;
  display: block;
}
.trend .percent.increase {
  color: #FF6A00;
}
.trend .percent.decrease {
  color: #00D97E;
}
.arrow-up {
  margin-left: 0.125em;
  vertical-align: middle;
}
.arrow-down {
  margin-left: 0.125em;
  vertical-align: middle;
}
.trend .desc {
  font-size: 0.65em; /* 减小描述文字，从0.7em到0.65em */
  color: #CECEF7;
  margin-top: 0.2em;
}
.max-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2em;
  margin-bottom: 0.15em;
}
.icon-kwh {
  vertical-align: middle;
  width: 16px; /* 减小图标大小 */
  height: 16px; /* 减小图标大小 */
}
.max-loss .max-value {
  font-size: 1.3em; /* 减小字体，从1.4em到1.3em */
  font-weight: bold;
  letter-spacing: 0.08em; /* 减小字间距 */
}
.max-loss .unit {
  font-size: 0.65em; /* 减小单位文字，从0.7em到0.65em */
  margin-left: 0.08em;
  color: #CECEF7;
}
.max-loss .desc {
  font-size: 0.65em; /* 减小描述文字，从0.7em到0.65em */
  color: #CECEF7;
  margin-top: 0.08em;
}
</style>
