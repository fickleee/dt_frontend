<template>
  <div class="overview-left">
    <div class="overview-infopanel" id="panel-volume">
      <div class="overview-infopanel-container">
        <div class="overview-item">
          <div class="overview-item-title">当日发电</div>
          <div class="overview-item-content">{{ OMData.dailyGeneration }}</div>
          <div class="overview-item-unit">kW/h</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">当月发电</div>
          <div class="overview-item-content">{{ OMData.monthlyGeneration }}</div>
          <div class="overview-item-unit">kW/h</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">累积发电</div>
          <div class="overview-item-content">{{ OMData.cumulativeGeneration }}</div>
          <div class="overview-item-unit">kW/h</div>
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
          <div class="overview-item-content">{{ OMData.cumulativeFaultDetection }}</div>
          <div class="overview-item-unit">组串</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">当前待运维故障</div>
          <div class="overview-item-content">{{ OMData.toOMFault }}</div>
          <div class="overview-item-unit">组串</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">预估损失量</div>
          <div class="overview-item-content">{{ OMData.estimatedLoss }}</div>
          <div class="overview-item-unit">kW/h</div>
        </div>
      </div>
    </div>
    <div id="panel-overview-plot-container">
      <div ref="anomalyRefOverview" style="width: 100%; height: 100%"></div>
    </div>
    <div class="overview-divider-container">
      <div class="overview-divider-controller">
        <a-divider class="overview-divider" />
      </div>
    </div>
    <div class="overview-infopanel" id="panel-maintain">
      <div class="overview-infopanel-container">
        <div class="overview-item">
          <div class="overview-item-title">一级运维数量</div>
          <div class="overview-item-content">{{ OMData.level1OMQuantity }}</div>
          <div class="overview-item-unit">组串</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">二级运维数量</div>
          <div class="overview-item-content">{{ OMData.level2OMQuantity }}</div>
          <div class="overview-item-unit">组串</div>
        </div>
        <div class="overview-item">
          <div class="overview-item-title">三级运维数量</div>
          <div class="overview-item-content">{{ OMData.level3OMQuantity }}</div>
          <div class="overview-item-unit">组串</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
const props = defineProps(['stationData'])
const OMData = ref({
  dailyGeneration: 0,
  monthlyGeneration: 0,
  cumulativeGeneration: 0,
  cumulativeFaultDetection: 0,
  toOMFault: 0,
  estimatedLoss: 0,
  level1OMQuantity: 0,
  level2OMQuantity: 0,
  level3OMQuantity: 0
})
const anomalyOption = ref({})
const anomalyRefOverview = ref(null)
const updateOMData = () => {
  // OMD
}
const getAnomalyData = () => {
  return [
    {
      name: '热斑',
      value: 10
    },
    {
      name: '短路',
      value: 12
    },
    {
      name: '断路',
      value: 6
    },
    {
      name: '遮挡',
      value: 18
    },
    {
      name: '积灰',
      value: 20
    },
    {
      name: '内部损坏',
      value: 5
    }
  ]
}
const drawDonutChart = () => {
  const plotDom = echarts.init(anomalyRefOverview.value, 'dt', { renderer: 'svg' })
  const data = getAnomalyData()

  anomalyOption.value = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: '5px',
      textStyle: {
        color: '#FFFFFF'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '70%'],
        data: data,
        label: {
          show: false,
          position: 'center'
        }
      }
    ]
  }
  plotDom.setOption(anomalyOption.value)
  window.addEventListener('resize', function () {
    plotDom.resize()
  })
}

watch(
  () => props.stationData,
  (newData, oldData) => {
    if (newData !== oldData) {
      updateOMData()
    }
  }
)
onMounted(() => drawDonutChart())
</script>
<style scoped lang="scss">
#panel-volume {
  height: 21%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#panel-anomaly {
  height: 21%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#panel-overview-plot-container {
  height: 29%;
  width: 100%;
  display: flex;
  justify-content: center;
}

#panel-maintain {
  height: 21%;
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
  color: #ceced9;
  font-weight: bolder;
  text-align: right;
  font-size: clamp(5px, 0.8vw, 30px);
  width: 15%;
}

.overview-item-content {
  width: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #79a7ff 50%, #c3c9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bolder;
  font-size: clamp(5px, 3vw, 30px);
  vertical-align: middle;
  text-align: center;
}
</style>
