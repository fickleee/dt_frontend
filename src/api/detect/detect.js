import request from '@/utils/request'

const API = {
  GET_DIM_REDUCTION_DATA: '/detect/get-dim-reduction-data', // 获取降维数据
  GET_FILE_NAME_LIST: '/detect/get-file-name-list', // 获取组串列表
  GET_CURRENT_DATA: '/detect/get-current-data', // 获取电流数据
  PERFORM_DETECTION: '/detect/perform-detection', // 执行降维
  DETECT_ANOMALIES: '/detect/detect-anomalies', // 执行异常检测
  GET_ANOMALY_HISTORY: '/detect/get-anomaly-history', // 获取异常历史
  GET_IRRADIANCE_DATA: '/detect/get-irradiance-data', // 获取辐照数据
  GET_POWER_LOSS: '/detect/get-power-loss', // 获取功率损失数据
  GET_STRING_DIAGNOSIS: '/detect/get-string-diagnosis', // 获取组串诊断结果
  GET_STRING_UAV_IMAGES: '/detect/get-string-uav-images' // 获取组串无人机图像
}


export const getStringInfo = (date, station_name) => {
  return request.get(`${API.GET_FILE_NAME_LIST}?date=${date}&station_name=${station_name}`)
}
// 获取降维数据，异常历史，电流，辐照
export const getDimReductionData = (station_name,selectString, date) => {
  return request.get(`${API.GET_DIM_REDUCTION_DATA}?station_name=${station_name}&selectString=${selectString}&date=${date}`)
}
export const getAnomalyHistory = (station_name, selectString, date) => {
  return request.get(`${API.GET_ANOMALY_HISTORY}?station_name=${station_name}&selectString=${selectString}&date=${date}`)
}
export const getCurrentData = (station_name, inverter_name, date) => {
  return request.get(`${API.GET_CURRENT_DATA}?station_name=${station_name}&inverter_name=${inverter_name}&date=${date}`);
};
export const getIrradianceData = (station_name, date) => {
  return request.get(`${API.GET_IRRADIANCE_DATA}?station_name=${station_name}&date=${date}`)
}
//执行异常检测
export const performDetection = (station_name, date) => {
  return request.post(
    `${API.PERFORM_DETECTION}?station_name=${station_name}&date=${date}`
  )
}

export const detectAnomalies = (start_time, end_time) => {
  return request.post(`${API.DETECT_ANOMALIES}?start_time=${start_time}&end_time=${end_time}`)
}

// 获取组串功率损失数据
export const getPowerLoss = (station_name, selectString, date) => {
  return request.get(`${API.GET_POWER_LOSS}?station_name=${station_name}&selectString=${selectString}&date=${date}`)
}

// 获取组串诊断结果
export const getStringDiagnosis = (station_name, selectString, date) => {
  return request.get(`${API.GET_STRING_DIAGNOSIS}?station_name=${station_name}&selectString=${selectString}&date=${date}`)
}

// 获取组串无人机图像
export const getStringUavImages = (station_name, selectString, date) => {
  return request.get(`${API.GET_STRING_UAV_IMAGES}?station_name=${station_name}&selectString=${selectString}&date=${date}`)
}

export default API
