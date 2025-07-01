<template>
  <div class="container">
    <div class="header">
      <div class="header-step">
        <a-steps
        v-model:current="current"
        type="navigation"
        :items="steps"
        ></a-steps>
      </div>
      <div class="header-station">
        <span style="color: #aaaaaa">当前处理场站：</span>
        <span class="station-value">{{ stationName }}</span>
      </div>
    </div>

    <div class="content">
      <component 
        :is="currentComponent" 
        :stationName="stationName" 
        :imagesList="imagesList"
        @update-station="updateStationName" 
        @update-images="updateImagesList"
        @step-complete="handleStepComplete" 
      />
    </div>
  </div>
</template>

<script setup>  
import { ref, computed } from 'vue';
import FileUpload from '@/views/merge/steps/FileUpload.vue';
import ImagePreprocess from '@/views/merge/steps/ImagePreprocess.vue';
import ModelDetection from '@/views/merge/steps/ModelDetection.vue';
import OCROptimization from '@/views/merge/steps/OCROptimization.vue';
import PlotDivision from '@/views/merge/steps/PlotDivision.vue';

const stationName = ref("")
const imagesList = ref([]);
const current = ref(0);
const steps = ref([
  { status: 'process', title: '文件上传', disabled: 'True'},
  { status: 'wait', title: '图片预处理', disabled: 'True'},
  { status: 'wait', title: '模型检测', disabled: 'True'},
  { status: 'wait', title: 'OCR优化', disabled: 'True'},
  { status: 'wait', title: '地块划分&融合', disabled: 'True'}
]);

const components = [
  FileUpload,
  ImagePreprocess,
  ModelDetection,
  OCROptimization,
  PlotDivision,
];

const currentComponent = computed(() => components[current.value]);

function handleStepComplete() {
  // Update current step status to 'finish'
  steps.value[current.value].status = 'finish';
  
  // Move to next step if available
  if (current.value < steps.value.length - 1) {
    current.value++;
    steps.value[current.value].status = 'process';
  }
}

function updateStationName(newName) {
  stationName.value = newName;
}

function updateImagesList(newImagesList) {
  imagesList.value = newImagesList;
}
</script>

<style scoped>
.container {
    width: 100%;
    height: 100%;
    padding: 15px;
}
.header {
    width: 100%;
    height: 56px;
    background-color: #393C41;
    border-radius: 15px;
    padding: 0px 10px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: row;
}
.header-step {
  width: 70%;
  height: 100%;
}
.header-station {
  width: 30%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.station-value {
  color: #06d30a
}

.content {
    width: 100%;
    height: calc(100% - 66px);
    background-color: #393C41;
    border-radius: 15px;
}

</style>