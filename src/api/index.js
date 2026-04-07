// 是否使用 Mock 数据（开发阶段设为 true）
const USE_MOCK = true

// 真实后端地址（当 USE_MOCK = false 时使用）
const BASE_URL = 'http://localhost:31173'

export const API = {
  tasks: `${BASE_URL}/api/data-acquisition/tasks`,
  groups: `${BASE_URL}/api/file-configs/group`,
  configs: `${BASE_URL}/api/file-configs`
}

// 导入 Mock 数据
import { mockTasks, mockGroups, mockConfigs } from './mock'

// 模拟网络延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

export const fetchTasks = async () => {
  if (USE_MOCK) {
    await delay()
    return mockTasks
  }
  return fetch(API.tasks).then(res => res.json())
}

export const fetchGroups = async () => {
  if (USE_MOCK) {
    await delay()
    return mockGroups
  }
  return fetch(API.groups).then(res => res.json())
}

export const fetchConfigs = async () => {
  if (USE_MOCK) {
    await delay()
    return mockConfigs
  }
  return fetch(`${API.configs}?all=true`).then(res => res.json())
}
