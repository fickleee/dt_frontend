<template>
  <div class="lossChart-container">
    <div class="chart-container">
      <historical-loss-chart :historical-data="historicalData" :ideal-data="idealData" />
    </div>
    <div class="chart-container" style="margin-top:8px">
      <future-loss-chart
        :historical-data="historicalData"
        :ideal-data="idealData"
        :future-loss-data="futureLossData"
      />
    </div>
  </div>
</template>

<script>
import HistoricalLossChart from './HistoricalLossChart.vue'
import FutureLossChart from './FutureLossChart.vue'

export default {
  name: 'TwoLossChart',
  components: {
    HistoricalLossChart,
    FutureLossChart
  },
  data() {
    return {
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
      futureLossData: [
        { date: '2024-02-03', value: 30 },
        { date: '2024-02-05', value: 40 }
      ]
    }
  }
}
</script>

<style scoped>
.lossChart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 10px;
  margin-top: 5px;
}

.chart-container {
  width: 100%;
  height: 80%;
}

svg {
  width: 100%;
  height: 100%;
}
</style>
