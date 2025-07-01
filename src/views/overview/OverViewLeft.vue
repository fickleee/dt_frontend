<template>
  <div class="overview-left">
    <div class="overview-infopanel" id="panel-volume">
      <div class="overview-infopanel-container">
        <div class="overview-item">
          <div class="overview-item-title">当日发电</div>
          <div class="overview-item-content">{{ OMData.dailyGeneration }}</div>
          <div class="overview-item-unit">万千瓦时</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">当月发电</div>
          <div class="overview-item-content">{{ OMData.monthlyGeneration }}</div>
          <div class="overview-item-unit">万千瓦时</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">累积发电</div>
          <div class="overview-item-content">{{ OMData.cumulativeGeneration }}</div>
          <div class="overview-item-unit">万千瓦时</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">累积损失发电</div>
          <div class="overview-item-content">{{ OMData.cumulativeLossGeneration }}</div>
          <div class="overview-item-unit">万千瓦时</div>
        </div>
      </div>
    </div>
    <div class="overview-divider-container">
      <div class="overview-divider-controller">
        <a-divider class="overview-divider" />
      </div>
    </div>
    <div class="overview-infopanel" id="panel-anomaly">
      <div class="overview-infopanel-container">
        <div class="overview-item">
          <div class="overview-item-title">累积检出故障</div>
          <div class="overview-item-content">{{ OMData.cumulativeFaultInverterDetection }}</div>
          <div class="overview-item-unit">逆变器</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">累积检出故障</div>
          <div class="overview-item-content">{{ OMData.cumulativeFaultDetection }}</div>
          <div class="overview-item-unit">组串</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">今日待运维故障</div>
          <div class="overview-item-content">{{ OMData.toOMInverterFault }}</div>
          <div class="overview-item-unit">逆变器</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">今日待运维故障</div>
          <div class="overview-item-content">{{ OMData.toOMFault }}</div>
          <div class="overview-item-unit">组串</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">预估损失量</div>
          <div class="overview-item-content">{{ OMData.estimatedLoss }}</div>
          <div class="overview-item-unit">万千瓦时</div>
        </div>
      </div>
    </div>
    <div id="panel-overview-plot-container">
      <div ref="anomalyRefOverview" style="width: 100%; height: 100%"></div>
    </div>
    <svg style="position: absolute; width: 0; height: 0">
      <linearGradient id="anomalyTextGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF"></stop>
        <stop offset="44%" stop-color="#79A7FF"></stop>
        <stop offset="100%" stop-color="#C3C9FF"></stop>
      </linearGradient>
    </svg>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
const props = defineProps(['overviewData'])

const OMData = ref({
  dailyGeneration: 0,
  monthlyGeneration: 0,
  cumulativeGeneration: 0,
  cumulativeLossGeneration: 0,
  cumulativeFaultInverterDetection: 0,
  cumulativeFaultDetection: 0,
  toOMInverterFault: 0,
  toOMFault: 0,
  estimatedLoss: 0,
  level1OMQuantity: 0,
  level2OMQuantity: 0,
  level3OMQuantity: 0
})
const stringAnomalyData = ref({
  surfaceStain: 0,
  diodeFault: 0,
  circuitFault: 0
})
const anomalyOption = ref({})
const anomalyRefOverview = ref(null)

const updateData = () => {
  const { overviewData } = props
  Object.keys(OMData.value).forEach((key) => {
    if (overviewData.hasOwnProperty(key)) {
      OMData.value[key] = overviewData[key]
    }
  })

  Object.keys(stringAnomalyData.value).forEach((key) => {
    if (overviewData.stringAnomalyData.hasOwnProperty(key)) {
      stringAnomalyData.value[key] = overviewData.stringAnomalyData[key]
    }
  })
}

const drawDonutChart = () => {
  const plotDom = echarts.init(anomalyRefOverview.value, 'dt', { renderer: 'svg' })

  const data = [
    {
      name: '表面污迹',
      value: stringAnomalyData.value.surfaceStain
    },
    {
      name: '二极管故障',
      value: stringAnomalyData.value.diodeFault
    },
    {
      name: '组串开路或短路',
      value: stringAnomalyData.value.circuitFault
    }
  ]

  const anomalyCnt = data.reduce((sum, item) => sum + item.value, 0)

  anomalyOption.value = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: '5px',
      textStyle: {
        color: '#FFFFFF'
      },
      icon: 'circle', // 设置图例形状为方形
      itemWidth: 18,
      itemHeight: 18
    },
    series: [
      {
        type: 'pie',
        radius: ['65%', '90%'],
        center: ['35%', '50%'],
        data: data,
        label: {
          show: false
        }
      },
      {
        name: '',
        z: 100,
        type: 'gauge',
        radius: '-50%',
        center: ['35%', '50%'], // 需和type: 'pie'中的center一致
        // 配置中间的数字的样式
        detail: {
          // 调节数字位置
          offsetCenter: [-1, 20],
          fontWeight: 'bolder',
          fontSize: 'clamp(5px, 3vw, 30px)',
          color: 'url(#anomalyTextGradient)'
        },
        pointer: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        // 中间的字和数字 数据
        data: [
          {
            value: anomalyCnt,
            name: '总故障数',
            title: {
              // 配置“总故障数”的样式
              show: true,
              fontWeight: 'bolder',
              fontSize: 'clamp(5px, 0.8vw, 30px)',
              color: '#fff'
            }
          }
        ]
      }
    ]
  }
  plotDom.setOption(anomalyOption.value)
  window.addEventListener('resize', function () {
    plotDom.resize()
  })
}

watch(
  () => props.overviewData,
  (newData, oldData) => {
    if (newData !== oldData) {
      updateData()
      drawDonutChart()
    }
  },
  { deep: true }
)
</script>
<style scoped lang="scss">
#panel-volume {
  height: 28%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#panel-anomaly {
  height: 35%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#panel-overview-plot-container {
  height: 32%;
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: -1.5em;
}

#panel-maintain {
  height: 20%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview-infopanel-container {
  width: 85%;
}

.overview-divider-container {
  height: 4%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview-divider-controller {
  width: 92%;
}

.overview-divider {
  height: 2px;
  background-color: #5a6f97;
}

.overview-item {
  display: flex;
  line-height: 4vh;
  text-align: center;
  margin-top: 5px;
  margin-bottom: 5px;
}

.overview-item-title {
  color: #ceced9;
  font-weight: bolder;
  text-align: left;
  font-size: clamp(5px, 0.8vw, 30px);
  width: 35%;
}

.overview-item-unit {
  color: #ffffff;
  font-weight: bolder;
  text-align: right;
  font-size: clamp(5px, 0.8vw, 30px);
  width: 20%;
}

.overview-item-content {
  width: 45%;
  background: linear-gradient(135deg, #ffffff 0%, #79a7ff 50%, #c3c9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bolder;
  font-size: clamp(5px, 3vw, 30px);
  vertical-align: middle;
  text-align: center;
}
</style>
