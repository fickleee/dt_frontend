<template>
    <div class="selector-container">
        <Select class="selector-station" placeholder="请选择电站" ref="select" :value="stationSelected"
            :options="stationOptions" @change="onStationChange"></Select>
        <DatePicker class="selector-time" :value="dateSelected" @change="onDateChange" />
    </div>
    <div class="predict-overview">
        <div class="title">过去30天总损失情况&未来7天损失估计</div>
        <div style="font-size: 10px">
            未来损失
            <span style="color: #7ea7ea; font-size: 18px; font-weight: bold"> XXX </span>
            <span style="color: #7ea7ea; font-size: 10px; margin-right: 50px">kw/h</span>
            已产生损失
            <span style="color: #7ea7ea; font-size: 18px; font-weight: bold"> XXX </span>
            <span style="color: #7ea7ea; font-size: 10px; margin-right: 50px">kw/h</span>
            当月总损失
            <span style="color: #7ea7ea; font-size: 18px; font-weight: bold"> XXX </span>
            <span style="color: #7ea7ea; font-size: 10px; margin-right: 50px">kw/h</span>
        </div>
        <div style="margin-top: 10px; width: 100%; height: 40%">
            <LossOverviewChart />
        </div>
    </div>
    <div class="predict-detail">
        <div class="table-container" style="width:30%">
            <!-- <div class="title">损失估计细节</div> -->
            <List class="list" :columns="columns" :data="treeData" :title="'损失估计细节'" :detailColumnCount="2"
                :detailColumns="detailColumns" :row-selection="rowSelection"
                :expandable="{ defaultExpandAllRows: true }" :style="{ backgroundColor: '#383c3f', fontSize: '12px' }">
            </List>
        </div>
        <div class="card-container" style="height: 100%; width: 70%; min-height: 500px">
            <div class="title">各组串损失估计曲线</div>
            <div style="font-size: 10px; margin: 10px 0 0">选中组串 XXX</div>
            <TwoLossChart />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Select, DatePicker } from 'ant-design-vue'
import LossOverviewChart from '@/components/charts/LossOverviewChart.vue'

import TwoLossChart from '@/components/charts/TwoLossChart.vue'
import List from '@/components/List.vue'
import dayjs from 'dayjs';
import { STATIONS } from '@/utils/constants';
import { useStore } from 'vuex';

const { state, commit } = useStore();
const stationOptions = STATIONS;
const stationSelected = computed(() => state.globalVar.selectedStation);
const dateSelected = computed(() => dayjs(state.globalVar.selectedDate, 'YYYY-MM-DD'));
const onStationChange = (station) => { commit("globalVar/setSelectedStation", station) };
const onDateChange = (date) => { commit("globalVar/setSelectedDate", date.format('YYYY-MM-DD')) };

const options = [
    {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [
            {
                value: 'hangzhou',
                label: 'Hangzhou'
            }
        ]
    },
    {
        value: 'jiangsu',
        label: 'Jiangsu',
        children: [
            {
                value: 'nanjing',
                label: 'Nanjing'
            }
        ]
    }
]
const stationvalue = ref([])

// 表格列定义
const columns = [
    { title: '组件名', dataIndex: 'name', key: 'name' },
    { title: '已造成损失', dataIndex: 'loss', key: 'loss', width: 60, align: 'right' },
    { title: '预估损失', dataIndex: 'preLoss', key: 'preLoss', width: 50, align: 'right' }
]

const detailColumns = ['loss', 'preLoss']

// 数据源：从 store 获取
const store = useStore()
const treeData = computed(() => store.getters['treeList/getTreeData'])
const rowSelection = reactive({
    type: 'checkbox',
    onChange: (selectedRowKeys, selectedRows) => {
    }
})
</script>

<style scoped>
.selector-container {
    height: 10%;
    width: 100%;
    display: flex;
    align-items: center;
}

.predict-overview {
    height: 18%;
    width: 100%;
    display: flex;
}

.predict-detail {
    height: 72%;
}
</style>