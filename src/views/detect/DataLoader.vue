<template>
  <div v-if="loading" class="loader-container">
    <div class="loader"></div>
    <p>数据加载中...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const loading = ref(true); 
let intervalId = null; 

const fetchData = async () => {
  console.log('开始获取数据...');
  try {
    await store.dispatch('degradationOverview/fetchStringInfo');
    loading.value = false; 
  } catch (error) {
    console.error('数据获取失败:', error);
  }
};

onMounted(() => {
  fetchData(); 
  intervalId = setInterval(fetchData, 60000); // 每 60 秒获取一次
});

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.loader-container {
  position:absolute;
  top:50%;
  left:50%;
  z-index:9999;
}
.loader {
  width: 50px;
  height: 50px;
  border: 6px solid #f3f3f3;
  border-top: 6px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;

}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
