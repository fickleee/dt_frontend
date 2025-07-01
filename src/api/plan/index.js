import request from '@/utils/request'
import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = {
  EXPORT_MAINTAIN_PLAN: '/plan/export/maintain', // 导出运维计划
  EXPORT_RUNTIME_PLAN: '/plan/export/runtime', // 导出运行计划
//   EXPORT_ALL_PLAN: '/plan/export', // 导出所有计划
  GET_PLAN_DATA: '/plan/data', // 获取计划数据
}

export const getPlanData = (station_name, process_date) => {
    
  return request.get(`${API.GET_PLAN_DATA}?station_name=${station_name}&process_date=${process_date}`)
}

export const exportMaintainPlan = (date, station_name) => {
  const token = getToken()
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
  
  return axios.get(`${import.meta.env.VITE_APP_BASE_API}${API.EXPORT_MAINTAIN_PLAN}?process_date=${date}&station_name=${station_name}`, {
    responseType: 'blob',
    timeout: 600000, // 10分钟超时
    headers
  })
}

export const exportRuntimePlan = (date, station_name) => {
  const token = getToken()
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
  
  return axios.get(`${import.meta.env.VITE_APP_BASE_API}${API.EXPORT_RUNTIME_PLAN}?process_date=${date}&station_name=${station_name}`, {
    responseType: 'blob',
    timeout: 600000, // 10分钟超时
    headers
  })
}

// export const exportAllPlan = (params) => {
//   return request.get(API.EXPORT_ALL_PLAN, { 
//     params,
//     responseType: 'blob'
//   })
// }

export default API