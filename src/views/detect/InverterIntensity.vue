<template>
    <div style="height: 35%; ">
        <div class="inverter-intensity-container">
            <div class="title">
                历史7 Days逆变器电流
            </div>
            <div class="legend">
                <div class="legend-item">
                    <span class="line intensity"></span>
                    <span class="legend-text">当前逆变器</span>
                </div>
                <div class="legend-item">
                    <span class="line selected"></span>
                    <span class="legend-text">选中的逆变器</span>
                </div>
            </div>


        </div>
        <LinePlot :lineStyle="extractedNumber"></LinePlot>
        <!-- <linechart :lineStyle="0"></linechart> -->
    </div>

</template>

<!-- <script setup> -->


<script setup>

import LinePlot from '@/components/charts/detect/LinePlot.vue';
import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore()
const selectedString = computed(() => store.getters['degradationOverview/getSelectedPV'])
const extractedNumber = computed(() => {
    const match = selectedString.value ? selectedString.value.match(/PV(\d+)/) : null;
    return match ? Number(match[1]) : null; // 提取匹配的数字
});
</script>


<style scoped>
.inverter-intensity-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    font-size: 18px;
    color: #333;
}

.title {
    font-size: 14px;
    color: #CECEF7;
}

.legend {
    display: flex;
    gap: 16px;
}

.legend-item {
    display: flex;
    align-items: center;
}

.line {
    width: 20px;
    height: 2px;
    margin-right: 8px;
}

.intensity {
    background-color: #6A88C1;
    /* 实线表示当前逆变器，蓝色 */
}

.selected {
    border-bottom: 2px dashed #6A88C1;
    /* 虚线表示选中的逆变器，红色 */
}

.legend-text {
    font-size: 14px;
    color: #CECEF7;
}
</style>