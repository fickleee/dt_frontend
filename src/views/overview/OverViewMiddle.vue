<template>
  <div class="overview-middle">
    <div class="overview-time-panel">
      <div class="overview-time-container">
        <!-- 当天的日期和星期 -->
        <div class="date-time">
          {{ currentDate + ' ' + currentWeekday }}
        </div>
        <!-- 精确到秒的时间 -->
        <div class="time">{{ currentTime }}</div>
        <!-- 安全运行时间 -->
        <div class="overlap-container">
          <div class="uptime">
            安全运行: <span style="font-size: 2.25vw">{{ uptime }}</span> 天
          </div>
          <div class="uptime-overlap">
            安全运行: <span class="uptime-number">{{ uptime }}</span> 天
          </div>
        </div>
      </div>
    </div>
    <div class="overview-map-panel">
      <div class="overview-map-container">
        <div ref="mapContainer" id="map-container"></div>
        <svg style="position: absolute; width: 0; height: 0">
          <linearGradient id="borderGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#FFFFFF"></stop>
            <stop offset="44%" stop-color="#79A7FF"></stop>
            <stop offset="100%" stop-color="#C3C9FF"></stop>
          </linearGradient>
        </svg>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex';
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
// import 'echarts/map/js/china'

// store 实例
const store = useStore()
// router 实例
const router = useRouter();
const onStationChange = (station) => { store.commit("globalVar/setSelectedStation", station) };

// 定义响应式数据
const props = defineProps(['stationData'])
const currentDate = ref('')
const currentWeekday = ref('')
const currentTime = ref('')
const uptime = ref(0) // 假设的安全运行天数，可以根据实际情况动态获取
const startTime = new Date('2024-01-01 00:00:00')

// 获取星期
function getWeekday(date) {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weekdays[date.getDay()]
}

// 更新时间
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString() // 获取当前时间的字符串表示
  const diff = now - startTime // 时间差
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) // 转换为天数
  uptime.value = days // 更新安全运行时间
  currentDate.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
  currentWeekday.value = getWeekday(now)
}

const mapContainer = ref(null)

const mapOption = ref({})
import geoData from '/src/zhejiang.json'
const scatterSeriesData = ref([])
const updateScatterSeriesData = () => {
  const { stationData } = props
  scatterSeriesData.value = stationData
    .filter((item) => {
      return item.geo !== null
    })
    .map((item) => [
      item.geo[0],
      item.geo[1],
      item.location,
      item.name,
      item.volume,
      item.auxiliaryPowerRate, // 实则 日发电量（万千瓦时）
      item.inefficientStringNumber,
      item.level1OMQuantity,
      item.label
    ])
}

const drawMap = () => {
  const plotDom = echarts.init(mapContainer.value, 'dt', { renderer: 'svg' })
  echarts.registerMap('浙江', { geoJson: geoData })

  mapOption.value = {
    // TODO  引导线效果 https://www.jianshu.com/p/dcb030754954
    tooltip: {
      trigger: 'item',
      triggerOn: 'click', // 由于hover会同时作用于geo和series，无法实现tooltip常显，设置为click
      alwaysShowContent: true,
      show: true, //update echarts5.x后，需要添加这部分代码 disable tooltip 原有的style:
      textStyle: { color: 'transparent' },
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      shadowColor: { show: false },
      formatter: function (params) {
        // console.log(params.componentType)
        console.log(params.data)
        const location = params.data[2] // 所在地
        const name = params.data[3] // 名称
        const volume = params.data[4] // 容量
        const powerGeneration = params.data[5] //发电量
        const inefficientStringNumber = params.data[6] //低效组串
        const level1OMQuantity = params.data[7] //一级运维数量
        return `
    <div class="overview-map-tooltip">
      <div class="overview-map-tooltip-border-bg"></div>
      <div class="overview-map-tooltip-border-left-icon">
        <img src="/tooltipIcon.svg"></img></div>
      <div class="overview-map-tooltip-border-right-icon">
        <img src="/tooltipIcon.svg"></img></div>
      <div class="overview-map-tooltip-title">${name}</div>
      <div
        class="overview-map-tooltip-text"
        style="width: 300px; white-space: normal"
      >
        位于${location}，装机总容量为${volume}兆瓦峰值、当日发电${powerGeneration}万千瓦时、当前低效组串${inefficientStringNumber}组。
      </div>
    </div>
            `
      }
    },
    geo: [
      {
        map: '浙江',
        roam: true,
        layoutCenter: ['50%', '50%'],
        layoutSize: '100%',
        selectedMode: 'single',
        itemStyle: {
          color: '#393C41',
          borderColor: 'url(#borderGradient)',
          borderWidth: 2,
          shadowColor: 'rgba(147, 179, 255, 0.5)', // 发光颜色
          shadowBlur: 30, // 发光扩散大小
          shadowOffsetX: 0, // 水平偏移
          shadowOffsetY: 4 // 垂直偏移
        },
        label: {
          fontSize: 0 //隐藏label
        },
        emphasis: {
          itemStyle: {
            areaColor: 'url(#borderGradient)',
            borderColor: '#FFFFFF',
            borderWidth: 2
          }
        },
        select: {
          disabled: false,
          itemStyle: {
            areaColor: 'url(#borderGradient)',
            borderColor: '#FFFFFF',
            borderWidth: 2
          }
        }
      }
    ],
    series: {
      type: 'effectScatter',
      rippleEffect: {
        number: 1,
        scale: 2,
        color: '#70CBFF80'
      },
      coordinateSystem: 'geo',
      symbol: 'image:///plant_light.svg', // 设置为图标资源路径
      symbolSize: 25, // 调整图标大小
      itemStyle: {
        color: '#b4fffa',
        shadowBlur: 10, // 阴影的模糊范围，值越大发光越明显
        shadowColor: 'rgba(255, 255, 255)', // 发光颜色和透明度
        shadowOffsetX: 0, // 阴影的水平偏移
        shadowOffsetY: 0 // 阴影的垂直偏移
      },
      data: scatterSeriesData.value
    }
  }

  plotDom.setOption(mapOption.value)

  // Add double click event listener
  plotDom.on('dblclick', params => {
    if (params.componentType === 'series') {
      // 获取电厂英文名，如 "tangjing"
      let stationName = params.data[8]
      if (stationName == 'changdatu') {
        stationName = 'datu';
      }
      onStationChange(stationName) // 更新store中的电站名称

      // Redirect to the station page
      router.push('/station');
    }
  })

  window.addEventListener('resize', function () {
    plotDom.resize()
  })
}

watch(
  () => props.stationData,
  (newData, oldData) => {
    if (newData !== oldData) {
      updateScatterSeriesData()
      drawMap()
    }
  }
)

// 组件挂载时开始定时更新时间
onMounted(() => {
  updateTime() // 初始更新时间
  const intervalId = setInterval(updateTime, 1000) // 每秒更新时间
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(intervalId)
  })
})
</script>
<style scoped lang="scss">
.overview-time-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 15%;
}

.overview-time-container {
  height: 70%;
  text-align: center;
  font-size: 1.5vw;
  font-weight: 600;
}

:deep(.overview-map-tooltip) {
  padding: 1em;
  background-color: #393c41;
  background-clip: padding-box; /*important*/
  border-radius: 6px;
  position: relative;
  word-wrap: break-word !important;
}
:deep(.overview-map-tooltip-border-left-icon) {
  position: absolute;
  top: -2px; //-border width
  left: -2px;
  background-color: #393c41; /* 添加不透明背景 */
  width: 41px; /* 与边框宽度一致 */
  height: 41px;
  border-radius: 4px 0 0 0;
}

:deep(.overview-map-tooltip-border-right-icon) {
  position: absolute;
  top: -2px; //-border width
  right: -2px;
  background-color: #393c41; /* 添加不透明背景 */
  width: 41px; /* 与边框宽度一致 */
  height: 41px;
  border-radius: 0 4px 0 0px;
}

:deep(.overview-map-tooltip-border-bg) {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: -1;
  margin: -2px;
  border-radius: inherit; /*important*/
  background: linear-gradient(135deg, #ffffff, #79a7ff, #c3c9ff);
}

// TODO  文字边框
:deep(.overview-map-tooltip-title) {
  text-align: center;
  font-weight: 900;
  font-family: SimHei;
  font-size: 16px;
  background: linear-gradient(135deg, #fff, #c3c9ff); /* 径向渐变 */
  -webkit-background-clip: text;
  color: transparent;
  background-clip: text;
  margin-bottom: 1em;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
}

:deep(.overview-map-tooltip-text) {
  color: #fff;
}

.uptime-number {
  text-shadow: none;
  color: #fff !important;
  font-size: 2.25vw !important;
  -webkit-text-fill-color: #fff;
}

.overlap-container {
  position: relative; /* 父容器设置为相对定位 */
}

.uptime-overlap {
  text-shadow: none !important;
  background-image: none !important;
}
.uptime,
.uptime-overlap {
  position: absolute; /* 子元素设置为绝对定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  width: 100%; /* 宽度与父容器一致 */
}

.overview-time-panel,
.overview-time-container,
.time,
.uptime,
.uptime-overlap {
  /* 应用渐变背景 */
  background-image: linear-gradient(135deg, #ffffff, #79a7ff, #c3c9ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* 使文本颜色透明，以显示背景 */
  -webkit-text-fill-color: transparent;
  /* 对于某些WebKit浏览器 */
  /* 添加文本发光效果 */
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
}

.overview-map-panel {
  justify-content: center;
  align-items: center;
  height: 85%;
  display: flex;
}

.overview-map-container {
  height: 70%;
}

#map-container {
  width: 30vw;
  /* 宽度占满容器 */
  height: 50vh;
  /* 高度占满视口高度 */
}
</style>
