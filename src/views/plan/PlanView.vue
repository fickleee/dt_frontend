<template>
    <div class="selector-container">
        <Select class="selector-center" placeholder="请选择运维中心" :value="centerSelected" :options="centerOptions" @change="onCenterChange"></Select>
        <Select class="selector-station" placeholder="请选择电站" ref="select" :value="stationSelected"
            :options="filteredStationOptions" @change="onStationChange"></Select>
        <DatePicker class="selector-time" :value="dateSelected" @change="onDateChange" />
        <a-button :loading="loading_maintain" @click="exportMaintain" class="button-loading" type="dashed" style="margin-right: 10px;">运维报告</a-button>
        <a-button :loading="loading_runtime" @click="exportRuntime" class="button-loading" type="dashed">运行报告</a-button>
    </div>
    <div class="plan-overview">
        <div class="plan-overview-container">
            <div :class="selectedPlan === 'maintain' ? 'plan-overview-panel-selected' : 'plan-overview-panel'"
                id="plan-overview-maintain" @click.stop="selectPlan('maintain')">
                <div id="plan-maintain-title" class="plan-panel-title">
                    <div class="plan-panel-container">
                        <p>运维</p>
                        <p>层面</p>
                    </div>
                </div>
                <div class="plan-panel-detail">
                    <div class="plan-panel-detail-container">
                        <p>检出逆变器 {{ getInverterAlarmCount() }}</p>
                        <p>检出组串 {{ getStringAlarmCount() }}</p>
                    </div>
                </div>
                <div class="plan-panel-plot" v-if="hasInverterAlarm() || hasStringAlarm()">
                    <div v-if="hasInverterAlarm()" id="plan-maintain-inverter-plot" ref="planMaintainInverterPlot" style="width: 50%; height: 100%;"></div>
                    <div v-if="hasStringAlarm()" id="plan-maintain-string-plot" ref="planMaintainStringPlot" style="width: 50%; height: 100%;"></div>
                </div>
            </div>
        </div>
        <div class="plan-overview-container">
            <div :class="selectedPlan === 'runtime' ? 'plan-overview-panel-selected' : 'plan-overview-panel'"
                id="plan-overview-runtime" @click.stop="selectPlan('runtime')">
                <div id="plan-runtime-title" class="plan-panel-title">
                    <div class="plan-panel-container">
                        <p>运行</p>
                        <p>层面</p>
                    </div>
                </div>
                <div class="plan-panel-detail">
                    <div class="plan-panel-detail-container">
                        <p>故障组串 {{ getStringAlarmTotal() }}</p>
                        <p>场站数 {{ getUniqueStationsCount() }}</p>
                    </div>
                </div>
                <div class="plan-panel-plot">
                    <div id="plan-runtime-plot" ref="planRuntimePlot" style="width: 100%; height: 100%;">

                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="plan-detail">
        <div class="plan-detail-container">
            <div class="table-content" ref="tableContentRef">
                <Table class="plan-detail-table" :columns="selectedPlan === 'maintain' ? maintainColumns : runtimeColumns"
                    :dataSource="currentPageData"
                    :rowKey="record => selectedPlan === 'maintain' ? `maintain-${record.deviceCode}-${record.order}` : `runtime-${record.deviceCode}-${record.order}`"
                    :scroll="{ x: '100%', y: tableBodyHeight }"
                    :pagination="false"
                    :loading="tableLoading"
                    :sticky="{ offsetHeader: 0 }"
                    @change="handleTableChange"></Table>
            </div>
            <div class="pagination-wrapper">
                <div class="pagination-total">
                    共 {{ filteredAndSortedData.length }} 条数据
                </div>
                <Pagination
                    :pageSize="pageSize"
                    :current="currentPage"
                    :total="filteredAndSortedData.length"
                    showSizeChanger
                    :pageSizeOptions="['10', '20', '50', '100']"
                    size="small"
                    @change="pageChange"
                    @showSizeChange="pageSizeChange" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { DatePicker, Select, Table, Pagination } from 'ant-design-vue';
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { STATIONS } from '@/utils/constants';
import { useStore } from 'vuex';
import { checkJsonFileState } from '@/utils/func';
import { message } from 'ant-design-vue';
import { getPlanData, exportMaintainPlan, exportRuntimePlan } from '@/api/plan';

const { state, commit } = useStore();

const tableContentRef = ref(null);
const tableBodyHeight = ref(0);

const calculateTableHeight = () => {
    if (tableContentRef.value) {
        const tableHeader = tableContentRef.value.querySelector('.ant-table-header');
        const headerHeight = tableHeader ? tableHeader.offsetHeight : 55; // 55是表头高度的备用值
        const containerHeight = tableContentRef.value.clientHeight;
        tableBodyHeight.value = containerHeight - headerHeight;
    }
};

// 添加ECharts实例引用
const chartInstances = ref([]);
const resizeListeners = ref([]);

onMounted(() => {
    const resizeObserver = new ResizeObserver(calculateTableHeight);
    if (tableContentRef.value) {
        resizeObserver.observe(tableContentRef.value);
    }
    setTimeout(calculateTableHeight, 150);
    
    // 数据加载完成后绘制图表
    fetchPlanData().then(() => {
        drawMaintainPlot();
        drawRuntimePlot();
    });
    // 确保初始化时运维中心已选择并触发相应的电站筛选
    if (filteredStationOptions.value.length > 0 && !filteredStationOptions.value.some(station => station.value === stationSelected.value)) {
        // 如果当前选择的电站不在筛选列表中，设置为第一个
        commit("globalVar/setSelectedStation", filteredStationOptions.value[0].value);
    }
});

onUnmounted(() => {
    // 清理所有ECharts实例
    chartInstances.value.forEach(chart => {
        if (chart && !chart.isDisposed()) {
            chart.dispose();
        }
    });
    chartInstances.value = [];
    
    // 清理所有resize事件监听器
    resizeListeners.value.forEach(listener => {
        window.removeEventListener('resize', listener);
    });
    resizeListeners.value = [];
});

// 定义运维中心数据
const centerOptions = [
    { value: '宁波运维中心', label: '宁波运维中心' },
    { value: '杭州运维中心', label: '杭州运维中心' },
    { value: '温州运维中心', label: '温州运维中心' },
    { value: '丽水运维中心', label: '丽水运维中心' }
];

// 运维中心与电站的对应关系
const centerStationsMap = {
    '杭州运维中心': ['富阳'],
    '温州运维中心': ['大峃', '二源', '马屿'],
    '丽水运维中心': ['唐景', '唐云'],
    '宁波运维中心': ['长大涂', '乌沙山']
};

// 当前选中的运维中心
const centerSelected = ref(centerOptions[0].value);

const stationOptions = STATIONS;
const stationSelected = computed(() => state.globalVar.selectedStation);
const dateSelected = computed(() => dayjs(state.globalVar.selectedDate, 'YYYY-MM-DD'));
const dateSelectedStr = computed(() => state.globalVar.selectedDate);

// 根据运维中心筛选电站选项
const filteredStationOptions = computed(() => {
    const centerStations = centerStationsMap[centerSelected.value] || [];
       // 将STATIONS中的选项与centerStationsMap中的名称进行匹配
    const filteredOptions = stationOptions.filter(station => {
        // 检查station.value或station.label是否包含在centerStations中的任何一个值中
        return centerStations.some(centerStation => 
            station.value.includes(centerStation) || 
            (station.label && station.label.includes(centerStation))
        );
    });
    
    return filteredOptions.length > 0 ? filteredOptions : stationOptions;
});

// 运维中心变更处理
const onCenterChange = (center) => {
    centerSelected.value = center;
    // 如果当前选中的电站不在新的运维中心下，则重置电站选择
    if (filteredStationOptions.value.length > 0 && !centerStationsMap[center].includes(stationSelected.value)) {
        const newStation = filteredStationOptions.value[0].value;
        commit("globalVar/setSelectedStation", newStation);
        fetchPlanData();
    }
};

const loading_maintain = ref(false);
const loading_runtime = ref(false);

const exportMaintain = async () => {
    loading_maintain.value = true;
    try {
        const response = await exportMaintainPlan(dateSelectedStr.value, stationSelected.value);
        
        // 获取文件名（兼容后端 Content-Disposition 或 fallback，优先 filename*）
        let filename = `${stationSelected.value}_${dateSelectedStr.value}_运维报告.xlsx`;
        const disposition = response.headers['content-disposition'];
        if (disposition) {
            // 优先匹配 filename*
            let match = disposition.match(/filename\*=UTF-8''([^;\n]*)/);
            if (match && match[1]) {
                filename = decodeURIComponent(match[1]);
            } else {
                // 再匹配普通 filename
                match = disposition.match(/filename=([^;\n]*)/);
                if (match && match[1]) {
                    filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
                }
            }
        }

        // 创建下载链接并自动下载
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        message.success('运维报告已导出');
    } catch (error) {
        console.error('Error exporting maintain report:', error);
        message.error(`导出运维报告失败: ${error.message || '未知错误'}`);
    } finally {
        loading_maintain.value = false;
    }
};

const exportRuntime = async () => {
    loading_runtime.value = true;
    try {
        const response = await exportRuntimePlan(dateSelectedStr.value, stationSelected.value);
        
        // 获取文件名（兼容后端 Content-Disposition 或 fallback，优先 filename*）
        let filename = `${stationSelected.value}_${dateSelectedStr.value}_运行报告.xlsx`;
        const disposition = response.headers['content-disposition'];
        if (disposition) {
            // 优先匹配 filename*
            let match = disposition.match(/filename\*=UTF-8''([^;\n]*)/);
            if (match && match[1]) {
                filename = decodeURIComponent(match[1]);
            } else {
                // 再匹配普通 filename
                match = disposition.match(/filename=([^;\n]*)/);
                if (match && match[1]) {
                    filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
                }
            }
        }

        // 创建下载链接并自动下载
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        message.success('运行报告已导出');
    } catch (error) {
        console.error('Error exporting runtime report:', error);
        message.error(`导出运行报告失败: ${error.message || '未知错误'}`);
    } finally {
        loading_runtime.value = false;
    }
};

const onStationChange = (station) => { 
    commit("globalVar/setSelectedStation", station);
    fetchPlanData();
};
const onDateChange = (date) => { 
    commit("globalVar/setSelectedDate", date.format('YYYY-MM-DD'));
    fetchPlanData();
};

const selectedPlan = ref('maintain');
const selectPlan = (plan) => { 
    selectedPlan.value = plan;
    // 重置表格状态
    resetTableState();
};

// 重置表格状态
const resetTableState = () => {
    currentPage.value = 1;
    // 保持每页条数不变
    sortField.value = '';
    sortOrder.value = '';
    filterInfo.value = {};
};

const maintainColumns = [
    {
        title: '排序',
        dataIndex: 'order',
        sorter: (a, b) => a.order - b.order,
        sortDirections: ['ascend', 'descend'],
        width: '8%'
    },
    {
        title: '告警类型',
        dataIndex: 'alarmType',
        filters: [
            { text: '逆变器告警', value: '逆变器告警' },
            { text: '组串告警', value: '组串告警' }
        ],
        onFilter: (value, record) => record.alarmType === value,
        width: '10%'
    },
    {
        title: '生产设备编号',
        dataIndex: 'deviceCode',
        width: '15%'
    },
    {
        title: '告警名称',
        dataIndex: 'alarmName',
        width: '15%'
    },
    {
        title: '处理建议',
        dataIndex: 'suggestion',
        width: '29%'
    },
    {
        title: '所需工具',
        dataIndex: 'tools',
        width: '15%'
    },
    {
        title: '人员数量',
        dataIndex: 'peopleCount',
        sorter: (a, b) => a.peopleCount - b.peopleCount,
        sortDirections: ['ascend', 'descend'],
        width: '8%'
    }
];

const runtimeColumns = [
    {
        title: '排序',
        dataIndex: 'order',
        sorter: (a, b) => a.order - b.order,
        sortDirections: ['ascend', 'descend'],
        width: '8%'
    },
    {
        title: '电站名称',
        dataIndex: 'stationName',
        filters: [], // 动态生成过滤选项
        onFilter: (value, record) => record.stationName === value,
        width: '10%'
    },
    {
        title: '生产设备编号',
        dataIndex: 'deviceCode',
        width: '20%'
    },
    {
        title: '故障类型',
        dataIndex: 'alarmType',
        filters: [
            { text: '掉串', value: '掉串' },
            { text: '遮挡', value: '遮挡' },
            { text: '积灰', value: '积灰' },
            { text: '二极管故障', value: '二极管故障' },
            { text: '热斑', value: '热斑' }
        ],
        onFilter: (value, record) => record.alarmType === value,
        width: '12%'
    },
    {
        title: '累计损失电量',
        dataIndex: 'lossAmount',
        sorter: (a, b) => {
            const aValue = parseInt(a.lossAmount.replace('kWh', '')) || 0;
            const bValue = parseInt(b.lossAmount.replace('kWh', '')) || 0;
            return aValue - bValue;
        },
        sortDirections: ['ascend', 'descend'],
        width: '15%'
    },
    {
        title: '未来一周预估损失电量',
        dataIndex: 'estimatedLoss',
        sorter: (a, b) => {
            const aValue = parseInt(a.estimatedLoss.replace('kWh', '')) || 0;
            const bValue = parseInt(b.estimatedLoss.replace('kWh', '')) || 0;
            return aValue - bValue;
        },
        sortDirections: ['ascend', 'descend'],
        width: '15%'
    },
    {
        title: '劣化率',
        dataIndex: 'degradationRate',
        sorter: (a, b) => {
            const aValue = parseInt(a.degradationRate.replace('%', '')) || 0;
            const bValue = parseInt(b.degradationRate.replace('%', '')) || 0;
            return aValue - bValue;
        },
        sortDirections: ['ascend', 'descend'],
        width: '10%'
    }
];

// 后端接口数据
const maintainResults = ref([]);
const runtimeResults = ref([]);

// 表格状态控制变量
const tableLoading = ref(false);
const pageSize = ref(20);
const currentPage = ref(1);
const sortField = ref('');
const sortOrder = ref('');
const filterInfo = ref({});

// 处理表格变化事件（排序、过滤）
const handleTableChange = (pagination, filters, sorter) => {
    // 更新过滤条件
    filterInfo.value = filters;
    
    // 更新排序条件
    if (sorter && sorter.field) {
        sortField.value = sorter.field;
        sortOrder.value = sorter.order;
    } else {
        sortField.value = '';
        sortOrder.value = '';
    }
};

// 页码变化处理
const pageChange = (page) => {
    currentPage.value = page;
};

// 每页条数变化处理
const pageSizeChange = (current, size) => {
    currentPage.value = 1; // 切换每页条数时重置为第一页
    pageSize.value = size;
};

// 应用筛选和排序到完整数据集
const filteredAndSortedData = computed(() => {
    let dataSource = selectedPlan.value === 'maintain' ? maintainResults.value : runtimeResults.value;
    
    // 应用过滤条件
    if (filterInfo.value && Object.keys(filterInfo.value).length > 0) {
        Object.keys(filterInfo.value).forEach(key => {
            const filterValues = filterInfo.value[key];
            if (filterValues && filterValues.length > 0) {
                dataSource = dataSource.filter(record => filterValues.includes(record[key]));
            }
        });
    }
    
    // 应用排序
    if (sortField.value && sortOrder.value) {
        dataSource = [...dataSource].sort((a, b) => {
            const aValue = a[sortField.value];
            const bValue = b[sortField.value];
            
            // 处理数字排序
            if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
                return sortOrder.value === 'ascend'
                    ? parseFloat(aValue) - parseFloat(bValue)
                    : parseFloat(bValue) - parseFloat(aValue);
            }
            
            // 处理字符串排序
            if (sortOrder.value === 'ascend') {
                return String(aValue).localeCompare(String(bValue));
            } else {
                return String(bValue).localeCompare(String(aValue));
            }
        });
    }
    
    return dataSource;
});

// 计算当前页显示的数据
const currentPageData = computed(() => {
    const dataSource = filteredAndSortedData.value;
    const startIndex = (currentPage.value - 1) * pageSize.value;
    const endIndex = startIndex + pageSize.value;
    return dataSource.slice(startIndex, endIndex);
});

// 从后端获取数据
const fetchPlanData = async () => {
    try {
        loading_maintain.value = true;
        loading_runtime.value = true;
        tableLoading.value = true;
        
        // 重置分页信息
        currentPage.value = 1;
        
        const response = await getPlanData(stationSelected.value, dateSelectedStr.value);
        
        if (response) {
            // 后端直接返回对象，不再有额外的嵌套
            if (Array.isArray(response.maintain_results)) {
                maintainResults.value = response.maintain_results;
            } else {
                console.warn('后端返回的维护数据格式不正确');
                maintainResults.value = [];
            }
            
            if (Array.isArray(response.runtime_results)) {
                runtimeResults.value = response.runtime_results;
            } else {
                console.warn('后端返回的运行数据格式不正确');
                runtimeResults.value = [];
            }
            
            // 当数据为空时使用空数组
            if (maintainResults.value.length === 0) {
                maintainResults.value = [];
            }
            
            if (runtimeResults.value.length === 0) {
                runtimeResults.value = [];
            }
            
            // 重新绘制图表
            drawMaintainPlot();
            drawRuntimePlot();
        } else {
            // 使用空数组
            maintainResults.value = [];
            runtimeResults.value = [];
        }
    } catch (error) {
        console.error('获取计划数据失败:', error);
        // 使用空数组
        maintainResults.value = [];
        runtimeResults.value = [];
    } finally {
        loading_maintain.value = false;
        loading_runtime.value = false;
        tableLoading.value = false;
    }
    
    // 返回Promise以便在调用处可以使用then
    return Promise.resolve();
};

// 获取逆变器告警类型及数量
const inverterAlarmDict = () => {
    const tmpDict = {};
    maintainResults.value
        .filter(r => r.alarmType === '逆变器告警')
        .forEach((r) => {
            if (r.alarmName in tmpDict) {
                tmpDict[r.alarmName] += 1;
            }
            else {
                tmpDict[r.alarmName] = 1;
            }
        });
    return tmpDict;
};

// 获取组串告警类型及数量
const stringAlarmDict = () => {
    const tmpDict = {};
    maintainResults.value
        .filter(r => r.alarmType === '组串告警')
        .forEach((r) => {
            if (r.alarmName in tmpDict) {
                tmpDict[r.alarmName] += 1;
            }
            else {
                tmpDict[r.alarmName] = 1;
            }
        });
    return tmpDict;
};

const planMaintainInverterPlot = ref(null);
const planMaintainStringPlot = ref(null);
const planMaintainInverterOption = ref({});
const planMaintainStringOption = ref({});

// 准备环形图数据
const prepareAlarmPlotData = (tmpDict) => {
    const ret = [];
    const getIssueColor = (index) => {
        const colors = [
            '#FF8A80', // 红色
            '#80DEEA', // 青色
            '#FFE082', // 黄色
            '#A7FFEB', // 浅绿色
            '#FFAB91', // 橙色
            '#D1C4E9', // 紫色
            '#80CBC4', // 蓝绿色
        ];
        return colors[index % colors.length];
    };
    
    let index = 0;
    for (let k in tmpDict) {
        ret.push({
            name: k,
            value: tmpDict[k],
            itemStyle: {
                color: getIssueColor(index++)
            }
        });
    }
    return ret;
};

// 创建通用的饼图选项配置
const createPieChartOptions = (data, centerText, centerColor = '#8EAAFB') => {
    const TextHighlightColor = '#CECED9';
    return {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            // 图例设置 - 更小更紧凑
            show: true,
            type: 'scroll',
            orient: 'horizontal',
            bottom: '5%',
            left: 'center',
            itemGap: 8,          // 降低项目间距从20到8
            itemWidth: 8,        // 减小图例标记尺寸从12到8
            itemHeight: 8,       // 减小图例标记尺寸从12到8
            pageButtonPosition: 'end',
            pageButtonItemGap: 3, // 减小按钮间距
            pageButtonGap: 3,     // 减小按钮间距
            pageIconColor: TextHighlightColor,
            pageIconInactiveColor: '#555',
            pageIconSize: 10,     // 稍微减小翻页图标
            textStyle: {
                fontSize: 10,     // 减小字体大小从12到10
                color: TextHighlightColor,
                padding: [1, 3]   // 减小内边距
            }
        },
        series: [
            {
                name: '数据统计',
                type: 'pie',
                radius: ['40%', '65%'],
                center: ['50%', '40%'],  // 上移，为底部图例留空间
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 2,
                    borderColor: '#393C41',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    position: 'center',
                    formatter: function() {
                        return '{count|' + centerText + '}';
                    },
                    rich: {
                        count: {
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: centerColor
                        }
                    }
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    },
                    label: {
                        show: true,
                        formatter: function() {
                            return '{count|' + centerText + '}';
                        },
                        rich: {
                            count: {
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: centerColor
                            }
                        }
                    }
                },
                labelLine: {
                    show: false
                },
                data: data
            }
        ]
    };
};

// 绘制逆变器告警环形图
const drawInverterAlarmPlot = () => {
    if (!planMaintainInverterPlot.value) return;
    
    const plotDom = echarts.init(planMaintainInverterPlot.value, 'dt', { renderer: 'svg' });
    
    // 保存实例引用
    chartInstances.value.push(plotDom);
    
    const tmpDict = inverterAlarmDict();
    
    const options = createPieChartOptions(
        prepareAlarmPlotData(tmpDict), 
        getInverterAlarmCount()
    );
    
    planMaintainInverterOption.value = options;
    plotDom.setOption(planMaintainInverterOption.value);
    
    // 创建resize监听器并保存引用
    const resizeListener = () => {
        if (plotDom && !plotDom.isDisposed()) {
            plotDom.resize();
        }
    };
    window.addEventListener('resize', resizeListener);
    resizeListeners.value.push(resizeListener);
};

// 绘制组串告警环形图
const drawStringAlarmPlot = () => {
    if (!planMaintainStringPlot.value) return;
    
    const plotDom = safeInitEcharts(planMaintainStringPlot.value, 'dt', { renderer: 'svg' });
    
    // 保存实例引用
    chartInstances.value.push(plotDom);
    
    const tmpDict = stringAlarmDict();
    
    const options = createPieChartOptions(
        prepareAlarmPlotData(tmpDict), 
        getStringAlarmCount()
    );
    
    planMaintainStringOption.value = options;
    plotDom.setOption(planMaintainStringOption.value);
    
    // 创建resize监听器并保存引用
    const resizeListener = () => {
        if (plotDom && !plotDom.isDisposed()) {
            plotDom.resize();
        }
    };
    window.addEventListener('resize', resizeListener);
    resizeListeners.value.push(resizeListener);
};

// 绘制所有告警图表
const drawMaintainPlot = () => {
    // 延迟执行，确保DOM已更新
    setTimeout(() => {
        if (hasInverterAlarm()) {
            drawInverterAlarmPlot();
        }
        if (hasStringAlarm()) {
            drawStringAlarmPlot();
        }
    }, 0);
};

const planRuntimePlot = ref(null);
const planRuntimeOption = ref({});

// 绘制运行层面图表
const drawRuntimePlot = () => {
    if (!planRuntimePlot.value) return;

    // 统计数据
    const dataByStation = {};
    runtimeResults.value.forEach(item => {
        // 已经在后端转换过，这里不需要再转换
        const station = item.stationName || '未知';
        if (station in dataByStation) {
            dataByStation[station]++;
        } else {
            dataByStation[station] = 1;
        }
    });

    // 如果没有任何数据，直接return，不渲染图表
    if (Object.keys(dataByStation).length === 0) {
        // 可选：清空图表
        if (planRuntimePlot.value) {
            let chart = echarts.getInstanceByDom(planRuntimePlot.value);
            if (chart) chart.clear();
        }
        return;
    }

    // 有数据才渲染
    const chartData = Object.keys(dataByStation).map((key, index) => {
        const colors = ['#FF8A80', '#80DEEA', '#FFE082', '#A7FFEB', '#FFAB91', '#D1C4E9'];
        return {
            name: key,
            value: dataByStation[key],
            itemStyle: {
                color: colors[index % colors.length]
            }
        };
    });

    const options = createPieChartOptions(
        chartData,
        getStringAlarmTotal()
    );

    const plotDom = safeInitEcharts(planRuntimePlot.value, 'dt', { renderer: 'svg' });
    planRuntimeOption.value = options;
    plotDom.setOption(planRuntimeOption.value);
    // ...resize监听
};

// 监听电站和日期变化
watch([stationSelected, dateSelectedStr], ([newStation, newDate]) => {
    checkJsonFileState(newStation, newDate);
}, { immediate: true });

// 监听计划类型变化
watch(selectedPlan, () => {
    // 切换计划类型时重置表格状态
    resetTableState();
}, { immediate: false });

// 监听筛选和排序条件变化，重置到第一页
watch([filterInfo, sortField, sortOrder], () => {
    currentPage.value = 1;
}, { immediate: false });

// 动态生成电站过滤选项
const stationFilters = computed(() => {
    const stations = new Set();
    runtimeResults.value.forEach(item => {
        if (item.stationName) {
            stations.add(item.stationName);
        }
    });
    
    return Array.from(stations).map(station => ({
        text: station,
        value: station
    }));
});

// 场站名称已在后端转换为中文

// 监听运行结果变化，更新电站过滤选项
watch(runtimeResults, () => {
    if (runtimeColumns && runtimeColumns.length > 1) {
        const stationColumn = runtimeColumns.find(col => col.dataIndex === 'stationName');
        if (stationColumn) {
            stationColumn.filters = stationFilters.value;
        }
    }
}, { immediate: true });

// 计算逆变器告警数量
const getInverterAlarmCount = () => {
    return maintainResults.value.filter(item => item.alarmType === '逆变器告警').length;
};

// 计算组串告警数量
const getStringAlarmCount = () => {
    return maintainResults.value.filter(item => item.alarmType === '组串告警').length;
};

// 检查是否有逆变器告警
const hasInverterAlarm = () => {
    return getInverterAlarmCount() > 0;
};

// 检查是否有组串告警
const hasStringAlarm = () => {
    return getStringAlarmCount() > 0;
};

// 计算组串告警总数
const getStringAlarmTotal = () => {
    return runtimeResults.value.length;
};

// 场站名称已在后端转换为中文

// 计算场站数量
const getUniqueStationsCount = () => {
    const stations = new Set();
    runtimeResults.value.forEach(item => {
        if (item.stationName) {
            stations.add(item.stationName);
        }
    });
    return stations.size;
};

function safeInitEcharts(dom) {
    if (!dom) {
        // dom 还没挂载，直接返回
        return null;
    }
    let chart = echarts.getInstanceByDom(dom);
    if (chart) {
        chart.dispose();
    }
    return echarts.init(dom);
}

</script>

<style>
.selector-container {
    height: 10%;
    width: 100%;
    display: flex;
    align-items: center;
}

.selector-center {
    width: 18%;
    margin-right: 10px;
}

.selector-center .ant-select-selector {
    display: flex;
    justify-content: center;
    align-items: center;
}

.selector-station {
    width: 18%;
    margin-right: 10px;
}

.selector-station .ant-select-selector {
    display: flex;
    justify-content: center;
    align-items: center;
}

.selector-time {
    width: 18%;
    height: 6vh;
    margin-right: 10px;
}

.button-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 6vh;
}

#plan-output-button {
    width: 10%;
    height: 6vh;
}

.plan-overview {
    height: 18%;
    width: 100%;
    display: flex;
}

.plan-overview-container {
    display: flex;
    height: 100%;
    width: 50%;
    justify-content: space-between;
}

.plan-overview-panel {
    width: 100%;
    height: 90%;
    background-color: #393C41;
    border-radius: 10px;
    display: flex;
}

#plan-overview-maintain {
    margin-right: 10px;
}

#plan-overview-runtime {
    margin-left: 10px;
}

.plan-overview-panel-selected {
    width: 100%;
    height: 90%;
    background-color: #393C41;
    border-radius: 10px;
    display: flex;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.plan-panel-title {
    height: 100%;
    width: 15%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.plan-panel-title-container {
    height: 100%;
    width: 100%;
}

.plan-panel-title p {
    font-size: 4vh;
    line-height: 4vh;
    align-items: center;
    text-align: center;
    padding: 5px 0px 5px 10px;
    margin: 0;
    color: #CECED9;
}

.plan-panel-detail {
    width: 30%;
    display: flex;
    justify-content: center;
    align-items: center;
}


.plan-panel-detail-container p {
    font-size: 2.5vh;
    line-height: 2.5vh;
    align-items: center;
    text-align: center;
    padding: 5px 0px 5px 10px;
    margin: 0;
    /* 应用渐变背景 */
    background-image: linear-gradient(70deg, #FFFFFF, #79A7FF, #C3C9FF);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    /* 使文本颜色透明，以显示背景 */
    -webkit-text-fill-color: transparent;
    /* 对于某些WebKit浏览器 */
}

.plan-panel-plot {
    width: 55%;
    display: flex;
    height: 100%;
    padding: 5px;
    box-sizing: border-box;
}

#plan-maintain-inverter-plot,
#plan-maintain-string-plot,
#plan-runtime-plot {
    height: 100% !important;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: visible;
}

/* 确保图例内容可见 */
:deep(.echarts-tooltip) {
    background: rgba(50, 50, 50, 0.9) !important;
    border: 1px solid #555 !important;
    border-radius: 4px !important;
    color: #fff !important;
    padding: 8px !important;
}

/* 图例标签样式优化 */
:deep(.echarts-legend-item) {
    cursor: pointer;
}

.plan-detail {
    height: 72%;
    width: 100%;
    overflow: visible;
    display: flex;
}

.plan-detail-container {
    width: 100%;
    height: 100%;
    background-color: #393C41;
    border-radius: 10px;
    overflow: visible;
    display: flex;
    flex-direction: column;
    position: relative;
}

.table-content {
    width: 100%;
    flex: 1;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
}

.pagination-wrapper {
    width: 100%;
    height: 50px;
    position: relative;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0 20px;
    background-color: #393C41;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.pagination-total {
    margin-right: auto;
    color: rgba(255, 255, 255, 0.85);
}

.plan-detail-table {
    width: 100%;
    height: 100%;
    /* overflow: auto; */
}

/* 确保表格容器有正确的布局 */
:deep(.ant-table-wrapper) {
    height: 100%;
}

:deep(.ant-table) {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.ant-table-container) {
    height: 100%;
}



/* 固定表头，内容区域可滚动 */
:deep(.ant-table-header) {
    position: sticky;
    top: 0;
    z-index: 2;
    overflow: hidden !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
    background-color: #2c2f33;
    width: 100%;
}

:deep(.ant-table-body) {
    /* height: calc(100% - 39px) !important; */ /* 减去表头高度 */
    overflow-x: auto !important;
    overflow-y: auto !important;
    /* max-height: none !important; */
    position: relative;
    flex: 1;
    min-height: 0;
}

/* 确保表头和表体列宽一致 */
:deep(.ant-table-header table),
:deep(.ant-table-body table) {
    width: 100% !important;
}

/* 自定义滚动条样式 */
:deep(.ant-table-body::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
}

:deep(.ant-table-body::-webkit-scrollbar-thumb) {
    background-color: #666;
    border-radius: 4px;
}

:deep(.ant-table-body::-webkit-scrollbar-thumb:hover) {
    background-color: #888;
}

:deep(.ant-table-body::-webkit-scrollbar-track) {
    background-color: #393C41;
    border-radius: 4px;
}

/* 隐藏表头的滚动条 */
:deep(.ant-table-header::-webkit-scrollbar) {
    display: none;
    width: 0;
    height: 0;
}

/* 移除表头底部阴影 */
:deep(.ant-table-sticky-scroll) {
    display: none !important;
}

:deep(.ant-table-sticky-holder) {
    box-shadow: none !important;
}

/* 确保表格行有合适的高度和样式 */
:deep(.ant-table-tbody > tr) {
    height: 48px;
}

:deep(.ant-table-thead > tr > th) {
    background-color: #2c2f33 !important;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding: 10px 16px;
}

:deep(.ant-table-thead > tr > th.ant-table-cell) {
    background-color: #2c2f33 !important;
}

:deep(.ant-table-sticky-header) {
    background: #2c2f33 !important;
}

/* 隐藏右侧多余的滚动条 */
:deep(.ant-table-ping-right:not(.ant-table-has-fix-right) .ant-table-container::after) {
    box-shadow: none !important;
    display: none !important;
}

:deep(.ant-table-ping-left:not(.ant-table-has-fix-left) .ant-table-container::before) {
    box-shadow: none !important;
    display: none !important;
}

/* 隐藏表格内部的水平滚动条 */
:deep(.ant-table-body::-webkit-scrollbar-corner) {
    background-color: transparent;
}

/* 调整分页器样式 */
:deep(.ant-pagination) {
    display: flex;
    align-items: center;
}

:deep(.ant-pagination-options) {
    margin-left: 16px;
    display: flex;
    align-items: center;
}

/* 提高表格过滤和排序按钮的可见度 */
:deep(.ant-table-column-sorter) {
    color: rgba(255, 255, 255, 0.7);
}

:deep(.ant-table-filter-trigger) {
    color: rgba(255, 255, 255, 0.7);
}

:deep(.ant-table-filter-trigger:hover) {
    color: #1890ff;
    background: rgba(24, 144, 255, 0.15);
}

:deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
    background-color: rgba(255, 255, 255, 0.08);
}

:deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding: 8px 16px;
}

/* --------- 美化表格滚动条样式，参考List.vue --------- */
.plan-detail .plan-detail-table .ant-table-body::-webkit-scrollbar,
.plan-detail .plan-detail-table .ant-table-content::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
}

.plan-detail .plan-detail-table .ant-table-body::-webkit-scrollbar-track,
.plan-detail .plan-detail-table .ant-table-content::-webkit-scrollbar-track {
    background: #2c2c2c !important;
    border-radius: 4px !important;
}

.plan-detail .plan-detail-table .ant-table-body::-webkit-scrollbar-thumb,
.plan-detail .plan-detail-table .ant-table-content::-webkit-scrollbar-thumb {
    background: #6b6b6b !important;
    border-radius: 4px !important;
}

.plan-detail .plan-detail-table .ant-table-body::-webkit-scrollbar-thumb:hover,
.plan-detail .plan-detail-table .ant-table-content::-webkit-scrollbar-thumb:hover {
    background: #888888 !important;
}
</style>