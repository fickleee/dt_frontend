<template>
  <div class="container">
    <div class="content">
      <div class="geo-division">
        <div class="mapbox-container">
          <GeoDivision 
            :stationName="computedStationName" 
            @update-geo-plots="updateGeoPlots"
          />
        </div>
        <div class="geo-info">
          <div class="plots-container">
            <div 
              v-for="(plot, index) in geoPlots" 
              :key="index"
              class="plot-card"
            >
              <h4 class="card-content">地块 {{ plot.name }}</h4>
            </div>
          </div>
        </div>
      </div>
      <a-divider type="vertical" style="height: 100%; background-color: #484A50; width: 5px" />
      <div class="bp-division">
        <div class="image-picker">
          <span style="color: #aaaaaa">当前图纸：</span>
          <a-select
            ref="select"
            v-model:value="currentValue"
            style="width: 200px"
            :options="options"
            @focus="focus"
            @change="handleChange"
          ></a-select>
        </div>
        <div class="canvas-container">
          <BlueprintDivision 
            :stationName="computedStationName" 
            :currentValue="currentValue" 
            @update-bp-plots="updateBpPlots"
          />
        </div>
        <div class="bp-info">
          <div class="plots-container">
            <div 
              v-for="(plot, index) in bpPlots" 
              :key="index"
              class="plot-card"
            >
              <h4 class="card-content">地块 {{ plot.plotName }}</h4>
              <p class="card-content">{{ plot.fileName }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="start-split">
      <a-button @click="handleDivision">开始分割&融合</a-button>
    </div>
  </div>
</template>

<script setup>  
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import GeoDivision from '@/components/merge/GeoDivision.vue';
import BlueprintDivision from '@/components/merge/BlueprintDivision.vue';
import { requestDivision } from '@/api/merge/create';
import { useRouter } from 'vue-router'

const emit = defineEmits(['step-complete']);

// router 实例
const router = useRouter();

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

const currentValue = ref(computedImagesList.value[0]);  // Set first image as default
const options = ref(computedImagesList.value.map(image => ({
  value: image,
  label: image,
})));

const geoPlots = ref([]);
const bpPlots = ref([]);

const focus = () => {
  // console.log('focus');
};
const handleChange = (value) => {
  // console.log("当前图纸：", currentValue.value);
};

const handleDivision = async () => {
  // 判断bpPlots和geoPlots是否为空
  if (bpPlots.value.length === 0 || geoPlots.value.length === 0) {
    message.error('图纸数据或者地理数据为空，请检查！');
    return;
  }
  // 判断bpPlots和geoPlots的数量是否一致
  if (bpPlots.value.length !== geoPlots.value.length) {
    message.error('图纸数据和地理数据的数量不一致，请检查！');
    return;
  }

  // 提交分割请求
  const status = await requestDivision(computedStationName.value, geoPlots.value, bpPlots.value);
  if (status === 'error') {
    message.error('分割失败，请重试！');
    return;
  }
  else {
    message.success('分割成功！');

    // Redirect to the station page
    router.push('/station');
  }
}

const updateGeoPlots = (newPlots) => {
  geoPlots.value = newPlots;
};
const updateBpPlots = (newPlots) => {
  bpPlots.value = newPlots;
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
  height: calc(100% - 40px);
  display: flex;
  flex-direction: row;
}

.geo-division {
  width: 50%;
  height: 100%;
}
.bp-division {
  width: 50%;
  height: 100%;
}
.image-picker{
  width: 100%;
  height: 30px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.start-split {
  width: 100%;
  margin-top: 10px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.mapbox-container{
  width: 100%;
  height: 85%;
  padding: 10px;
  border-radius: 15px;
}
.canvas-container{
  width: 100%;
  height: calc(85% - 30px);
  padding: 10px;
  border-radius: 15px;
}
.bp-info {
  width: 100%;
  height: 15%;
  padding: 10px;
  border-radius: 15px;
  overflow-x: auto;
}

.plots-container {
  display: flex;
  gap: 10px;
  height: 100%;
}

.plot-card {
  min-width: 150px;
  height: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f8f8;
}

.geo-info{
  width: 100%;
  height: 15%;
  padding: 10px;
  border-radius: 15px;
  overflow-x: auto;
}

.card-content{
  color: #000000;
}
</style>