<template>
  <div id="predict-view">
    <svg ref="chart" :width="width" :height="height"></svg>
    <svg ref="plot" :width="width" :height="height"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { csv } from 'd3-fetch'

export default {
  name: 'PredictView',
  data() {
    return {
      width: 700,
      height: 300,
      historicalData: [
        { date: '2024-01-01', value: 38 },
        { date: '2024-01-06', value: 55 },
        { date: '2024-01-11', value: 40 },
        { date: '2024-01-16', value: 50 },
        { date: '2024-01-21', value: 35 },
        { date: '2024-01-26', value: 35 },
        { date: '2024-01-31', value: 35 }
      ],
      idealData: [
        { date: '2024-01-01', value: 42 },
        { date: '2024-01-06', value: 75 },
        { date: '2024-01-11', value: 48 },
        { date: '2024-01-16', value: 63 },
        { date: '2024-01-21', value: 38 },
        { date: '2024-01-26', value: 38 },
        { date: '2024-01-31', value: 38 }
      ],
      futureData: [
        { date: '2024-01-31', value: 30 },
        { date: '2024-02-05', value: 40 }
      ]
    }
  },
  mounted() {
    this.createChart()
    // this.loadAaplData()
    // this.createChart2()
  },
  methods: {
    loadAaplData() {
      csv('/aapl.csv').then(data => {
        this.aapl = data.map(d => ({
          date: new Date(d.date),
          close: +d.close
        }))
        // this.createChart()
        this.createChart2()
      })
    },
    createChart() {
      const svg = d3.select(this.$refs.chart)
      const margin = { top: 20, right: 30, bottom: 30, left: 40 }
      const width = this.width - margin.left - margin.right
      const height = this.height - margin.top - margin.bottom

      // 解析日期和创建比例尺
      const parseDate = d3.timeParse('%Y-%m-%d')
      this.historicalData.forEach((d) => (d.date = parseDate(d.date)))
      this.idealData.forEach((d) => (d.date = parseDate(d.date)))

      const x = d3
        .scaleTime()
        .domain(d3.extent(this.historicalData, (d) => d.date))
        .range([0, width])

      const y = d3
        .scaleLinear()
        .domain([0, 100]) //限定y轴的范围
        .range([height, 0])

      // 创建主图表组
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      // X 轴，只显示指定的日期点
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(
          d3
            .axisBottom(x)
            .tickValues(this.historicalData.map((d) => d.date))
            .tickFormat(d3.timeFormat('%m-%d'))
        )

      // Y 轴
      g.append('g').call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `${d.toFixed(1)}`)
      )

      // Y 轴标签
      g.append('text')
        .attr('x', -margin.left)
        .attr('y', -20)
        .attr('dy', '1em')
        .style('text-anchor', 'start')
        .text('kWh')

      const lineGenerator = d3
        .line()
        .x((d) => x(d.date))
        .y((d) => y(d.value))

      // 绘制历史数据折线图
      g.append('path')
        .datum(this.historicalData)
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('d', lineGenerator)

      // 绘制理想数据折线图（虚线）
      g.append('path')
        .datum(this.idealData)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 4') // 设置虚线样式
        .attr('d', lineGenerator)

      const differenceData = this.historicalData.map((d, i) => {
        return {
          date: d.date,
          value: this.idealData[i].value - d.value
        }
      })

      // 绘制差值面积图
      const areaGenerator = d3
        .area()
        .x((d) => x(d.date))
        .y0(height)
        .y1((d) => y(d.value))

      g.append('path')
        .datum(differenceData)
        .attr('fill', 'rgba(68, 83, 158, 0.8)')
        .attr('d', areaGenerator)
    },
    createChart2(){
          // Declare the chart dimensions and margins.
      const width = 928;
      const height = 500;
      const marginTop = 20;
      const marginRight = 30;
      const marginBottom = 30;
      const marginLeft = 40;

      // Declare the x (horizontal position) scale.
      const x = d3.scaleUtc(d3.extent(this.aapl, d => d.date), [marginLeft, width - marginRight]);

      // Declare the y (vertical position) scale.
      const y = d3.scaleLinear([0, d3.max(this.aapl, d => d.close)], [height - marginBottom, marginTop]);

      // Declare the line generator.
      const line = d3.line()
          .x(d => x(d.date))
          .y(d => y(d.close));

      // Create the SVG container.
      const svg = d3.select(this.$refs.plot)
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

      // Add the x-axis.
      svg.append("g")
          .attr("transform", `translate(0,${height - marginBottom})`)
          .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

      // Add the y-axis, remove the domain line, add grid lines and a label.
      svg.append("g")
          .attr("transform", `translate(${marginLeft},0)`)
          .call(d3.axisLeft(y).ticks(height / 40))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll(".tick line").clone()
              .attr("x2", width - marginLeft - marginRight)
              .attr("stroke-opacity", 0.1))
          .call(g => g.append("text")
              .attr("x", -marginLeft)
              .attr("y", 10)
              .attr("fill", "currentColor")
              .attr("text-anchor", "start")
              .text("↑ Daily close ($)"));

      // Append a path for the line.
      svg.append("path")
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", line(this.aapl));

      // return svg.node();
    }
  }
}
</script>

<style scoped>
#predict-view {
  font-family: Arial, sans-serif;
}

svg {
  transform: translate(20px, 40px); /*调整图表位置（左，上）*/
}
</style>
