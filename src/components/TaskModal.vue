<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 640px">
        <div class="ant-modal-header">
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
                <option value="">-- 选择快捷频率 --</option>
                <option value="daily">每天固定时间</option>
                <option value="weekly">每周几</option>
                <option value="monthly">每月几号</option>
                <option value="hourly">每小时</option>
                <option value="minutes">每 N 分钟</option>
                <option value="custom">自定义 Cron</option>
              </select>

              <div v-if="frequencyPreset === 'daily'" class="preset-input">
                <input type="time" v-model="dailyTime" class="ant-input" @change="updateCronFromPreset" />
              </div>
            </div>
            <div v-if="cronExpression" class="cron-preview">
              <span class="cron-label">当前频率：</span>
              <span class="cron-desc">{{ cronDescription }}</span>
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
                :key="group.id"
                class="group-checkbox-card"
                :class="{ 'is-checked': formData.groupIds.includes(group.id) }"
                @click="toggleGroupSelection(group.id)"
              >
                <div class="checkbox-status">
                  <div class="inner-dot"></div>
                </div>
                <div class="group-card-content">
                  <div class="group-card-name">{{ group.groupName || group.GroupName }}</div>
                  <div class="group-card-meta">{{ group.configCount || 0 }} 个配置项</div>
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
import message from '@/components/index.js'

const emit = defineEmits(['saved'])

// 状态控制
const visible = ref(false)
const isEdit = ref(false)
const allGroups = ref([]) // 由 open 方法从外部传入

// 时间相关
const frequencyPreset = ref('')
const dailyTime = ref('02:00')
const weeklyDay = ref('1')
const weeklyTime = ref('09:00')
const monthlyDay = ref(1)
const monthlyTime = ref('10:00')
const hourlyMinute = ref(0)
const minutesInterval = ref(30)
const customCron = ref('')

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
const cronDescription = computed(() => cronExpression.value ? translateCron(cronExpression.value) : '未设置')

// 切换选择
const toggleGroupSelection = (id) => {
  const index = formData.value.groupIds.indexOf(id)
  if (index > -1) {
    formData.value.groupIds.splice(index, 1)
  } else {
    formData.value.groupIds.push(id)
  }
}

// 解析Cron表达式
function updateCronFromPreset() {
  let cron = ''
  switch (frequencyPreset.value) {
    case 'daily':
      { const [dHour, dMin] = dailyTime.value.split(':'); cron = `${dMin} ${dHour} * * *`
      break }
    case 'weekly':
      { const [wHour, wMin] = weeklyTime.value.split(':'); cron = `${wMin} ${wHour} * * ${weeklyDay.value}`
      break }
    case 'monthly':
      { const [mHour, mMin] = monthlyTime.value.split(':'); cron = `${mMin} ${mHour} ${monthlyDay.value} * *`
      break }
    case 'hourly': cron = `${hourlyMinute.value} * * * *`; break
    case 'minutes': cron = `*/${minutesInterval.value} * * * *`; break
    case 'custom': cron = customCron.value; break
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
      groupIds: data.groupIds || data.GroupIds || [], // 假设后端返回了已关联的ID
    }
  } else {
    formData.value = { id: null, taskName: '', description: '', taskMode: 1, cronExpression: '', isEnabled: true, groupIds: [] }
  }
  visible.value = true
}

function close() { visible.value = false }

async function save() {
  if (!formData.value.taskName.trim()) return message('请填写任务名称')

  const payload = {
    Id: formData.value.id,
    TaskName: formData.value.taskName,
    Description: formData.value.description,
    TaskMode: formData.value.taskMode,
    CronExpression: formData.value.cronExpression,
    IsEnabled: formData.value.isEnabled,
    GroupIds: formData.value.groupIds, // 发送选中的 ID 数组给后端
  }

  console.log('提交任务数据:', payload)
  close()
  emit('saved')
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

.form-item { margin-bottom: 20px; }
.form-item label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
.form-item label.required::before { content: '*'; color: #ff4d4f; margin-right: 4px; }

.label-with-extra { display: flex; justify-content: space-between; align-items: center; }
.extra-info { font-size: 12px; color: #52c41a; font-weight: normal; }

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

/* 关闭按钮 */
.close-btn { font-size: 20px; color: #999; cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: #666; }
</style>
