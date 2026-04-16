import axios from 'axios'
import { mockRequest } from './mock'

// MOCK控制开关
const USE_MOCK = false

const request = axios.create({
  baseURL: 'http://localhost:31173',
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
    // 处理 mock 返回
    if (error.__MOCK__) {
      return await error.data
    }

    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default request
