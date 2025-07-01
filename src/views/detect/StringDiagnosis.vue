<template>
  <div>
    <div class="section-title">电气量根因诊断</div>
    <div ref="d3Chart" class="ring-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as d3 from 'd3';
import { getStringDiagnosis } from '@/api/detect/detect';

const props = defineProps({
  stationName: String,
  date: String,
  selectString: String
});

const d3Chart = ref(null);
const isLoading = ref(false);
const diagnosisResults = ref([]);
const centerText = ref({
  name: '',
  value: 0,
  color: '#FF6F61'
});

// 颜色映射表
const colorMap = {
  '表面污迹': '#7EC6F9',
  '二极管故障': '#FF7C7C',
  '组串开路': '#FFB300',
  '组串开路或低效': '#FFB300',
  '热斑': '#FF6F61',
  '遮挡': '#A3A1FB',
  '积灰': '#00D97E'
};

// 获取诊断数据
const fetchDiagnosisData = async () => {
  d3.select(d3Chart.value).selectAll('*').remove();
  if (!props.stationName || !props.selectString || !props.date) return;
  
  try {
    isLoading.value = true;
    const response = await getStringDiagnosis(props.stationName, props.selectString, props.date);
    
    if (response && response.diagnosis_results) {
      diagnosisResults.value = response.diagnosis_results
        .filter(item => item.rate > 0) // 过滤掉比率为0的项
        .map(item => ({
          value: item.rate,
          name: item.result,
          color: colorMap[item.result] || getRandomColor()
        }));
      
      // 如果没有数据，添加默认项
      if (diagnosisResults.value.length === 0) {
        diagnosisResults.value = [
          {
            value: 100,
            name: '正常',
            color: '#00D97E'
          }
        ];
      }
      
      // 默认中心显示最大项
      updateCenterText();
      
      // 绘制图表
      drawD3Chart();
    }
  } catch (error) {
    console.error('获取诊断数据失败:', error);
    // 使用默认数据
    diagnosisResults.value = [
      {
        value: 40,
        name: '表面污迹',
        color: '#7EC6F9'
      },
      {
        value: 30,
        name: '二极管故障',
        color: '#FF7C7C'
      },
      {
        value: 20,
        name: '组串开路',
        color: '#FFB300'
      },
      {
        value: 10,
        name: '热斑',
        color: '#FF6F61'
      }
    ];
    
    // 默认中心显示最大项
    updateCenterText();
    
    // 绘制图表
    drawD3Chart();
  } finally {
    isLoading.value = false;
  }
};

// 更新中心文字
const updateCenterText = () => {
  if (diagnosisResults.value.length === 0) return;
  
  const maxIdx = diagnosisResults.value.reduce(
    (maxIdx, item, idx, arr) => item.value > arr[maxIdx].value ? idx : maxIdx, 
    0
  );
  
  centerText.value = {
    name: diagnosisResults.value[maxIdx].name,
    value: diagnosisResults.value[maxIdx].value,
    color: diagnosisResults.value[maxIdx].color
  };
};

// 绘制D3环形图
const drawD3Chart = () => {
  if (!d3Chart.value) return;
  
  // 清空容器
  d3.select(d3Chart.value).selectAll('*').remove();
  
  // 设置尺寸和边距
  const width = d3Chart.value.clientWidth;
  const height = d3Chart.value.clientHeight;
  const margin = 40;
  const chartWidth = width - 2 * margin;
  const chartHeight = height - 2 * margin;
  const radius = Math.min(chartWidth, chartHeight) / 3;
  
  // 创建SVG容器
  const svg = d3.select(d3Chart.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 3}, ${height / 2})`); // 保持环形图左侧位置

  // 创建饼图/环形图生成器
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null); // 不排序，保持原始顺序
  
  const arc = d3.arc()
    .innerRadius(radius * 0.7) // 内半径
    .outerRadius(radius);
    
  // 绘制环形图
  svg.selectAll('path')
    .data(pie(diagnosisResults.value))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
    .attr('stroke-width', 1)
    .style('filter', 'drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.3))')
    .on('mouseover', function(event, d) {
      // 更新中心文字
      updateCenterTextOnHover(d.data.name, d.data.value, d.data.color);
      
      // 高亮当前扇区
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', d3.arc()
          .innerRadius(radius * 0.68)
          .outerRadius(radius * 1.05)
        );
    })
    .on('mouseout', function() {
      // 恢复默认中心文字
      updateCenterText();
      
      // 恢复扇区大小
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', arc);
    });
  
  // 添加中心文字容器
  const centerGroup = svg.append('g')
    .attr('class', 'center-text');
  
  // 添加故障类型文字
  centerGroup.append('text')
    .attr('class', 'center-name')
    .attr('x', 0)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('fill', centerText.value.color)
    .style('font-size', '22px')
    .style('font-weight', 'bold')
    .style('text-shadow', `0 0 10px ${centerText.value.color}88`)
    .text(centerText.value.name);
  
  // 添加百分比文字
  centerGroup.append('text')
    .attr('class', 'center-value')
    .attr('x', 0)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .style('fill', centerText.value.color)
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .style('text-shadow', `0 0 5px ${centerText.value.color}88`)
    .text(`${centerText.value.value}%`);
    
  // 绘制图例
  const legendGroup = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${radius * 1.1}, ${-radius * 0.8})`);
    
  const legend = legendGroup.selectAll('.legend-item')
    .data(diagnosisResults.value)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`);
    
  legend.append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('rx', 2)
    .attr('fill', d => d.color);
    
  legend.append('text')
    .attr('x', 15)
    .attr('y', 9)
    .style('font-size', '11px')
    .style('fill', '#CECEF7')
    .text(d => `${d.name}: ${d.value}%`);
};

// 鼠标悬停时更新中心文字
const updateCenterTextOnHover = (name, value, color) => {
  // 更新中心文本
  d3.select('.center-name')
    .transition()
    .duration(200)
    .style('fill', color)
    .style('text-shadow', `0 0 10px ${color}88`)
    .text(name);
    
  d3.select('.center-value')
    .transition()
    .duration(200)
    .style('fill', color)
    .style('text-shadow', `0 0 5px ${color}88`)
    .text(`${value}%`);
    
  // 更新状态
  centerText.value = { name, value, color };
};

// 生成随机颜色
const getRandomColor = () => {
  const colors = ['#FFB300', '#7EC6F9', '#A3A1FB', '#FF7C7C', '#FF6F61', '#00D97E'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 监听窗口大小变化
const handleResize = () => {
  drawD3Chart();
};

// 监听参数变化
watch(() => [props.stationName, props.date, props.selectString], fetchDiagnosisData);

// 组件挂载时获取数据和添加窗口大小监听
onMounted(() => {
  fetchDiagnosisData();
  window.addEventListener('resize', handleResize);
});

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.section-title {
  font-size: 1.125em;
  font-weight: bold;
  color: #CECEF7;
  margin-bottom: 0.5em;
  padding-left: 0.5em;
}
.ring-chart {
  width: 100%;
  height: 48vh;
  margin: 0 auto;
  background: transparent;
  position: relative;
  max-height: calc(100% - 2em);
}
</style>
