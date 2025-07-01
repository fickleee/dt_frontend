<template>
  <div class="current-data-box">
    <div class="box-header">
      <div class="header-left">选中组串</div>
      <div class="header-info">
        {{ props.index }}
      </div>
      <div class="header-right">
        <div class="line"></div>
        当前组串
        <div class="dash">-----</div>
        其他组串
      </div>
    </div>
    <div ref="myChart" id="mychart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  index: String,
  xLabel: Array,
  targetData: Array,
  assistData: Array
})

const myChart = ref(null)
const diagnosisOption = ref({})

const drawChart = () => {
  const chartInstance = echarts.init(myChart.value, 'dt', { renderer: 'svg' })
  // 在绘制之前清除原有的图表内容
  chartInstance.clear()
  //xdata 为0,1,一直到42
  const xdata = [],
    ydata = [],
    ydata2 = []
  const xlabel = props.xLabel
  const targetData = props.targetData
  const assistData = props.assistData

  for (let i = 0; i < 168; i++) {
    xdata.push(i)
    ydata.push(0)
    ydata2.push(0)
  }
  let index = 0
  if (targetData && targetData.length == 168) {
    for (let i = 0; i < 168; i++) {
      ydata[i] = targetData[index]
      // ydata2[i] = assistData[index]
      index++
    }
  }

  const series = []

  for (let i = 0; i < assistData.length; i++) {
    series.push({
      data: assistData[i],
      type: 'line',
      lineStyle: { type: 'dashed', width: 1, opacity: 0.2, color: 'white' },
      emphasis: { lineStyle: { width: 3 } },
      smooth: false,
      showSymbol: false,
      zIndex: 5
    })
  }

  series.push({
    data: ydata,
    type: 'line',
    lineStyle: { width: 1, color: 'orange' },
    emphasis: { lineStyle: { width: 3 }, borderColor: 'red' },
    smooth: false,
    showSymbol: false,
    zIndex: 10
  })

  const maxTargetData = Math.max(...targetData)

  const maxAssistData = assistData.flat().reduce((max, val) => Math.max(max, val), -Infinity)

  const maxSeriesValue = Math.max(maxTargetData, maxAssistData)

  diagnosisOption.value = {
    xAxis: {
      type: 'category',
      data: xdata,
      splitLine: {
        show: false
      },

      axisTick: {
        show: false
      },

      axisLine: {
        show: false
      },

      axisLabel: {
        interval: 0,

        formatter: function (value) {
          const step = 23
          let num = Number(value)

          if (num % step === 0 && num !== 0) {
            return xlabel[num / step - 1]
          } else {
            return ''
          }
        },
        color: '#e2e2e2',
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: 'I/A',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#e2e2e2',
        fontSize: 10
        // margin: 10
      },
      interval: 1.0,
      min: 0,
      max: Math.ceil(maxSeriesValue),

      splitLine: {
        show: false
      },
      axisLabel: {
        color: '#e2e2e2',
        fontSize: 10,

        formatter: function (value) {
          let num = parseFloat(value)
          if (num <= Math.ceil(maxSeriesValue)) {
            return num.toFixed(1)
          } else {
            return ''
          }
        }
      }
    },

    series: series,

    grid: {
      top: 28,
      right: 5,
      bottom: 20,
      left: 35
    }
  }

  chartInstance.setOption(diagnosisOption.value)
}

onMounted(() => {
  drawChart()
})

watch(
  () => [props.targetData, props.assistData, props.xLabel],
  () => {
    drawChart()
  }
)
</script>

<style scoped>
.current-data-box {
  height: 25vh;
  width: 100%;
  padding-top: 5px;
  /* background-color: blue; */

  .box-header {
    display: flex;
    align-items: center;
    height: 20px;
    font-size: smaller;
    margin-bottom: 10px;

    .header-left {
      line-height: 20px;
    }

    .header-info {
      margin-left: 10px;
      background-color: #484a50;
      line-height: 20px;
      padding: 0 5px;
      border-radius: 10px;
    }

    .header-right {
      display: flex;
      align-items: center;
      margin-right: 0px;
      margin-left: auto;
      .line {
        width: 20px;
        height: 0.5px;
        margin-right: 5px;
        background-color: #e2e2e2;
      }

      .dash {
        margin-left: 10px;
        margin-right: 5px;
        height: 20px;
        line-height: 17.5px;
      }
    }
  }

  #mychart {
    margin: 0px;
    width: 100%;
    height: 80%;
    /* border: 1px solid red; */
  }
}
</style>
