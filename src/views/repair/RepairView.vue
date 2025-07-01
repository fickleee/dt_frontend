<template>
  <div class="repair-view">
    <div ref="tooltip" class="tooltip" style="opacity: 0"></div>
    <div class="selector">
    <Select 
      placeholder="请选择电站" 
      ref="select" 
      v-model:value="stationSelected" 
      :options="stationOptions" 
      @change="onStationChange"
      class="selector-item station-select"
    />
    <DatePicker
      format="YYYY-MM-DD"
      :placeholder="'请选择日期'"
      @change="onDateChange"
      class="selector-item date-picker"
    />
    <Select 
      placeholder="请选择变量类型" 
      v-model:value="typeSelected" 
      :options="typeOptions" 
      @change="onTypeChange"
      class="selector-item type-select"
    />
  </div>
  <div id="repair-content" class="content">
    <div class="table">
      <Spin :spinning="selectorSpinning">
        <List :columns="columns" :data="stationData" :title="'数据质量问题详览'" :detailColumnCount="2"
          :detailColumns="detailColumns" :handleModel="handleModel" :otherHeight="16 + 35 + 10 + 120 + 60 + 10 + 16">
        </List>
      </Spin>
    </div>
    <div class="impute">
      <div class="instance-overview" id="impute-instance-overview">
          <svg id="impute_overview"></svg>
        </div>
      <div class="detail-card" id="impute-card">
        <div class="detail-card-title">数据填补</div>
        <div class="detail-card-description">
          <span>当前填补情况</span>
          <Button v-if="detailVariable !== ''" size="small" shape="round" style="margin-left: 10px">
            {{ detailVariable }}
          </Button>
          <Button v-if="detailImputeDate !== ''" size="small" shape="round" style="margin-left: 10px">
            {{ detailImputeDate }}
          </Button>
          <Button 
            size="small" 
            shape="round" 
            style="margin-left: 10px" 
            :icon="h(LineChartOutlined)"
            @click="toggleEditMode('i', 'svg_container_impute')"
            :disabled="!originData.length"
          >{{ editModeImpute ? '停止绘制' : '绘制填补曲线' }}</Button>
          <Button 
            size="small" 
            shape="round" 
            style="margin-left: 10px" 
            :icon="h(SaveOutlined)"
            @click="handleSaveResult" 
            :loading="saveLoading"
            :disabled="!sketchData.length"
          >保存结果</Button>
        </div>
        <div class="svg_container" style="margin: 15px 0">
          <Spin :spinning="chartImputeSpinning">
            <svg id="svg_container_impute"></svg>
          </Spin>
        </div>
        <div class="detail-card-description">
          <span>推荐填补结果</span>
          <Switch v-show="allValuesZero" v-model:checked="isImputed" :loading="modelImputeSpinning"
            style="margin-left: 10px"
            @change="imputeZero" />
        </div>
        <Spin :spinning="modelImputeSpinning">
          <div class="models-container" v-if="modelRes.length > 0">
            <div class="model" v-for="(item, index) in 3" :key="index" @click="handleModelClick(modelRes, index, 'i')">
              <ModelResult v-if="modelRes.length > 0 && modelRes[index]" :model="modelRes[index].model"
                :auc="modelRes[index].auc" :impute="modelRes[index].impute" :origin="originData" :index="index"
                type="impute" />
            </div>
          </div>
        </Spin>
      </div>
    </div>
    <div class="repair">
      <div class="instance-overview" id="repair-instance-overview">
          <svg id="repair_overview"></svg>
      </div>
      <div class="detail-card">
        <div class="detail-card-title">数据修正</div>
        <div class="detail-card-description">
          <span>当前修正情况</span>
          <Button v-if="detailVariable !== ''" size="small" shape="round" style="margin-left: 10px">
            {{ detailVariable }}
          </Button>
          <Button v-if="detailRepairDate !== ''" size="small" shape="round" style="margin-left: 10px">
            {{ detailRepairDate }}
          </Button>
          <Button 
            size="small" 
            shape="round" 
            style="margin-left: 10px" 
            :icon="h(LineChartOutlined)"
            @click="toggleEditMode('r', 'svg_container_repair')"
            :disabled="!originData2.length"
          >{{ editModeRepair ? '停止绘制' : '绘制修正曲线' }}</Button>
          <Button 
            size="small" 
            shape="round" 
            style="margin-left: 10px" 
            :icon="h(SaveOutlined)"
            @click="handleSaveRepairResult" 
            :loading="saveRepairLoading"
            :disabled="!sketchData2.length"
          >保存结果</Button>
        </div>
        <div class="svg_container" style="margin: 15px 0">
          <Spin :spinning="chartRepairSpinning">
            <svg id="svg_container_repair"></svg>
          </Spin>
        </div>
        <div class="detail-card-description">
          <span>推荐修正结果</span>
        </div>
        <Spin :spinning="modelRepairSpinning">
          <div class="models-container" v-if="modelRes2.length > 0">
            <div class="model" v-for="(item, index) in 3" :key="index" @click="handleModelClick(modelRes2, index, 'r')">
              <ModelResult v-if="modelRes2.length > 0 && modelRes2[index]" :model="modelRes2[index].model"
                :auc="modelRes2[index].auc" :impute="modelRes2[index].impute" :origin="originData2" :index="index"
                type="repair" />
            </div>
          </div>
        </Spin>
      </div>
    </div>
  </div>
  </div>
  

  
</template>
<script setup>
import { ref, computed, h  } from 'vue'
// import type { SelectProps } from 'ant-design-vue'
import { reqImpute, reqRepair, reqStationData, reqStationChart, reqStationInfo, reqSaveImputeResult } from '@/api/index'
import { LineChartOutlined, SaveOutlined } from '@ant-design/icons-vue'
import * as d3 from "d3"
import ModelResult from '@/components/ModelResult.vue'
import List from '../../components/List.vue'
import { Select, DatePicker, Spin, Button, Switch, message } from 'ant-design-vue'
import { STATIONS, STATUS_COLORS } from '@/utils/constants';
import { useStore } from 'vuex';
import dayjs from 'dayjs'
const { state, commit } = useStore();
const tooltip = ref(null);

let stationData = ref([])
let startDate = ref('')
let endDate = ref('')
// 模型结果
let modelRes = ref([])
let modelRes2 = ref([])

// 绘制原始chart与sketched chart
let originData = ref([])
let originData2 = ref([])
let sketchData = ref([])
let sketchData2 = ref([])

// 控制编辑模式
let editModeImpute = ref(false)
let editModeRepair = ref(false)

let detailColumns = ref(['err_rate', 'missing_rate'])

// 填补详情信息
let detailVariable = ref('')
let detailImputeDate = ref('')
let detailRepairDate = ref('')



// 控制loading效果
let selectorSpinning = ref(false)
let chartImputeSpinning = ref(false)
let chartRepairSpinning = ref(false)
let modelImputeSpinning = ref(false)
let modelRepairSpinning = ref(false)

// 待填补信息
let svgData = ref()
let dateIndex = ref()

// 零电流相关
let isImputed = ref(false) // 是否填补(默认不填)
let allValuesZero = ref(false)

// 存储当前选中的设备信息
const currentDevice = ref('')  // 存储 deviceId

const imputeZero = async (checked) => {
  if (checked) {
    modelImputeSpinning.value = true
    try {
      let imputeModel = await reqImpute(
        svgData.value[dateIndex.value]['date'], 
        stationSelected.value, 
        currentDevice.value, 
        typeSelected.value
      )
      modelRes.value = imputeModel
      message.success('零电流填补模型加载成功')
    } catch (error) {
      message.error('零电流填补模型加载失败')
    } finally {
      modelImputeSpinning.value = false
    }
  } else {
    modelRes.value = []
  }
}

/**
 * 切换编辑模式
 *
 * @param editMode 编辑模式，可选值为 'i' 或 'r'
 * @param svgId SVG元素的ID
 * @returns 无返回值
 */
const toggleEditMode = (editMode, svgId) => {
  const svgElement = document.getElementById(svgId)
  try {
    if (editMode == 'i') {
      editModeImpute.value = !editModeImpute.value
      if (editModeImpute.value) {
        svgElement.classList.add('edit-cursor')
        message.info('已进入填补曲线绘制模式')
      } else {
        svgElement.classList.remove('edit-cursor')
        message.info('已退出填补曲线绘制模式')
      }
    }
    if (editMode == 'r') {
      editModeRepair.value = !editModeRepair.value
      if (editModeRepair.value) {
        svgElement.classList.add('edit-cursor')
        message.info('已进入修正曲线绘制模式')
      } else {
        svgElement.classList.remove('edit-cursor')
        message.info('已退出修正曲线绘制模式')
      }
    }
  } catch (error) {
    message.error('切换编辑模式失败')
  }
}

/**
 * 绘制日期概览图
 *
 * @param svgId svg元素的id
 * @param svgData svg数据
 * @param attrName 属性名
 * @param variable 变量
 * @param filePath 文件路径
 */
const drawDateOverview = (svgId, svgData, attrName) => {
  d3.selectAll(svgId).selectAll("*").remove();

  const svgSelection = d3.select(svgId);
  const container = svgSelection.node().parentNode;

  if (!container) return;

  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  svgSelection.attr('width', containerWidth).attr('height', containerHeight);

  const dates = svgData.length;
  if (dates === 0) return;

  const padding = 10;
  const rectGap = 2;

  const rectWidth = Math.max(0, (containerWidth - 2 * padding - (dates - 1) * rectGap) / dates);
  const rectHeight = Math.max(0, containerHeight - 2 * padding);
  
  const xOffset = padding;
  const yOffset = padding;
  
  let modelType = svgId.includes('impute') ? 'i' : 'r'

  for (let i = 0; i < dates; i++) {
    let attrValue = svgData[i][attrName];
    
    let fillColor;
    if (attrValue === 0) {
      fillColor = STATUS_COLORS.LOW;
    } else if (attrValue > 0 && attrValue <= 3) {
      fillColor = STATUS_COLORS.MEDIUM;
    } else {
      fillColor = STATUS_COLORS.HIGH;
    }
    
    svgSelection.append("rect")
      .attr("x", xOffset + i * (rectWidth + rectGap))
      .attr("y", yOffset)
      .attr('rx', 2)
      .attr('ry', 2)
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("fill", fillColor)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr('id', modelType + '_' + i)
      .attr('class', modelType + '_rect')
      .on('mouseover', function (/* event */) {
        d3.select(this)
          .attr('stroke', '#ADFFA0');

        const tooltipEl = tooltip.value;
        if (tooltipEl) {
          tooltipEl.innerHTML = svgData[i]['date'].split(' ')[0];
          tooltipEl.style.opacity = 1;
        }
      })
      .on('mousemove', function (event) {
        const tooltipEl = tooltip.value;
        if (tooltipEl) {
          tooltipEl.style.left = (event.pageX + 15) + 'px';
          tooltipEl.style.top = (event.pageY + 15) + 'px';
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', 'black');
        
        const tooltipEl = tooltip.value;
        if (tooltipEl) {
          tooltipEl.style.opacity = 0;
        }
      })
      .on("click", async function () {
        const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        dateIndex.value = i;
        isImputed.value = false;
        if (modelType == 'i') {
          chartImputeSpinning.value = true;
          modelRes.value = [];
          let imputeData = await reqStationChart(
            svgData[i]['date'], 
            stationSelected.value,
            currentDevice.value,
            typeSelected.value
          );
          detailImputeDate.value = svgData[i]['date'].split(' ')[0];
          originData.value = imputeData;
          allValuesZero.value = imputeData.every(d => d.value === 0);
          sketchData.value = Array.from(imputeData);
          imputeData.forEach(d => {
            d.date = parseTime(d.date);
          });
          drawSvg('#svg_container_impute', imputeData, sketchData);
          chartImputeSpinning.value = false;

          if (allValuesZero.value == false) {
            modelImputeSpinning.value = true;
            let imputeModel = await reqImpute(
              svgData[i]['date'],
              stationSelected.value,
              currentDevice.value,
              typeSelected.value
            );
            modelRes.value = imputeModel;
            modelImputeSpinning.value = false;
          }
        }
        if (modelType == 'r') {
          chartRepairSpinning.value = true;
          modelRepairSpinning.value = true;
          modelRes2.value = [];
          let repairData = await reqStationChart(
            svgData[i]['date'],
            stationSelected.value,
            currentDevice.value,
            typeSelected.value
          );
          detailRepairDate.value = svgData[i]['date'].split(' ')[0];
          originData2.value = repairData;
          sketchData2.value = Array.from(repairData);
          repairData.forEach(d => {
            d.date = parseTime(d.date);
          });
          drawSvg('#svg_container_repair', repairData, sketchData2);
          chartRepairSpinning.value = false;
          let repairModel = await reqRepair(
            svgData[i]['date'],
            stationSelected.value,
            currentDevice.value,
            typeSelected.value
          );
          modelRes2.value = repairModel;
          modelRepairSpinning.value = false;
        }
      });
  }
}

/**
 * 绘制SVG图表
 *
 * @param svgId SVG元素ID
 * @param svgData SVG数据
 * @param sketchLine 描边数据
 * @returns 无返回值
 */
const drawSvg = (svgId, svgData, sketchLine) => {
  try {
    d3.selectAll(svgId).selectAll("*").remove()
    const container = document.querySelector('.svg_container');
    const width = container.offsetWidth - 20;
    const height = container.offsetHeight - 20;  // 动态获取容器高度，减去内边距
    
    // 确保数据有效
    if (!svgData || svgData.length === 0) {
      console.error('无效的图表数据')
      return
    }
    
    // 检查数据中的日期格式
    const hasValidDates = svgData.every(d => d.date instanceof Date && !isNaN(d.date.getTime()))
    if (!hasValidDates) {
      console.error('图表数据包含无效日期')
      return
    }
    
    const marginTop = 20
    const marginRight = 20
    const marginBottom = 20
    const marginLeft = 40

    // Declare the x (horizontal position) scale.
    const x = d3.scaleTime(d3.extent(svgData, d => d.date), [marginLeft, width - marginRight])

    // 计算y轴范围，考虑sketchLine数据
    let yMin = d3.min(svgData, d => d.value)
    let yMax = d3.max(svgData, d => d.value)
    
    // 如果有填补数据，考虑其范围
    if (sketchLine.value && sketchLine.value.length > 0) {
      const sketchMin = d3.min(sketchLine.value, d => d.value)
      const sketchMax = d3.max(sketchLine.value, d => d.value)
      
      if (sketchMin !== undefined && sketchMin < yMin) {
        yMin = sketchMin
      }
      
      if (sketchMax !== undefined && sketchMax > yMax) {
        yMax = sketchMax
      }
    }
    
    // 确保y轴范围有效
    if (yMin === undefined || yMax === undefined || isNaN(yMin) || isNaN(yMax)) {
      yMin = 0
      yMax = 1
    }
    
    // 添加一点空间，使图表不会紧贴边界
    const yPadding = (yMax - yMin) * 0.1
    yMin = Math.min(yMin - yPadding, 0) // 确保包含0
    yMax = yMax + yPadding

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear([yMin, yMax], [height - marginBottom, marginTop])

    // Declare the line generator.
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .defined(d => d && d.date instanceof Date && !isNaN(d.date.getTime()) && typeof d.value === 'number' && !isNaN(d.value))

    const svg = d3.select(svgId)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      
    const formatTime = d3.timeFormat("%H:%M")
    // Add the x-axis.
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickFormat(formatTime).tickSizeOuter(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke-opacity", 0))
      .call(g => g.selectAll(".tick line").clone()
        .attr("y2", - (height - marginTop - marginBottom))
        .attr("stroke-opacity", 0.1))

    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(6))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke-opacity", 0))
      .call(g => g.selectAll(".tick line").clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
        .attr("x", 10 - marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("I/A"))

    // 首先绘制模型填补结果（绿色虚线）
    if (sketchLine.value && sketchLine.value.length > 0) {
      try {
        const sketchPath = line(sketchLine.value)
        if (sketchPath) {
          svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "#61FF00")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", '5,5,5')
            .attr("d", sketchPath)
        } else {
          console.error('生成填补线路径失败')
        }
      } catch (error) {
        console.error('绘制填补线失败:', error)
      }
    } else {
      console.log('没有填补数据可绘制')
    }

    // 然后绘制原始数据（蓝色实线），确保它在填补结果上方
    try {
      const originPath = line(svgData)
      if (originPath) {
        svg.append("path")
          .attr("fill", "none")
          .attr("stroke", "#81ABFC")
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 2)
          .attr("d", originPath)
      }
    } catch (error) {
      console.error('绘制原始数据线失败:', error)
    }

    // 添加点击事件处理
    svg.on("click", function (event) {
      if (svg.classed("edit-cursor")) {
        const [xPos, yPos] = d3.pointer(event)
        const xDate = x.invert(xPos)
        const yValue = y.invert(yPos)
        const roundedHour = xDate.getMinutes() <= 30 ? xDate.getHours() : xDate.getHours() + 1
        const newDate = new Date(xDate)
        newDate.setHours(roundedHour, 0, 0, 0)
        const newDataPoint = { date: newDate, value: yValue }
        const index = sketchLine.value.findIndex(d => d.date.getTime() === newDate.getTime())
        if (index > -1) {
          sketchLine.value[index] = newDataPoint
        } else {
          sketchLine.value.push(newDataPoint)
          sketchLine.value.sort((a, b) => a.date - b.date)
        }
        drawSvg(svgId, svgData, sketchLine)
      }
    })
  } catch (error) {
    console.error('绘制SVG图表失败:', error)
  }
}

/**
 * 选择具体变量分析时触发，绘制dateOverview
 *
 * @param chosenSeries 当前选择的组串
 * @returns 无返回值，异步操作
 */
const handleModel = async (chosenSeries) => {
  if (!chosenSeries) {
    message.warning('请选择要分析的变量',3)
    return
  }

  const hide = message.loading('正在加载', 0);
  
  try {
    // 清除之前的结果
    d3.selectAll("#svg_container_impute").selectAll("*").remove()  // 清除填补容器
    d3.selectAll("#svg_container_repair").selectAll("*").remove()  // 清除修正容器
    d3.selectAll("#impute_overview").selectAll("*").remove()  // 清除填补概览
    d3.selectAll("#repair_overview").selectAll("*").remove()  // 清除修正概览
    
    modelRes.value = []
    modelRes2.value = []
    detailVariable.value = ''
    detailImputeDate.value = ''
    detailRepairDate.value = ''
    originData.value = []
    originData2.value = []
    sketchData.value = []
    sketchData2.value = []

    let pathArr = chosenSeries.split(",")
    let deviceId = pathArr.slice(1).join("-")
    currentDevice.value = deviceId
    
    let overviewData = await reqStationData(
      stationSelected.value, 
      deviceId, 
      startDate.value, 
      endDate.value, 
      typeSelected.value
    )
    
    svgData.value = overviewData
    drawDateOverview('#impute_overview', overviewData, 'missing_count')
    drawDateOverview('#repair_overview', overviewData, 'error_count')
    message.success('变量数据加载成功')
  } catch (error) {
    message.error('加载变量数据失败，请稍后重试')
  } finally {
    // 无论请求成功还是失败，都关闭加载提示
    hide();
  }
}

/**
 * 处理模型结果点击事件，将模型填补结果绘制到SVG图表上
 *
 * @param modelRes 模型结果
 * @param index 当前点击的索引
 * @param type 点击类型（'i'或者'r'）
 * @returns 无返回值
 */
const handleModelClick = (modelRes, index, type) => {
  try {
    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S")
    
    if (type == 'i') {
      // 深拷贝数据，避免修改原始数据
      sketchData.value = JSON.parse(JSON.stringify(modelRes[index]['impute']))
      
      // 确保日期格式正确
      sketchData.value.forEach(d => {
        if (typeof d.date === 'string') {
          d.date = parseTime(d.date)
        }
      })
      
      // 过滤无效数据
      sketchData.value = sketchData.value.filter(d => 
        d && d.date instanceof Date && !isNaN(d.date.getTime()) && 
        typeof d.value === 'number' && !isNaN(d.value)
      )
      
      drawSvg('#svg_container_impute', originData.value, sketchData)
      message.success('已应用填补模型结果')
    }
    else if (type == 'r') {
      // 深拷贝数据，避免修改原始数据
      sketchData2.value = JSON.parse(JSON.stringify(modelRes[index]['impute']))
      
      // 确保日期格式正确
      sketchData2.value.forEach(d => {
        if (typeof d.date === 'string') {
          d.date = parseTime(d.date)
        }
      })
      
      // 过滤无效数据
      sketchData2.value = sketchData2.value.filter(d => 
        d && d.date instanceof Date && !isNaN(d.date.getTime()) && 
        typeof d.value === 'number' && !isNaN(d.value)
      )
      
      drawSvg('#svg_container_repair', originData2.value, sketchData2)
      message.success('已应用修正模型结果')
    }
  } catch (error) {
    message.error('应用模型结果失败')
    console.error(error)
  }
}

const stationOptions = STATIONS
const stationSelected = computed(() => state.globalVar.selectedStation);


const typeSelected = ref()
const typeOptions = ref([
  {
    value: 0,
    label: '电流'
  },
  {
    value: 1,
    label: '电压'
  }
])

const columns = [
  {
    title: '设备编号',
    dataIndex: 'name',
    key: 'name'
  },
  // {
  //   title: '异常率',
  //   dataIndex: 'err_rate',
  //   key: 'err_rate',
  //   width: 80,
  // },
  {
    title: '异常程度',
    dataIndex: 'missing_rate',
    key: 'missing_rate',
    width: 150,
  }
]

// 检查所有选择器的值是否都已选择
const checkAllSelected = () => {
  return stationSelected.value && startDate.value && endDate.value && typeSelected.value !== undefined
}

// 清除之前的结果
const clearPreviousResults = () => {
  d3.selectAll("#repair_overview").selectAll("*").remove()
  d3.selectAll("#impute_overview").selectAll("*").remove()
  d3.selectAll("#svg_container_impute").selectAll("*").remove()
  d3.selectAll("#svg_container_repair").selectAll("*").remove()
  modelRes.value = []
  modelRes2.value = []
  detailVariable.value = ''
  detailImputeDate.value = ''
  detailRepairDate.value = ''
  originData.value = []
  originData2.value = []
  sketchData.value = []
  sketchData2.value = []
}

// 获取数据的统一函数
const fetchData = async () => {
  if (!checkAllSelected()) return
  
  selectorSpinning.value = true
  clearPreviousResults()
  
  try {
    let infoRes = await reqStationInfo(stationSelected.value, startDate.value, endDate.value, typeSelected.value)
    stationData.value = infoRes.station_info  
  } catch (error) {
    message.error('获取数据失败，请稍后重试')
  } finally {
    selectorSpinning.value = false
  }
}

// 监听电站选择变化
const onStationChange = (station) => {
  commit("globalVar/setSelectedStation", station)
  fetchData()
}

// 监听日期变化
const onDateChange = (date, dateString) => {
  if (!date) {
    startDate.value = ''
    endDate.value = ''
    return
  }
  // 结束日期为选中日期
  endDate.value = dateString
  // 开始日期为选中日期减去7天
  startDate.value = dayjs(date).subtract(7, 'day').format('YYYY-MM-DD')
  fetchData()
}

// 监听变量类型变化
const onTypeChange = () => {
  fetchData()
}

const saveLoading = ref(false)

// 添加保存结果的处理函数
const handleSaveResult = async () => {
  if (saveLoading.value) return
  saveLoading.value = true
  
  try {
    // 构造要发送的数据对象
    const saveData = {
      stationName: stationSelected.value,    // 场站名称
      deviceId: currentDevice.value,         // 设备ID
      variableType: typeSelected.value,      // 变量类型
      date: detailImputeDate.value,         // 填补日期
      imputeData: sketchData.value.map(item => item.value)  // 只传递值的数组
    }

    
    const res = await reqSaveImputeResult(saveData)
    
    if (res.code === 200) {
      message.success('保存成功！')
    } else {
      message.error('保存失败')
    }
  } catch (error) {
    message.error('保存失败，请稍后重试')
  } finally {
    saveLoading.value = false
  }
}

// 添加修正结果保存的loading状态
const saveRepairLoading = ref(false)

// 添加修正结果保存的处理函数
const handleSaveRepairResult = async () => {
  if (saveRepairLoading.value) return
  saveRepairLoading.value = true
  
  try {
    // 构造要发送的数据对象
    const saveData = {
      stationName: stationSelected.value,    // 场站名称
      deviceId: currentDevice.value,         // 设备ID
      variableType: typeSelected.value,      // 变量类型
      date: detailRepairDate.value,         // 修正日期
      imputeData: sketchData2.value.map(item => item.value)  // 使用修正数据
    }

    
    const res = await reqSaveImputeResult(saveData)
    
    if (res.code === 200) {
      message.success('修正结果保存成功！')
    } else {
      message.error('修正结果保存失败')
    }
  } catch (error) {
    message.error('修正结果保存失败，请稍后重试')
  } finally {
    saveRepairLoading.value = false
  }
}


</script>
<style scoped lang="scss">
.repair-view {
  width: 100%;
  height: 100%;
}

.tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  pointer-events: none;
  z-index: 999;
  transition: opacity 0.2s ease;
}

.selector {
  height: 10%;
  width: 100%;
  display: flex;
  align-items: center;
}

.selector-item {
  height: 60%;
  margin-right: 10px;
}

.station-select {
  width: 18%;
}

.date-picker {
  width: 15%;
  height: 6vh;
}

.type-select {
  width: 15%;
}

:deep(.ant-select-selector) {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.ant-switch-checked) {
  background-color: #3C49C2;
}

.content {
  display: flex;
  flex-direction: row;
  height: 90%;
  width: 100%;
  padding-bottom: 10px;
  overflow-y: hidden;
  overflow-x: hidden;
}

.table {
    width: 26%;
    height: 100%;
    background-color: #141414;
    border-radius: 10px;
  }
  :deep(.ant-spin-nested-loading) {
    height: 100%;
  }
  :deep(.ant-spin-container) {
    height: 100%;
  }

.impute, .repair {
  width: 37%;
  padding-left: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.instance-overview {
  height: 5vh;
  width: 100%;
  background-color: #141414;
  border-radius: 10px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.detail-card {
  flex: 1;
  background: #141414;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.detail-card-title {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.detail-card-description {
  padding: 10px;
  flex-shrink: 0;
}

.detail-card-content {
  flex: 1;
  margin-bottom: 16px;
}

.models-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 5px;
  height: 35vh;  
  & > .model {
    flex-shrink: 0;
    min-height: 90px;
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #141414;
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
    
    &:hover {
      background: #555;
    }
  }
}

.model {
  flex-shrink: 0;
}

.svg_container {
  height: 30vh;       
  width: 100%;
  margin: 15px 0;
  background-color: #141414;
  border-radius: 4px;
  flex-shrink: 0;
}

/* 确保svg不会自动调整大小 */
.svg_container svg {
  width: 100%;
  height: 100%;
  display: block; // 防止不必要的空白
}

.edit-cursor {
  cursor: crosshair;
}
</style>