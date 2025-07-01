<template>
  <div class="container">
    <div class="canvas-content">
      <CanvasDisplay 
        :stationName="computedStationName" 
        :currentValue="currentValue" 
        @update-rotation="updateRotation"
        @update-rectangles="updateRectangles"
      />
    </div>
    <div class="info-content">
      <div class="image-picker">
        <span style="color: #aaaaaa">当前图纸：</span>
        <a-select
          ref="select"
          v-model:value="currentValue"
          style="width: 120px"
          :options="options"
          @focus="focus"
          @change="handleChange"
        ></a-select>
      </div>
      <div class="operation-info">
        <div class="info-section">
          <h4>图像信息</h4>
          <div class="info-item">
            <span>旋转角度:</span>
            <span>{{ tempRotation }}°</span>
          </div>
        </div>

        <div class="info-section">
          <h4>矩形区域 ({{ tempRectangles.length }})</h4>
          <div v-for="(rect, index) in tempRectangles" :key="index" class="rectangle-info">
            <div>矩形 {{ index + 1 }}:</div>
            <div>X: {{ rect.x }}, Y: {{ rect.y }}, 宽度: {{ rect.width }}, 高度: {{ rect.height }}</div>
          </div>
        </div>
      </div>
      <div class="next-step">
        <a-button @click="showConfirm">下一步</a-button>
      </div>
    </div>
  </div>
</template>

<script setup>  
import CanvasDisplay from '@/components/merge/CanvasDisplay.vue';
import { ref, computed } from 'vue';
import { Modal } from 'ant-design-vue';
import { createVNode } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

const emit = defineEmits(['step-complete']);

// 定义接收的props
const props = defineProps({
  stationName: String,
  imagesList: Array,
});

const tempRotation = ref(0);
const tempRectangles = ref([]);

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

const focus = () => {
  // console.log('focus');
};
const handleChange = async (value) => {
  // console.log("当前图纸：", currentValue.value);
};

function updateRotation(newRotation) {
  tempRotation.value = newRotation;
}
function updateRectangles(newRectangles) {
  tempRectangles.value = newRectangles;
}

const showConfirm = () => {
  Modal.confirm({
    title: '是否进行模型预测?',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode(
      'div',
      {
        style: 'color:red;',
      },
      '请确保图纸图片已经完成预处理，否则会影响模型预测的结果',
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
  display: flex;
  flex-direction: row;
}

.canvas-content {
  width: 70%;
  height: 100%;
  border-radius: 15px;
  margin-right: 10px;
  background-color: #484A50;
}

.info-content {
  width: calc(30% - 10px);
  border-radius: 15px;
  height: 100%;
  background-color: #484A50;
  padding: 10px;
}

.image-picker {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

  .operation-info {
    margin-top: 20px;
    color: #ddd;
    width: 100%;
    height: 85%;
    overflow-y: auto;
  }

  .info-section {
    margin-bottom: 20px;
  }

  .info-section h4 {
    margin-bottom: 10px;
    color: #aaa;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
  }

  .rectangle-info {
    background: #3a3c42;
    border-radius: 5px;
    padding: 8px;
    margin-bottom: 8px;
  }

  .rectangle-info div {
    margin: 3px 0;
  }

.next-step {
  width: 100%;
  height: calc(15% - 40px - 20px);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>