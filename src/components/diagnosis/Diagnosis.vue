<template>
  <!-- <div class="diagnosis-container"> -->
  <div class="selector-container">
    <Select
      placeholder="请选择电站"
      ref="select1"
      v-model:value="station_selected"
      class="selector-item station-select"
      :options="station_options"
    />
    <!-- <RangePicker format="YYYY-MM-DD 00:00:00" :placeholder="['开始时间', '结束时间']" v-model:value="date" @change="onRangeChange"
            class="selector-item date-picker" /> -->
    <DatePicker class="selector-time" :value="dayjs(selectedDate)" @change="onDateChange" />
    <Select
      placeholder="请选择参数"
      ref="select2"
      v-model:value="extra_selected1"
      class="selector-item type-select"
      :options="extra_options1"
    />
    <Select
      placeholder="请选择参数"
      ref="select3"
      v-model:value="extra_selected2"
      class="selector-item type-select"
      :options="extra_options2"
    />
  </div>
  <div class="main-content">
    <!-- <div class="box">
                <List />
            </div> -->
    <List
      class="box"
      :title="'劣化根因总览'"
      :columns="[
        {
          title: '组件名',
          dataIndex: 'name',
          key: 'name'
        },
        {
          title: '缺陷类型',
          dataIndex: 'anomaly_type',
          key: 'anomaly_type',
          align: 'right'
        }
      ]"
      :data="diagnosisListData"
      :detailColumnCount="1"
      :handleModel="handleModel"
    />

    <div class="box">
      <div class="current-data">
        <div class="data-header">
          <h4>电气量诊断结果</h4>
        </div>
        <CurrentData
          :index="diagnosisData.index"
          :xLabel="diagnosisData.xLabel"
          :targetData="diagnosisData.currentTargetData"
          :assistData="diagnosisData.currentAssistData"
        />
      </div>
      <div class="fault-statistics">
        <div class="statistics-header">
          <h5>故障概率统计</h5>
        </div>

        <div class="statistics-content">
          <div
            v-for="(fault, index) in diagnosisData.faultData"
            :key="index"
            class="result-fault-item"
          >
            <span class="ordinal">{{ getOrdinal(index + 1) }}</span>
            <div
              class="result-fault-type-item"
              :style="{ color: getColorByResultFaultType(fault.type) }"
            >
              <div
                class="dot"
                :style="{ backgroundColor: getColorByResultFaultType(fault.type) }"
              ></div>
              {{ fault.type }}
            </div>
            <span class="percentage" :style="{ color: getColorByResultFaultType(fault.type) }">{{
              formatPercentage(fault.percentage)
            }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="box">
      <div class="UAV-basic">
        <div class="basic-header">
          <h4>历史无人机巡检报告</h4>
        </div>
        <div class="basic-info">
          <div class="info-row">
            <div class="title-left">当前诊断组串</div>
            <div class="info-left">
              {{ diagnosisData.index }}
            </div>

            <div class="title-right">故障点温度</div>
            <div class="info-right">
              {{ diagnosisData.report_result.high }}
            </div>
          </div>
          <div class="info-row">
            <div class="title-left">无人机巡检位置</div>
            <div class="info-left">
              {{ diagnosisData.report_result.panelName }}
            </div>
            <div class="title-right">平均温度</div>
            <div class="info-right">
              {{ diagnosisData.report_result.averageTemperature }}
            </div>
          </div>
          <div class="info-row">
            <div class="title-left">GPS(东经, 北纬)</div>
            <div class="info-left">
              {{ diagnosisData.report_result.GPS }}
            </div>
            <div class="title-right">温差</div>
            <div class="info-right">
              {{ diagnosisData.report_result.temperatureDifference }}
            </div>
          </div>

          <div class="info-row-high">
            <div class="title-left">
              结论
              <div class="fault-type">
                <div
                  v-if="diagnosisData.report_result.faultType"
                  :style="{
                    color: getColorByReportFaultType(diagnosisData.report_result.faultType)
                  }"
                  class="fault-type-item"
                >
                  <div
                    class="dot"
                    :style="{
                      backgroundColor: getColorByReportFaultType(
                        diagnosisData.report_result.faultType
                      )
                    }"
                  ></div>
                  {{ diagnosisData.report_result.faultType }}
                </div>
              </div>
            </div>
            <div class="info-left">
              {{ diagnosisData.report_result.faultInfo }}
            </div>
          </div>
        </div>
      </div>
      <div class="UAV-pic">
        <div class="pic-box">
          <div class="box-header">
            <h5>可见光图片</h5>
          </div>
          <div class="box-pic">
            <img :src="rgbImageURL" alt="可见光照片" />
          </div>
        </div>
        <div class="pic-box">
          <div class="box-header">
            <h5>红外线图片</h5>
          </div>
          <div class="box-pic">
            <img :src="irImageURL" alt="红外线照片" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- </div> -->
</template>

<script setup>
import { ref, watch } from 'vue'

import CurrentData from './CurrentData.vue'
// import FaultStatistics from './FaultStatistics.vue';
import List from '../List.vue'
import { Select, DatePicker } from 'ant-design-vue'
import dayjs from 'dayjs'
import axios from 'axios'
// import { createRequire } from 'module';
// import process from 'process';
// import * as Minio from 'minio';
import { reqDiagnosisList, reqDiagnosisString, reqOssCredentials } from '../../api/index.js'
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

const extra_selected1 = ref()
const extra_selected2 = ref()
const extra_options1 = ref([
  {
    value: 'original',
    label: '源数据'
  },
  {
    value: 'GEO',
    label: '排除地理因素'
  },
  {
    value: 'GUI',
    label: '排除光照因素'
  }
])

const extra_options2 = ref([
  {
    value: 'day',
    label: '天'
  },
  {
    value: 'hour',
    label: '小时'
  },
  {
    value: 'hourMerge',
    label: '小时/平均'
  }
])

const onDateChange = (date) => {
  if (!date || !dayjs.isDayjs(date)) {
    console.error('无效的日期:', date)
    return
  }

  const formattedDate = date.format('YYYY-MM-DD')
  // console.log('选择的日期:', formattedDate);

  selectedDate.value = formattedDate
  // console.log(selectedDate.value);
}

watch(extra_selected2, (newVal) => {
  if (
    newVal !== undefined &&
    station_selected.value !== undefined &&
    selectedDate.value !== '' &&
    extra_selected1.value !== undefined
  ) {
    getDiagnosisList()
  }
})

watch(extra_selected1, (newVal) => {
  if (
    newVal !== undefined &&
    station_selected.value !== undefined &&
    selectedDate.value !== '' &&
    extra_selected2.value !== undefined
  ) {
    getDiagnosisList()
  }
})

watch(selectedDate, (newVal) => {
  if (
    newVal !== '' &&
    station_selected.value !== undefined &&
    extra_selected1.value !== undefined &&
    extra_selected2.value !== undefined
  ) {
    getDiagnosisList()
  }
})

const station_selected = ref()
const station_options = ref([
  {
    value: 'daxue',
    label: '大峃'
  },
  {
    value: 'tangyun',
    label: '唐云'
  },
  {
    value: 'tangjing',
    label: '唐景'
  },
  {
    value: 'datu',
    label: '大涂'
  }
])

watch(station_selected, (newVal) => {
  if (
    newVal !== undefined &&
    extra_selected1.value !== undefined &&
    selectedDate.value !== '' &&
    extra_selected2.value !== undefined
  ) {
    getDiagnosisList()
  }
})

let diagnosisListData = ref()

const getDiagnosisList = async () => {
  let onlydate = selectedDate.value

  let tempDiagnosisList = await reqDiagnosisList(
    station_selected.value,
    onlydate,
    extra_selected1.value,
    extra_selected2.value
  )

  diagnosisListData.value = tempDiagnosisList
}




let diagnosisData = ref({
  index: '',
  xLabel: ['00-00', '00-00', '00-00', '00-00', '00-00', '00-00', '00-00'],
  currentTargetData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  currentAssistData: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  faultData: [
    {
      type: '正常',
      percentage: 0
    },
    {
      type: '热斑',
      percentage: 0
    },
    {
      type: '遮挡',
      percentage: 0
    },
    {
      type: '二极管故障/开路/断路/0电流',
      percentage: 0
    },
    {
      type: '积灰',
      percentage: 0
    }
  ],
  report_result: {
    faultType: '',
    high: '',
    panelName: '',
    faultInfo: '',
    averageTemperature: '',
    temperatureDifference: '',
    taskId: '',
    zoneId: '',
    GPS: '',
    irImage: '',
    rgbImage: ''
  }
})

// variables and functions for fetching image
const irImageURL = ref()
const rgbImageURL = ref()
const imageToken = ref('')

const fetchImageToken = async () => {
  const url = "http://api1.zklf-tech.com/api/auth/oauth/token?username=dtzhejiang&password=zkYs!23&grant_type=password&client_id=client-app&client_secret=123456&systemType=INSPECTION_SYSTEM&loginType=2&domain=yweos.zklf-tech.com";
  try {
    const response = await axios.get(url);
    imageToken.value = response.data.data.tokenHead + response.data.data.token;
  } catch (error) {
    console.error("获取图片Token失败", error);
  }
}

const fetchImageURL = async (zoneid, taskid, ir_image, rgb_image) => {
  let url = "http://api1.zklf-tech.com/api/inspection/sys/common/compress";
  let ir_payload = {
    bucketName: "solar",
    compressRatio: 0.1,
    objectKey: "pic/" + zoneid + "/" + taskid + "/ir/" + ir_image
  }
  let rgb_payload = {
    bucketName: "solar",
    compressRatio: 0.1,
    objectKey: "pic/" + zoneid + "/" + taskid + "/rgb/" + rgb_image
  }

  try {
    const ir_response = await axios.post(url, ir_payload, {
      headers: {
        Authorization: imageToken.value
      },
      responseType: "blob"
    });
    const rgb_response = await axios.post(url, rgb_payload, {
      headers: {
        Authorization: imageToken.value
      },
      responseType: "blob"
    });

    if (ir_response.status === 200 && rgb_response.status === 200) {
      const ir_reader = new FileReader();
      const rgb_reader = new FileReader();
      ir_reader.onload = () => {
        irImageURL.value = ir_reader.result;
      };
      rgb_reader.onload = () => {
        rgbImageURL.value = rgb_reader.result;
      };
      ir_reader.readAsDataURL(ir_response.data);
      rgb_reader.readAsDataURL(rgb_response.data);
    } else {
      console.error("获取图片URL失败", ir_response, rgb_response);
    }

  } catch (error) {
    console.error("获取图片URL失败", error);
  }
}

const fetchImage = async (zoneid, taskid, ir_image, rgb_image) => {
  await fetchImageToken();
  await fetchImageURL(zoneid, taskid, ir_image, rgb_image);
}
// end of fetching image


const handleModel = async (data) => {
  let onlydate = selectedDate.value

  const ids = data.split(',')

  const box_id = ids[1]
  const inverter_id = ids[2]
  const string_id_with_text = ids[3]

  const string_id_match = string_id_with_text.match(/\d+/)
  const string_id = string_id_match ? string_id_match[0] : null

  let oss = await reqOssCredentials()
  console.log('oss', oss)

  console.log('after require minio')

  let diagnosis_string = await reqDiagnosisString(
    station_selected.value,
    onlydate,
    box_id,
    inverter_id,
    string_id
  )

  const timeSeriesResult = diagnosis_string.time_series_result

  const faultDataArr = []

  for (const key in timeSeriesResult) {
    const entry = timeSeriesResult[key]

    const [type, percentageStr] = entry.split(' ')
    const percentage = parseFloat(percentageStr) / 100

    const faultEntry = {
      type: type,
      percentage: percentage
      // targetData: Array(14).fill(0),
      // assistData: Array(14).fill(0),
    }

    faultDataArr.push(faultEntry)
  }
  // 处理时间戳
  const timestamps = diagnosis_string.timestamp
  const timestampArr = Array.from(
    new Set(
      timestamps.map((ts) => {
        const date = new Date(ts * 1000)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${month}-${day}`
      })
    )
  )

  diagnosisData.value = {
    index: `${box_id}-${inverter_id}-${string_id}`,
    xLabel:
      timestampArr.length > 0
        ? timestampArr
        : ['00-00', '00-00', '00-00', '00-00', '00-00', '00-00', '00-00'],
    currentTargetData:
      diagnosis_string.data.length > 0
        ? diagnosis_string.data
        : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    currentAssistData:
      diagnosis_string.assistdata.length > 0
        ? diagnosis_string.assistdata
        : [[3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4]],
    faultData: faultDataArr,
    report_result: diagnosis_string.report_result
  }

  // 获取可见光图片与红外线图片
  let zoneid = diagnosisData.value.report_result.zoneId
  let taskid = diagnosisData.value.report_result.taskId
  let ir_image = diagnosisData.value.report_result.irImage
  let rgb_image = diagnosisData.value.report_result.rgbImage
  await fetchImage(zoneid, taskid, ir_image, rgb_image)
}

const getColorByReportFaultType = (faultType) => {
  const reportFaultTypeColors = {
    固定设施遮挡: 'red',
    二极管故障: 'yellow',
    组串开路: '#74ffe7',
    草木遮挡: '#ff1d8e',
    表面破损: '#c7971e',
    表面污迹: 'green',
    组串短路: '#9a3cfa',
    内部缺陷: 'blue',
    组件异位: '#670000'
  }

  return reportFaultTypeColors[faultType] || 'white'
}

const formatPercentage = (value) => {
  return `${(value * 100).toFixed(0)}%`
}

const getOrdinal = (num) => {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const value = num % 100
  return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0])
}

const getColorByResultFaultType = (faultType) => {
  const resultFaultTypeColors = {
    正常: 'white',
    热斑: '#ff6f61',
    遮挡: '#6495ed',
    '二极管故障/开路/断路/0电流': '#fffacd',
    积灰: 'orange'
  }
  return resultFaultTypeColors[faultType] || 'white'
}
</script>

<style scoped>
#components-layout-demo-side .logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.logo-system {
  margin-top: 40px;
  margin-bottom: 30px;
  margin-left: 20px;
  display: flex;
  color: #e2e2e2;
  /* line-height: 0.3; */
}

.h2 {
  font-size: 16pt;
  font-weight: 600;
  margin-bottom: 5pt;
}

.h4 {
  font-size: 12pt;
  font-weight: 300;
  margin: 0;
}

.logo-system svg {
  height: 50px;
  margin-right: 20px;
}

.site-layout .site-layout-background {
  background: #484a50;
}

[data-theme='dark'] .site-layout .site-layout-background {
  background: #393c41;
}

.diagnosis-container {
  height: 100%;
  /* background-color: white; */
}

.ant-table-tbody > tr.ant-table-row:hover > td,
.ant-table-tbody > tr > td.ant-table-cell-row-hover {
  background: #484d50;
}

.ant-table-tbody>tr.ant-table-row:hover>td,
/* .select-container {
    height: 35px;
    display: flex;
} */
.selector-container {
  display: flex;
  align-items: center;
  height: 5%;
  gap: 1%;
}

.selector-item {
  height: 100%;
}

.station-select {
  width: 30%;
}

.date-picker {
  width: 30%;
}

.type-select {
  width: 15%;
}

:deep(.ant-select-selector),
:deep(.ant-picker) {
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
}

.main-content {
  display: flex;
  flex-direction: row;
  background-color: #484a50;
  height: 90%;
  /* padding: 0 15px; */

  .box {
    flex: 1;
    height: 100%;
    margin: 20px 5px 10px 5px;
    background-color: #141414;
    border-radius: 15px;
    color: #e2e2e2;
    padding: 15px 20px;
    /* height: 100%; */
    .fault-statistics {
      margin-top: 10px;
    }

    .UAV-basic {
      /* margin: 15px 20px; */
      height: 30%;
      /* background-color: red; */

      .info-row {
        display: flex;
        font-size: smaller;
        margin: 15px 0 40px 0;
        .title-left {
          width: 28%;
          /* text-align: left; */
        }

        .info-left {
          width: 40%;
          background-color: #484a50;
          border-radius: 8px;
          text-align: center;
        }

        .title-right {
          margin-left: 10px;
          width: 20%;
        }

        .info-right {
          width: 20%;
          background-color: #484a50;
          border-radius: 8px;
          text-align: center;
        }
      }

      .info-row-high {
        display: flex;

        height: 30px;
        font-size: smaller;
        align-items: center;

        .title-left {
          width: 35%;
          display: flex;
          justify-content: space-between;
        }

        .info-left {
          width: 65%;
          height: 30px;
          margin-left: 12px;
          line-height: 30px;
          background-color: #484a50;
          border-radius: 12px;
          text-align: center;
        }
      }
    }

    .UAV-pic {
      /* margin: 0 20px; */
      height: 65%;
      /* background-color: blue; */

      .pic-box {
        margin-top: 50px;
        .box-header {
          margin-bottom: 30px;
        }

        .box-pic {
          img {
            width: 100%;
            height: 150px;
          }
        }
      }
    }
  }
}
.fault-type {
  display: flex;
  align-items: center;
}

.fault-type-item {
  display: flex;
  align-items: center;
}

.dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 3px;
}

.statistics-content {
  font-size: 12px;
}
.result-fault-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  width: 100%;
}

.ordinal {
  flex: 0 0 20%;
  text-align: left;
}

.result-fault-type-item {
  display: flex;
  align-items: center;
  flex: 0 0 60%;
}
.percentage {
  flex: 0 0 20%;
  text-align: right;
}
</style>
