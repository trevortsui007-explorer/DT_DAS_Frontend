import axios from 'axios'
import { mockRequest } from './mock'

// MOCK控制开关
const USE_MOCK = false

const request = axios.create({
  baseURL: '', // http://localhost:31173
  timeout: 15000
})

// ====================== 请求拦截 ======================
request.interceptors.request.use((config) => {
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
    if (response && response.status === 404) {
      console.warn(`接口 ${config.url} 404，正在尝试降级至 Mock...`)

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
