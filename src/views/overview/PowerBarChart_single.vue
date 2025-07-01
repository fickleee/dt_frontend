<template>
  <div ref="barChartRef" style="width: 100%; height: 100%"></div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps(['data'])
const barChartRef = ref(null)
const optionRef = ref({})

const drawChart = () => {
  if (barChartRef.value === null) return
  const { data } = props
  console.log(data)
  const plotDom = echarts.init(barChartRef.value, 'dt', { renderer: 'svg' })
  const TextHighlightColor = '#CECED9'

  optionRef.value = {
    tooltip: {
      trigger: 'item'
    },
    grid: [
      {
        left: '3%',
        right: '4%',
        containLabel: true
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: data.x,
        axisLabel: {
          color: TextHighlightColor
        },
        gridIndex: 0
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          show: false
          // color: TextHighlightColor
        },
        // name: 'MW',
        nameTextStyle: {
          color: TextHighlightColor
        },
        axisLine: {
          show: false // 隐藏纵轴轴线
        },
        splitLine: {
          show: false // 隐藏纵轴分割线
          // lineStyle: {
          //   color: '#484A50'
          // }
        }
      }
    ],
    series: [
      {
        name: '计划发电量',
        type: 'bar',
        data: data.planVolume,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: TextHighlightColor },
            { offset: 0.5, color: '#d2f2d8' },
            { offset: 1, color: '#cdf1c0' }
          ])
        }
      },
      {
        name: '发电量',
        type: 'bar',
        data: data.volume,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: TextHighlightColor },
            { offset: 0.5, color: '#C3C9FF' },
            { offset: 1, color: '#79A7FF' }
          ])
        }
      },
      {
        name: '厂用电率',
        type: 'bar',
        data: data.rate,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: TextHighlightColor },
            { offset: 0.5, color: '#FDB462' },
            { offset: 1, color: '#FB8072' }
          ])
        }
      }
    ]
  }

  plotDom.setOption(optionRef.value)
  window.addEventListener('resize', function () {
    plotDom.resize()
  })
}

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      drawChart()
    }
  },
  { immediate: true }
)

onMounted(() => {
  drawChart()
})
</script>
<style scoped lang="scss"></style>
