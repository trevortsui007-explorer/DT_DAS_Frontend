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

// ====================== 配置组 API ======================
export const createGroup = async (data) => {
  if (USE_MOCK) {
    await delay()
    // 模拟返回成功
    return { success: true, data: { id: Date.now(), ...data } }
  }
  return fetch(API.groups, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
}

export const updateGroup = async (id, data) => {
  if (USE_MOCK) {
    await delay()
    return { success: true }
  }
  return fetch(`${API.groups}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
}

export const deleteGroup = async (id) => {
  if (USE_MOCK) {
    await delay()
    return { success: true }
  }
  return fetch(`${API.groups}/${id}`, {
    method: 'DELETE'
  }).then(res => res.json())
}

export const toggleGroupStatus = async (id, isEnabled) => {
  if (USE_MOCK) {
    await delay()
    return { success: true }
  }
  // 注意后端 PATCH 接口可能需要 formdata，这里简化处理
  const formData = new FormData()
  formData.append('ids', id)
  formData.append('isEnabled', isEnabled)
  return fetch(`${API.groups}/status/`, {
    method: 'PATCH',
    body: formData
  }).then(res => res.json())
}

// ====================== 任务 API ======================
export const createTask = async (data) => {
  if (USE_MOCK) {
    await delay()
    return { success: true, data: { id: Date.now(), ...data } }
  }
  return fetch(API.tasks, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
}

export const updateTask = async (id, data) => {
  if (USE_MOCK) {
    await delay()
    return { success: true }
  }
  return fetch(`${API.tasks}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
}

// 检查表是否存在
export const checkTableExists = (tableName) => {
  if (USE_MOCK) {
    return Promise.resolve({ exists: false, columns: [] })
  }
  return fetch(`/api/table/check?tableName=${tableName}`).then(res => res.json())
}

// 获取表结构
export const getTableSchema = (tableName) => {
  if (USE_MOCK) {
    return Promise.resolve({ columns: [] })
  }
  return fetch(`/api/table/schema?tableName=${tableName}`).then(res => res.json())
}

// 创建表
export const createTable = (tableName, columns) => {
  if (USE_MOCK) {
    return Promise.resolve({ success: true })
  }
  return fetch(`/api/table/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableName, columns })
  }).then(res => res.json())
}
