/// <reference types="vite/client" />
import axios from 'axios'
import { getToken, removeToken } from './auth'
import router from '@/router'
import { message } from 'ant-design-vue'

//创建axios实例
let request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 500000,
})

//请求拦截器
request.interceptors.request.use((config) => {
  // 从localStorage获取token
  const token = getToken()
  // 如果token存在，则添加到请求头中
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

//响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          // 清除token
          removeToken()
          // 显示提示信息
          message.error('登录已过期，请重新登录')
          // 如果不是在登录页面，则跳转到登录页面
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
          break
        case 403:
          message.error('无权访问')
          break
        case 404:
          message.error('请求地址错误')
          break
        case 500:
          message.error('服务器出现问题')
          break
        default:
          message.error('网络错误')
      }
    }
    return Promise.reject(error)
  }
)

export default request