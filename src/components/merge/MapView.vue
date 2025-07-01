<template>
    <div class="map-view">
        <p>地图展示</p>
        <div ref="mapContainer" class="map-container">
        </div>
    </div>
</template>

<script setup lang="ts">
import mapboxgl, { GeoJSONSource, Map } from 'mapbox-gl'
import { ref, Ref, reactive, watch, onMounted } from 'vue'
import { Geometry } from 'geojson'
import { reqMergeGeo } from '@/api'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useStore } from 'vuex'
import { message } from 'ant-design-vue';

const myStore = useStore()

const station = ref('')

let map: Map
let panelJson: any
let panelLabelJson: any
const modelValue = reactive({
    lat: 27.795514303438515,
    lng: 120.004,
    bearing: 0,
    pitch: 0,
    zoom: 19,
})

const mapContainer: Ref<HTMLDivElement | null> = ref(null)

const initMap = () => {
    const hide = message.loading('Loading map...', 0);
    setTimeout(hide, 2500);
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
        addPanelData();
        // addRectangleToMap(); // 添加矩形
    })
    map.on('move', getLocation)
    map.on('zoom', getLocation)
    map.on('rotate', getLocation)
    map.on('pitch', getLocation)
}

const addPanelData = async () => {
    // get file data
    const { panelJson, panelLabelJson } = await reqMergeGeo(station.value);

    modelValue.lng = panelLabelJson.features[0].geometry.coordinates[0]
    modelValue.lat = panelLabelJson.features[0].geometry.coordinates[1]

    if (map.getSource('panel')) {
        const panelSource = map.getSource('panel') as GeoJSONSource
        panelSource.setData(panelJson as any)

        const panelLabelSource = map.getSource('panel-label') as GeoJSONSource
        panelLabelSource.setData(panelLabelJson as any)
    } else {
        map.addSource('panel', {
            type: 'geojson',
            data: panelJson as any,
        })
        map.addLayer({
            id: 'panel',
            type: 'fill',
            source: 'panel',
            paint: {
                'fill-color': '#aaa',
            },
        })

        map.addSource('panel-label', {
            type: 'geojson',
            data: panelLabelJson as unknown as Geometry,
        })

        map.addLayer({
            id: 'panel-label',
            type: 'symbol',
            source: 'panel-label',
            layout: {
                'text-field': ['get', 'name'],
                'text-size': 12,
                'text-justify': 'center', // 文本对齐方式
            },
            paint: {
                'text-color': '#000', // 文本颜色
            },
        })
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

const getRectangleCoordinates = (center) => {
    const offsetX = 0.0001;
    const offsetY = 0.00005;

    // 将 lng 和 lat 转换为数字
    const lng = Number(center.x);
    const lat = Number(center.y);

    return [
        [
            [lng - offsetX, lat + offsetY], // 左上角
            [lng + offsetX, lat + offsetY], // 右上角
            [lng + offsetX, lat - offsetY], // 右下角
            [lng - offsetX, lat - offsetY], // 左下角
            [lng - offsetX, lat + offsetY]  // 闭合矩形
        ]
    ];
}

watch(modelValue, (nextValue) => {
    const curr = getLocation()
    if (curr.lng != nextValue.lng || curr.lat != nextValue.lat)
        map.setCenter({ lng: nextValue.lng, lat: nextValue.lat })
    if (curr.pitch != nextValue.pitch) map.setPitch(nextValue.pitch)
    if (curr.bearing != nextValue.bearing) map.setBearing(nextValue.bearing)
    if (curr.zoom != nextValue.zoom) map.setZoom(nextValue.zoom)
})

// 监视 主页面匹配数据加载的变化
watch(() => myStore.state.mergeDisplay.matchJSONData, () => {
    station.value = myStore.state.mergeDisplay.areaName;
    initMap()
},);

// 监视 主页面匹配数据加载的变化
watch(() => myStore.state.mergeDisplay.matchSelectedConnection, (newValue) => {
    if (Object.keys(newValue).length > 0) {
        addPanelData()

        const center = newValue.X_reality;

        if (center !== undefined) {
            // 清除上次的图层和源
            if (map.getLayer('rectangle-layer-stroke')) {
                map.removeLayer('rectangle-layer-stroke');  // 移除图层
            }
            if (map.getSource('rectangle')) {
                map.removeSource('rectangle');  // 移除源
            }

            const rectangleCoordinates = getRectangleCoordinates(center);

            const rectangleGeoJSON = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: rectangleCoordinates,
                        },
                        properties: {}
                    }
                ]
            };

            // 添加新的源
            map.addSource('rectangle', {
                type: 'geojson',
                data: rectangleGeoJSON,
            });

            // 添加新的矩形边界轮廓图层
            map.addLayer({
                id: 'rectangle-layer-stroke',
                type: 'line',
                source: 'rectangle',
                layout: {},
                paint: {
                    'line-color': '#FF0000', // 边界颜色
                    'line-width': 10, // 边界宽度
                },
            });

            // 设置地图中心
            map.setCenter([Number(center.x), Number(center.y)]);
        }
    }
});


</script>

<style scoped>
.map-view {
    width: 100%;
    height: 50vh;
    background-color: #141414;
    /* 淡色背景 */
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    /* 稍微的阴影效果 */
}

.map-container {
    width: 95%;
    height: 80%;
    border: 1px solid #D1D5DB;
    /* 浅灰色边框 */
    margin-left: 2%;
    background-color: #efefef;
    /* 浅灰色背景，以区别于整体背景 */
}
</style>
