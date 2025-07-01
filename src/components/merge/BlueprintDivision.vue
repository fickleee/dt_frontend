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
      @contextmenu="addPoint"
    ></canvas>
    <div class="toolbar">   
      <button class="toolbar-btn" @click="handleReset">
        <img :src="'/src/assets/merge/reset.svg'" alt="重置图片" class="icon">
      </button>
    </div>
  </div>  
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { requestImage } from '@/api/merge/create';
import axios from 'axios';
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

const emit = defineEmits(['update-bp-plots']);

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

// 存储所有右键点击的圆点
const points = ref([]); // 当前多边形的圆点
const pointsArray = ref([]); // 存储所有完成的多边形的记录 { points, plotName, fileName }

const pointRadius = 5; // 圆点半径
const polygonCloseThreshold = 100; // 判断圆点是否接近闭合的阈值，单位：像素


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

  // Draw points
  // 绘制所有右键点击的圆点
  points.value.forEach(point => {
    drawPoint(point.canvasX, point.canvasY); // 以偏移量绘制圆点
  });

  // 绘制所有完成多边形的记录
  // 绘制所有已完成的多边形
  pointsArray.value.forEach(polygon => {
    if (polygon.fileName === props.currentValue) {
      drawPolygon(polygon.points, polygon.plotName);
    }
  });
};

// 绘制单个圆点
const drawPoint = (x, y) => {
  const ctx = canvas.value.getContext('2d');
  ctx.beginPath();
  ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
  ctx.fillStyle = 'blue';
  ctx.fill();
};

// 绘制多边形并显示名称
const drawPolygon = (polygonPoints, name) => {
  const ctx = canvas.value.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(polygonPoints[0].canvasX, polygonPoints[0].canvasY); // 移动到第一个点

  for (let i = 1; i < polygonPoints.length; i++) {
    const point = polygonPoints[i];
    ctx.lineTo(point.canvasX, point.canvasY); // 画线到每个点
  }

  ctx.closePath(); // 自动闭合路径
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'blue'; // 设置边框颜色
  ctx.stroke(); // 绘制边框

  ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; // 半透明填充
  ctx.fill(); // 填充多边形

  // 计算多边形的中心点
  const centerX = polygonPoints.reduce((sum, point) => sum + point.canvasX, 0) / polygonPoints.length;
  const centerY = polygonPoints.reduce((sum, point) => sum + point.canvasY, 0) / polygonPoints.length;

  // 在多边形的中心点绘制名称
  ctx.fillStyle = 'red';
  ctx.font = '14px Arial';
  ctx.fillText(name, centerX, centerY);
};

const handleReset = () => {
  scale.value = 1;
  offset.value = { x: 0, y: 0 };
  rotation.value = 0;
  rectangles.value = [];
  points.value = [];
  pointsArray.value = [];
  drawImage();
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

const getTransformedRightPoint = (x,y) => {
  const topLeft = calTransformedPoint(x, y);
  const imageCoords = calCanvasToImageCoords(topLeft.x, topLeft.y);
  return {
    x: Math.round(imageCoords.x),
    y: Math.round(imageCoords.y)
  };
}

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

const addPoint = (e) => {
  e.preventDefault(); // 阻止右键菜单弹出

  const rect = canvas.value.getBoundingClientRect();
  const canvasPoint = getTransformedPoint(
    e.clientX - rect.left,
    e.clientY - rect.top
  );
  const imagePoint = getTransformedRightPoint(
    canvasPoint.x,
    canvasPoint.y
  );
  
  points.value.push({
    canvasX: canvasPoint.x,
    canvasY: canvasPoint.y,
    imageX: imagePoint.x,
    imageY: imagePoint.y
  });

  if (points.value.length > 2) {
    const firstPoint = points.value[0];
    const lastPoint = points.value[points.value.length - 1];
    const distance = Math.sqrt((lastPoint.imageX - firstPoint.imageX) ** 2 + (lastPoint.imageY - firstPoint.imageY) ** 2);

    // 如果距离小于设定的阈值，认为多边形闭合
    if (distance < polygonCloseThreshold) {
      // 弹出提示框输入多边形名称
      const polygonName = prompt("请输入图纸地块名称：");

      // 将该多边形的点和名称存储到 pointsArray 中
      pointsArray.value.push({ points: [...points.value], plotName: polygonName, fileName: props.currentValue });

      // 绘制该多边形和名称
      drawPolygon(points.value, polygonName);

      // 清空当前的 points 数组，开始新的多边形
      points.value = [];
    }
  } 

  drawPoint(canvasPoint.x, canvasPoint.y);
}

// const requestImage = async (stationName, imageName) => {
//   try {
//       const imageResponse = await axios.get('/api/merge-create-show-image',
//         { 
//           responseType: 'blob',
//           params: {
//               stationName: stationName,
//               imageName: imageName
//           }
//         }
//       );

//       return URL.createObjectURL(imageResponse.data); // 返回 Base64 图片 URL
//   } catch (error) {
//       console.error('获取图片失败：', error);
//       throw error; // 根据需要抛出错误，或者做其他错误处理
//   }
// }

watch(computedCurrentValue, async () => {
  imageUrl.value = await requestImage(props.stationName, props.currentValue);
  imgRef.value = null;
  scale.value = 1;
  offset.value = { x: 0, y: 0 };
  rotation.value = 0;
  rectangles.value = [];
  points.value = [];
  drawImage();
});

onMounted( async () => {
  imageUrl.value = await requestImage(props.stationName, props.currentValue);
  drawImage();
  window.addEventListener('resize', drawImage);
});

watch(pointsArray, (newPointsArray) => {
  emit('update-bp-plots', newPointsArray);
}, { deep: true });

</script>

<style scoped>
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
  bottom: 10%;
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
  width: 20px;
  height: 20px;
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
  width: 16px;
  height: 16px;
}
</style>