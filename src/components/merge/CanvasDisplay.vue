<template>
  <div class="container">
    <canvas 
      ref="canvas" 
      class="image-canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @wheel="onWheel"
    ></canvas>
    <div class="toolbar">
      <button class="toolbar-btn" @click="handleRotate">
        <img :src="'/src/assets/merge/rotate.svg'" alt="顺时针旋转90°" class="icon" style="width: 30px; height: 30px;">
      </button>
      <button 
        class="toolbar-btn" 
        :class="{ active: isDrawingMode }"
        @click="toggleDrawingMode"
      >
        <img :src="'/src/assets/merge/rect.svg'" alt="绘制白色遮罩" class="icon" style="width: 30px; height: 30px;">
      </button>
      <button class="toolbar-btn" @click="handleReset">
        <img :src="'/src/assets/merge/reset.svg'" alt="重置图片" class="icon">
      </button>
      <button class="toolbar-btn" @click="handleSave">
        <img :src="'/src/assets/merge/save.svg'" alt="保存修改" class="icon">
      </button>
    </div>
  </div>
</template>

<script setup>
// 目前有bug：请在未旋转时绘制矩形框，旋转后绘制矩形框，其坐标将会有bug

import { ref, watch, onMounted, computed } from 'vue';
import { requestImage, requestImageSave } from '@/api/merge/create'; // 引入API请求函数
import { message } from 'ant-design-vue';

const props = defineProps({
  stationName: String,
  currentValue: String
});

const computedStationName = computed(() => {
  return props.stationName;
});
const computedCurrentValue = computed(() => {
  return props.currentValue;
});

const emit = defineEmits(['update-rotation','update-rectangles']);

const imageUrl = ref("");
const canvas = ref(null);
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const lastPos = ref({ x: 0, y: 0 });
const imgRef = ref(null);
const rotation = ref(0);
const isDrawingMode = ref(false);
const rectangles = ref([]);
const startPos = ref(null);
const originalImageSize = ref({ width: 0, height: 0 });
let drawWidth=-1;
let drawHeight=-1;

const toggleDrawingMode = () => {
  isDrawingMode.value = !isDrawingMode.value;
  canvas.value.style.cursor = isDrawingMode.value ? 'crosshair' : 'grab';
};

const drawImage = () => {
  if (!imageUrl.value || !canvas.value) return;

  const ctx = canvas.value.getContext('2d');
  
  if (!imgRef.value) {
    const img = new Image();
    img.onload = () => {
      imgRef.value = img;
      originalImageSize.value = {
        width: img.width,
        height: img.height
      };
      drawImageToCanvas();
    };
    img.src = imageUrl.value;
  } else {
    drawImageToCanvas();
  }
};

const getCanvasToImageScale = () => {
  if (!canvas.value || !imgRef.value) return 1;

  const originalWidth = originalImageSize.value.width;
  const originalHeight = originalImageSize.value.height;
  
  const canvasAspect = canvas.value.width / canvas.value.height;
  const imgAspect = originalWidth / originalHeight;

  if (imgAspect > canvasAspect) {
    return originalWidth / canvas.value.width;
  } else {
    return originalHeight / canvas.value.height;
  }
};

const calCanvasToImageCoords = (x, y) => {
  const imageScale = getCanvasToImageScale();

  // Convert to image coordinates
  const imageX = x * imageScale;
  const imageY = y * imageScale;

  return { x: imageX, y: imageY };
};

const getTransformedPoint = (x, y) => {
  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;
  
  // Reverse the transformations
  const angle = (-rotation.value * Math.PI) / 180;
  const translatedX = x - (centerX + offset.value.x);
  const translatedY = y - (centerY + offset.value.y);
  
  // Rotate point
  const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
  const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);
  
  // Scale point
  return {
    x: rotatedX / scale.value,
    y: rotatedY / scale.value
  };
};

const calTransformedPoint = (x, y) => {
  const centerX = drawWidth / 2;
  const centerY = drawHeight / 2;
  
  const translatedX = x + centerX ;
  const translatedY = y + centerY ;
  
  return {
    x: translatedX,
    y: translatedY
  };
};

const drawImageToCanvas = () => {
  if (!canvas.value || !imgRef.value) return;
  
  const ctx = canvas.value.getContext('2d');
  const img = imgRef.value;

  canvas.value.width = canvas.value.clientWidth;
  canvas.value.height = canvas.value.clientHeight;

  const canvasAspect = canvas.value.width / canvas.value.height;
  const imgAspect = img.width / img.height;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;
  
  ctx.translate(centerX + offset.value.x, centerY + offset.value.y);
  ctx.scale(scale.value, scale.value);
  ctx.rotate((rotation.value * Math.PI) / 180);

  if (imgAspect > canvasAspect) {
    drawWidth = canvas.value.width;
    drawHeight = canvas.value.width / imgAspect;
  } else {
    drawHeight = canvas.value.height;
    drawWidth = canvas.value.height * imgAspect;
  }
  
  ctx.drawImage(
    img,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  );

  // Draw rectangles
  ctx.fillStyle = 'white';
  for (const rect of rectangles.value) {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    
    // Add blue dashed border
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = 'blue';
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }
};

const handleRotate = () => {
  rotation.value = (rotation.value + 90) % 360;
  emit('update-rotation', rotation.value);
  drawImage();
};

const handleReset = () => {
  scale.value = 1;
  offset.value = { x: 0, y: 0 };
  rotation.value = 0;
  rectangles.value = [];
  drawImage();
  emit('update-rotation', rotation.value);
  emit('update-rectangles', rectangles.value);
};

const getTransformedRectangles = () => {
  if (rectangles.value.length === 0) return [];

  return rectangles.value.map(rect => {
    const topLeft = calTransformedPoint(rect.x, rect.y);
    const imageCoords = calCanvasToImageCoords(topLeft.x, topLeft.y);
    
    const width = rect.width * getCanvasToImageScale();
    const height = rect.height * getCanvasToImageScale();

    return {
      x: Math.round(imageCoords.x),
      y: Math.round(imageCoords.y),
      width: Math.round(width),
      height: Math.round(height)
    };
  });
};

const handleSave = async () => {
  const transformedRectangles = getTransformedRectangles();

  const result = {
    stationName: props.stationName,
    imageName: props.currentValue,
    rotation: rotation.value,
    rectangles: transformedRectangles,
  };

  if (result.rectangles.length === 0 && result.rotation === 0) {
    alert('图片无变化！请先绘制矩形框或旋转图片');
    return;
  }

  const hide = message.loading('保存中...', 0);

  try {
    // Add cache-busting parameter to ensure fresh load
    const newUrl = await requestImageSave(
      props.stationName,
      props.currentValue,
      rotation.value,
      transformedRectangles
    );

    // Clear the existing image reference and force reload
    imgRef.value = null;
    imageUrl.value = newUrl + `?t=${Date.now()}`; // Add timestamp to bypass cache
    scale.value = 1;
    offset.value = { x: 0, y: 0 };
    rotation.value = 0;
    rectangles.value = [];
    drawImage();
  } catch (error) {
    message.error('保存失败，请重试');
  } finally {
    hide();
  }
};

const onMouseDown = (e) => {
  if (isDrawingMode.value) {
    const rect = canvas.value.getBoundingClientRect();
    const point = getTransformedPoint(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    startPos.value = point;
  } else {
    isDragging.value = true;
    lastPos.value = { x: e.clientX, y: e.clientY };
  }
};

const onMouseMove = (e) => {
  if (isDrawingMode.value && startPos.value) {
    const rect = canvas.value.getBoundingClientRect();
    const currentPos = getTransformedPoint(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    
    const tempRectangles = [...rectangles.value];
    tempRectangles.push({
      x: startPos.value.x,
      y: startPos.value.y,
      width: currentPos.x - startPos.value.x,
      height: currentPos.y - startPos.value.y
    });
    
    rectangles.value = tempRectangles;
    drawImage();
    rectangles.value.pop();
  } else if (isDragging.value) {
    offset.value.x += e.clientX - lastPos.value.x;
    offset.value.y += e.clientY - lastPos.value.y;
    lastPos.value = { x: e.clientX, y: e.clientY };
    drawImage();
  }
};

const onMouseUp = (e) => {
  if (isDrawingMode.value && startPos.value) {
    const rect = canvas.value.getBoundingClientRect();
    const endPos = getTransformedPoint(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    
    rectangles.value.push({
      x: startPos.value.x,
      y: startPos.value.y,
      width: endPos.x - startPos.value.x,
      height: endPos.y - startPos.value.y
    });
    
    const transformedRectangles = getTransformedRectangles();
    emit('update-rectangles', transformedRectangles);
    
    startPos.value = null;
    drawImage();
  }
  isDragging.value = false;
};

const onWheel = (e) => {
  e.preventDefault();
  
  const rect = canvas.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  
  scale.value *= zoomFactor;
  
  offset.value.x = mouseX - zoomFactor * (mouseX - offset.value.x);
  offset.value.y = mouseY - zoomFactor * (mouseY - offset.value.y);
  
  drawImage();
};

watch(computedCurrentValue, async () => {
  imageUrl.value = await requestImage(props.stationName, props.currentValue);
  imgRef.value = null;
  scale.value = 1;
  offset.value = { x: 0, y: 0 };
  rotation.value = 0;
  rectangles.value = [];
  emit('update-rotation', rotation.value);
  emit('update-rectangles', rectangles.value);
  drawImage();
});

onMounted( async () => {
  imageUrl.value = await requestImage(props.stationName, props.currentValue);
  drawImage();
  window.addEventListener('resize', drawImage);
  emit('update-rotation', rotation.value);
  emit('update-rectangles', rectangles.value);
});
</script>

<style scoped>
/* Styles remain unchanged */
.container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.image-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  cursor: grab;
}

.image-canvas:active {
  cursor: grabbing;
}

.toolbar {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  background: rgba(200, 200, 200, 0.9);
  padding: 5px 5px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.toolbar-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  color: #2c3e50;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.3s, box-shadow 0.3s, color 0.3s;
}

.toolbar-btn:hover {
  color: #3498db;
  transform: scale(1.1);
}

.toolbar-btn i {
  font-size: 24px;
}

.toolbar-btn.active {
  background-color: #bfbfbf;
  border-color: #aaa;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.icon {
  width: 24px;
  height: 24px;
}
</style>
