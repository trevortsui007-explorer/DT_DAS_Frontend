<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 640px">
        <div class="ant-modal-header task-modal-header">
          <span class="ant-modal-title">{{ isEdit ? '编辑任务' : '新建任务' }}</span>
          <span class="close-btn" @click="close">×</span>
        </div>

        <div class="ant-modal-body scrollable-body">
          <input type="hidden" v-model="formData.id" />

          <div class="form-item">
            <label class="required">任务名称</label>
            <input
              type="text"
              class="ant-input"
              v-model="formData.taskName"
              placeholder="请输入任务名称"
            />
          </div>

          <div class="form-item">
            <label>描述</label>
            <textarea
              class="ant-input"
              v-model="formData.description"
              rows="2"
              placeholder="描述任务用途"
            ></textarea>
          </div>

          <div class="form-item">
            <label>任务模式</label>
            <div class="custom-segmented">
              <div
                class="custom-segmented__pill"
                :style="{ transform: `translateX(${modePillLeft})` }"
              ></div>
              <div class="custom-segmented__options">
                <div
                  v-for="mode in taskModes"
                  :key="mode.value"
                  class="custom-segmented__option"
                  :class="{ 'custom-segmented__option--active': formData.taskMode === mode.value }"
                  @click="formData.taskMode = mode.value"
                >
                  {{ mode.label }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="formData.taskMode === 1" class="frequency-section">
            <label>执行频率</label>
            <div class="frequency-selector">
              <select v-model="frequencyPreset" class="ant-input" @change="updateCronFromPreset">
                <option value="">请选择执行频率</option>
                <option value="minutes">每 N 分钟</option>
                <option value="hourly">每小时固定分钟</option>
                <option value="daily">每天固定时间</option>
                <option value="weekly">每周固定时间</option>
                <option value="monthly">每月固定日期</option>
                <option value="custom">自定义 Cron</option>
              </select>

              <div v-if="frequencyPreset === 'minutes'" class="preset-input inline-preset">
                <span>每</span>
                <input
                  type="number"
                  min="1"
                  max="59"
                  v-model.number="minutesInterval"
                  class="ant-input number-input"
                  @input="updateCronFromPreset"
                />
                <span>分钟执行一次</span>
              </div>

              <div v-if="frequencyPreset === 'hourly'" class="preset-input inline-preset">
                <span>每小时第</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  v-model.number="hourlyMinute"
                  class="ant-input number-input"
                  @input="updateCronFromPreset"
                />
                <span>分钟执行</span>
              </div>

              <div v-if="frequencyPreset === 'daily'" class="preset-input">
                <input type="time" v-model="dailyTime" class="ant-input" @change="updateCronFromPreset" />
              </div>

              <div v-if="frequencyPreset === 'weekly'" class="preset-input two-col-preset">
                <select v-model="weeklyDay" class="ant-input" @change="updateCronFromPreset">
                  <option v-for="day in weekOptions" :key="day.value" :value="day.value">
                    {{ day.label }}
                  </option>
                </select>
                <input type="time" v-model="weeklyTime" class="ant-input" @change="updateCronFromPreset" />
              </div>

              <div v-if="frequencyPreset === 'monthly'" class="preset-input two-col-preset">
                <input
                  type="number"
                  min="1"
                  max="31"
                  v-model.number="monthlyDay"
                  class="ant-input"
                  @input="updateCronFromPreset"
                />
                <input type="time" v-model="monthlyTime" class="ant-input" @change="updateCronFromPreset" />
              </div>

              <div v-if="frequencyPreset === 'custom'" class="preset-input">
                <input
                  v-model="customCron"
                  class="ant-input cron-input"
                  placeholder="例如：*/30 * * * *"
                  @input="updateCronFromPreset"
                />
              </div>
            </div>
            <div v-if="cronExpression" class="cron-preview">
              <span class="cron-label">当前频率：</span>
              <span class="cron-desc">{{ cronDescription }}</span>
              <span class="cron-code">Cron：{{ cronExpression }}</span>
            </div>
          </div>

          <div class="form-item">
            <div class="label-with-extra">
              <label>关联配置组</label>
              <span class="extra-info">已选 {{ formData.groupIds.length }} 个</span>
            </div>
            <div class="group-select-grid">
              <div
                v-for="group in allGroups"
                :key="getGroupId(group)"
                class="group-checkbox-card"
                :class="{ 'is-checked': formData.groupIds.includes(getGroupId(group)) }"
                @click="toggleGroupSelection(getGroupId(group))"
              >
                <div class="checkbox-status">
                  <div class="inner-dot"></div>
                </div>
                <div class="group-card-content">
                  <div class="group-card-name">{{ getGroupName(group) }}</div>
                  <div class="group-card-meta">{{ getGroupConfigCount(group) }} 个配置项</div>
                </div>
              </div>
              <div v-if="allGroups.length === 0" class="empty-inline">暂无可用配置组</div>
            </div>
          </div>

          <div class="form-item inline-flex">
            <label>立即启用</label>
            <label class="toggle-switch">
              <input type="checkbox" v-model="formData.isEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="ant-modal-footer task-modal-footer">
          <button class="ant-btn ant-btn-default" @click="close">取消</button>
          <button class="ant-btn ant-btn-primary" :disabled="saving" @click="save">
            {{ saving ? '保存中...' : '保存任务' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import message from '@/components/index.js'
import * as api from '@/api'

const emit = defineEmits(['saved'])

// 状态控制
const visible = ref(false)
const isEdit = ref(false)
const allGroups = ref([]) // 由 open 方法从外部传入
const saving = ref(false)

// 时间相关
const frequencyPreset = ref('minutes')
const dailyTime = ref('02:00')
const weeklyDay = ref('1')
const weeklyTime = ref('09:00')
const monthlyDay = ref(1)
const monthlyTime = ref('10:00')
const hourlyMinute = ref(0)
const minutesInterval = ref(30)
const customCron = ref('')

const weekOptions = [
  { value: '1', label: '周一' },
  { value: '2', label: '周二' },
  { value: '3', label: '周三' },
  { value: '4', label: '周四' },
  { value: '5', label: '周五' },
  { value: '6', label: '周六' },
  { value: '0', label: '周日' },
]

const formData = ref({
  id: null,
  taskName: '',
  description: '',
  taskMode: 1,
  cronExpression: '',
  isEnabled: true,
  groupIds: [],
})

// 任务模式配置
const taskModes = [{ value: 0, label: '常规任务' }, { value: 1, label: '周期执行' }]
const modePillLeft = computed(() => {
  const index = taskModes.findIndex(m => m.value === formData.value.taskMode)
  return `${index * 100}%`
})

// Cron 预览
const cronExpression = computed(() => formData.value.cronExpression)
const cronDescription = computed(() => describeCron(cronExpression.value))

const unwrapResult = (res) => res?.data ?? res
const assertSuccess = (res) => {
  const result = unwrapResult(res)

  if (result?.code !== undefined && result.code !== 1) {
    throw new Error(result.info || result.message || '保存失败')
  }

  return result
}

const normalizeId = (id) => String(id ?? '')
const getGroupId = (group) => normalizeId(group?.id ?? group?.Id)
const getGroupName = (group) => group?.groupName || group?.GroupName || `配置组 ${getGroupId(group)}`
const getGroupConfigCount = (group) => group?.configCount ?? group?.ConfigCount ?? 0

const extractGroupIds = (data = {}) => {
  const rawIds =
    data.groupIds ||
    data.GroupIds ||
    data.groupIdsList ||
    data.GroupIdsList ||
    []

  if (Array.isArray(rawIds) && rawIds.length) {
    return rawIds
      .map((item) => (typeof item === 'object' ? item.id ?? item.Id : item))
      .filter((id) => id !== undefined && id !== null && id !== '')
      .map(normalizeId)
  }

  const rawGroups =
    data.associatedGroups ||
    data.AssociatedGroups ||
    data.groups ||
    data.Groups ||
    data.taskGroups ||
    data.TaskGroups ||
    []

  return Array.isArray(rawGroups)
    ? rawGroups
        .map((group) => group?.id ?? group?.Id ?? group?.groupId ?? group?.GroupId)
        .filter((id) => id !== undefined && id !== null && id !== '')
        .map(normalizeId)
    : []
}

// 切换选择
const toggleGroupSelection = (id) => {
  const normalizedId = normalizeId(id)
  if (!normalizedId) return

  const index = formData.value.groupIds.indexOf(normalizedId)
  if (index > -1) {
    formData.value.groupIds.splice(index, 1)
  } else {
    formData.value.groupIds.push(normalizedId)
  }
}

const clampNumber = (value, min, max, fallback) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(num)))
}

const splitTime = (value, fallback = '00:00') => {
  const [hour = '00', minute = '00'] = String(value || fallback).split(':')
  return [hour.padStart(2, '0'), minute.padStart(2, '0')]
}

const isValidFiveFieldCron = (cron) => {
  return String(cron || '').trim().split(/\s+/).length === 5
}

const describeCron = (cron) => {
  const parts = String(cron || '').trim().split(/\s+/)
  if (parts.length !== 5) return '未设置'

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  if (/^\*\/\d+$/.test(minute) && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `每隔 ${minute.split('/')[1]} 分钟执行一次`
  }
  if (/^\d+$/.test(minute) && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `每小时第 ${minute} 分钟执行`
  }
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `每天 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} 执行`
  }
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const weekLabel = weekOptions.find((item) => item.value === dayOfWeek)?.label || `周${dayOfWeek}`
    return `每${weekLabel} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} 执行`
  }
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    return `每月 ${dayOfMonth} 号 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} 执行`
  }

  return `自定义 Cron：${cron}`
}

const syncPresetFromCron = (cron) => {
  const parts = String(cron || '').trim().split(/\s+/)
  if (parts.length !== 5) {
    frequencyPreset.value = 'minutes'
    minutesInterval.value = 30
    updateCronFromPreset()
    return
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  if (/^\*\/\d+$/.test(minute) && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    frequencyPreset.value = 'minutes'
    minutesInterval.value = clampNumber(minute.split('/')[1], 1, 59, 30)
  } else if (/^\d+$/.test(minute) && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    frequencyPreset.value = 'hourly'
    hourlyMinute.value = clampNumber(minute, 0, 59, 0)
  } else if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    frequencyPreset.value = 'daily'
    dailyTime.value = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  } else if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    frequencyPreset.value = 'weekly'
    weeklyDay.value = dayOfWeek
    weeklyTime.value = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  } else if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    frequencyPreset.value = 'monthly'
    monthlyDay.value = clampNumber(dayOfMonth, 1, 31, 1)
    monthlyTime.value = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
  } else {
    frequencyPreset.value = 'custom'
    customCron.value = cron
  }
}

// 解析Cron表达式
function updateCronFromPreset() {
  let cron = ''
  switch (frequencyPreset.value) {
    case 'daily':
      { const [dHour, dMin] = splitTime(dailyTime.value, '02:00'); cron = `${dMin} ${dHour} * * *`
      break }
    case 'weekly':
      { const [wHour, wMin] = splitTime(weeklyTime.value, '09:00'); cron = `${wMin} ${wHour} * * ${weeklyDay.value}`
      break }
    case 'monthly':
      { const [mHour, mMin] = splitTime(monthlyTime.value, '10:00'); cron = `${mMin} ${mHour} ${clampNumber(monthlyDay.value, 1, 31, 1)} * *`
      break }
    case 'hourly':
      cron = `${clampNumber(hourlyMinute.value, 0, 59, 0)} * * * *`
      break
    case 'minutes':
      cron = `*/${clampNumber(minutesInterval.value, 1, 59, 30)} * * * *`
      break
    case 'custom':
      cron = customCron.value.trim()
      break
  }
  if (cron) formData.value.cronExpression = cron
}

// 打开 Modal
function open(edit = false, data = null, groups = []) {
  isEdit.value = edit
  allGroups.value = groups // 接收来自 App.vue 的配置组数据

  if (edit && data) {
    formData.value = {
      id: data.id || data.Id,
      taskName: data.taskName || data.TaskName,
      description: data.description || data.Description,
      taskMode: data.taskMode ?? data.TaskMode ?? 1,
      cronExpression: data.cronExpression || data.CronExpression,
      isEnabled: data.isEnabled ?? data.IsEnabled ?? true,
      groupIds: extractGroupIds(data),
    }
    syncPresetFromCron(formData.value.cronExpression)
  } else {
    frequencyPreset.value = 'minutes'
    minutesInterval.value = 30
    formData.value = { id: null, taskName: '', description: '', taskMode: 1, cronExpression: '', isEnabled: true, groupIds: [] }
    updateCronFromPreset()
  }
  visible.value = true
}

function close() { visible.value = false }

async function save() {
  if (!formData.value.taskName.trim()) return message('请填写任务名称')
  const taskMode = Number(formData.value.taskMode)

  if (taskMode === 1 && !isValidFiveFieldCron(formData.value.cronExpression)) {
    return message.error('执行频率必须生成 5 位 Cron 表达式')
  }

  saving.value = true

  const payload = {
    TaskName: formData.value.taskName,
    Description: formData.value.description,
    TaskMode: taskMode,
    CronExpression: taskMode === 1 ? formData.value.cronExpression.trim() : '',
    IsEnabled: formData.value.isEnabled ? 1 : 0,
  }

  try {
    let taskId = formData.value.id

    if (isEdit.value) {
      payload.Id = formData.value.id
      assertSuccess(await api.updateTask(taskId, payload))
    } else {
      const result = assertSuccess(await api.createTask(payload))
      taskId = result?.data ?? result?.Data ?? result
    }

    assertSuccess(await api.assignTaskGroups(taskId, formData.value.groupIds))
    message.success('任务保存成功')
    close()
    emit('saved')
  } catch (error) {
    console.error('任务保存失败:', error)
    message.error(error.message || '任务保存失败')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
/* 弹窗基础布局 */
.scrollable-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px;
}

.task-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-item { margin-bottom: 20px; }
.form-item label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
.form-item label.required::before { content: '*'; color: #ff4d4f; margin-right: 4px; }

.label-with-extra { display: flex; justify-content: space-between; align-items: center; }
.extra-info { font-size: 12px; color: #52c41a; font-weight: normal; }

.custom-segmented {
  position: relative;
  display: flex;
  height: 34px;
  background: #f0f2f5;
  border-radius: 999px;
  padding: 4px;
  overflow: hidden;
}

.custom-segmented__pill {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: #52c41a;
  border-radius: 999px;
  transition: transform 0.25s ease;
  z-index: 1;
}

.custom-segmented__options {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
}

.custom-segmented__option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  user-select: none;
}

.custom-segmented__option--active {
  color: #fff;
  font-weight: 600;
}

/* 配置组选择网格 */
.group-select-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #fbfbfb;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.group-checkbox-card {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.group-checkbox-card:hover {
  border-color: #52c41a;
  background: #f6ffed;
}

.group-checkbox-card.is-checked {
  border-color: #52c41a;
  background: #f6ffed;
}

/* 模拟 Checkbox 样式 */
.checkbox-status {
  width: 18px;
  height: 18px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: all 0.2s;
}

.is-checked .checkbox-status {
  background: #52c41a;
  border-color: #52c41a;
}

.is-checked .checkbox-status .inner-dot {
  width: 8px;
  height: 4px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translateY(-1px);
}

.group-card-name { font-size: 13px; font-weight: 500; color: #333; }
.group-card-meta { font-size: 12px; color: #999; margin-top: 2px; }

/* 其他样式 */
.cron-preview { margin-top: 8px; padding: 8px 12px; background: #f6ffed; border-radius: 4px; border: 1px dashed #b7eb8f; font-size: 12px; }
.cron-desc { color: #52c41a; font-weight: bold; }
.inline-flex { display: flex; align-items: center; gap: 12px; }
.empty-inline { grid-column: span 2; text-align: center; color: #999; padding: 20px; font-size: 13px; }

.task-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.frequency-section {
  margin-bottom: 20px;
}

.frequency-section > label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.frequency-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-input {
  width: 100%;
}

.inline-preset {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #595959;
}

.two-col-preset {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.number-input {
  width: 96px;
}

.cron-input {
  font-family: Consolas, Monaco, monospace;
}

.cron-preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.cron-code {
  color: #64748b;
  font-family: Consolas, Monaco, monospace;
}

.ant-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* 关闭按钮 */
.close-btn { font-size: 20px; color: #999; cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: #666; }
</style>
