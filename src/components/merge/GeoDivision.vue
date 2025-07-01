<template>
  <div class="container">
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup>
import mapboxgl, { GeoJSONSource, Map } from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { Geometry } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { requestGeoData } from '@/api/merge/create';

const props = defineProps({
  stationName: String
});

const emit = defineEmits(['update-geo-plots']);

const computedStationName = computed(() => {
  return props.stationName;
});

let map;
let draw;
const modelValue = reactive({
    lat: 27.795514303438515,
    lng: 120.004,
    bearing: 0,
    pitch: 0,
    zoom: 19,
})

const polygons = ref([]); // 将 polygons 声明为反应式数据

const mapContainer = ref(null)

const initMap = () => {
    const { lng, lat, bearing, pitch, zoom } = modelValue
    mapboxgl.accessToken =' '
    map = new mapboxgl.Map({
        container: mapContainer.value,

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
    });
    
    // 初始化Mapbox Draw
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true,
        }
    });
    map.addControl(draw);

    map.on('load', function () {
        addPanelData();
    })
    map.on('move', getLocation)
    map.on('zoom', getLocation)
    map.on('rotate', getLocation)
    map.on('pitch', getLocation)
    // 监听绘制完成事件
    map.on('draw.create', updateSelectedFeatures);
    map.on('draw.update', updateSelectedFeatures);
    map.on('draw.delete', clearSelectedFeatures);
}

const addPanelData = async () => {
    // get file data
    const responseData = await requestGeoData(props.stationName);
    const panelJson = responseData.panel_geo;
    const panelLabelJson = responseData.panel_geo_label;
    
    modelValue.lng = panelLabelJson.features[0].geometry.coordinates[0]
    modelValue.lat = panelLabelJson.features[0].geometry.coordinates[1]

    if (map.getSource('panel')) {
        const panelSource = map.getSource('panel')
        panelSource.setData(panelJson)

        const panelLabelSource = map.getSource('panel-label')
        panelLabelSource.setData(panelLabelJson)
    } else {
        map.addSource('panel', {
            type: 'geojson',
            data: panelJson,
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
            data: panelLabelJson,
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

const updateSelectedFeatures = () => {
    const data = draw.getAll();
    let selectedPolygon = data.features[0];
    if (data.features.length > 0)
        selectedPolygon = data.features[data.features.length-1];
    
    // 设定一个延时，保证用户体验
    setTimeout(() => {
        const polygonName = prompt("请输入多边形名称：");
        if (polygonName) {
            polygons.value.push({ name: polygonName, points: selectedPolygon.geometry.coordinates });
        }
    }, 300); // 300ms延迟
};

const clearSelectedFeatures = () => {
    polygons.value = [] // 清空 polygons 数组
    draw.deleteAll(); // 清除绘制
};

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

watch(polygons, (newPolygons) => {
    emit('update-geo-plots', newPolygons);
}, { deep: true })

onMounted(() => {
    initMap();
})

</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  background-color: #484A50;
  border-radius: 15px;
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 15px;
}

</style>