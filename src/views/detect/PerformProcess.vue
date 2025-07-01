<template>
    <div class="perform-process-container">
        <Button style="box-shadow: none !important; background:none !important" class="perform-btn" type="primary"
            @click="handlePerform">{{ performText }}</Button>
        <Spin v-if="loading" style="margin-left: 10px;" />
    </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { Button, Spin } from 'ant-design-vue';
import { checkJsonFileState } from '@/utils/func';
const store = useStore();
// 计算属性绑定到 Vuex 的 dataLoaderVisible 状态
const loading = ref(false);
const performText = ref('确认');

const stationSelected = computed(() => store.state.globalVar.selectedStation);
const dateSelectedStr = computed(() => store.state.globalVar.selectedDate);
// 处理按钮点击事件
const handlePerform = async () => {
    loading.value = true;
    performText.value = '执行中...';

    // await store.dispatch('groupDetection/performDetection', { station_name, date })
    //     .then(response => {
    //         console.log('降维处理完成，状态码:', response);
    //     })
    //     .catch(error => {
    //         console.error('降维处理出错:', error);
    //     })
    //     .finally(() => {
    //         loading.value = false;
    //         performText.value = '确认';
    //     });
    console.log("check"+stationSelected.value+dateSelectedStr.value);
    const result = await checkJsonFileState(stationSelected.value, dateSelectedStr.value);
    if (result) {
        try {
            await store.dispatch('degradationOverview/fetchStringInfo');
            loading.value = false; 
        } catch (error) {
            console.error('数据获取失败:', error);
        }
    }
    
    loading.value = false;
    performText.value = '确认';
}
</script>
<style scoped>
.perform-process-container {
    display: flex;
    align-items: center;
    height: 100%;
}
</style>