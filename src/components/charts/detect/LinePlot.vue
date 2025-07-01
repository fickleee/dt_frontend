<template>
    <div ref="lineChart" class="linechart-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import * as d3 from 'd3';
import { getTimeScale, getYScale } from './scale';

const props = defineProps({
    lineStyle: {
        type: Number,
    }
});
const store = useStore();
const lineChart = ref(null);
// const selectedStringCurrent = computed(() => store.getters['degradationOverview/getSelectedStringCurrent']);
const selectedStringCurrent = computed(() => store.getters['degradationOverview/getInverterStringCurrentData']);
const selectedDate = computed(() => store.getters['globalVar/getSelectedDate']);
const selectedStation = computed(() => store.getters['globalVar/getSelectedStation']);
const selectedString = computed(() => store.getters['degradationOverview/getSelectedPV'])
const margin = { top: 20, right: 50, bottom: 30, left: 70 };
const svgWidth = ref(0);
const svgHeight = ref(0);
// const chartWidth = computed(() => svgWidth.value - margin.left - margin.right);
// const chartHeight = computed(() => svgHeight.value - margin.top - margin.bottom);
const dataArray = computed(() => {
    if (!Array.isArray(selectedStringCurrent.value) || selectedStringCurrent.value.length === 0) return [];
    // 新的getter已经返回了正确格式的数据，不需要额外的解码处理
    return selectedStringCurrent.value;
});

const chartData = computed(() => {
    if (!Array.isArray(dataArray.value) || dataArray.value.length === 0) return [];

    const valueKeys = Object.keys(dataArray.value[0]).filter(key => key.includes("输入电流"));
    return dataArray.value.map(d => {
        const time = d["时间"];
        const values = {};
        valueKeys.forEach((key, index) => {
            const newKey = `value${index + 1}`;
            values[newKey] = d[key];
        });

        return { time, ...values };
    });
});
const drawChart = () => {
    if (chartData.value.length === 0) return;
    getChartSize();
    const chartWidth = svgWidth.value - margin.left - margin.right;
    const chartHeight = svgHeight.value - margin.top - margin.bottom;

    const xScale = getTimeScale(
        d3.min(chartData.value, d => new Date(d.time)),
        d3.max(chartData.value, d => new Date(d.time)),
        0,
        chartWidth
    );

    const yScale = getYScale(
        0,
        d3.max(chartData.value, d =>
            d3.max(
                Object.keys(d)
                    .filter(key => key.startsWith('value'))
                    .map(key => +d[key] || 0)
            )
        ),
        chartHeight,
        0
    );

    // 定义原始比例尺，用于在缩放时重新计算
    const initialXScale = xScale.copy();
    const initialYScale = yScale.copy(); // 纵轴不缩放，但保留原始比例尺以供线条绘制使用

    // 定义缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.5, 20]) // 设置最小和最大缩放比例
        .extent([[0, 0], [chartWidth, chartHeight]]) // 设置缩放区域
        .translateExtent([[0, 0], [chartWidth, chartHeight]]) // 设置平移范围
        .on('zoom', zoomed); // 绑定缩放事件处理函数

    // 检查是否已存在 SVG
    let svg = d3.select(lineChart.value).select('svg');
    let g;

    if (svg.empty()) {
        svg = d3.select(lineChart.value)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .call(zoom);

        g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // 定义裁剪路径
        g.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', chartWidth)
            .attr('height', chartHeight);

        // 将 zoom 行为应用到 g 元素上
        g.call(zoom);

        // 创建线条元素
        Object.keys(chartData.value[0])
            .filter(key => key.startsWith('value'))
            .forEach((key) => {
                const line = d3.line()
                    .x(d => xScale(new Date(d.time)))
                    .y(d => yScale(d[key]));

                g.append('path') // 在 g 元素下创建 path
                    .data([chartData.value]) // 绑定数据
                    .attr('class', `line-${key}`)
                    .attr('d', line)
                    .attr('fill', 'none')
                    .attr('stroke', '#81ABFC')
                    .attr('stroke-width', key === `value${props.lineStyle}` ? 1.5 : 0.8)
                    .attr('stroke-opacity', key === `value${props.lineStyle}` ? 1 : 0.5)
                    .attr('stroke-dasharray', key === `value${props.lineStyle}` ? 'none' : '3 2')
                    .attr('clip-path', 'url(#clip)'); // 应用裁剪路径
            });

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale)
                .ticks(d3.timeDay.every(1)) // 初始刻度为天
                .tickFormat(d3.timeFormat('%Y-%m-%d')))
            .selectAll('text')
            .style('fill', '#fff')
            .attr('dx', '10px')
            .attr('dy', '10px');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale).ticks(5))
            .selectAll('text')
            .style('fill', '#fff');

        g.append('text')
            .attr('class', 'y-label')
            .attr('x', -margin.left)
            .attr('y', -30)
            .attr('fill', '#fff')
            .style('text-anchor', 'start')
            .text('I/A')
            .attr('transform', 'rotate(-90)');

    } else {
        svg.call(zoom);
        g = svg.select('g');

        // 更新裁剪路径的尺寸，以防图表大小变化
        g.select('#clip rect')
            .attr('width', chartWidth)
            .attr('height', chartHeight);

        // 重新将 zoom 行为应用到 g 元素上（如果 SVG 已经存在）
        // g.call(zoom);

        // 更新线条
        Object.keys(chartData.value[0])
            .filter(key => key.startsWith('value'))
            .forEach((key) => {
                // 重新定义线条生成器
                const line = d3.line()
                    .x(d => xScale(new Date(d.time)))
                    .y(d => yScale(d[key]));

                g.select(`.line-${key}`) // 选择现有的 path 元素
                    .data([chartData.value]) // 绑定数据
                    .transition()
                    .duration(300)
                    .attr('d', line)
                    .attr('stroke-width', key === `value${props.lineStyle}` ? 1.5 : 0.8)
                    .attr('stroke-opacity', key === `value${props.lineStyle}` ? 1 : 0.5)
                    .attr('stroke-dasharray', key === `value${props.lineStyle}` ? 'none' : '3 2');
            });

        g.select('.x-axis')
            .transition()
            .duration(300)
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale)
                .ticks(d3.timeDay.every(1)) // 初始刻度为天
                .tickFormat(d3.timeFormat('%Y-%m-%d')));

        g.select('.y-axis')
            .transition()
            .duration(300)
            .call(d3.axisLeft(yScale).ticks(5));
    }

    // 缩放事件处理函数
    function zoomed(event) {
        const transform = event.transform;

        // 1. 只对 X 轴进行缩放，Y 轴保持不变
        const newXScale = transform.rescaleX(initialXScale);
        const newYScale = initialYScale; // Y 轴不缩放

        // 2. 根据缩放级别动态调整 X 轴的刻度格式
        let tickInterval = d3.timeDay.every(1); // 默认按天显示
        let tickFormat = d3.timeFormat('%Y-%m-%d');

        if (transform.k > 13) { // 放大到很大程度，显示1小时
            tickInterval = d3.timeHour.every(1); // 每1小时一个刻度
            tickFormat = d3.timeFormat('%Y-%m-%d %H:%M');
        } else if (transform.k > 7) { // 放大到较大程度，显示3小时
            tickInterval = d3.timeHour.every(3); // 每3小时一个刻度
            tickFormat = d3.timeFormat('%Y-%m-%d %H:%M');
        } else if (transform.k > 3) { // 放大到一定程度，显示6小时
            tickInterval = d3.timeHour.every(6); // 每6小时一个刻度
            tickFormat = d3.timeFormat('%Y-%m-%d %H:%M');
        } else if (transform.k > 2) { // 放大到中等程度，显示天和小时
            tickInterval = d3.timeDay.every(1); // 每天一个刻度
            tickFormat = d3.timeFormat('%Y-%m-%d %H:%M');
        } else { // 默认或缩小，显示天
            tickInterval = d3.timeDay.every(1);
            tickFormat = d3.timeFormat('%Y-%m-%d');
        }

        // 更新轴
        g.select('.x-axis')
            .call(d3.axisBottom(newXScale)
                .ticks(tickInterval)
                .tickFormat(tickFormat));

        g.select('.y-axis')
            .call(d3.axisLeft(newYScale).ticks(5)); // Y 轴使用原始比例尺更新

        // 更新线条
        Object.keys(chartData.value[0])
            .filter(key => key.startsWith('value'))
            .forEach((key) => {
                const line = d3.line()
                    .x(d => newXScale(new Date(d.time))) // 使用新的 X 比例尺
                    .y(d => newYScale(d[key])); // 使用原始 Y 比例尺

                g.select(`.line-${key}`)
                    .attr('d', line);
            });
    }
};


const getChartSize = () => {
    const container = lineChart.value;
    if (container) {
        svgWidth.value = container.clientWidth;
        svgHeight.value = container.clientHeight;
    }
};

watch(
    [() => props.lineStyle, () => selectedStringCurrent.value ],
    () => {
        if (chartData.value && chartData.value.length > 0) {
            drawChart();
        }
    },
    { immediate: true }
);
watch(
    [() => selectedDate.value, () => selectedString.value, () =>selectedStation.value],
    () => {
        // 清空图表内容
        // console.log('selectedDate.value', selectedDate.value);
        d3.select(lineChart.value).selectAll('*').remove();
    },
    { immediate: true }
);

onMounted(() => {
    getChartSize();
    window.addEventListener('resize', drawChart);
    if (chartData.value && chartData.value.length > 0) {
        drawChart();
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', drawChart);
});
</script>

<style scoped>
.linechart-container {
    width: 100%;
    height: 80%;
}
</style>