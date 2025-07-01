<template>
  <div ref="barChartRef" style="width: 100%; height: 100%"></div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps(['data', 'stationName'])
const legend = ['月计划发电量', '月发电量', '日发电量']
const barChartRef = ref(null)
const optionRef = ref({})
const drawChart = () => {
  const { data, stationName } = props
  if (stationName.length === 0) return
  // 获取每列的最大值（忽略name）
  const maxValues = data[0].map((_, colIndex) => {
    return Math.max(...data.map((row) => row[colIndex + 1]))
  })
  const row1x = stationName.slice(0, 4)
  const row1Data = data.filter((item) => row1x.includes(item[0]))
  const row2x = stationName.slice(4)
  const row2Data = data.filter((item) => row2x.includes(item[0]))

  // 不足4个补全，补全占位值
  while (row1x.length < 4) {
    row2x.push('')
  }
  while (row2x.length < 4) {
    row2x.push('')
  }
  while (row1Data.length < 4) {
    row1Data.push(['', null, null, null]) // 使用默认值补全
  }
  while (row2Data.length < 4) {
    row2Data.push(['', null, null, null]) // 使用默认值补全
  }

  const plotDom = echarts.init(barChartRef.value, 'dt', { renderer: 'svg' })
  const TextHighlightColor = '#CECED9'

  optionRef.value = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: legend,
      textStyle: {
        color: TextHighlightColor
      },
      icon: 'rect', // 设置图例形状为方形
      itemWidth: 10,
      itemHeight: 10,
      right: 10
    },
    grid: [
      {
        left: '10%',
        right: '6%',
        bottom: '55%', // 留出空间给第二行
        top: '15%',
        containLabel: true
      },
      {
        left: '10%',
        right: '6%',
        top: '65%', // 从底部55%开始
        bottom: '0%',
        containLabel: true
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: row1x,
        axisLabel: {
          color: TextHighlightColor
        },
        splitLine: {
          lineStyle: {
            color: '#484A50'
          }
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        gridIndex: 0
      },
      {
        type: 'category',
        data: row2x,
        axisLabel: {
          color: TextHighlightColor
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        gridIndex: 1
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '万千瓦时',
        nameTextStyle: {
          color: TextHighlightColor
        },
        splitLine: {
          lineStyle: {
            color: '#484A50'
          }
        },
        axisLabel: {
          show: false
        },
        max: Math.max(maxValues[0], maxValues[1], maxValues[2]),
        min: 0,
        gridIndex: 0
      },
      {
        type: 'value',
        position: 'right',
        name: '',
        nameTextStyle: {
          color: TextHighlightColor
        },
        splitLine: {
          lineStyle: {
            color: '#484A50'
          }
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: false
        },
        max: Math.max(maxValues[0], maxValues[1], maxValues[2]),
        min: 0,
        gridIndex: 0
      },
      {
        type: 'value',
        nameTextStyle: {
          color: TextHighlightColor
        },
        splitLine: {
          lineStyle: {
            color: '#484A50'
          }
        },
        axisLabel: {
          show: false
        },
        max: Math.max(maxValues[0], maxValues[1]),
        min: 0,
        gridIndex: 1
      },
      {
        type: 'value',
        position: 'right',
        nameTextStyle: {
          color: TextHighlightColor
        },
        axisLabel: {
          show: false
        },
        splitLine: {
          show: false
        },
        max: maxValues[2],
        min: 0,
        gridIndex: 1
      }
    ],
    series: [
      {
        name: '月计划发电量',
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.5, color: '#B4FDAC' },
            { offset: 1, color: '#E9FFF5' }
          ])
        },
        barWidth: '18%',
        datasetIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 0
      },
      {
        name: '月发电量',
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.5, color: '#79A7FF' },
            { offset: 1, color: '#C3C9FF' }
          ])
        },
        barWidth: '18%',
        datasetIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 0
      },
      {
        name: '日发电量',
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.5, color: '#FB8072' },
            { offset: 1, color: '#FDB462' }
          ])
        },
        barWidth: '18%',
        datasetIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 1
      },
      {
        name: '月计划发电量',
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.5, color: '#B4FDAC' },
            { offset: 1, color: '#E9FFF5' }
          ])
        },
        barWidth: '18%',
        datasetIndex: 1,
        xAxisIndex: 1,
        yAxisIndex: 2
      },
      {
        name: '月发电量',
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.5, color: '#79A7FF' },
            { offset: 1, color: '#C3C9FF' }
          ])
        },
        barWidth: '18%',
        datasetIndex: 1,
        xAxisIndex: 1,
        yAxisIndex: 2
      },
      {
        name: '日发电量',
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.5, color: '#FB8072' },
            { offset: 1, color: '#FDB462' }
          ])
        },
        barWidth: '18%',
        datasetIndex: 1,
        xAxisIndex: 1,
        yAxisIndex: 2
      }
    ],
    dataset: [
      {
        source: row1Data
      },
      {
        source: row2Data
      }
    ]
  }

  plotDom.setOption(optionRef.value)
  window.addEventListener('resize', function () {
    plotDom.resize()
  })
}

watch(
  () => props.stationName,
  (newData, oldData) => {
    if (newData !== oldData) {
      drawChart()
    }
  },
  { deep: true }
)

onMounted(() => {
  drawChart()
})
</script>
<style scoped lang="scss"></style>
