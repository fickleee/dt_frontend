<template>
  <div class="overview">
    <OverViewLeft :overviewData="overviewData"></OverViewLeft>
    <OverViewMiddle :stationData="stationData"></OverViewMiddle>
    <OverViewRight :stationData="stationData"></OverViewRight>
  </div>
</template>
<script setup>
import { ref, onBeforeMount } from 'vue'
import OverViewLeft from './OverViewLeft.vue'
import OverViewMiddle from './OverViewMiddle.vue'
import OverViewRight from './OverViewRight.vue'
import { getOverviewData } from '@/api/overview/apiData'

const stationData = ref([])
const overviewData = ref({})
onBeforeMount(async () => {
  overviewData.value = await getOverviewData()
  stationData.value = overviewData.value.stationData
})
</script>
<style scoped lang="scss">
.overview {
  background-color: #393c41;
  width: 100%;
  height: 100%;
  display: flex;
  border-radius: 10px;
}

.overview-left {
  width: 30%;
}

.overview-middle {
  width: 38%;
}

.overview-right {
  width: 32%;
}
</style>
