<template>
    <div class="station-statistics">
        <div class="degradation-statistics">
            <span class="ss-title">低效劣化统计</span>
            <div ref="degradationRefOverview" class="donut-chart"></div>
        </div>
        <div class="diagnosis-statistics">
            <span class="ss-title">根因诊断统计</span>
            <div ref="anomalyRefOverview" class="donut-chart"></div>
        </div>
        <div class="ai-management">
            <span class="ss-title">发电量统计</span>
            <div class="card-box">
                <div>
                    <span class="text-value">{{ power.cumulativePower }}</span>
                    <span class="text-description">累积发电</span>
                </div>
                <div>
                    <span class="text-value">{{ power.monthlyPower }}</span>
                    <span class="text-description">当月发电</span>
                </div>
                <div>
                    <span class="text-value">{{ power.dailyPower }}</span>
                    <span class="text-description">当日发电</span>
                </div>
            </div>
        </div>
        <div class="loss-predict">
            <span class="ss-title">损失预测</span>
            <div class="card-box">
                <div>
                    <div>
                        <span class="text-value">{{ loss.cumulativeLoss }}</span>
                        <!-- <span class="text-unit"> 万千瓦时</span> -->
                    </div>
                    <span class="text-note">累积损失</span>
                </div>
                <div>
                    <div>
                        <span class="text-value">{{ loss.dailyLoss }}</span>
                        <!-- <span class="text-unit"> 万千瓦时</span> -->
                    </div>
                    <span class="text-note">预估损失</span>
                </div>
                <div>
                    <div>
                        <span class="text-value">{{ loss.futureWeekLoss }}</span>
                        <!-- <span class="text-unit"> 万千瓦时</span> -->
                    </div>
                    <span class="text-note">未来一周损失</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted,computed, watch } from 'vue';
import * as echarts from 'echarts';
import { reqOverviewStationInfo } from '@/api/overview/overview';
import { useStore } from 'vuex'

const store = useStore()
const stationSelected = computed(() => store.state.globalVar.selectedStation);
const dateSelected = computed(() => store.state.globalVar.selectedDate);

const degradationData = ref([]);
const anomalyData = ref([]);

const degradationOption = ref({});
const degradationRefOverview = ref(null);
const anomalyOption = ref({});
const anomalyRefOverview = ref(null);
const power=ref({
    cumulativePower: 0,
    monthlyPower: 0,
    dailyPower: 0
})
const loss=ref({
    cumulativeLoss: 0,
    dailyLoss: 0,
    futureWeekLoss: 0
})

const degradationSummary = (data) => {
    if (!data || data.length === 0) {
        return 0;
    }
    let lowValue=0;
    let total = 0;
    for (let i = 0; i < data.length; i++) {
        if (data[i].name === '低效组串数量') {
            lowValue = data[i].value;
        }
        total += data[i].value;
    }
    if (total === 0) {
        return 0;
    }
    return (lowValue/total*100).toFixed(2);
}

const drawDegradationDonutChart = () => {
    const plotDom = echarts.init(degradationRefOverview.value, 'dt', { renderer: 'svg' });
    const data = degradationData.value;

    degradationOption.value = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            orient: 'vertical',
            left: '15px',
            top: '20%',
            textStyle: {
                color: '#FFFFFF'
            }
        },
        series: [
            {
                type: 'pie',
                radius: ['55%', '85%'],
                data: data,
                label: {
                    show: false, // 隐藏外部标签
                },
                center: ['60%', '50%']
            },
            {
                type: 'pie',
                radius: ['0%', '1%'], // 设置为一个非常小的值
                label: {
                    position: 'center', // 将标签放置在中心
                    formatter: `低效占比\n${degradationSummary(data)}%`, // 保留两位小数
                    color: '#FFFFFF', // 白色文字以提高对比度
                    fontSize: 16, // 增加字体大小
                    fontWeight: 'bold', // 字体加粗
                    lineHeight: 20, // 设置行高以确保文本居中
                },
                data: [{ value: data[0].value }], // 使用动态数据
                center: ['60%', '50%']
            }
        ]
    };
    plotDom.setOption(degradationOption.value);
    window.addEventListener('resize', function () {
        plotDom.resize();
    });
}

const anomalySummary = (data) => {
    if (!data || data.length === 0) {
        return 0;
    }
    let total = 0;
    for (let i = 0; i < data.length; i++) {
        total += data[i].value;
    }
    return total;
}

const drawAnomalyDonutChart = () => {
    const plotDom = echarts.init(anomalyRefOverview.value, 'dt', { renderer: 'svg' });
    const data = anomalyData.value;

    anomalyOption.value = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            orient: 'vertical',
            left: '15px',
            top: '20%',
            textStyle: {
                color: '#FFFFFF'
            }
        },
        series: [
            {
                type: 'pie',
                radius: ['55%', '85%'],
                data: data,
                label: {
                    show: false, // 隐藏外部标签
                },
                center: ['60%', '50%']
            },
            {
                type: 'pie',
                radius: ['0%', '1%'], // 设置为一个非常小的值
                label: {
                    position: 'center', // 将标签放置在中心
                    formatter: `总异常数\n${anomalySummary(data)}`, // 保留两位小数
                    color: '#FFFFFF', // 白色文字以提高对比度
                    fontSize: 16, // 增加字体大小
                    fontWeight: 'bold', // 字体加粗
                    lineHeight: 20, // 设置行高以确保文本居中
                },
                data: [{ value: anomalySummary(data) }], // 使用动态数据
                center: ['60%', '50%']
            }
        ]
    };
    plotDom.setOption(anomalyOption.value);
    window.addEventListener('resize', function () {
        plotDom.resize();
    });
}

const getStationInfo = async () => {
    const {degradationInfo, anomalyInfo, powerInfo, lossInfo} = await reqOverviewStationInfo(stationSelected.value,dateSelected.value);
    degradationData.value = degradationInfo;
    anomalyData.value = anomalyInfo;
    power.value = powerInfo;
    loss.value = lossInfo;
}

onMounted(() => {
    getStationInfo();
});

watch([stationSelected, dateSelected],  () => {
    getStationInfo(); 
});

watch(degradationData,() => {
    drawDegradationDonutChart();
},{deep:true})
watch(anomalyData,() => {
    drawAnomalyDonutChart();
},{deep:true})

</script>


<style scoped lang="scss">
.station-statistics {
    display: flex;
    flex-direction: column;
}

.degradation-statistics, 
.diagnosis-statistics, 
.loss-predict, 
.ai-management {
    width: 100%;
    background-color: #393C41;
    border-radius: 10px;
    margin-bottom: 15px; // 添加底部间隔
}

.degradation-statistics:last-child, 
.diagnosis-statistics:last-child, 
.loss-predict:last-child, 
.ai-management:last-child {
    margin-bottom: 0; // 移除最后一个子元素的底部间隔
}

.degradation-statistics, 
.diagnosis-statistics {
    height: 30%;
    display: flex;
    flex-direction: column;
}

.loss-predict, 
.ai-management {
    height: 20%;
    display: flex;
    flex-direction: column;
}

// 移除伪元素
.station-statistics::before,
.station-statistics::after,
.station-statistics > * + * {
    // 移除这些伪元素
}

.ss-title{
    color: #CECED9;
    font-weight: bold;
    text-align: left;
    font-size: clamp(5px, 1vw, 30px);
    margin-left: 20px;
    margin-top: 15px;
}
.donut-chart{
    flex-grow: 1;
}
.card-box {
    flex-grow: 1;
    display: flex;
    gap: 15px; // 设置子元素间隔
    height: 100%; // 确保高度继承
    padding: 10px 15px;
}
.card-box > div {
    flex: 1; /* 等分剩余空间 */
    min-width: 0; /* 防止内容溢出 */
    background: #484D50; /* 测试用背景色 */
    border-radius: 8px; /* 可选圆角 */
    height: 100%; /* 继承父容器高度 */
    display: flex; /* 使子元素可以使用 flexbox 布局 */
    flex-direction: column; /* 垂直排列子元素 */
    align-items: center; /* 水平居中文本 */
    justify-content: center; /* 垂直居中文本 */
    text-align: center; /* 确保多行文本水平居中 */
}
.text-value{
    background: linear-gradient(60deg, #FFFFFF 0%, #79A7FF 44%, #C3C9FF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bolder;
    font-size: clamp(5px, 3vw, 30px);
}
.text-unit{
    background: linear-gradient(60deg, #FFFFFF 0%, #79A7FF 44%, #C3C9FF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bolder;
    font-size: clamp(5px, 0.7vw, 30px);
}
.text-note{
    // background: #CECEF7;
    // -webkit-background-clip: text;
    // -webkit-text-fill-color: transparent;
    font-weight: bolder;
    font-size: clamp(5px, 0.7vw, 30px);
    color: #ceced9;
}
.text-description{
    font-weight: bolder;
    font-size: clamp(5px, 0.7vw, 30px);
    color: #ceced9;
}
</style>