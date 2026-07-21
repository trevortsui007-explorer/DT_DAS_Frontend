import axios from 'axios'
import { mockRequest } from './mock'
const USE_MOCK = false
const API_BASE_URL_STORAGE_KEY = 'das_api_base_url'
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const getDefaultApiBaseUrl = () => DEFAULT_API_BASE_URL

export const getRuntimeApiBaseUrl = () => {
  try {
    return localStorage.getItem(API_BASE_URL_STORAGE_KEY) || ''
  } catch (err) {
    return ''
  }
}

export const getActiveApiBaseUrl = () => getRuntimeApiBaseUrl() || DEFAULT_API_BASE_URL

export const setRuntimeApiBaseUrl = (url) => {
  const normalizedUrl = String(url || '').trim()
  if (!normalizedUrl) return
  localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalizedUrl)
}

export const clearRuntimeApiBaseUrl = () => {
  localStorage.removeItem(API_BASE_URL_STORAGE_KEY)
}

// MOCK控制开关

const request = axios.create({
  baseURL: getActiveApiBaseUrl(),
  timeout: 15000
})

// ====================== 请求拦截 ======================
request.interceptors.request.use((config) => {
  config.baseURL = getActiveApiBaseUrl()

  if (USE_MOCK) {
    const mockRes = mockRequest(config)

    if (mockRes) {
      // 中断 axios，直接返回 mock
      return Promise.reject({
        __MOCK__: true,
        data: mockRes
      })
    }
  }
  return config
})

// ====================== 响应拦截 ======================
request.interceptors.response.use(
  (res) => res.data,
  async (error) => {
// 1. 处理请求拦截器里抛出的强制 Mock
    if (error.__MOCK__) {
      return await error.data
    }

    const { config, response } = error

    // 2. 核心逻辑：当返回 404 时，尝试匹配 Mock
    if (response && (response.status === 404 || response.status === 405)) {
      console.warn(`接口 ${config.url} ${response.status}，正在尝试降级至 Mock...`)

      const mockRes = mockRequest(config)
      if (mockRes) {
        console.log(`成功匹配 Mock 数据: ${config.url}`)
        return await mockRes // 直接返回 Mock 内容
      }

      console.error(`Mock 库中也未找到该接口: ${config.url}`)
    }

    // 3. 其他错误处理
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default request
