<template>
  <div class="image-container" @mousedown="startDrag" @mouseup="stopDrag" @mousemove="drag">
    <canvas ref="canvasRef" class="canvas"></canvas>
  </div>
</template>

<script setup> 
import { ref, watch, computed } from 'vue';
import { requestMergedImage } from '@/api/merge/create'; // 引入API请求函数

// 定义props
const props = defineProps({
  stationName: String,
  currentValue: String,
  currentBox: Object,
});

const imageUrl = ref("");
const canvasRef = ref(null);
const dragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const offsetX = ref(0); // 画布相对视口的偏移
const offsetY = ref(0); // 画布相对视口的偏移
const image = ref(null);

const boxCoords = ref({x1:0,y1:0,x2:0,y2:0}); // 初始矩形坐标，默认为传入的currentBox


const computedStationName = computed(() => {
  return props.stationName;
});
const computedCurrentValue = computed(() => {
  return props.currentValue;
});
const computedBoxCoords = computed(() => {
    if (Object.keys(props.currentBox).length === 0) {
        console.warn('当前没有选中的记录');
        return {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        };
    } else {
        return props.currentBox;
    }
});

// 修改加载图片后的初始化
const loadImage = () => {
  image.value = new Image();
  image.value.src = imageUrl.value;
  image.value.onload = () => {
    // 使用矩形中心点进行居中
    const centerX = (boxCoords.value.x1 + boxCoords.value.x2) / 2;
    const centerY = (boxCoords.value.y1 + boxCoords.value.y2) / 2;
    centerCanvasOnPoint({ x: centerX, y: centerY });
  };
};

const drawImage = () => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight - 20;

  if (image.value && image.value.complete) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image.value, offsetX.value, offsetY.value);

    // 绘制选中的矩形框
    const x1 = boxCoords.value.x1 + offsetX.value;
    const y1 = boxCoords.value.y1 + offsetY.value;
    const width = boxCoords.value.x2 - boxCoords.value.x1;
    const height = boxCoords.value.y2 - boxCoords.value.y1;
    
    ctx.beginPath();
    ctx.rect(x1, y1, width, height);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
};

// 以指定点为中心调整画布
const centerCanvasOnPoint = (point) => {
  const canvas = canvasRef.value;
  const { clientWidth: canvasWidth, clientHeight: canvasHeight } = canvas;

  offsetX.value = canvasWidth / 2 - point.x;
  offsetY.value = canvasHeight / 2 - point.y;

  drawImage();
};

// 拖拽逻辑
const startDrag = (event) => {
  dragging.value = true;
  startX.value = event.clientX - offsetX.value;
  startY.value = event.clientY - offsetY.value;
};

const stopDrag = () => {
  dragging.value = false;
};

const drag = (event) => {
  if (dragging.value) {
    offsetX.value = event.clientX - startX.value;
    offsetY.value = event.clientY - startY.value;

    drawImage();
  }
};

watch(computedBoxCoords, (newValue) => {
  if (newValue) {
    boxCoords.value = {
      x1: newValue.x1,
      y1: newValue.y1,
      x2: newValue.x2,
      y2: newValue.y2
    };

    // 使用矩形中心点进行居中
    const centerX = (newValue.x1 + newValue.x2) / 2;
    const centerY = (newValue.y1 + newValue.y2) / 2;
    centerCanvasOnPoint({ x: centerX, y: centerY });
  }
});

watch(computedCurrentValue, async () => {
  imageUrl.value = await requestMergedImage(props.stationName, props.currentValue);
  loadImage();
}, { immediate: true });

</script>

<style scoped>
.image-container{
  width: 100%;
  height: 100%;
}
</style>