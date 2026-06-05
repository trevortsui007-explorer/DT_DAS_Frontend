<template>
  <div class="table-view">
    <div v-if="loading" class="loading-placeholder">加载中...</div>
    <div v-else-if="error" class="error-placeholder">{{ error }}</div>
    <div v-else>
      <table v-if="type === 'overview'" class="ant-table ant-table-overview">
        <thead>
        <tr><th>指标</th><th>当前值</th><th>状态</th></tr>
        </thead>
        <tbody>
        <tr><td>总任务数</td><td><b class="text-primary">{{ stats.tasks }}</b></td><td><span class="status-dot green">正常</span></td></tr>
        <tr><td>配置组数</td><td><b class="text-primary">{{ stats.groups }}</b></td><td><span class="status-dot green">正常</span></td></tr>
        <tr><td>配置项数</td><td><b class="text-primary">{{ stats.configs }}</b></td><td><span class="status-dot green">正常</span></td></tr>
        </tbody>
      </table>

      <table v-else-if="type === 'task'" class="ant-table">
        <thead>
        <tr>
          <th style="width: 48px"></th> <th>任务名称</th>
          <th>模式</th>
          <th>执行频率</th>
          <th>关联组</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="task in tasks" :key="getTaskId(task)">
          <tr class="main-row" :class="{ 'is-expanded': expandedRows.has(getTaskId(task)) }">
            <td class="text-center">
                <span class="expand-toggle" @click="toggleRow(getTaskId(task))">
                  {{ expandedRows.has(getTaskId(task)) ? '▼' : '▶' }}
                </span>
            </td>
            <td class="font-600">{{ task.taskName || task.TaskName || '-' }}</td>
            <td>
              <span :class="['task-mode-tag', getTaskModeClass(task)]">{{ getTaskMode(task) }}</span>
            </td>
            <td><code>{{ translateCron(task.cronExpression || task.CronExpression) }}</code></td>
            <td>
                <span class="group-count-link" @click="toggleRow(getTaskId(task))">
                  {{ getTaskGroupCount(task) }} 个配置组
                </span>
            </td>
            <td>
                <span :class="['status-dot', isTaskEnabled(task) ? 'green' : 'red']">
                  {{ isTaskEnabled(task) ? '启用' : '禁用' }}
                </span>
            </td>
            <td>
              <button class="ant-btn-link" @click="editTask(task)">编辑</button>
            </td>
          </tr>

          <tr v-if="expandedRows.has(getTaskId(task))" class="sub-table-row">
            <td></td> <td colspan="6">
            <div class="sub-table-container">
              <div class="sub-header">关联的配置组详情：</div>
              <div v-if="getTaskGroups(task).length > 0" class="sub-grid">
                <button
                  v-for="g in getTaskGroups(task)"
                  :key="getGroupId(g)"
                  type="button"
                  class="mini-group-card"
                  :class="{ active: isGroupSelected(task, g) }"
                  @click="selectExpandedGroup(task, g)"
                >
                  <span class="g-name">{{ getGroupName(g) }}</span>
                  <span class="g-count">{{ getGroupConfigCount(g) }} 项</span>
                </button>

                <div v-if="getSelectedGroup(task)" class="group-config-panel">
                  <div class="group-config-header">
                    <span>{{ getGroupName(getSelectedGroup(task)) }}</span>
                    <span>{{ getResolvedGroupConfigCount(getSelectedGroup(task)) }} 个配置项</span>
                  </div>
                  <div v-if="getGroupConfigs(getSelectedGroup(task)).length" class="group-config-grid">
                    <button
                      v-for="config in getGroupConfigs(getSelectedGroup(task))"
                      :key="getConfigId(config)"
                      type="button"
                      class="mini-config-card"
                      title="打开配置"
                      @click="viewConfigDetail(config)"
                    >
                      <div class="mini-config-title">{{ getConfigName(config) }}</div>
                      <div class="mini-config-meta">
                        <span>ID：{{ getConfigId(config) || '-' }}</span>
                        <span v-if="getConfigTable(config)">表：{{ getConfigTable(config) }}</span>
                        <span v-if="getConfigFileType(config)">类型：{{ getConfigFileType(config) }}</span>
                      </div>
                    </button>
                  </div>
                  <div v-else class="empty-sub">该配置组暂无配置项</div>
                </div>
              </div>
              <div v-else class="empty-sub">暂未关联任何配置组</div>
            </div>
          </td>
          </tr>
        </template>
        <tr v-if="tasks.length === 0">
          <td colspan="7" class="empty-placeholder">暂无任务数据</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { translateCron } from '@/utils/cron'

const props = defineProps({
  type: String,
  tasks: { type: Array, default: () => [] },
  allGroups: { type: Array, default: () => [] }, // 需要父组件把全量Group传进来用于匹配
  allConfigs: { type: Array, default: () => [] },
  stats: { type: Object, default: () => ({ tasks: 0, groups: 0, configs: 0 }) },
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['edit-task', 'edit-config'])

const expandedRows = ref(new Set())
const selectedGroupByTask = ref({})

const toggleRow = (id) => {
  const normalizedId = normalizeId(id)
  if (expandedRows.value.has(normalizedId)) {
    expandedRows.value.delete(normalizedId)
  } else {
    expandedRows.value.add(normalizedId)
  }
}

const normalizeId = (id) => String(id ?? '')
const getTaskId = (task) => normalizeId(task?.id ?? task?.Id)
const getGroupId = (group) => normalizeId(group?.id ?? group?.Id ?? group?.groupId ?? group?.GroupId)
const getGroupName = (group) => group?.groupName || group?.GroupName || `配置组 ${getGroupId(group)}`
const getGroupConfigCount = (group) => group?.configCount ?? group?.ConfigCount ?? 0
const isTaskEnabled = (task) => task?.isEnabled ?? task?.IsEnabled ?? false
const getConfigId = (config) => normalizeId(config?.id ?? config?.Id ?? config?.configId ?? config?.ConfigId)
const getConfigName = (config) =>
  config?.eqName ||
  config?.EqName ||
  config?.configName ||
  config?.ConfigName ||
  `配置 ${getConfigId(config)}`
const getConfigTable = (config) => config?.tableName || config?.TableName || ''
const getConfigFileType = (config) => config?.fileType || config?.FileType || ''
const normalizeKey = (value) => String(value ?? '').trim().toLowerCase()

const pickFirstArray = (...arrays) => arrays.find((item) => Array.isArray(item) && item.length) || []

const findFullConfig = (config) => {
  const configId = getConfigId(config)
  const configName = normalizeKey(getConfigName(config))

  return props.allConfigs.find((item) => {
    const itemId = getConfigId(item)
    if (configId && itemId === configId) return true
    return configName && normalizeKey(getConfigName(item)) === configName
  })
}

const enrichConfig = (config) => {
  const matchedConfig = findFullConfig(config)
  return matchedConfig ? { ...matchedConfig, ...config } : config
}

const enrichGroup = (group) => {
  const matchedGroup = props.allGroups.find((item) => getGroupId(item) === getGroupId(group))

  if (!matchedGroup) return group

  return {
    ...matchedGroup,
    ...group,
    associatedConfigs: pickFirstArray(
      group?.associatedConfigs,
      group?.AssociatedConfigs,
      matchedGroup?.associatedConfigs,
      matchedGroup?.AssociatedConfigs,
    ),
    AssociatedConfigs: pickFirstArray(
      group?.AssociatedConfigs,
      group?.associatedConfigs,
      matchedGroup?.AssociatedConfigs,
      matchedGroup?.associatedConfigs,
    ),
    configIds: pickFirstArray(
      group?.configIds,
      group?.ConfigIds,
      group?.associatedConfigIds,
      group?.AssociatedConfigIds,
      matchedGroup?.configIds,
      matchedGroup?.ConfigIds,
      matchedGroup?.associatedConfigIds,
      matchedGroup?.AssociatedConfigIds,
    ),
    ConfigIds: pickFirstArray(
      group?.ConfigIds,
      group?.configIds,
      group?.AssociatedConfigIds,
      group?.associatedConfigIds,
      matchedGroup?.ConfigIds,
      matchedGroup?.configIds,
      matchedGroup?.AssociatedConfigIds,
      matchedGroup?.associatedConfigIds,
    ),
  }
}

const extractTaskGroupIds = (task = {}) => {
  const rawIds = task.groupIds || task.GroupIds || task.groupIdsList || task.GroupIdsList || []

  if (Array.isArray(rawIds) && rawIds.length) {
    return rawIds
      .map((item) => (typeof item === 'object' ? item.id ?? item.Id ?? item.groupId ?? item.GroupId : item))
      .filter((id) => id !== undefined && id !== null && id !== '')
      .map(normalizeId)
  }

  const rawGroups =
    task.associatedGroups ||
    task.AssociatedGroups ||
    task.groups ||
    task.Groups ||
    task.taskGroups ||
    task.TaskGroups ||
    []

  return Array.isArray(rawGroups)
    ? rawGroups
        .map((group) => group?.id ?? group?.Id ?? group?.groupId ?? group?.GroupId)
        .filter((id) => id !== undefined && id !== null && id !== '')
        .map(normalizeId)
    : []
}

const getTaskGroups = (task) => {
  const directGroups =
    task.associatedGroups ||
    task.AssociatedGroups ||
    task.groups ||
    task.Groups ||
    task.taskGroups ||
    task.TaskGroups ||
    []

  if (Array.isArray(directGroups) && directGroups.length) {
    return directGroups.map(enrichGroup)
  }

  const ids = new Set(extractTaskGroupIds(task))
  return props.allGroups.filter((group) => ids.has(getGroupId(group)))
}

const getTaskGroupCount = (task) => {
  const groups = getTaskGroups(task)
  if (groups.length) return groups.length
  return extractTaskGroupIds(task).length
}

const getGroupConfigs = (group) => {
  const directConfigs =
    group?.associatedConfigs ||
    group?.AssociatedConfigs ||
    group?.configs ||
    group?.Configs ||
    group?.groupConfigs ||
    group?.GroupConfigs ||
    []

  if (Array.isArray(directConfigs) && directConfigs.length) {
    return directConfigs.map(enrichConfig)
  }

  const configRefs =
    group?.configIds ||
    group?.ConfigIds ||
    group?.configIdList ||
    group?.ConfigIdList ||
    group?.associatedConfigIds ||
    group?.AssociatedConfigIds ||
    []

  if (!Array.isArray(configRefs) || !configRefs.length) {
    return []
  }

  const refKeys = new Set(
    configRefs
      .map((item) => {
        if (typeof item === 'object') {
          return item.id ?? item.Id ?? item.configId ?? item.ConfigId ?? item.eqName ?? item.EqName
        }
        return item
      })
      .filter((value) => value !== undefined && value !== null && value !== '')
      .map(normalizeKey),
  )

  return props.allConfigs.filter((config) => {
    const id = getConfigId(config)
    const name = getConfigName(config)
    return refKeys.has(normalizeKey(id)) || refKeys.has(normalizeKey(name))
  })
}

const getResolvedGroupConfigCount = (group) => {
  const configs = getGroupConfigs(group)
  return configs.length || getGroupConfigCount(group)
}

const selectExpandedGroup = (task, group) => {
  const taskId = getTaskId(task)
  const groupId = getGroupId(group)

  selectedGroupByTask.value = {
    ...selectedGroupByTask.value,
    [taskId]: selectedGroupByTask.value[taskId] === groupId ? '' : groupId,
  }
}

const getSelectedGroup = (task) => {
  const taskId = getTaskId(task)
  const selectedGroupId = selectedGroupByTask.value[taskId]

  if (!selectedGroupId) return null
  return getTaskGroups(task).find((group) => getGroupId(group) === selectedGroupId) || null
}

const isGroupSelected = (task, group) => {
  return selectedGroupByTask.value[getTaskId(task)] === getGroupId(group)
}

const getTaskMode = (task) => {
  const mode = task.TaskMode ?? task.taskMode
  return mode === 1 ? '周期执行' : '常规任务'
}

const getTaskModeClass = (task) => {
  const mode = task.TaskMode ?? task.taskMode
  return mode === 1 ? 'is-periodic' : 'is-normal'
}

const editTask = (task) => {
  emit('edit-task', task)
}

const viewConfigDetail = (config) => {
  emit('edit-config', enrichConfig(config))
}
</script>

<style scoped>
/* 1. 基础表格样式优化 */
.ant-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.ant-table th {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
}
.ant-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.ant-table-overview th {
  padding: 12px 20px;
  font-size: 14px;
}

.ant-table-overview td {
  padding: 12px 20px;
  font-size: 16px;
}

/* 2. 展开按钮 & 链接交互 */
.expand-toggle {
  cursor: pointer;
  color: #bfbfbf;
  font-size: 10px;
  transition: all 0.2s;
}
.expand-toggle:hover { color: #52c41a; }
.main-row:hover td { background-color: #f6ffed !important; }
.is-expanded td { background: #fbfbfb; }

.group-count-link {
  color: #52c41a;
  text-decoration: underline;
  cursor: pointer;
  font-size: 13px;
}

/* 3. 子表容器样式 */
.sub-table-row td {
  padding: 0 !important;
  background: #fafafa;
}
.sub-table-container {
  padding: 12px 24px 24px 12px;
  border-left: 2px solid #52c41a; /* 绿色左边线，引导视觉 */
  margin: 8px 0;
}
.sub-header {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: bold;
}
.sub-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mini-group-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 4px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.mini-group-card:hover,
.mini-group-card.active {
  border-color: #52c41a;
  background: #f6ffed;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.12);
}

.mini-group-card .g-name { color: #262626; }
.mini-group-card .g-count { color: #52c41a; font-weight: bold; }

.group-config-panel {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8f5e1;
  border-radius: 8px;
}

.group-config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #262626;
  font-size: 13px;
  font-weight: 600;
}

.group-config-header span:last-child {
  color: #52c41a;
  font-size: 12px;
  font-weight: 500;
}

.group-config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.mini-config-card {
  padding: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.mini-config-card:hover {
  border-color: #52c41a;
  background: #f6ffed;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.12);
}

.mini-config-title {
  margin-bottom: 6px;
  color: #262626;
  font-size: 13px;
  font-weight: 600;
}

.mini-config-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #8c8c8c;
  font-size: 12px;
}

/* 4. 状态点 & 标签 */
.status-dot {
  position: relative;
  padding-left: 14px;
}
.status-dot::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-dot.green::before { background: #52c41a; box-shadow: 0 0 4px #52c41a; }
.status-dot.red::before { background: #ff4d4f; }

.ant-tag {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.task-mode-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.task-mode-tag.is-periodic {
  color: #1677ff;
  background: #eef6ff;
  border: 1px solid #91caff;
}

.task-mode-tag.is-normal {
  color: #389e0d;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.text-primary { color: #52c41a; }
.font-600 { font-weight: 600; }
.ant-btn-link {
  color: #52c41a;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.ant-btn-link:hover { text-decoration: underline; }
.empty-placeholder { text-align: center; padding: 40px; color: #bfbfbf; }

.table-view {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 240px);
  padding-right: 4px;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
}

.table-view::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-view::-webkit-scrollbar-track {
  background: transparent;
}

.table-view::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 10px;
}

.table-view::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.ant-table-overview {
  min-height: auto;
}

.font-600 {
  font-weight: 600;
  color: #262626;
}

code {
  font-family: 'Cascadia Code', Consolas, monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #cf1322;
}

.text-primary {
  color: #52c41a;
  font-size: 18px;
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.ant-table-overview .text-primary {
  font-size: 20px;
  font-weight: 700;
}

.ant-table > thead > tr > th,
.ant-table > tbody > tr > td {
  text-align: center;
}

.sub-table-container {
  text-align: left;
  padding: 12px 24px 24px 12px;
  border-left: 2px solid #52c41a;
  margin: 8px 0;
}

.sub-header {
  text-align: left;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 12px;
  font-weight: bold;
}

.sub-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}
</style>
