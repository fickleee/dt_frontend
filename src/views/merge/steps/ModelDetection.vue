<template>
  <div class="container">
    <a-spin tip="Loading...">
      <a-alert
        message="正在进行模型检测..."
        description="图纸分割 -> 模型检测 -> 图纸合并"
      ></a-alert>
    </a-spin>
  </div>
</template>

<script setup>  
import { onMounted, computed } from 'vue';
import { requestModelDetection } from '@/api/merge/create'; // 引入API请求函数

const emit = defineEmits(['step-complete']);

// 定义接收的props
const props = defineProps({
  stationName: String,
  imagesList: Array,
});

const computedStationName = computed(() => {
  if (props.stationName) {
    return props.stationName;
  } else {
    return "";
  }
});
const computedImagesList = computed(() => {
  if (props.imagesList) {
    return props.imagesList;
  } else {
    return [];
  }
});

onMounted( async () => {
  const status = await requestModelDetection(computedStationName.value);
  if (status === 'error') {
    // 处理错误状态
    console.error('模型检测失败');
    return;
  }
  emit('step-complete');
});


</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

</style>