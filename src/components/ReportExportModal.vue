<template>
  <div>
    <div v-if="visible" class="ant-modal-mask active"></div>
    <div v-if="visible" class="ant-modal-wrap active" @click.self="handleCancel">
      <div class="ant-modal report-export-modal">
        <div class="ant-modal-header">
          <span class="ant-modal-title">
            <ExportOutlined />
            报表导出
          </span>
          <button type="button" class="modal-close-btn" @click="handleCancel">×</button>
        </div>

        <div class="ant-modal-body">
          <div class="selected-info-box">
            <div class="info-label">导出配置组 ({{ groups.length }})</div>
            <div class="group-chip-list">
              <span v-for="group in groups" :key="getGroupId(group)" class="group-chip">
                {{ getGroupName(group) }}
              </span>
              <span v-if="!groups.length" class="empty-tip">暂无可导出的配置组</span>
            </div>
          </div>

          <div class="date-picker-grid">
            <label class="form-item">
              <span class="date-label">开始时间</span>
              <input v-model="form.startTime" type="datetime-local" class="ant-input" />
            </label>
            <label class="form-item">
              <span class="date-label">结束时间</span>
              <input v-model="form.endTime" type="datetime-local" class="ant-input" />
            </label>
          </div>

          <div class="modal-tips">
            单次导出时间范围最多 7 天。确认后后台生成 Excel，多个配置组会打包为 ZIP。
          </div>

          <div v-if="task" class="export-progress-card">
            <div class="progress-header">
              <div>
                <div class="task-id">任务 {{ task.id }}</div>
                <div class="task-stage">{{ task.stage || getStatusText(task.status) }}</div>
              </div>
              <span class="status-pill" :class="`is-${normalizeStatus(task.status)}`">
                {{ getStatusText(task.status) }}
              </span>
            </div>

            <div class="progress-track">
              <div class="progress-bar" :style="{ width: `${task.progress || 0}%` }"></div>
            </div>
            <div class="progress-meta">
              <span>{{ task.progress || 0 }}%</span>
              <span v-if="task.fileName">{{ task.fileName }}</span>
            </div>

            <div v-if="task.errorMessage" class="error-text">{{ task.errorMessage }}</div>
          </div>
        </div>

        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" :disabled="submitting || downloading" @click="handleCancel">
            取消
          </button>
          <button
            class="ant-btn ant-btn-orange"
            :disabled="submitting || downloading || !groups.length"
            @click="handleSubmit"
          >
            <ExportOutlined />
            {{ submitting ? '生成中...' : '确认导出' }}
          </button>
          <button
            v-if="task?.canDownload"
            class="ant-btn ant-btn-primary"
            :disabled="downloading"
            @click="handleDownload"
          >
            <DownloadOutlined />
            {{ downloading ? '下载中...' : '下载文件' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onBeforeUnmount } from 'vue'
import { DownloadOutlined, ExportOutlined } from '@ant-design/icons-vue'
import message from '@/components/index.js'
import * as api from '@/api'

const props = defineProps({
  visible: Boolean,
  groups: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible'])

const form = reactive({
  startTime: '',
  endTime: '',
})

const task = ref(null)
const submitting = ref(false)
const downloading = ref(false)
let pollTimer = null

const getGroupId = (group) => String(group?.id ?? group?.Id ?? '')
const getGroupName = (group) => group?.groupName || group?.GroupName || `配置组 ${getGroupId(group)}`
const unwrapResult = (res) => res?.data ?? res
const unwrapTaskId = (res) => {
  const result = unwrapResult(res)
  const data = result?.data ?? result?.Data ?? result
  return data?.exportTaskId || data?.ExportTaskId || data?.id || data?.Id
}

const normalizeTaskDto = (dto) => {
  const data = dto?.data ?? dto?.Data ?? dto ?? {}

  return {
    id: data.id ?? data.Id ?? '',
    status: data.status ?? data.Status ?? '',
    progress: data.progress ?? data.Progress ?? 0,
    stage: data.stage ?? data.Stage ?? '',
    fileName: data.fileName ?? data.FileName ?? '',
    errorMessage: data.errorMessage ?? data.ErrorMessage ?? '',
    canDownload: data.canDownload ?? data.CanDownload ?? false,
    createdAt: data.createdAt ?? data.CreatedAt ?? '',
    expiredAt: data.expiredAt ?? data.ExpiredAt ?? '',
  }
}

const toDatetimeLocal = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const toApiDateTime = (value) => {
  if (!value) return ''
  const [datePart, timePart = '00:00'] = String(value).split('T')
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart
  return `${datePart} ${normalizedTime}`
}

const setDefaultRange = () => {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setHours(23, 59, 0, 0)

  form.startTime = toDatetimeLocal(start)
  form.endTime = toDatetimeLocal(end)
}

const normalizeStatus = (status) => String(status || '').toLowerCase()
const getStatusText = (status) => {
  const normalized = normalizeStatus(status)
  if (normalized === 'queued') return '排队中'
  if (normalized === 'running') return '生成中'
  if (normalized === 'success') return '已完成'
  if (normalized === 'failed') return '失败'
  return status || '未开始'
}

const clearPoll = () => {
  if (!pollTimer) return
  clearInterval(pollTimer)
  pollTimer = null
}

const validateForm = () => {
  if (!props.groups.length) {
    message.warning('暂无可导出的配置组')
    return false
  }

  const start = new Date(form.startTime)
  const end = new Date(form.endTime)

  if (!form.startTime || !form.endTime || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    message.warning('请选择导出时间范围')
    return false
  }

  if (start >= end) {
    message.warning('结束时间必须晚于开始时间')
    return false
  }

  if (end.getTime() - start.getTime() > 7 * 24 * 60 * 60 * 1000) {
    message.warning('单次导出时间范围不能超过 7 天')
    return false
  }

  return true
}

const refreshTask = async (taskId) => {
  task.value = normalizeTaskDto(await api.fetchReportExportTask(taskId))

  const status = normalizeStatus(task.value?.status)
  if (status === 'success' || status === 'failed') {
    clearPoll()
    submitting.value = false
    if (status === 'success') {
      message.success('报表生成完成')
    } else {
      message.error(task.value?.errorMessage || '报表生成失败')
    }
  }
}

const startPolling = (taskId) => {
  clearPoll()
  pollTimer = setInterval(() => {
    refreshTask(taskId).catch((error) => {
      clearPoll()
      submitting.value = false
      message.error('获取导出进度失败')
      console.error(error)
    })
  }, 2000)
}

const handleSubmit = async () => {
  if (!validateForm()) return

  clearPoll()
  submitting.value = true
  task.value = null

  try {
    const groupIds = props.groups
      .map((group) => Number(getGroupId(group)))
      .filter((id) => Number.isFinite(id) && id > 0)

    const taskId = unwrapTaskId(await api.createReportExportTask({
      GroupIds: groupIds,
      StartTime: toApiDateTime(form.startTime),
      EndTime: toApiDateTime(form.endTime),
    }))
    if (!taskId) {
      throw new Error('后端未返回导出任务编号')
    }

    message.success('报表任务已提交')
    await refreshTask(taskId)
    if (!['success', 'failed'].includes(normalizeStatus(task.value?.status))) {
      startPolling(taskId)
    }
  } catch (error) {
    submitting.value = false
    message.error(error.message || '提交报表导出失败')
    console.error(error)
  }
}

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'report-export.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const handleDownload = async () => {
  if (!task.value?.id) return

  downloading.value = true
  try {
    const blob = await api.downloadReportExportTask(task.value.id)
    saveBlob(blob, task.value.fileName)
    message.success('下载已开始')
  } catch (error) {
    message.error('下载报表失败')
    console.error(error)
  } finally {
    downloading.value = false
  }
}

const handleCancel = () => {
  clearPoll()
  emit('update:visible', false)
}

watch(() => props.visible, (visible) => {
  if (visible) {
    setDefaultRange()
    task.value = null
    submitting.value = false
    downloading.value = false
    clearPoll()
  }
})

onBeforeUnmount(clearPoll)
</script>

<style scoped>
.report-export-modal {
  width: 680px !important;
}

.report-export-modal .ant-modal-header,
.report-export-modal .ant-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-export-modal .ant-modal-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.report-export-modal .ant-modal-footer {
  justify-content: flex-end;
  gap: 8px;
}

.modal-close-btn {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #8c8c8c;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.modal-close-btn:hover {
  background: #f5f5f5;
  color: #262626;
}

.selected-info-box {
  padding: 14px;
  margin-bottom: 18px;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  background: #f6ffed;
}

.info-label {
  margin-bottom: 10px;
  color: #52c41a;
  font-size: 12px;
  font-weight: 600;
}

.group-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 126px;
  overflow-y: auto;
}

.group-chip {
  padding: 4px 10px;
  border: 1px solid #d9f7be;
  border-radius: 4px;
  background: #fff;
  color: #389e0d;
  font-size: 13px;
  font-weight: 500;
}

.empty-tip {
  color: #8c8c8c;
  font-size: 13px;
}

.date-picker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-item {
  display: block;
  margin: 0;
}

.date-label {
  display: block;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.modal-tips {
  margin-top: 14px;
  color: #8c8c8c;
  font-size: 12px;
}

.export-progress-card {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #e8f5df;
  border-radius: 8px;
  background: #fbfffa;
}

.progress-header,
.progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-id {
  color: rgba(0, 0, 0, 0.85);
  font-size: 13px;
  font-weight: 600;
}

.task-stage,
.progress-meta {
  margin-top: 4px;
  color: #8c8c8c;
  font-size: 12px;
}

.status-pill {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid #d9d9d9;
  color: #666;
  background: #fff;
  font-size: 12px;
}

.status-pill.is-running,
.status-pill.is-queued {
  border-color: #91d5ff;
  color: #1677ff;
  background: #e6f4ff;
}

.status-pill.is-success {
  border-color: #b7eb8f;
  color: #52c41a;
  background: #f6ffed;
}

.status-pill.is-failed {
  border-color: #ffccc7;
  color: #ff4d4f;
  background: #fff2f0;
}

.progress-track {
  height: 8px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2ea;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: #52c41a;
  transition: width 0.25s ease;
}

.error-text {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #ff4d4f;
  background: #fff2f0;
  font-size: 12px;
}
</style>
