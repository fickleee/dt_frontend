<template>
  <div class="overview-right">
    <div id="panel-volume-radiation">
      <div
        class="overview-plot-container"
        style="display: flex; flex-wrap: wrap; overflow-y: hidden; overflow-x: hidden"
      >
        <PowerBarChart :stationName="stationName" :data="stationPowerData"></PowerBarChart>
      </div>
    </div>
    <div class="overview-divider-container">
      <div class="overview-divider-controller">
        <a-divider class="overview-divider" />
      </div>
    </div>
    <div id="panel-EAfactor">
      <div class="overview-plot-container">
        <RatePieChart
          title="数据异常率"
          type="data-anomaly"
          :pieColor="dataAnomalyRateColor"
          :data="stationAnomalyRateData.dataAnomalyRate"
          :stationName="stationName"
          style="width: 100%; height: 50%"
        ></RatePieChart>
        <RatePieChart
          title="低效异常率"
          type="low-efficiency-anomaly"
          :pieColor="lowEfficiencyAnomalyRateColor"
          :data="stationAnomalyRateData.lowEfficiencyAnomalyRate"
          :stationName="stationName"
          style="width: 100%; height: 50%"
        ></RatePieChart>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import PowerBarChart from './PowerBarChart.vue'
import RatePieChart from './RatePieChart.vue'
import * as echarts from 'echarts'

const props = defineProps(['stationData'])
const stationName = ref([])
const stationPowerData = ref([])
const stationAnomalyRateData = ref({})

const updateStationPowerData = () => {
  const { stationData } = props
  // 转换逻辑
  const result = stationData.map((item) => [
    item.shortName,
    item.powerGeneration,
    item.planPowerGeneration,
    item.auxiliaryPowerRate
  ])

  stationPowerData.value = result
}

const dataAnomalyRateColor = [
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#A0FFF9 ' },
    { offset: 1, color: '#B3C2FF' }
  ]),
  new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
    { offset: 0, color: '#D9D9D9 ' },
    { offset: 1, color: '#737373' }
  ])
]

const lowEfficiencyAnomalyRateColor = [
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#B9FFA0 ' },
    { offset: 1, color: '#B3D1FF' }
  ]),
  new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
    { offset: 0, color: '#D9D9D9 ' },
    { offset: 1, color: '#737373' }
  ])
]

const updateStationAnomalyRateData = () => {
  const { stationData } = props

  stationAnomalyRateData.value = {
    dataAnomalyRate: stationData.map((item) => item.dataAnomalyRate * 100),
    lowEfficiencyAnomalyRate: stationData.map((item) => item.lowEfficiencyAnomalyRate * 100)
  }
}

watch(
  () => props.stationData,
  (newData, oldData) => {
    if (newData !== oldData) {
      stationName.value = props.stationData.map((item) => item.shortName)
      updateStationPowerData()
      updateStationAnomalyRateData()
    }
  }
)
</script>
<style scoped lang="scss">
#panel-volume-radiation {
  height: 64%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#panel-efficiency {
  height: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#panel-EAfactor {
  height: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview-plot-container {
  padding-top: 1em;
  height: 100%;
  width: 100%;
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

.power-chart-legend {
  position: absolute;
  top: 2em;
  right: 3em;
  display: flex;
}

.power-chart-legend-item {
  display: flex;
  align-items: center;
  margin-right: 1em;
}

.power-chart-legend-color {
  width: 1em;
  height: 1em;
  margin-right: 1em;
}
</style>
