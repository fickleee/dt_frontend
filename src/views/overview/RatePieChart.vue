<template>
  <div ref="pieChartRef" style="width: 100%; height: 100%"></div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
const OTHER_NAME = 'other'
const props = defineProps(['data', 'title', 'type', 'pieColor', 'stationName'])
const pieChartRef = ref(null)
const optionRef = ref({})
const drawChart = () => {
  const { pieColor, title, stationName, data, type } = props
  if (stationName.length === 0) return

  const plotDom = echarts.init(pieChartRef.value, 'dt', { renderer: 'svg' })

  const dataSeries = stationName.map((name, i) => {
    return {
      type: 'pie',
      radius: ['70%', '90%'],
      data: [
        { value: data[i], name: 'value', stationName: name },
        { value: 100 - data[i], name: OTHER_NAME, stationName: name }
      ],
      left: `${((1.0 * i) / stationName.length) * 100}%`,
      right: `${100 - ((1.0 * (i + 1)) / stationName.length) * 100}%`,
      label: {
        position: 'center',
        show: true,
        fontSize: 14,
        color: '#fff',
        formatter: () => {
          return data[i].toFixed(1)
        }
      },
      color: pieColor,
      emphasis: {
        scale: false // 禁用鼠标悬停时的缩放动画
        //   label: {
        //     show: true,
        //     fontWeight: 'bold',
        //     fontSize: 16,
        //     color: '#CECED9',
        //     formatter: (data) => {
        //       return data.percent.toFixed(1)
        //     }
        //   }
      }
    }
  })
  optionRef.value = {
    grid: {
      top: '15%',
      right: '10%',
      bottom: '10%',
      left: '15%'
    },
    title: {
      text: title,
      textStyle: {
        color: '#CECED9',
        fontSize: 16
      }
    },
    tooltip: {
      show: true,
      formatter: (params) => {
        const percent = params.data.name !== OTHER_NAME ? params.percent : 100 - params.percent
        return `
          <div style="display: flex; align-items: center; justify-content: center;">
            <div class="${type} rate-legend"></div>
            <div>${params.data.stationName}</div>
          </div>
          <div style="float: right; font-size: 12px; color: #999;">${percent.toFixed(2)}%</div>`
      },
      trigger: 'item' // 设置触发类型为单个扇区
    },
    series: dataSeries
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
<style scoped lang="scss">
:deep(.data-anomaly) {
  background: linear-gradient(135deg, #a0fff9, #b3c2ff);
}
:deep(.low-efficiency-anomaly) {
  background: linear-gradient(135deg, #b9ffa0, #b3d1ff);
}

:deep(.rate-legend) {
  width: 10px;
  height: 10px;
  border-radius: 10px;
  margin: 4px;
}
</style>
