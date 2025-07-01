<template>
  <div class="chart-container">
    <p style="font-size: 12px">未来一周发电量损失预测</p>
    <svg ref="futrlossChart"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'FutureLossChart',
  data() {
    return {
      combinedLossData: [
        { date: '2024-01-01', value: 23, type: 'historical' },
        { date: '2024-01-06', value: 40, type: 'historical' },
        { date: '2024-01-11', value: 25, type: 'historical' },
        { date: '2024-01-16', value: 35, type: 'historical' },
        { date: '2024-01-21', value: 15, type: 'historical' },
        { date: '2024-01-26', value: 10, type: 'historical' },
        { date: '2024-01-31', value: 10, type: 'historical' },
        { date: '2024-01-31', value: 10, type: 'future' },
        { date: '2024-02-05', value: 25, type: 'future' },
        { date: '2024-02-10', value: 25, type: 'future' }
      ]
    }
  },
  mounted() {
    this.createFutrLossChart()
    window.addEventListener('resize', this.updateFutrLossChart)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateFutrLossChart)
  },
  methods: {
    // 将原来的 createFutrLossChart 和 updateFutrLossChart 方法移到这里
    createFutrLossChart() {
      const container = this.$refs.futrlossChart
      const width = container.clientWidth
      const height = container.clientHeight

      this.margin = { top: 10, right: 10, bottom: 25, left: 20 }

      this.chartWidth = width - this.margin.left - this.margin.right
      this.chartHeight = height - this.margin.top - this.margin.bottom

      this.svg = d3
        .select(container)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

      this.updateFutrLossChart()
    },
    updateFutrLossChart() {
      const container = this.$refs.futrlossChart
      const width = container.clientWidth
      const height = container.clientHeight

      this.svg.attr('width', width).attr('height', height)
      this.chartWidth = width - this.margin.left - this.margin.right
      this.chartHeight = height - this.margin.top - this.margin.bottom

      this.svg.selectAll('*').remove()

      // 解析日期
      const parseDate = d3.timeParse('%Y-%m-%d')
      this.combinedLossData.forEach((d) => (d.date = parseDate(d.date)))

      // 设置比例尺
      const x = d3
        .scaleTime()
        .domain(d3.extent(this.combinedLossData, (d) => d.date))
        .range([0, this.chartWidth - 25])

      const y = d3.scaleLinear().domain([0, 100]).range([this.chartHeight, 0])

      const g = this.svg
        .append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

      // X 轴
      g.append('g')
        .attr('transform', `translate(0,${this.chartHeight + 5})`)
        .call(
          d3
            .axisBottom(x)
            .tickSize(0)
            .tickValues(this.combinedLossData.map((d) => d.date))
            .tickFormat(d3.timeFormat('%m-%d'))
        )
        .call((g) => g.select('.domain').remove())

      // Y 轴
      g.append('g')
        .attr('transform', `translate(-10,0)`)
        .call(
          d3
            .axisLeft(y)
            .tickSize(0)
            .ticks(5)
            .tickFormat((d) => `${d.toFixed(1)}`)
        )
        .call((g) => g.select('.domain').remove())
        .call((g) =>
          g
            .selectAll('.tick line')
            .clone()
            .attr('x2', this.chartWidth)
            .attr('stroke-opacity', 0.1)
            .style('fill', 'white')
        )

      // Y 轴标签
      g.append('text')
        .attr('x', -this.margin.left)
        .attr('y', -20)
        .attr('dy', '1em')
        .style('text-anchor', 'start')
        .style('fill', 'white')
        .text('kWh')

      // 创建面积生成器
      const area = d3
        .area()
        .x((d) => x(d.date))
        .y0(this.chartHeight)
        .y1((d) => y(d.value))

      // 绘制历史损失面积
      g.append('path')
        .datum(this.combinedLossData.filter((d) => d.type === 'historical'))
        .attr('class', 'historical-area')
        .attr('fill', 'rgba(68, 83, 158, 0.8)')
        .attr('d', area)

      // 绘制未来损失面积
      g.append('path')
        .datum(this.combinedLossData.filter((d) => d.type === 'future'))
        .attr('class', 'future-area')
        .attr('fill', '#6188b4')
        .attr('d', area)

      //   // 添加分隔线
      //   const lastHistoricalDate = this.combinedLossData
      //     .filter((d) => d.type === 'historical')
      //     .slice(-1)[0].date
      //   g.append('line')
      //     .attr('x1', x(lastHistoricalDate))
      //     .attr('x2', x(lastHistoricalDate))
      //     .attr('y1', 0)
      //     .attr('y2', this.chartHeight)
      //     .attr('stroke', '#ffffff')
      //     .attr('stroke-width', 1)
      //     .attr('stroke-dasharray', '3,3')

      // 添加图例
        const legend = g
          .append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${this.chartWidth - 250}, -15)`)

        // 历史损失图例
        legend
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', '#4952a6')
          .attr('stroke', 'grey')
          .attr('stroke-width', 1)

        legend
          .append('text')
          .attr('x', 15)
          .attr('y', 8)
          .style('fill', 'white')
          .style('font-size', '10px')
          .text('总历史损失发电量')

        // 预测损失图例
        legend
          .append('rect')
          .attr('x', 130)
          .attr('y', 0)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', '#6188b4')
          .attr('stroke', 'grey')
          .attr('stroke-width', 1)

        legend
          .append('text')
          .attr('x', 145)
          .attr('y', 8)
          .style('fill', 'white')
          .style('font-size', '10px')
          .text('预测损失发电量')
    }
  }
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}

svg {
  width: 100%;
  height: 100%;
}
</style>
