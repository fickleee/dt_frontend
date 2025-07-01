<template>
    <div class="station-view">
        <div class="selector-container">
            <Select class="selector-station" placeholder="请选择电站" ref="select" :value="stationSelected"
                :options="stationOptions" @change="onStationChange"></Select>
            <DatePicker class="selector-time" :value="dateSelected" @change="onDateChange" />
            <!-- <a-button :loading="loading" @click="enterLoading" class="button-loading" type="dashed">手动生成日志</a-button> -->
        </div>
        <div class="station-overview">
            <StationMap />
            <StationStatistics />
        </div>
    </div>
</template>

<script setup>
import { DatePicker, Select } from 'ant-design-vue';
import { computed,watch,ref,provide } from 'vue';
import dayjs from 'dayjs';
import { useStore } from 'vuex';
import { STATIONS } from '@/utils/constants';
import StationMap from './StationMap.vue';
import StationStatistics from './StationStatistics.vue';
import { reqOverviewStationMap } from '@/api/overview/overview';
import { checkJsonFileState } from '@/utils/func';
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';

const router = useRoute();
const store = useStore();
const stationOptions = STATIONS;
const stationSelected = computed(() => store.state.globalVar.selectedStation);
const dateSelected = computed(() => dayjs(store.state.globalVar.selectedDate, 'YYYY-MM-DD'));
const dateSelectedStr = computed(() => store.state.globalVar.selectedDate);
const onStationChange = (station) => { store.commit("globalVar/setSelectedStation", station) };
const onDateChange = (date) => { store.commit("globalVar/setSelectedDate", date.format('YYYY-MM-DD')) };

const currentPanelJson = ref({})
const currentPanelLabelJson = ref({})

// 包含数据读取和地图初始化
const generateMap = async (currentStation, currentDate) => {
    const hide = message.loading('开始生成地图', 0);
    try {
        const { panelJson, panelLabelJson } = 
            await reqOverviewStationMap(currentStation, currentDate);
        
        currentPanelJson.value = panelJson;
        currentPanelLabelJson.value = panelLabelJson;
    } finally {
        hide(); // 数据返回后关闭提示
    }
}

watch(() => router.path, (newPath) => {
  if (newPath.includes('/station')) {  // Adjust this to match your route path
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    console.log('yesterday:',yesterday);
    if (dateSelectedStr.value !== yesterday) {
      store.commit("globalVar/setSelectedDate", yesterday);
    }
  }
}, { immediate: true });

watch([stationSelected, dateSelectedStr],  ([newStation,newDate]) => {
    checkJsonFileState(newStation,newDate);
    generateMap(newStation,newDate); 
}, { immediate: true });

provide('currentPanelJson', currentPanelJson);
provide('currentPanelLabelJson', currentPanelLabelJson);

</script>

<style scoped>
.station-view {
    width: 100%;
    height: 100%;
}

.selector-container {
    height: 10%;
    width: 100%;
    display: flex;
    align-items: center;
}

    .selector-station {
        width: 18%;
        margin-right: 10px;
    }

    .selector-station .ant-select-selector {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .selector-time {
        width: 18%;
        height: 6vh;
        margin-right: 10px;
    }

    .button-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 6vh;
    }

.station-overview {
    display: flex;
    flex-direction: row ;
    height: 90%;
    width: 100%;
}
    .station-map{
        width: 60%;
        height: 100%;
        background-color: #393C41;
        border-radius: 10px;
        margin-right: 10px;
    }

    .station-statistics{
        width: 40%;
        height: 100%;
        padding: 0px 10px;
    }
</style>