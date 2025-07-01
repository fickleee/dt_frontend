<!-- HistoricalLossChart.vue -->
<template>
  <div class="chart-container">
    <p style="font-size: 12px">历史发电量损失估计</p>
    <svg ref="histlossChart"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'HistoricalLossChart',
  props: {
    historicalData: Array, // 历史数据
    idealData: Array // 理想数据
  },
  mounted() {
    this.createHistLossChart()
    window.addEventListener('resize', this.updateChartSize) // 监听窗口大小变化
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateChartSize) // 移除监听器
  },
  methods: {
    createHistLossChart() {
      const container = this.$refs.histlossChart
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

      this.updateHistLossChart()
    },
    updateHistLossChart() {
      const container = this.$refs.histlossChart
      const width = container.clientWidth
      const height = container.clientHeight

      this.svg.attr('width', width).attr('height', height)
      this.chartWidth = width - this.margin.left - this.margin.right
      this.chartHeight = height - this.margin.top - this.margin.bottom

      this.svg.selectAll('*').remove()

      const parseDate = d3.timeParse('%Y-%m-%d')
      this.historicalData.forEach((d) => (d.date = parseDate(d.date)))
      this.idealData.forEach((d) => (d.date = parseDate(d.date)))

      const x = d3
        .scaleTime()
        .domain(d3.extent(this.historicalData, (d) => d.date))
        .range([0, this.chartWidth - 25])

      const y = d3.scaleLinear().domain([0, 100]).range([this.chartHeight, 0])

      const g = this.svg
        .append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

      g.append('g')
        .attr('transform', `translate(0,${this.chartHeight + 5})`)
        .call(
          d3
            .axisBottom(x)
            .tickSize(0)
            .tickValues(this.historicalData.map((d) => d.date))
            .tickFormat(d3.timeFormat('%m-%d'))
        )
        .call((g) => g.select('.domain').remove())

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

      g.append('text')
        .attr('x', -this.margin.left)
        .attr('y', -20)
        .attr('dy', '1em')
        .style('text-anchor', 'start')
        .style('fill', 'white')
        .text('kWh')

      const lineGenerator = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.value))

      g.append('path')
        .datum(this.historicalData)
        .attr('fill', 'none')
        .attr('stroke', '#647eb1')
        .attr('stroke-width', 1)
        .attr('d', lineGenerator)

      g.append('path')
        .datum(this.idealData)
        .attr('fill', 'none')
        .attr('stroke', '#647eb1')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2 4')
        .attr('d', lineGenerator)

      const historyLossData = this.historicalData.map((d, i) => {
        return {
          date: d.date,
          value: this.idealData[i].value - d.value
        }
      })

      const areaGenerator = d3
        .area()
        .x((d) => x(d.date))
        .y0(this.chartHeight)
        .y1((d) => y(d.value))

      g.append('path')
        .datum(historyLossData)
        .attr('fill', 'rgba(68, 83, 158, 0.8)')
        .attr('d', areaGenerator)

      // Add legend,并排图例组
      const legend = this.svg
        .append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(340, 0)`)

      // Historical data line legend
      const legendItems = [
        { type: 'line', color: '#647eb1', dash: null, text: '当前组串发电量' },
        { type: 'line', color: '#647eb1', dash: '2 4', text: '理论发电量' },
        { type: 'rect', color: 'rgba(68, 83, 158, 0.8)', text: '当前组串历史损失发电量' }
      ]

      legendItems.forEach((item, index) => {
        const legendItem = legend.append('g').attr('transform', `translate(${index * 110}, 0)`)

        if (item.type === 'line') {
          legendItem
            .append('line')
            .attr('x1', -25)
            .attr('y1', 0)
            .attr('x2', 5)
            .attr('y2', 0)
            .attr('stroke', item.color)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', item.dash || null)
        } else if (item.type === 'rect') {
          legendItem
            .append('rect')
            .attr('x', -10)
            .attr('y', -5)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', item.color)
            .attr('stroke', 'grey')
            .attr('stroke-width', 1)
        }

        legendItem
          .append('text')
          .attr('x', 8)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .style('fill', 'white')
          .text(item.text)
      })
    }
  }
}
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  /* min-height: 200px; */
}

svg {
  width: 100%;
  height: 100%;
}
</style>
