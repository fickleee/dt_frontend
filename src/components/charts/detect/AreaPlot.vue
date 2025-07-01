<template>
    <div ref="areaChart" class="areachart-container"></div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import * as d3 from 'd3';
import { getTimeScale, getYScale } from './scale';

const store = useStore();
const areaChart = ref(null);
const irradianceData = computed(() => store.getters['degradationOverview/getIrradianceData']);
const selectStringCurrent = computed(() => store.getters['degradationOverview/getSelectedStringCurrent']);
const selectPV = computed(() => store.getters['degradationOverview/getSelectedPV']);
const margin = { top: 60, right: 60, bottom: 40, left: 60 };
const svgWidth = ref(0);
const svgHeight = ref(0);

const chartData = computed(() => {
    if (selectStringCurrent.value === null) return [];
    const match = selectPV.value.match(/PV(\d+)/);
    const pvNumber = match ? Number(match[1]) : null;
    if (!pvNumber) return [];

    return selectStringCurrent.value.map((currentItem, index) => {
        const time = new Date(currentItem.时间);
        const irradianceItem = irradianceData.value.data[index];
        if (!irradianceItem || new Date(irradianceItem.Time).getTime() !== time.getTime()) {
            return null;
        }
        const irradiance = parseFloat(irradianceItem.rad) || 0;
        const current = parseFloat(currentItem[`PV${pvNumber}输入电流`]) || 0;
        const value = irradiance === 0 ? 0 : current / irradiance;
        return { date: time, value };
    }).filter(item => item !== null);
});

const drawChart = () => {
    if (!chartData.value || chartData.value.length === 0) return;
    getChartSize();

    const chartWidth = svgWidth.value - margin.left - margin.right;
    const chartHeight = svgHeight.value - margin.top - margin.bottom;

    const xScale = getTimeScale(
        d3.min(chartData.value, d => d.date),
        d3.max(chartData.value, d => d.date),
        margin.left,
        chartWidth + margin.left
    );

    const yScale = getYScale(
        0,
        d3.max(chartData.value, d => d.value),
        chartHeight,
        margin.top
    );
    let svg = d3.select(areaChart.value).select('svg');
    let g;
    const area = d3.area()
        .x(d => xScale(d.date))
        .y0(chartHeight)
        .y1(d => yScale(d.value))
        .curve(d3.curveCatmullRom);

    if (svg.empty()) {
        svg = d3.select(areaChart.value)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%');
        g = svg.append('g');
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'gradient')
            .attr('x1', '0')
            .attr('y1', '0')
            .attr('x2', '0')
            .attr('y2', '1');

        gradient.append('stop')
            .attr('offset', '60%')
            .attr('stop-color', '#81ABFC');
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#393C41');

        g.append('path')
            .attr('fill', 'url(#gradient)')
            .attr('d', area(chartData.value));

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(d3.timeFormat('%Y-%m-%d')))
            .selectAll('text')
            .attr('dx', '5px')
            .attr('dy', '10px');

        g.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale)
                .ticks(5)
                .tickPadding(30))
            .selectAll('text')
            .attr('dx', '20px');
    } else {
        g = svg.select('g');
    }
    g.select('path')
        .transition()
        .duration(300)
        .attr('d', area(chartData.value));
    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d3.timeFormat('%Y-%m-%d'));

    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickPadding(30);
    g.select('.x-axis')
        .transition()
        .duration(300)
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('dx', '5px')
        .attr('dy', '10px');

    g.select('.y-axis')
        .transition()
        .duration(300)
        .attr('transform', `translate(${margin.left},0)`)
        .call(yAxis)
        .selectAll('text')
        .attr('dx', '20px');
};

const getChartSize = () => {
    const container = areaChart.value;
    if (container) {
        svgWidth.value = container.clientWidth;
        svgHeight.value = container.clientHeight;
    }
};

onMounted(() => {
    getChartSize();
    window.addEventListener('resize', drawChart);
    if (chartData.value.length > 0) {
        drawChart();
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', drawChart);
});

watch(chartData, (newValue) => {
    if (newValue.length > 0) {
        drawChart();
    }
});
</script>

<style scoped>
.areachart-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

path {
    stroke: none;
}
</style>