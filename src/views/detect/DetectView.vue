<template>
    <div class="detect-container" id="configContainer" ref="configContainer">
        <div style=" width: 100%; height: 100%; ">
            <div class="selector-container" style="">
                <Select class="selector-station" placeholder="请选择电站" ref="select" :value="stationSelected"
                    :options="stationOptions" @change="onStationChange"></Select>
                <DatePicker class="selector-time" :value="dateSelected" @change="onDateChange" />
            </div>
            <div id="detect-content" class="content" style=" padding-bottom: 10px;">
                <div style="display: flex; flex-direction: row; width: 100%; height: 100%;">
                    <div class="table">
                        <Spin :spinning="isLoading">
                            <List :columns="columns" :data="stringInfo" :title="'低效识别结果'" :detailColumnCount="2"
                                :detailColumns="detailColumns" :handleModel="handleModel"
                                :otherHeight="16 + 60 + 35 + 10 + 10 + 16">
                            </List>
                        </Spin>
                    </div>
                    <div class="detect-card">
                        <div class="card-content">
                            <StringDetail :stationName="stationSelected" :date="dateSelectedStr" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { DatePicker, Select, Spin } from 'ant-design-vue';
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import StringDetail from './StringDetail.vue'
import { useStore } from 'vuex';
import List from '../../components/List.vue'
import { STATIONS } from '@/utils/constants';
import dayjs from 'dayjs';
import { checkJsonFileState } from '@/utils/func';

const store = useStore();
const stationOptions = STATIONS;
const stationSelected = computed(() => store.state.globalVar.selectedStation);
const dateSelected = computed(() => dayjs(store.state.globalVar.selectedDate, 'YYYY-MM-DD'));
const dateSelectedStr = computed(() => store.state.globalVar.selectedDate);
const isLoading = ref(false);

const onStationChange = async (station) => {
    // 先清空相关store数据
    isLoading.value = true;
    store.commit('degradationOverview/setstringInfo', []);
    store.commit('degradationOverview/setSelectPV', '');
    store.commit('degradationOverview/setSelectInverter', '');
    store.commit('degradationOverview/setSelectString', '');
    store.commit('degradationOverview/setInverterStringCurrentData', []);
    // 你还可以根据需要清空其他模块的数据

    // 再切换场站
    store.commit("globalVar/setSelectedStation", station);

    // 拉新数据
    await store.dispatch('degradationOverview/fetchStringInfo');
    isLoading.value = false;
};
const onDateChange = async (date) => {
    isLoading.value = true;
    store.commit("globalVar/setSelectedDate", date.format('YYYY-MM-DD'));
    await store.dispatch('degradationOverview/fetchStringInfo');
    store.dispatch('degradationOverview/updateSelectPV', null);
    store.dispatch('degradationOverview/updateSelectInverter', null);
    store.dispatch('degradationOverview/updateSelectString', null);
    store.dispatch('degradationOverview/updateSelectStringCurrent', null);
    isLoading.value = false;
};

const configContainer = ref(null);
const configHeight = ref(0);

const detailColumns = ['degradeRate'];


const handleModel = (chosenSeries) => {
    const keyParts = chosenSeries.split(',');
    const btPart = keyParts.find((part) => part.startsWith('BT'));
    const iPart = keyParts.find((part) => part.startsWith('I'));
    const pvPart = Number(
        keyParts.find((part) => part.startsWith('PV'))?.match(/PVINV_DCI(\d+)/)?.[1]
    );

    if (btPart && iPart) {
        const baseString = 'DTZJJK-CDTGF-Q1';
        const deviceId = `${btPart}-${iPart}`;
        const newSelectInverter = `${baseString}-${deviceId}`;
        const newSelectString = `${deviceId}-PV${pvPart}`;
        const newSelectPV = `PV${pvPart}`;
        store.dispatch('degradationOverview/updateSelectPV', newSelectPV);
        store.dispatch('degradationOverview/updateSelectInverter', newSelectInverter);
        store.dispatch('degradationOverview/updateSelectString', newSelectString);
        store.dispatch('degradationOverview/processInverterStringCurrentData');
    }
};

const columns = [
    {
        title: '组件名',
        dataIndex: 'name',
        key: 'name'
    },
    {
        title: '低效程度',
        dataIndex: 'degradeRate',
        key: 'degradeRate',
        width: 150,
    }
]

const stringInfo = computed(() => store.getters['degradationOverview/getStringInfo']);


onMounted(async () => {
    await store.dispatch('degradationOverview/fetchStringInfo');
    await nextTick();
    if (configContainer.value) {
        configHeight.value = configContainer.value.offsetHeight;
    }
})

watch([stationSelected, dateSelectedStr], ([newStation, newDate]) => {
    checkJsonFileState(newStation, newDate);
}, { immediate: true });
</script>

<style scoped>
.detect-container {
    height: 100%;
    width: 100%;
}

.selector-container {
    height: 10%;
    width: 100%;
    height: 10%;
    width: 100%;
    display: flex;
    align-items: center;
}

.export-results {
    background-color: #393C41;
    height: 60%;
    border-radius: 10px;
    margin-right: 10px;
}

.export-results:hover {
    background-color: #393C41;
    height: 60%;
    border: 1px white solid;
}

.content {
    display: flex;
    flex-direction: row;
    overflow-y: hidden;
    overflow-x: hidden;
    height: 90%;
}

.table {
  width: 26%;
  height: 100%;
  background-color: #141414;
  border-radius: 10px;
}

:deep(.ant-spin-nested-loading) {
  height: 100%;
}

:deep(.ant-spin-container) {
  height: 100%;
}

.detect-card {
    width: 74%;
    height: 100%;
    padding-left: 20px;
}

.card-content {
    height: 100%;
    padding-left: 20px;
}

.card-content {
    background-color: #141414;
    border-radius: 10px;
    width: 100%;
    height: 100%;
    width: 100%;
    height: 100%;
}

.site-select .anticon {
    font-size: 12px;
    /* 设置图标大小 */
    color: #C6C6C6;
    /* 设置图标颜色 */
}
</style>