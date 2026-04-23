<template>
  <div class="task-log-view">
    <div class="task-log-layout">
      <section class="task-log-card">
        <div class="task-log-card__header">
          <div class="task-log-card__header-left">
            <h3 class="task-log-card__title">当前任务</h3>
            <p class="task-log-card__desc">查看当前选中任务的状态、进度和明细</p>
          </div>
          <div class="task-log-card__header-right">
            <div class="task-log-filter-row">
              <button
                v-for="tag in detailFilterTags"
                :key="tag"
                type="button"
                class="status-tag status-tag--filter"
                :class="[getStatusClass(tag), { 'status-tag--active': activeDetailTag === tag }]"
                @click="setActiveDetailTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="currentTask" class="task-log-current">
          <div class="task-log-summary-grid">
            <div class="task-log-summary-item">
              <span class="label">任务ID</span>
              <span class="value mono">{{ currentTask.taskLogId || '--' }}</span>
            </div>

            <div class="task-log-summary-item">
              <span class="label">状态</span>
              <span class="value">
                <span class="status-tag" :class="getStatusClass(currentTask.status)">
                  {{ currentTask.status || '--' }}
                </span>
              </span>
            </div>

            <div class="task-log-summary-item">
              <span class="label">开始时间</span>
              <span class="value">{{ formatDateTime(currentTask.startTime) }}</span>
            </div>

            <div class="task-log-summary-item">
              <span class="label">结束时间</span>
              <span class="value">{{ formatDateTime(currentTask.endTime) }}</span>
            </div>

            <div class="task-log-summary-item">
              <span class="label">总任务数</span>
              <span class="value">{{ currentTask.totalConfigs ?? 0 }}</span>
            </div>

            <div class="task-log-summary-item">
              <span class="label">已处理</span>
              <span class="value">{{ currentTask.processedCount ?? 0 }}</span>
            </div>

            <div class="task-log-summary-item">
              <span class="label">成功</span>
              <span class="value success-text">{{ currentTask.successCount ?? 0 }}</span>
            </div>

            <div class="task-log-summary-item">
              <span class="label">失败</span>
              <span class="value danger-text">{{ currentTask.failureCount ?? 0 }}</span>
            </div>
          </div>

          <div class="task-progress-block">
            <div class="task-progress-meta">
              <span>执行进度</span>
              <span>{{ progressPercent }}%</span>
            </div>

            <div class="task-progress-bar">
              <div class="task-progress-bar__inner" :style="{ width: `${progressPercent}%` }" />
            </div>

            <div class="task-progress-foot">
              <span>上次刷新：{{ formatDateTime(lastRefreshTime) }}</span>
            </div>
          </div>

          <div class="task-log-detail">
            <div v-if="detailsLoading" class="loading-placeholder">正在加载任务明细...</div>

            <div v-else class="task-log-detail-content">
              <div v-if="!taskDetails.length" class="empty-placeholder">暂无任务明细</div>

              <div v-else-if="!filteredTaskDetails.length" class="empty-placeholder">
                当前筛选条件下暂无记录
              </div>

              <div v-else class="task-log-detail-list">
                <div
                  v-for="item in filteredTaskDetails"
                  :key="item.id || `${item.fileName}-${item.startTime}`"
                  class="task-log-detail-item"
                >
                  <div class="task-log-detail-item__top">
                    <span class="task-log-file">{{ item.fileName || '--' }}</span>
                    <span class="status-tag" :class="getStatusClass(item.status)">
                      {{ item.status || '--' }}
                    </span>
                  </div>

                  <div class="task-log-detail-item__meta">
                    <span>配置ID：{{ item.configId ?? '--' }}</span>
                    <span>起始行：{{ item.startRow ?? 0 }}</span>
                    <span>处理行数：{{ item.processedRows ?? 0 }}</span>
                  </div>

                  <div class="task-log-detail-item__meta">
                    <span>开始：{{ formatDateTime(item.startTime) }}</span>
                    <span>结束：{{ formatDateTime(item.endTime) }}</span>
                  </div>

                  <div v-if="item.errorMessage" class="task-log-error">
                    {{ item.errorMessage }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-placeholder">暂无任务日志。请先执行采集任务。</div>
      </section>

      <aside class="task-log-card task-log-history">
        <div class="task-log-card__header task-log-history-header">
          <div class="task-log-history-header__left">
            <h3 class="task-log-card__title">历史任务</h3>
            <p class="task-log-card__desc">点击切换查看不同任务</p>
          </div>
          <div class="task-log-history-header__right">
            <div class="history-date-filter">
              <label class="history-date-filter__item">
                <span>开始日期</span>
                <input
                  v-model="historyStartDateInput"
                  type="date"
                  class="history-date-filter__input ant-input"
                  @change="applyHistoryDateFilter"
                />
              </label>
              <label class="history-date-filter__item">
                <span>结束日期</span>
                <input
                  v-model="historyEndDateInput"
                  type="date"
                  class="history-date-filter__input ant-input"
                  @change="applyHistoryDateFilter"
                />
              </label>
              <button
                type="button"
                class="ant-btn ant-btn-gray history-date-filter__clear"
                :disabled="!historyStartDateInput && !historyEndDateInput"
                @click="clearHistoryDateFilter"
              >
                清空
              </button>
            </div>
          </div>
        </div>
        <div v-if="historyDateFilterError" class="history-date-filter__error">
          {{ historyDateFilterError }}
        </div>

        <div v-if="listLoading" class="loading-placeholder">正在加载历史任务...</div>

        <div v-else-if="!taskList.length" class="empty-placeholder">暂无历史任务</div>

        <div v-else-if="!filteredHistoryTaskList.length" class="empty-placeholder">
          当前筛选条件下暂无历史任务记录
        </div>

        <div v-else class="task-log-history-list">
          <div
            v-for="item in filteredHistoryTaskList"
            :key="item.taskLogId"
            class="task-log-history-item"
            :class="{ active: currentTask?.taskLogId === item.taskLogId }"
            @click="selectTask(item)"
          >
            <div class="task-log-history-item__top">
              <span class="mono">{{ item.taskLogId || '--' }}</span>
              <span class="status-tag" :class="getStatusClass(item.status)">
                {{ item.status || '--' }}
              </span>
            </div>

            <div class="task-log-history-item__meta">
              <span>总数 {{ item.totalConfigs ?? 0 }}</span>
              <span>成功 {{ item.successCount ?? 0 }}</span>
              <span>失败 {{ item.failureCount ?? 0 }}</span>
            </div>

            <div class="task-log-history-item__meta">
              <span>{{ formatDateTime(item.startTime) }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as api from '../api'

// 本地安全提示，避免依赖 components/index.js 导出格式
const notify = {
  error(text) {
    console.error(text)
  },
  warning(text) {
    console.warn(text)
  },
  success(text) {
    console.log(text)
  },
}

const props = defineProps({
  initialTaskLogId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['task-selected'])

const currentTask = ref(null)
const taskList = ref([])
const taskDetails = ref([])
const detailCacheByTaskId = ref({})
const detailFilterTags = ['All', 'Running', 'Success', 'PartialSuccess', 'Failed']
const activeDetailTag = ref('All')
const historyStartDateInput = ref('')
const historyEndDateInput = ref('')
const effectiveHistoryStartDate = ref('')
const effectiveHistoryEndDate = ref('')
const historyDateFilterError = ref('')

const listLoading = ref(false)
const detailsLoading = ref(false)
const polling = ref(false)
const pollingTimer = ref(null)
const lastRefreshTime = ref(null)

const progressPercent = computed(() => {
  const item = currentTask.value
  if (!item) return 0

  if (typeof item.progress === 'number') {
    return Math.max(0, Math.min(100, item.progress))
  }

  const total = item.totalConfigs ?? 0
  const processed = item.processedCount ?? (item.successCount ?? 0) + (item.failureCount ?? 0)

  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((processed / total) * 100)))
})

const normalizeStatus = (status) =>
  String(status || '')
    .replace(/\s+/g, '')
    .toLowerCase()

const filteredTaskDetails = computed(() => {
  const selectedTag = normalizeStatus(activeDetailTag.value)
  if (selectedTag === 'all') return taskDetails.value

  return taskDetails.value.filter((item) => normalizeStatus(item.status) === selectedTag)
})

const getStartOfDayMs = (dateString) => {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const getEndOfDayMs = (dateString) => {
  if (!dateString) return null
  const date = new Date(`${dateString}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const getTaskStartTimeMs = (task) => {
  const date = new Date(task?.startTime || '')
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const filteredHistoryTaskList = computed(() => {
  const startBoundary = getStartOfDayMs(effectiveHistoryStartDate.value)
  const endBoundary = getEndOfDayMs(effectiveHistoryEndDate.value)

  return taskList.value.filter((item) => {
    const taskStartTimeMs = getTaskStartTimeMs(item)
    if (taskStartTimeMs === null) {
      return startBoundary === null && endBoundary === null
    }
    if (startBoundary !== null && taskStartTimeMs < startBoundary) return false
    if (endBoundary !== null && taskStartTimeMs > endBoundary) return false
    return true
  })
})

const setActiveDetailTag = (tag) => {
  if (!detailFilterTags.includes(tag)) return
  activeDetailTag.value = tag
}

const applyHistoryDateFilter = () => {
  const startDateValue = historyStartDateInput.value
  const endDateValue = historyEndDateInput.value
  const nextStartMs = getStartOfDayMs(startDateValue)
  const nextEndMs = getEndOfDayMs(endDateValue)

  if (nextStartMs !== null && nextEndMs !== null && nextStartMs > nextEndMs) {
    historyDateFilterError.value = '开始日期不能晚于结束日期'
    notify.warning('开始日期不能晚于结束日期')
    return
  }

  historyDateFilterError.value = ''
  effectiveHistoryStartDate.value = startDateValue
  effectiveHistoryEndDate.value = endDateValue
}

const clearHistoryDateFilter = () => {
  historyStartDateInput.value = ''
  historyEndDateInput.value = ''
  effectiveHistoryStartDate.value = ''
  effectiveHistoryEndDate.value = ''
  historyDateFilterError.value = ''
}

const normalizeTask = (raw = {}) => ({
  taskLogId: raw.taskLogId || raw.id || raw.Id || '',
  status: raw.status || raw.Status || '',
  startTime: raw.startTime || raw.StartTime || '',
  endTime: raw.endTime || raw.EndTime || '',
  totalConfigs: raw.totalConfigs ?? raw.TotalConfigs ?? 0,
  successCount: raw.successCount ?? raw.SuccessCount ?? 0,
  failureCount: raw.failureCount ?? raw.FailureCount ?? 0,
  processedCount:
    raw.processedCount ??
    raw.ProcessedCount ??
    (raw.successCount ?? raw.SuccessCount ?? 0) + (raw.failureCount ?? raw.FailureCount ?? 0),
  progress: raw.progress ?? raw.Progress,
})

const normalizeDetail = (raw = {}) => ({
  id: raw.id || raw.Id || '',
  taskLogId: raw.taskLogId || raw.TaskLogId || '',
  configId: raw.configId ?? raw.ConfigId,
  fileName: raw.fileName || raw.FileName || '',
  status: raw.status || raw.Status || '',
  startRow: raw.startRow ?? raw.StartRow ?? 0,
  processedRows: raw.processedRows ?? raw.ProcessedRows ?? 0,
  startTime: raw.startTime || raw.StartTime || '',
  endTime: raw.endTime || raw.EndTime || '',
  errorMessage: raw.errorMessage || raw.ErrorMessage || '',
})

const formatDateTime = (value) => {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const getTodayDateString = () => {
  const today = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
}

const getStatusClass = (status) => {
  const s = normalizeStatus(status)

  if (s === 'success') return 'status-tag--success'
  if (s === 'failed') return 'status-tag--failed'
  if (s === 'running') return 'status-tag--running'
  if (s === 'partialsuccess') return 'status-tag--partial'
  return 'status-tag--default'
}

const loadTaskList = async () => {
  listLoading.value = true
  try {
    const res = await api.fetchTaskLogs()
    const list = (res?.data || res || []).map(normalizeTask)
    taskList.value = list

    if (props.initialTaskLogId) {
      const matched = list.find((item) => item.taskLogId === props.initialTaskLogId)
      if (matched) {
        await selectTask(matched)
        return
      }
    }

    if (!currentTask.value && list.length) {
      await selectTask(list[0])
    }
  } catch (err) {
    console.error('加载任务日志列表失败', err)
    notify.error('加载任务日志列表失败')
  } finally {
    listLoading.value = false
  }
}

const loadTaskStatus = async (taskLogId) => {
  if (!taskLogId) return

  try {
    const res = await api.fetchTaskLogStatus(taskLogId)
    currentTask.value = normalizeTask(res?.data || res || {})
    lastRefreshTime.value = new Date()

    taskList.value = taskList.value.map((item) =>
      item.taskLogId === currentTask.value.taskLogId ? { ...item, ...currentTask.value } : item,
    )
  } catch (err) {
    console.error('加载任务状态失败', err)
    notify.error('加载任务状态失败')
  }
}

const loadTaskDetails = async (taskLogId, { force = false } = {}) => {
  if (!taskLogId) return

  const cachedDetails = detailCacheByTaskId.value[taskLogId]
  if (!force && cachedDetails) {
    taskDetails.value = cachedDetails.map((item) => ({ ...item }))
    return
  }

  detailsLoading.value = true
  try {
    const res = await api.fetchTaskLogDetails(taskLogId)
    const normalizedDetails = (res?.data || res || []).map(normalizeDetail)
    detailCacheByTaskId.value = {
      ...detailCacheByTaskId.value,
      [taskLogId]: normalizedDetails,
    }
    taskDetails.value = normalizedDetails
  } catch (err) {
    console.error('加载任务明细失败', err)
    notify.error('加载任务明细失败')
  } finally {
    detailsLoading.value = false
  }
}

const selectTask = async (item) => {
  currentTask.value = normalizeTask(item)
  activeDetailTag.value = 'All'
  emit('task-selected', currentTask.value)

  await Promise.all([
    loadTaskStatus(currentTask.value.taskLogId),
    loadTaskDetails(currentTask.value.taskLogId),
  ])
}

const refreshCurrentTask = async () => {
  if (!currentTask.value?.taskLogId) {
    notify.warning('当前没有可刷新的任务')
    return
  }

  await Promise.all([
    loadTaskStatus(currentTask.value.taskLogId),
    loadTaskDetails(currentTask.value.taskLogId, { force: true }),
  ])
}

const refreshHistoryList = async () => {
  await loadTaskList()
}

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
  polling.value = false
}

const startPolling = () => {
  if (!currentTask.value?.taskLogId) {
    notify.warning('请先选择任务')
    return
  }

  stopPolling()
  polling.value = true

  pollingTimer.value = setInterval(async () => {
    await loadTaskStatus(currentTask.value.taskLogId)

    const status = normalizeStatus(currentTask.value?.status)
    if (['success', 'failed', 'partialsuccess'].includes(status)) {
      await loadTaskDetails(currentTask.value.taskLogId, { force: true })
      stopPolling()
    }
  }, 3000)
}

const togglePolling = () => {
  if (polling.value) {
    stopPolling()
  } else {
    startPolling()
  }
}

watch(
  () => props.initialTaskLogId,
  async (val) => {
    if (!val || !taskList.value.length) return
    const matched = taskList.value.find((item) => item.taskLogId === val)
    if (matched) {
      await selectTask(matched)
    }
  },
)

onMounted(async () => {
  const todayDate = getTodayDateString()
  historyEndDateInput.value = todayDate
  effectiveHistoryEndDate.value = todayDate
  await loadTaskList()
})

onBeforeUnmount(() => {
  stopPolling()
})

defineExpose({
  refreshHistoryList,
  refreshCurrentTask,
})
</script>

<style scoped>
.task-log-view {
  width: 100%;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.task-log-page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-log-page-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-log-page-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.task-log-layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.task-log-card {
  background: #fafafa;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 12px;
  padding: 16px;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-card__header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.task-log-card__header-left,
.task-log-card__header-right {
  flex: 0 0 50%;
  min-width: 0;
}

.task-log-card__header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-left: 20px;
  border-left: 1px solid #eef2f6;
  box-sizing: border-box;
}

.task-log-history-header {
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.task-log-history-header__left {
  min-width: 0;
}

.task-log-history-header__right {
  margin-left: auto;
}

.history-date-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 8px 12px;
}

.history-date-filter__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.history-date-filter__input {
  min-width: 150px;
  height: 30px;
}

.history-date-filter__clear {
  height: 30px;
  min-width: 64px;
}

.history-date-filter__error {
  margin-bottom: 12px;
  font-size: 12px;
  color: #cf1322;
}

.task-log-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-log-card__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-log-current {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.task-log-summary-item {
  background: #fff;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-log-summary-item .label {
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-log-summary-item .value {
  font-size: 15px;
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-progress-block {
  background: #fff;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.task-progress-meta,
.task-progress-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-progress-meta {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-progress-foot {
  margin-top: 8px;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #f0f0f0;
  overflow: hidden;
}

.task-progress-bar__inner {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #52c41a 0%, #95de64 100%);
  transition: width 0.3s ease;
}

.task-log-detail {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-detail-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-filter-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 0;
}

.task-log-section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
  flex-shrink: 0;
}

.task-log-detail-list,
.task-log-history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
  padding-right: 4px;
  padding-bottom: 30px;
}

.task-log-detail-item,
.task-log-history-item {
  background: #fff;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s ease;
}

.task-log-history-item {
  cursor: pointer;
}

.task-log-history-item:hover,
.task-log-history-item.active,
.task-log-detail-item:hover {
  border-color: var(--ant-primary, #52c41a);
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.12);
}

.task-log-detail-item__top,
.task-log-history-item__top,
.task-log-detail-item__meta,
.task-log-history-item__meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px 24px;
  flex-wrap: wrap;
}

.task-log-detail-item__top,
.task-log-history-item__top {
  margin-bottom: 8px;
}

.task-log-detail-item__meta,
.task-log-history-item__meta {
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
  margin-top: 4px;
}

.task-log-file {
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

.task-log-error {
  margin-top: 8px;
  padding: 8px 10px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #cf1322;
  font-size: 12px;
  word-break: break-word;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  box-sizing: border-box;
  flex-shrink: 0;
}

.status-tag--filter {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.status-tag--filter:hover {
  transform: translateY(-1px);
}

.status-tag--active {
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.18);
}

.status-tag--success {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.status-tag--failed {
  background: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffccc7;
}

.status-tag--running {
  background: #e6f7ff;
  color: #096dd9;
  border: 1px solid #91d5ff;
}

.status-tag--partial {
  background: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
}

.status-tag--default {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.success-text {
  color: #389e0d !important;
}

.danger-text {
  color: #cf1322 !important;
}

.mono {
  font-family: Consolas, Monaco, monospace;
}

.loading-placeholder,
.empty-placeholder {
  text-align: center;
  padding: 40px 24px;
  color: #999;
}

@media (max-width: 1280px) {
  .task-log-page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .task-log-page-actions {
    justify-content: flex-start;
  }

  .task-log-layout {
    grid-template-columns: 1fr;
  }

  .task-log-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-log-history-header {
    align-items: stretch;
  }

  .history-date-filter {
    justify-content: flex-start;
  }
}
</style>
