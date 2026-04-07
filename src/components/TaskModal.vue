<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 600px;">
        <div class="ant-modal-header">
          <span class="ant-modal-title">{{ isEdit ? '编辑任务' : '新建任务' }}</span>
          <span style="cursor:pointer; float:right;" @click="close">×</span>
        </div>
        <div class="ant-modal-body">
          <input type="hidden" v-model="formData.id" />

          <div class="form-item">
            <label><span style="color:red;">*</span> 任务名称</label>
            <input type="text" class="ant-input" v-model="formData.taskName" placeholder="请输入任务名称" />
          </div>

          <div class="form-item" style="margin-top:16px;">
            <label>描述</label>
            <textarea class="ant-input" v-model="formData.description" rows="2" placeholder="可选，描述任务用途"></textarea>
          </div>

          <!-- 任务模式胶囊（独立样式） -->
          <div class="form-item" style="margin-top:16px;">
            <label>任务模式</label>
            <div class="custom-segmented">
              <div class="custom-segmented__pill" :style="{ transform: `translateX(${modePillLeft})` }"></div>
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

          <!-- 周期执行：频率设置 -->
          <div v-if="formData.taskMode === 1" class="form-item" style="margin-top:16px;">
            <label>执行频率</label>
            <div class="frequency-selector">
              <select v-model="frequencyPreset" class="ant-input" style="width: 100%;">
                <option value="">-- 选择快捷频率 --</option>
                <option value="daily">每天固定时间</option>
                <option value="weekly">每周几</option>
                <option value="monthly">每月几号</option>
                <option value="hourly">每小时</option>
                <option value="minutes">每 N 分钟</option>
                <option value="custom">自定义 Cron</option>
              </select>

              <!-- 根据预设显示额外输入 -->
              <div v-if="frequencyPreset === 'daily'" style="margin-top: 12px;">
                <label>执行时间 (HH:mm)</label>
                <input type="time" v-model="dailyTime" class="ant-input" @change="updateCronFromPreset" />
              </div>
              <div v-else-if="frequencyPreset === 'weekly'" style="margin-top: 12px;">
                <label>选择星期几</label>
                <select v-model="weeklyDay" class="ant-input" @change="updateCronFromPreset">
                  <option value="1">星期一</option>
                  <option value="2">星期二</option>
                  <option value="3">星期三</option>
                  <option value="4">星期四</option>
                  <option value="5">星期五</option>
                  <option value="6">星期六</option>
                  <option value="0">星期日</option>
                </select>
                <label style="margin-top:8px;">执行时间 (HH:mm)</label>
                <input type="time" v-model="weeklyTime" class="ant-input" @change="updateCronFromPreset" />
              </div>
              <div v-else-if="frequencyPreset === 'monthly'" style="margin-top: 12px;">
                <label>每月几号 (1-31)</label>
                <input type="number" v-model="monthlyDay" min="1" max="31" class="ant-input" @change="updateCronFromPreset" />
                <label style="margin-top:8px;">执行时间 (HH:mm)</label>
                <input type="time" v-model="monthlyTime" class="ant-input" @change="updateCronFromPreset" />
              </div>
              <div v-else-if="frequencyPreset === 'hourly'" style="margin-top: 12px;">
                <label>分钟 (0-59)</label>
                <input type="number" v-model="hourlyMinute" min="0" max="59" class="ant-input" @change="updateCronFromPreset" />
              </div>
              <div v-else-if="frequencyPreset === 'minutes'" style="margin-top: 12px;">
                <label>每隔多少分钟 (1-59)</label>
                <input type="number" v-model="minutesInterval" min="1" max="59" class="ant-input" @change="updateCronFromPreset" />
              </div>
              <div v-else-if="frequencyPreset === 'custom'" style="margin-top: 12px;">
                <label>Cron 表达式</label>
                <input type="text" v-model="cronExpression" class="ant-input" placeholder="例如: 0 2 * * *" @input="syncCronFromInput" />
              </div>
            </div>
            <!-- 显示当前 Cron 的可读描述 -->
            <div v-if="cronExpression" class="cron-preview">
              <span class="cron-label">当前频率：</span>
              <span class="cron-desc">{{ cronDescription }}</span>
            </div>
          </div>

          <!-- 状态开关 -->
          <div class="form-item" style="margin-top:16px;">
            <label>状态</label>
            <label class="toggle-switch" style="display: block;">
              <input type="checkbox" v-model="formData.isEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" @click="close">取消</button>
          <button class="ant-btn ant-btn-primary" @click="save">保存任务</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { translateCron } from '@/utils/cron'

const emit = defineEmits(['saved'])

const visible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: null,
  taskName: '',
  description: '',
  taskMode: 1,      // 0: 常规任务, 1: 周期执行
  cronExpression: '',
  isEnabled: true
})

const taskModes = [
  { value: 0, label: '常规任务' },
  { value: 1, label: '周期执行' }
]

const modePillLeft = computed(() => {
  const index = taskModes.findIndex(m => m.value === formData.value.taskMode)
  return `${index * 100}%`  // 两个选项，每个占100%宽度，通过translateX移动
})

// 频率预设相关
const frequencyPreset = ref('')
const dailyTime = ref('02:00')
const weeklyDay = ref('1')
const weeklyTime = ref('09:00')
const monthlyDay = ref(1)
const monthlyTime = ref('10:00')
const hourlyMinute = ref(0)
const minutesInterval = ref(30)
const customCron = ref('')

const cronExpression = computed({
  get: () => formData.value.cronExpression,
  set: (val) => { formData.value.cronExpression = val }
})

const cronDescription = computed(() => {
  if (!cronExpression.value) return '未设置'
  return translateCron(cronExpression.value)
})

// 根据预设更新 cron
function updateCronFromPreset() {
  let cron = ''
  switch (frequencyPreset.value) {
    case 'daily':
      if (dailyTime.value) {
        const [hour, minute] = dailyTime.value.split(':')
        cron = `${minute} ${hour} * * *`
      }
      break
    case 'weekly':
      if (weeklyTime.value) {
        const [hour, minute] = weeklyTime.value.split(':')
        cron = `${minute} ${hour} * * ${weeklyDay.value}`
      }
      break
    case 'monthly':
      if (monthlyTime.value && monthlyDay.value) {
        const [hour, minute] = monthlyTime.value.split(':')
        cron = `${minute} ${hour} ${monthlyDay.value} * *`
      }
      break
    case 'hourly':
      cron = `${hourlyMinute.value} * * * *`
      break
    case 'minutes':
      cron = `*/${minutesInterval.value} * * * *`
      break
    case 'custom':
      cron = customCron.value
      break
    default:
      return
  }
  if (cron) {
    formData.value.cronExpression = cron
  }
}

function syncCronFromInput() {
  frequencyPreset.value = 'custom'
  customCron.value = cronExpression.value
}

function open(edit = false, data = null) {
  isEdit.value = edit
  if (edit && data) {
    formData.value = {
      id: data.id || data.Id || null,
      taskName: data.taskName || data.TaskName || '',
      description: data.description || data.Description || '',
      taskMode: (data.taskMode ?? data.TaskMode) !== undefined ? (data.taskMode ?? data.TaskMode) : 1,
      cronExpression: data.cronExpression || data.CronExpression || '',
      isEnabled: data.isEnabled !== undefined ? data.isEnabled : (data.IsEnabled ?? true)
    }
    // 尝试解析现有 cron 到预设（简化，不实现自动匹配，用户可手动选择预设）
  } else {
    formData.value = {
      id: null,
      taskName: '',
      description: '',
      taskMode: 1,
      cronExpression: '',
      isEnabled: true
    }
    frequencyPreset.value = ''
  }
  visible.value = true
}

function close() {
  visible.value = false
}

async function save() {
  if (!formData.value.taskName.trim()) {
    alert('请填写任务名称')
    return
  }
  if (formData.value.taskMode === 1 && !formData.value.cronExpression) {
    alert('请设置执行频率')
    return
  }

  const payload = {
    TaskName: formData.value.taskName,
    Description: formData.value.description,
    TaskMode: formData.value.taskMode,
    CronExpression: formData.value.cronExpression,
    IsEnabled: formData.value.isEnabled
  }
  if (isEdit.value && formData.value.id) {
    payload.Id = formData.value.id
  }

  // TODO: 替换为真实 API
  console.log('保存任务', payload)
  alert('任务保存成功！（实际项目中请替换为接口调用）')
  close()
  emit('saved')
}

defineExpose({ open })
</script>

<style scoped>
/* 独立胶囊样式，不依赖全局 */
.custom-segmented {
  position: relative;
  display: flex;
  background-color: #f0f2f5;
  border-radius: 9999px;
  padding: 4px;
  height: 36px;
  width: 100%;
}
.custom-segmented__pill {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  width: calc(50% - 4px);
  background-color: var(--ant-primary, #52c41a);
  border-radius: 9999px;
  transition: transform 0.35s cubic-bezier(0.645, 0.045, 0.355, 1);
  z-index: 1;
}
.custom-segmented__options {
  display: flex;
  position: relative;
  z-index: 2;
  width: 100%;
}
.custom-segmented__option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--ant-text-secondary, #8c8c8c);
  cursor: pointer;
  transition: color 0.3s ease;
  border-radius: 9999px;
  user-select: none;
}
.custom-segmented__option--active {
  color: #ffffff;
  font-weight: 600;
}

.frequency-selector {
  margin-top: 8px;
}
.cron-preview {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f6f6f6;
  border-radius: 6px;
  font-size: 13px;
}
.cron-label {
  font-weight: 500;
  color: #333;
}
.cron-desc {
  color: #1677ff;
  margin-left: 8px;
}
</style>
