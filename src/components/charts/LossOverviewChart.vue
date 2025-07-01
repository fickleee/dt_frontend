<template>
  <div class="chart-container">
    <svg ref="lossviewChart"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'LossOverviewChart',
  mounted() {
    this.drawChart()
    window.addEventListener('resize', this.updateChart)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateChart)
  },
  methods: {
    drawChart() {
      const container = this.$refs.lossviewChart.parentNode
      const width = container.clientWidth
      const height = container.clientHeight*0.45

      this.margin = { top: 15, right: 2, bottom: 10, left: 2 }

      this.chartWidth = width - this.margin.left - this.margin.right
      this.chartHeight = height - this.margin.top - this.margin.bottom

      this.svg = d3
        .select(this.$refs.lossviewChart)
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

      this.updateChart()
    },
    updateChart() {
      const container = this.$refs.lossviewChart
      const width = container.clientWidth
      const height = container.clientHeight

      this.svg.attr('width', width).attr('height', height)
      this.chartWidth = width - this.margin.left - this.margin.right
      this.chartHeight = height - this.margin.top - this.margin.bottom

      this.svg.selectAll('*').remove()

      d3.csv('/chart1.csv').then((data) => {
        data.forEach((d) => {
          d.date = d3.timeParse('%Y-%m-%d')(d.date)
          d.value = +d.value
        })

        const xScale = d3
          .scaleTime()
          .domain(d3.extent(data, (d) => d.date))
          .range([0, this.chartWidth])

        const yScale = d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.value)])
          .range([this.chartHeight, 0])

        const area = d3
          .area()
          .x((d) => xScale(d.date))
          .y0(this.chartHeight)
          .y1((d) => yScale(d.value))

        const splitIndex = data.findIndex((d) => d3.timeFormat('%Y-%m-%d')(d.date) === '2024-01-30')
        const leftData = data.slice(0, splitIndex + 1)
        const rightData = data.slice(splitIndex)

        this.svg.append('path').datum(leftData).attr('fill', '#4952a6').attr('d', area)
        this.svg.append('path').datum(rightData).attr('fill', '#628bb8').attr('d', area)

        const xAxis = d3.axisBottom(xScale).tickSize(0).tickFormat('')
        this.svg
          .append('g')
          .attr('transform', `translate(0, ${this.chartHeight + 3})`)
          .call(xAxis)
          .selectAll('path')
          .attr('stroke', 'grey')

        this.svg
          .append('text')
          .attr('x', xScale(new Date('2024-01-30')))
          .attr('y', this.chartHeight + this.margin.bottom)
          .attr('text-anchor', 'middle')
          .style('fill', '#fff')
          .style('font-size', '8px')
          .text('2024-01-30')

        const legend = this.svg
          .append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${this.chartWidth - 200}, -15)`)

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
          .attr('y', 10)
          .style('fill', 'white')
          .style('font-size', '10px')
          .text('总历史损失发电量')

        legend
          .append('rect')
          .attr('x', 100)
          .attr('y', 0)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', '#6188b4')
          .attr('stroke', 'grey')
          .attr('stroke-width', 1)

        legend
          .append('text')
          .attr('x', 115)
          .attr('y', 10)
          .style('fill', 'white')
          .style('font-size', '10px')
          .text('预测损失发电量')
      })
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
