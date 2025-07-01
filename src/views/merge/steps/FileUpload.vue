<template>
  <div class="container">
    <div class="content">
      <div class="bp-uploader">
        <h1>上传场站图纸（PDF格式）</h1>
        <h3>注：上传所有pdf文件，一个文件中可包含多页</h3>
        <a-upload :file-list="bpFileList" :before-upload="beforeBpUpload" @remove="handleBpRemove">
          <a-button>
            <upload-outlined></upload-outlined>
            Select File
          </a-button>
        </a-upload>

      </div>
      <a-divider type="vertical" style="height: 100%; background-color: #484A50; width: 5px" />
      <div class="geo-uploader">
        <h1>上传场站GeoJSON文件</h1>
        <h3>注：两个文件，应为geo.json和geo_label.json</h3>
        <a-upload :file-list="geoFileList" :before-upload="beforeGeoUpload" @remove="handleGeoRemove">
          <a-button>
            <upload-outlined></upload-outlined>
            Select File
          </a-button>
        </a-upload>
      </div>
    </div>
    <div class="next-step">
      <a-button
        type="primary"
        :disabled="bpFileList.length === 0 || geoFileList.length === 0"
        :loading="uploading"
        style="margin-top: 16px"
        @click="handleUpload"
      >
        {{ uploading ? 'Uploading' : 'Start Upload' }}
      </a-button>
    </div>
  </div>
</template>

<script setup>  
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { requestUpload } from '@/api/merge/create'; 

// 定义接收的props
defineProps({
  stationName: String,
  imagesList: Array,
});

const emit = defineEmits(['update-station','update-images', 'step-complete']);

const bpFileList = ref([]);
const geoFileList = ref([]);
const uploading = ref(false);

const handleBpRemove = file => {
  const index = bpFileList.value.indexOf(file);
  const newbpFileList = bpFileList.value.slice();
  newbpFileList.splice(index, 1);
  bpFileList.value = newbpFileList;
};
const handleGeoRemove = file => {
  const index = geoFileList.value.indexOf(file);
  const newGeoFileList = geoFileList.value.slice();
  newGeoFileList.splice(index, 1);
  geoFileList.value = newGeoFileList;
};
const beforeBpUpload = file => {
  const isPDF = file.type === 'application/pdf';
  if (!isPDF) {
    message.error(`${file.name} 不是 pdf 格式的文件`);
    return false;
  }

  bpFileList.value = [...(bpFileList.value || []), file];
  return false;
};
const beforeGeoUpload = file => {
  const isJSON = file.type === 'application/json';
  const isValidName = file.name === 'geo.json' || file.name === 'geo_label.json';
  
  if (!isJSON) {
    message.error(`${file.name} 不是 json 格式的文件`);
    return false;
  }
  
  if (!isValidName) {
    message.error(`文件名必须是 geo.json 或 geo_label.json`);
    return false;
  }

  geoFileList.value = [...(geoFileList.value || []), file];
  return false;
};
const handleUpload = async () => {
  // 弹出对话框，让用户创建新场站名称
  const stationName = prompt("请输入场站名称：");
  if (!stationName) {
    message.error("场站名称不能为空");
    return;
  }
  emit('update-station', stationName);

  const formData = new FormData();

  bpFileList.value.forEach(file => {
    formData.append('bpFiles[]', file);
  });
  geoFileList.value.forEach(file => {
    formData.append('geoFiles[]', file);
  });

  formData.append('stationName', stationName);

  uploading.value = true;
  const imagesList = await requestUpload(formData);
  // 如果imagesList数组不为空
  if (imagesList.length > 0) {
    message.success(`上传成功，共 ${imagesList.length} 张图片`);
    emit('update-images', imagesList);
    emit('step-complete');
  }
  else {
    message.error('上传失败，请重试！');
  }
  uploading.value = false;
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.content {
  width: 100%;
  height: 90%;
  display: flex;
  flex-direction: row;
}

.bp-uploader {
  width: 50%;
  height: 100%;
  /* background-color: #f0f0f0; */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.geo-uploader {
  width: 50%;
  height: 100%;
  /* background-color: #e0e0e0; */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.next-step {
  width: 100%;
  height: 10%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>