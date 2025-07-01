<template>
  <div>
    <div class="section-title">历史无人机巡检报告</div>
    <div>
      <div v-if="props.selectString" class="uav-image-pair">
        <div class="uav-image-item">
          <img v-if="rgbImage" :src="rgbImage" alt="可见光图像" class="uav-image rgb" @click="openPreview(rgbImage)" />
          <img
            v-else
            src="@/assets/images/missing_img.svg"
            alt="无可见光图像"
            style="margin-right: 10px;"
            class="uav-image placeholder-image"
          />
        </div>
        <div class="uav-image-item">
          <img v-if="irImage" :src="irImage" alt="红外线图像" class="uav-image ir" @click="openPreview(irImage)" />
          <img
            v-else
            src="@/assets/images/missing_img.svg"
            alt="无红外线图像"
            class="uav-image placeholder-image"
          />
        </div>
      </div>
    </div>
    <!-- 大图预览弹窗 -->
    <div v-if="showPreview" class="img-preview-mask" @click="closePreview">
      <span class="img-preview-close" @click.stop="closePreview">×</span>
      <img :src="previewSrc" class="img-preview" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getStringUavImages } from '@/api/detect/detect';

const props = defineProps({
  stationName: String,
  date: String,
  selectString: String
});

const rgbImage = ref('');
const irImage = ref('');
const loading = ref(false);

const showPreview = ref(false);
const previewSrc = ref('');

const openPreview = (src) => {
  // 只有当src有值时才打开预览
  if (src) {
    previewSrc.value = src;
    showPreview.value = true;
  }
};
const closePreview = () => {
  showPreview.value = false;
  previewSrc.value = '';
};

const fetchImages = async () => {
  if (!props.stationName || !props.selectString || !props.date) {
    rgbImage.value = '';
    irImage.value = '';
    return;
  }
  loading.value = true;
  try {
    const res = await getStringUavImages(props.stationName, props.selectString, props.date);
    console.log(res);
    
    rgbImage.value = res.rgb_image || '';
    irImage.value = res.ir_image || '';
  } catch (e) {
    console.error("Failed to fetch UAV images:", e); // 添加错误日志
    rgbImage.value = '';
    irImage.value = '';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchImages);
watch(() => [props.stationName, props.selectString, props.date], fetchImages);
</script>

<style scoped>
.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #CECEF7;
  margin-bottom: 20px;
}
.uav-image-pair {
  display: flex;
  flex-direction: row;
  height: auto;
  padding: 0 20px;
}
.uav-image-item {
  display: flex;
  flex-direction: column;
  align-items: contain;
  width: auto;
  height: auto;
}
.uav-image.rgb, .uav-image.ir {
  height: 140px;
  width: auto;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #444;
  cursor: pointer;
}
.uav-image.rgb {
  aspect-ratio: 559 / 314;
}
.uav-image.ir {
  aspect-ratio: 393 / 314;
  margin-left: 5vw;
}

/* 大图预览弹窗样式 */
.img-preview-mask {
  position: fixed;
  z-index: 9999;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-preview {
  max-width: 70vw;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 2px 16px #000a;
  background: #222;
}

.img-preview-close {
  position: absolute;
  top: 24px;
  right: 36px;
  font-size: 2.2em;
  color: #fff;
  cursor: pointer;
  z-index: 10000;
  font-weight: bold;
  transition: color 0.2s;
}
.img-preview-close:hover {
  color: #ff4b4b;
}

/* 占位符图片的样式，可以根据你的SVG图片调整 */
.placeholder-image {
  height: 110px;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 无图像提示文本样式 */
.no-image-placeholder {
  color: #888;
  text-align: center;
  margin-top: 50px;
  font-size: 16px;
}
</style>
