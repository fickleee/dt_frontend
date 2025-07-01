<template>
    <div class="station-map">
        <div class="map-title">
            <span id="title-text">地图展示</span>
            <div class="mode-switch">
                <button 
                    :class="['mode-button', { 'active': currentMode === 0 }]" 
                    @click="switchMode(0)"
                >
                    劣化
                </button>
                <button 
                    :class="['mode-button', { 'active': currentMode === 1 }]" 
                    @click="switchMode(1)"
                >
                    异常
                </button>
            </div>
        </div>
        <div ref="mapContainer" class="map-container">
        </div>
    </div>
</template>

<script setup lang="ts">
import { useStore } from 'vuex'
import mapboxgl, { GeoJSONSource, Map } from 'mapbox-gl'
import { ref, Ref, reactive, computed, watch, onMounted,inject } from 'vue'
import { Geometry } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { message } from 'ant-design-vue';
import { STATIONS_CENTER_POINTS } from '@/utils/constants'

// for: 模式切换
const currentMode = ref<0 | 1>(0); // 0 -> 劣化模式；1 -> 异常模式
const switchMode = (mode: 0 | 1) => {
    currentMode.value = mode;
};

const store = useStore()
const stationSelected = computed(() => store.state.globalVar.selectedStation);
const currentPanelJson = inject('currentPanelJson')
const currentPanelLabelJson = inject('currentPanelLabelJson')
let map: Map
const modelValue = reactive({
    lat: 27.795514303438515,
    lng: 120.004,
    bearing: 0,
    pitch: 0,
    zoom: 15,
})
const DEFAULT_MIN_ZOOM_FOR_TEXT = 15; // 设置文本显示的最低缩放级别

const mapContainer: Ref<HTMLDivElement | null> = ref(null)

const initMap = () => {
    clearMap(); // 在初始化地图之前清除现有的地图内容
    const { lng, lat, bearing, pitch, zoom } = modelValue
    mapboxgl.accessToken ='pk.eyJ1IjoiZ3VndWR1ZHUiLCJhIjoiY2xzMmw5cWMzMGN0ZTJsbjI0cWo3MWE2byJ9.IApkEpat6fEs_UL2fi-nPg'
    map = new mapboxgl.Map({
        container: mapContainer.value as HTMLElement,

        style: {
            version: 8,
            layers: [],
            sources: {},
            glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        },
        center: [lng, lat], // 设置中心为矩形中心
        bearing,
        pitch,
        zoom,
    })

    map.on('load', function () {
        addPanelData(); // 添加电站数据
        // addRectangleToMap(); // 添加矩形
    })
    map.on('move', getLocation)
    map.on('zoom', getLocation)
    map.on('rotate', getLocation)
    map.on('pitch', getLocation)
}
const clearMap = () => {
    if (map) {
        map.remove(); // 移除现有的地图实例
        map = null; // 将 map 变量置为 null
    }
    // 清除地图容器的内容
    if (mapContainer.value) {
        mapContainer.value.innerHTML = '';
    }
}
const addPanelData =  () => {
    // 如果stationSelected.value在STATIONS_CENTER_POINTS中的键中存在，则使用对应的值
    if (stationSelected.value in STATIONS_CENTER_POINTS) {
        const centerPoint = STATIONS_CENTER_POINTS[stationSelected.value as keyof typeof STATIONS_CENTER_POINTS];
        modelValue.lng = centerPoint[0];
        modelValue.lat = centerPoint[1];
    }

    if (map.getSource('panel')) {
        const panelSource = map.getSource('panel') as GeoJSONSource
        panelSource.setData(currentPanelJson.value as any)

        const panelLabelSource = map.getSource('panel-label') as GeoJSONSource
        panelLabelSource.setData(currentPanelLabelJson.value as any)
    } else {
        map.addSource('panel', {
            type: 'geojson',
            data: currentPanelJson.value as any,
        })
        map.addLayer({
            id: 'panel',
            type: 'fill',
            source: 'panel',
            paint: {
                'fill-color': currentMode.value === 0 ? ['get', 'degradation_color'] : ['get', 'anomaly_color'],
            },
        })
        map.addSource('panel-label', {
            type: 'geojson',
            data: currentPanelLabelJson.value as unknown as Geometry,
        })
        map.addLayer({
            id: 'panel-label',
            type: 'symbol',
            source: 'panel',
            layout: {
                'text-field': ['get', 'name'],
                'text-size': 12,
                'text-justify': 'center', // 文本对齐方式
                'visibility': map.getZoom() >= DEFAULT_MIN_ZOOM_FOR_TEXT ? 'visible' : 'none',
            },
            paint: {
                'text-color': currentMode.value === 0 ? ['get', 'degradation_font_color'] : ['get', 'anomaly_font_color'], // 文本颜色
            },
        })

        map.on('zoom', () => {
            const zoom = map.getZoom();
            map.setLayoutProperty('panel-label', 'visibility', zoom >= DEFAULT_MIN_ZOOM_FOR_TEXT ? 'visible' : 'none');
        });

    }

    map.on('mouseenter', 'panel', () => {
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'panel', () => {
        map.getCanvas().style.cursor = ''
    })
}
const getLocation = () => {
    return {
        ...map.getCenter(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        zoom: map.getZoom(),
    }
}
watch(modelValue, (nextValue) => {
    const curr = getLocation()
    if (curr.lng != nextValue.lng || curr.lat != nextValue.lat)
        map.setCenter({ lng: nextValue.lng, lat: nextValue.lat })
    if (curr.pitch != nextValue.pitch) map.setPitch(nextValue.pitch)
    if (curr.bearing != nextValue.bearing) map.setBearing(nextValue.bearing)
    if (curr.zoom != nextValue.zoom) map.setZoom(nextValue.zoom)
})

watch([currentPanelJson, currentPanelLabelJson],  () => {
    initMap();
},{deep: true});
watch(currentMode, () => {
    const hide = message.loading('切换地图中', 0);
    setTimeout(hide, 2500);
    initMap();
});
onMounted(() => {
    initMap();
})
</script>

<style scoped>
.map-title {
    height: 40px;
    width: 100%;
    display: flex;
    align-items: center;
}

    #title-text {
        font-size: 16px;
        font-weight: 700;
        line-height: 20.7px;
        text-align: left;
        color: rgba(255, 255, 255, 0.85);
        margin-left: 20px;
    }

    .mode-switch {
        display: flex;
        margin-left: auto;
        margin-right: 20px;
        border-radius: 10px;
        overflow: hidden;
        background-color: #e0e0e0;
    }

        .mode-button {
            flex: 1;
            padding: 5px 16px;
            border: none;
            background-color: transparent;
            color: #666;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        .mode-button.active {
            background-color: #007bff;
            color: white;
        }

        .mode-button:not(.active):hover {
            background-color: #d0d0d0;
        }

.map-container {
    width: 100%;
    height: calc(100% - 40px);
    box-sizing: border-box;
    padding: 10px;
    background-color: #393C41;
}
</style>
