<template>
  <div ref="scatterChart" class="scatterchart-container"></div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import * as d3 from 'd3';
import { useStore } from 'vuex';
import { getXScale, getYScale } from './scale';

const store = useStore();
const scatterChart = ref(null);
const margin = { top: 80, right: 80, bottom: 80, left: 80 };
const svgWidth = ref(0);
const svgHeight = ref(0);

const deviceId = computed(() => store.getters['degradationOverview/getSelectedString']);
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const chartData = computed(() => {
  const pid = deviceId.value;
  const scatterData = props.data[pid];
  if (!scatterData) return [];
  
  const { x, y } = scatterData;
  return x.map((value, index) => ({
    x: value,
    y: y[index],
  }));
});

const drawChart = () => {
  if (!chartData.value || chartData.value.length === 0) return;
  getChartSize();

  const chartWidth = svgWidth.value - margin.left - margin.right;
  const chartHeight = svgHeight.value - margin.bottom - margin.top;

  const xScale = getXScale(
    d3.min(chartData.value, d => d.x),
    d3.max(chartData.value, d => d.x),
    0,
    chartWidth
  );

  const yScale = getYScale(
    d3.min(chartData.value, d => d.y),
    d3.max(chartData.value, d => d.y),
    chartHeight,
    0
  );

  let svg = d3.select(scatterChart.value).select('svg');
  if (svg.empty()) {
    svg = d3.select(scatterChart.value)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.selectAll('circle')
      .data(chartData.value)
      .enter()
      .append('circle')
      .attr('fill', '#FFE5B4')
      .attr('stroke', '#FFE5B4')
      .attr('stroke-width', 12)
      .attr('stroke-opacity', 0.3)
      .attr('r', 8);
  }

  svg.selectAll('circle')
    .data(chartData.value)
    .transition()
    .duration(300)  
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y));
};

const getChartSize = () => {
  const container = scatterChart.value;
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
.scatterchart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>