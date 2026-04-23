// src/api/index.js
import request from './request'

// ====================== CONFIG ======================
export const fetchConfigs = () => {
  return request.get('/api/file-configs?all=true')
}

export const fetchConfigById = (id) => {
  return request.get(`/api/file-configs/${id}`)
}

export const createConfig = (data) => {
  return request.post('/api/file-configs', data)
}

export const updateConfig = (id, data) => {
  return request.put(`/api/file-configs/${id}`, data)
}

// 启用/禁用配置（FormData）
export const setConfigStatus = (ids, isEnabled) => {
  const formData = new FormData()
  formData.append('ids', ids)
  formData.append('isEnabled', isEnabled)

  return request.patch('/api/file-configs/status', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ====================== GROUP ======================
export const fetchGroups = () => {
  return request.get('/api/file-configs/group')
}

export const fetchGroupById = (id) => {
  return request.get(`/api/file-configs/group/${id}`)
}

export const createGroup = (data) => {
  return request.post('/api/file-configs/group', data)
}

export const updateGroup = (id, data) => {
  return request.put(`/api/file-configs/group/${id}`, data)
}

export const deleteGroup = (id) => {
  return request.delete(`/api/file-configs/group/${id}`)
}

// group status
export const setGroupStatus = (ids, isEnabled) => {
  const formData = new FormData()
  formData.append('ids', ids)
  formData.append('isEnabled', isEnabled)

  return request.patch('/api/file-configs/group/status/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// group-config relation
export const bindConfigsToGroup = (groupId, ids) => {
  const params = new URLSearchParams();
  ids.forEach(id => params.append('ids', id));

  return request.post(
    `/api/file-configs/group/${groupId}/configs`,
    null,
    { params }
  )
}

export const removeConfigsFromGroup = (groupId, ids) => {
  return request.delete(
    `/api/file-configs/group/${groupId}/configs`,
    { params: { ids } }
  )
}

// ====================== TASK ======================
export const fetchTasks = () => {
  return request.get('/api/data-acquisition/tasks')
}

export const fetchTaskById = (id) => {
  return request.get(`/api/data-acquisition/tasks/${id}`)
}

export const createTask = (data) => {
  return request.post('/api/data-acquisition/tasks', data)
}

export const updateTask = (id, data) => {
  return request.put(`/api/data-acquisition/tasks/${id}`, data)
}

export const deleteTasks = (ids) => {
  return request.delete('/api/data-acquisition/tasks', {
    params: { ids }
  })
}

export const setTaskStatus = (ids, isEnabled) => {
  return request.patch('/api/data-acquisition/tasks/status', null, {
    params: { ids, isEnabled }
  })
}

// task-group
export const fetchTaskGroups = (taskId) => {
  return request.get(`/api/data-acquisition/tasks/${taskId}/groups`)
}

export const assignTaskGroups = (taskId, ids) => {
  return request.post(
    `/api/data-acquisition/tasks/${taskId}/groups`,
    null,
    { params: { ids } }
  )
}

// ====================== FILE ======================
export const listFiles = (params) => {
  return request.get('/api/files/list', { params })
}

export const checkFileExists = (path) => {
  return request.get('/api/files/exists', {
    params: { path }
  })
}

export const previewFile = (path, top = 10) => {
  return request.get('/api/files/preview', {
    params: { path, top }
  })
}

// ====================== LOG ======================
export const createLog = (data) => {
  return request.post('/api/data-acquisition/log', data)
}

export const createTaskLog = (data) => {
  return request.post('/api/data-acquisition/task-log', data)
}

export const updateTaskLog = (id, data) => {
  return request.put(`/api/data-acquisition/task-log/${id}`, data)
}

export const fetchTaskLogs = () => {
  return request.get('/api/data-acquisition/task-log')
}

export const fetchTaskLogStatus = (taskLogId) => {
  return request.get(`/api/data-acquisition/task-log/${taskLogId}`)
}

export const fetchTaskLogDetails = (taskLogId) => {
  return request.get(`/api/data-acquisition/task-log/${taskLogId}/details`)
}
// ====================== EXECUTION ======================
export const executeById = (id, processDate) => {
  return request.post(`/api/data-acquisition/execute-by-id/${id}`, null, {
    params: { processDate }
  })
}

export const executeManual = (id, processDate) => {
  return request.post(`/api/data-acquisition/execute-manual/${id}`, null, {
    params: { processDate }
  })
}

export const executeByGroup = (groupIds, processDate) => {
  return request.post('/api/data-acquisition/execute-by-groups', null, {
    params: { groupIds, processDate }
  })
}

export const executeByRange = (id, startDate, endDate) => {
  return request.post(`/api/data-acquisition/execute-by-range/${id}`, null, {
    params: { startDate, endDate }
  })
}

export const executeConfigsRange = (ids, startDate, endDate) => {
  return request.post('/api/data-acquisition/execute-configs-range', null, {
    params: { ids, startDate, endDate }
  })
}

// ====================== SQL ======================
export const bulkImport = (data) => {
  return request.post('/api/data-acquisition/bulk-import', data)
}

export const executeSproc = (sproc) => {
  return request.post('/api/data-acquisition/execute-post-process', null, {
    params: { sproc }
  })
}

// ====================== TABLE 表相关 ======================

// 检查表是否存在
export const checkTableExists = (tableName) => {
  return request.get('/api/table/check', {
    params: { tableName }
  })
}

// 获取表结构
export const getTableSchema = (tableName) => {
  return request.get('/api/table/schema', {
    params: { tableName }
  })
}

// 创建表
export const createTable = (tableName, columns) => {
  return request.post('/api/table/create', {
    tableName,
    columns
  })
}


// ====================== 数据源探测 ======================

export const fetchInspection = ({ configId, startTime, endTime, user, pass }) => {
  return request.get('/api/files/discovery', {
    params: {
      configId,
      startTime,
      endTime,
      user,
      pass
    }
  })
}

// ====================== 大屏显示 ======================

export const fetchOverviewTrend = () => {
  return request.get('/api/dashboard/trend')
}

export const fetchOverviewActivities = () => {
  return request.get('/api/dashboard/activities')
}
