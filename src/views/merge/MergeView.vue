<template>
    <div class="merge-view">
        <div class="filters">
            <Select class="selector-station" placeholder="请选择电站" ref="select" :value="stationSelected"
                :options="stationOptions" @change="onStationChange"></Select>
            <div class="filters-button">
                <!-- 暂时通过v-if不显示，兼容问题待解决 -->
                <a-button v-if="false" type="primary" ghost @click="navigateToCreate" style="background-color: #141414;color: rgba(255, 255, 255, 0.85)">创建厂站</a-button>
            </div>
        </div>
        <div class="content">
            <div class="origin-data">
                <DrawingSVG /> <!-- 显示原图纸中的数据（按地块划分）+ 单个无人机的信息 -->
                <MapView />
            </div>
            <div class="modified-data">
                <EditTable />
            </div>
            <div class="match-data">
                <MatchTable /> <!-- 显示匹配结果的表格 -->
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { STATIONS } from '@/utils/constants';
import MatchTable from '@/components/merge/MatchTable.vue';
import EditTable from '@/components/merge/EditTable.vue';
import DrawingSVG from '@/components/merge/DrawingSVG.vue';
import MapView from '@/components/merge/MapView.vue';
import { reqMergeTable } from '@/api';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'
import { Select } from 'ant-design-vue';

const store = useStore();
const myRouter = useRouter();
const stationOptions = STATIONS;
const stationSelected = computed(() => store.state.globalVar.selectedStation);

const onStationChange = (station) => { store.commit("globalVar/setSelectedStation", station) };

const navigateToCreate = () => {
    myRouter.push('/merge/create');
};

const loadMatchData = async () => {
    const matchJSON = await reqMergeTable(stationSelected.value);

    store.commit('mergeDisplay/setMatchJSONData', matchJSON);
};

watch(stationSelected, (newValue) => {
    store.commit('mergeDisplay/setAreaName', newValue); // 在这里，修改areaName
    store.commit('mergeDisplay/setMatchSelectedConnection', []);
    store.commit('mergeDisplay/setMatchModifiedData', {});
    loadMatchData();
}, { immediate: true });

</script>

<style scoped>
.merge-view {
    display: flex;
    flex-direction: column;
    /* background: rgb(72, 77, 80); */
    /* 浅色背景 */
    width: 100%;
    height: 100%;
}

.merge-view .filters {
    display: flex;
    flex-direction: row;
    width: 100%;
    /* height: 60px; */
    height: 7%;
}

/* .selector-station {
        width: 18%;
        margin-right: 10px;
        height: 70%;
    } */

.filters-button {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
    margin-left: auto;
    margin-right: 60px;
}

.merge-view .scope-select {
    width: 366px;
    height: 100%;
    border-radius: 5px;
}

.merge-view .content {
    display: flex;
    flex-direction: row;
    height: calc(100% - 60px);
}

.origin-data,
.match-data,
.modified-data {
    display: flex;
    flex-direction: column;
    height: calc(100% - 30px);
}

.origin-data {
    width: calc(50% - 40px);
}

.modified-data {
    margin-left: 20px;
    width: calc(25% - 20px);
    border-radius: 10px;
    background-color: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    /* 浅灰色背景 */
}

.match-data {
    margin-left: 10px;
    width: calc(25% - 20px);
    border-radius: 10px;
    background-color: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    /* 浅灰色背景 */
}

/* 文字颜色 */
.merge-view .filters a-select {
    color: #333;
    /* 深色文字 */
}
</style>
