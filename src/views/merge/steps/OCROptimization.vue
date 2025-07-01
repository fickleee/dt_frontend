<template>
  <div class="container">
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
      <a-button @click="showConfirm" style="margin-left: 20px;">下一步</a-button>
    </div>
    <div class="optimize-content">
      <div class="optimize-image">
        <OptimizationImage 
          :stationName="computedStationName" 
          :currentValue="currentValue" 
          :currentBox="currentBox"
        />
      </div>
      <div class="optimize-info">
        <OptimizationInfo 
          :stationName="computedStationName" 
          :currentValue="currentValue" 
          :currentBox="currentBox"
          @update-box="updateBox"
        />
      </div>
    </div>
  </div>
</template>

<script setup>  
import { ref, computed } from 'vue';
import OptimizationImage from '@/components/merge/OptimizationImage.vue';
import OptimizationInfo from '@/components/merge/OptimizationInfo.vue';
import { Modal } from 'ant-design-vue';
import { createVNode } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

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

const currentValue = ref(computedImagesList.value[0]);  // Set first image as default
const options = ref(computedImagesList.value.map(image => ({
  value: image,
  label: image,
})));
const currentBox = ref({
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0
});

const focus = () => {
  // console.log('focus');
};
const handleChange = (value) => {
  // console.log("当前图纸：", currentValue.value);
  currentBox.value = {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0
  };
};

const updateBox = (box) => {
  currentBox.value = box;
};

const showConfirm = () => {
  Modal.confirm({
    title: '是否进行地块划分?',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
      'div',
      {
        style: 'color:red;',
      },
      '请确保所有图纸的标签已经处理完毕，且将OCR结果进行了转换',
    ),
    onOk() {
      emit('step-complete');
    },
    onCancel() {
      // console.log('Cancel');
    },
    class: 'test',
  });
};

</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.image-picker{
  width: 100%;
  height: 45px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.optimize-content{
  width: 100%;
  height: calc(100% - 45px);
  display: flex;
  flex-direction: row;
}
.optimize-image{
  width: 65%;
  height: 100%;
  margin-right: 10px;
  padding: 10px;
  border-radius: 15px;
  background-color: #484A50;
}
.optimize-info{
  width: calc(35% - 10px);
  height: 100%;
  padding: 10px;
  border-radius: 15px;
  background-color: #484A50;
}
</style>