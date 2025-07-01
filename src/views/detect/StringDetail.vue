<template>
  <!-- <DataLoader v-if="dataLoaderVisible" /> -->
  <div style="font-weight: bold; height: 4vh; color: #ffffff; padding-left: 1em; padding-top: 1em;">劣化分析</div>
  <div class="container">
    <div class="item">
      <div class="label">选中组串</div>
      <div class="capsule" style="width: 15em; margin-left: 5em;">{{ formatSelectedString(selectedString) }}</div>
    </div>
    <div class="item" style="margin-left: 2em;">
      <div class="label">劣化率</div>
      <div class="capsule" :style="{ width: '10em', color: degradationColor }">
        <template v-if="selectString">
          <div class="circle" :style="{ backgroundColor: degradationColor }"></div>
          {{ degradationRate }} %
        </template>
      </div>
    </div>
  </div>
  <InverterIntensity></InverterIntensity>
  <div class="split-container">
    <div class="left-panel">
      <StringDiagnosis 
        :stationName="stationName" 
        :date="date" 
        :selectString="selectString" 
      />
    </div>
    <div class="right-panel">
      <div class="top-half">
        <PowerLoss 
          :stationName="stationName" 
          :date="date" 
          :selectString="selectString" 
        />
      </div>
      <div class="bottom-half">
        <ReportImg          
          :stationName="stationName" 
          :date="date" 
          :selectString="selectString" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed} from 'vue';
import { useStore } from 'vuex';
import InverterIntensity from './InverterIntensity.vue';
import StringDiagnosis from './StringDiagnosis.vue';
import PowerLoss from './PowerLoss.vue';
import ReportImg from './ReportImg.vue';
import { STATUS_COLORS } from '@/utils/constants';

const props = defineProps({
  stationName: String,
  date: String
});

const store = useStore()
const selectedString = computed(() => store.getters['degradationOverview/getSelectedPV']) // Replace 'String' with actual data
const stringInfo = computed(() => store.getters['degradationOverview/getStringInfo'])
const selectString = computed(() => store.getters['degradationOverview/getSelectedString'])

// 使用props中的stationName和date
const stationName = computed(() => props.stationName);
const date = computed(() => props.date);

// const selectedDate = computed(() => store.getters['globalVar/getSelectedDate']);
const formatSelectedString = (pv) => {
  if (!pv) return '';
  // 匹配 PV 后面的数字
  const match = pv.match(/^PV(\d+)$/);
  if (match) {
    return `${parseInt(match[1], 10)}号组串`;
  }
  return pv;
}
// ... 其他代码 ...
const degradationRate = computed(() => {
  if (selectString.value && stringInfo.value) {
    const result = getAnomalyAndDegradeRate(stringInfo.value, selectString.value).degradeRate;
    // Convert to float if it's a string, then process
    const numericValue = typeof result === 'string' ? parseFloat(result) : result;
    if (isNaN(numericValue) || !isFinite(numericValue)) return 0;
    return `${parseFloat((numericValue * 100).toFixed(2))}`;
  }
  return null;
});
const getAnomalyAndDegradeRate = (stringInfo, selectString) => {
  let result = {
    degradeRate: 0,
  };
  function formatKey(key) {
    const parts = key.split(',');
    if (parts.length >= 6) {
      const btPart = parts[3]; // BT001
      const iPart = parts[4]; // I001
      const pvPart = parts[5].replace('PVINV_DCI', 'PV'); // 将 PVINV_DCI1 转为 PV1
      return `${btPart}-${iPart}-${pvPart}`;
    }
    return '';
  }
  function findLevel4Nodes(children) {
    if (!Array.isArray(children)) return;
    for (const node of children) {
      if (node.level === 4) {
        // 格式化 key 并比较
        if (formatKey(node.key) === selectString) {
          result.degradeRate = node.degradeRate;
          return;
        }
      } else if (node.children && node.children.length > 0) {
        findLevel4Nodes(node.children); // 递归查找子节点
      }
    }
  }
  if (stringInfo.length > 0) {
    findLevel4Nodes(stringInfo[0].children);
  }
  return result;
}

const degradationColor = computed(() => {
  const rate = Number(degradationRate.value);
  if (isNaN(rate) || rate <= 0) return STATUS_COLORS.LOW; 
  if (rate < 10) return STATUS_COLORS.MEDIUM;    
  return STATUS_COLORS.HIGH;                 
});

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  /* Horizontal layout */
  gap: 1em;
  /* Space between items */
  align-items: center;
  /* Center items vertically */
  padding: 0.5em 1em;
  height: 4vh;
}

.item {
  display: flex;
  align-items: center;
}

.capsule {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3em 0.6em;
  border-radius: 1.25em;
  /* Capsule effect */
  background-color: #484D50;
  /* Capsule background color */
  color: #CECEF7;
  /* Capsule text color */
  margin-left: 1em;
  height: 2em;
}

.capsule .circle {
  width: 1em;
  /* Diameter of the circle */
  height: 1em;
  /* Diameter of the circle */
  background-color: #FFA0A0;
  /* Color of the circle */
  border-radius: 50%;
  /* Circle effect */
  margin-right: 0.3em;
  /* Space between circle and percentage */
  flex-shrink: 0;
  /* 防止圆形被压缩 */
}

.label {
  font-size: 0.875em;
  /* Label text size */
  color: #CECEF7;
  /* Label text color */
}

.legend {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 0.6em;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.875em;
  /* Label text size */
  color: #CECEF7;
}

.legend-dot {
  width: 0.9em;
  height: 0.9em;
  border-radius: 50%;
  margin-right: 0.3em;
}

.legend-dot.normal {
  background-color: #ACF3F4;
}

.legend-dot.current {
  background-color: #FF7373;
}

.legend-dot.abnormal {
  background-color: #FFE5B4;
}

.split-container {
  display: flex;
  width: 100%;
  height: 45vh;
  margin-top: 1em;
  padding: 0 0.5em;
}

.left-panel {
  width: 45%; /* 增加左侧面板宽度，从42%到45% */
  /* margin-right: 1%; */
  height: 100%;
  padding-bottom: 1em;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel {
  width: 54%; /* 相应减小右侧面板宽度，从57%到54% */
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.top-half {
  height: 65%; /* 稍微减小上半部分高度 */
  /* margin-bottom: 2%; */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bottom-half {
  height: 35%; /* 增加下半部分高度 */
  margin-top: 1%;
  overflow: hidden;
}
</style>