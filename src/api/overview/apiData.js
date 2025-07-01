import request from '@/utils/request'

const API = {
  GET_OVERVIEW_DATA: '/overview/overview-data', // 获取电站数据
}

export const getOverviewData = () => {
  return request.get(`${API.GET_OVERVIEW_DATA}`)
}

export default API
