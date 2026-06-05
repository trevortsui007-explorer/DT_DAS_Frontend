<template>
  <div class="unified-monitor-container">
    <div class="panel-header">
      <div class="mode-switcher time-tester">
        <input
          class="time-input"
          type="datetime-local"
          :value="timeInputValue"
          @change="handleManualTimeChange"
        />
        <button class="time-btn" type="button" @click="shiftReferenceTime(-60)">-1h</button>
        <button class="time-btn" type="button" @click="shiftReferenceTime(-30)">-30m</button>
        <button class="time-btn" type="button" @click="shiftReferenceTime(30)">+30m</button>
        <button class="time-btn" type="button" @click="shiftReferenceTime(60)">+1h</button>
        <button
          class="time-btn reset-btn"
          type="button"
          :disabled="!isTestMode"
          @click="handleResetToNow"
        >
          回到现在
        </button>
      </div>
    </div>

    <div v-if="loading" class="subtitle">数据加载中...</div>
    <div v-else-if="error" class="subtitle">{{ error }}</div>

    <div v-else class="timeline-wrapper">
      <div class="time-labels">
        <span
          v-for="label in timeLabels"
          :key="label.key"
          class="time-label"
          :style="{ left: getXPosition(label.time) }"
        >
          {{ label.label }}
        </span>
      </div>

      <div class="timeline-body" :style="timelineBodyStyle">
        <div class="now-axis">
          <div class="now-tag">NOW {{ nowLabel }}</div>
        </div>

        <div class="grid-lines">
          <div v-for="n in 8" :key="n" class="grid-line"></div>
        </div>

        <div class="tracks-container">
          <div v-for="task in normalizedItems" :key="task.id" class="task-track">
            <div class="track-line"></div>
            <div class="task-name-label" :title="getRuleText(task)">
              {{ task.taskName }}
            </div>

            <div
              v-for="(point, pIdx) in task.points"
              :key="`${task.id}-${point.timestamp}-${pIdx}`"
              class="execution-point"
              :class="[
                point.type === 'history' ? 'point-solid' : 'point-ring',
                getPointStatusClass(point),
                { 'is-error': point.status === 'error' },
              ]"
              :title="getPointTitle(task, point)"
              :style="{
                left: getXPosition(point.time),
                backgroundColor: point.type === 'history' ? getPointColor(task, point) : 'transparent',
                borderColor: task.color,
              }"
              @click="handlePointClick(task, point)"
            >
              <div v-if="point.status === 'error'" class="error-badge"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-legend">
        <div class="legend-item"><span class="dot dot-history"></span>已完成历史</div>
        <div class="legend-item"><span class="dot dot-future"></span>预测计划</div>
        <div v-if="hasErrorPoints" class="legend-item"><span class="dot dot-error"></span>异常记录</div>
        <div class="legend-divider"></div>
        <div v-for="task in normalizedItems" :key="`legend-${task.id}`" class="legend-item">
          <span class="dot" :style="{ backgroundColor: task.color }"></span>
          {{ task.taskName }}
        </div>
      </div>
    </div>

    <div class="stats-footer">
      <button class="stat-card stat-action" type="button" @click="openRunningModal">
        <div class="stat-icon icon-running">▶</div>
        <div class="stat-info">
          <p class="stat-label">当前正在运行</p>
          <p class="stat-value">{{ runningTaskCount }} <span class="unit">个任务活跃中</span></p>
        </div>
      </button>
      <button class="stat-card stat-action highlight" type="button" @click="openNextRunModal">
        <div class="stat-icon icon-predict">🕒</div>
        <div class="stat-info">
          <p class="stat-label">下次采集预计</p>
          <p class="stat-value">
            {{ nextRunTimeLabel }}
            <span class="unit">{{ nextRunRelativeLabel }}</span>
          </p>
        </div>
      </button>
    </div>

    <div class="timeline-modal-mask" :class="{ active: runningModalVisible }" @click="closeRunningModal"></div>
    <div class="timeline-modal-wrap" :class="{ active: runningModalVisible }">
      <div class="timeline-modal">
        <div class="timeline-modal__header">
          <div>
            <h3>当前运行任务</h3>
            <p>启用且已配置执行规则的任务</p>
          </div>
          <button type="button" class="timeline-modal__close" @click="closeRunningModal">×</button>
        </div>
        <div class="timeline-modal__body">
          <div v-if="runningTasks.length" class="task-modal-list">
            <div v-for="task in runningTasks" :key="task.id" class="task-modal-item">
              <div class="task-modal-item__main">
                <span class="task-color" :style="{ backgroundColor: task.color }"></span>
                <strong>{{ task.taskName }}</strong>
              </div>
              <div class="task-modal-item__meta">
                <span>执行规则：{{ getRuleText(task) }}</span>
                <span v-if="getTaskNextTime(task)">下次：{{ getTaskNextTime(task) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="timeline-modal-empty">暂无运行中的任务</div>
        </div>
      </div>
    </div>

    <div class="timeline-modal-mask" :class="{ active: nextRunModalVisible }" @click="closeNextRunModal"></div>
    <div class="timeline-modal-wrap" :class="{ active: nextRunModalVisible }">
      <div class="timeline-modal">
        <div class="timeline-modal__header">
          <div>
            <h3>下次采集时段</h3>
            <p>{{ nextRunModalSubtitle }}</p>
          </div>
          <button type="button" class="timeline-modal__close" @click="closeNextRunModal">×</button>
        </div>
        <div class="timeline-modal__body">
          <div v-if="nextRunTasks.length" class="task-modal-list">
            <div v-for="task in nextRunTasks" :key="task.id" class="task-modal-item">
              <div class="task-modal-item__main">
                <span class="task-color" :style="{ backgroundColor: task.color }"></span>
                <strong>{{ task.taskName }}</strong>
                <span class="next-run-tag">{{ nextRunTimeLabel }}</span>
              </div>
              <div class="task-modal-item__meta">
                <span>执行规则：{{ getRuleText(task) }}</span>
                <span>{{ nextRunRelativeLabel }}</span>
              </div>
            </div>
          </div>
          <div v-else class="timeline-modal-empty">暂无下一时段采集计划</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { translateCron } from '@/utils/cron'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  maxHeight: Number,
  referenceTime: {
    type: [Date, String, Number],
    default: null,
  },
  isTestMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open-log', 'set-reference-time', 'reset-reference-time'])

const DEFAULT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#14b8a6',
  '#6366f1',
  '#ef4444',
]

const fallbackNow = ref(new Date())
const timer = ref(null)
const rangeMinutes = 240
const timeInputValue = ref('')
const runningModalVisible = ref(false)
const nextRunModalVisible = ref(false)

const toDate = (value) => {
  if (!value && value !== 0) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const pad2 = (value) => String(value).padStart(2, '0')

const toDateTimeLocalValue = (value) => {
  const date = toDate(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hour = pad2(date.getHours())
  const minute = pad2(date.getMinutes())
  return `${year}-${month}-${day}T${hour}:${minute}`
}

const formatHHmm = (value) => {
  const date = toDate(value)
  if (!date) return '--:--'
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

const hashColor = (name, index) => {
  const key = String(name || index || '')
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length]
}

const activeNow = computed(() => toDate(props.referenceTime) || fallbackNow.value)

watch(
  () => activeNow.value,
  (value) => {
    timeInputValue.value = toDateTimeLocalValue(value)
  },
  { immediate: true },
)

const normalizePoint = (point, nowTs) => {
  const sourceTime = point?.time ?? point?.timestamp
  const date = toDate(sourceTime)
  if (!date) return null

  const timestamp = date.getTime()
  let type = point?.type

  if (type !== 'history' && type !== 'prediction') {
    if (point?.kind === 'past') type = 'history'
    else if (point?.kind === 'future' || point?.kind === 'next') type = 'prediction'
    else type = timestamp <= nowTs ? 'history' : 'prediction'
  }

  return {
    timestamp,
    time: date,
    type,
    kind: point?.kind ?? '',
    status: point?.status ?? null,
    taskLogId: point?.taskLogId || '',
    label: point?.label || '',
  }
}

const normalizedItems = computed(() => {
  const nowTs = activeNow.value.getTime()

  return (props.items || [])
    .map((rawTask, index) => {
      const id = rawTask?.id ?? rawTask?.Id ?? `task-${index + 1}`
      const taskName = rawTask?.taskName || rawTask?.TaskName || `任务 ${index + 1}`
      const isEnabled = rawTask?.isEnabled ?? rawTask?.IsEnabled ?? false
      const cronExpression = String(rawTask?.cronExpression || rawTask?.CronExpression || '').trim()
      const color = rawTask?.color || hashColor(taskName || id, index)

      const sourcePoints = Array.isArray(rawTask?.points)
        ? rawTask.points
        : Array.isArray(rawTask?.rollingPoints)
          ? rawTask.rollingPoints
          : []

      const points = sourcePoints
        .map((point) => normalizePoint(point, nowTs))
        .filter(Boolean)
        .sort((a, b) => a.timestamp - b.timestamp)

      return {
        id,
        taskName,
        isEnabled,
        cronExpression,
        color,
        points,
        nextPoint: rawTask?.nextPoint || null,
      }
    })
    .filter((task) => task.cronExpression || task.points.length > 0)
})

onMounted(() => {
  timer.value = setInterval(() => {
    fallbackNow.value = new Date()
  }, 60000)
})

onBeforeUnmount(() => {
  clearInterval(timer.value)
})

const nowLabel = computed(() => {
  return activeNow.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const getXPosition = (targetTime) => {
  const timeObj = toDate(targetTime)
  if (!timeObj) return '0%'

  const diffMinutes = (timeObj.getTime() - activeNow.value.getTime()) / 60000
  const position = 50 + (diffMinutes / rangeMinutes) * 50
  const clamped = Math.min(100, Math.max(0, position))
  return `${clamped}%`
}

const timeLabels = computed(() => {
  const labels = []
  const startHour = new Date(activeNow.value)
  startHour.setMinutes(0, 0, 0)

  for (let i = -3; i <= 3; i += 1) {
    const t = new Date(startHour.getTime() + i * 3600000)
    labels.push({
      key: t.getTime(),
      time: t,
      label: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  }

  return labels
})

const hasErrorPoints = computed(() =>
  normalizedItems.value.some((task) => task.points.some((point) => point.status === 'error')),
)

const timelineBodyStyle = computed(() => {
  const preferredHeight = Math.max(168, 72 + normalizedItems.value.length * 38)
  const maxHeight = Number(props.maxHeight || 240)
  return {
    height: `${Math.min(preferredHeight, Math.max(maxHeight, 168))}px`,
  }
})

const runningTasks = computed(() =>
  normalizedItems.value.filter((task) => task.isEnabled && task.cronExpression),
)

const runningTaskCount = computed(() => runningTasks.value.length)

const nextRunInfo = computed(() => {
  const nowTs = activeNow.value.getTime()
  const candidates = []

  normalizedItems.value.forEach((task) => {
    task.points.forEach((point) => {
      if (point.type === 'prediction' && point.timestamp >= nowTs) {
        candidates.push(point.timestamp)
      }
    })

    if (task.nextPoint?.timestamp && task.nextPoint.timestamp >= nowTs) {
      candidates.push(task.nextPoint.timestamp)
    }
  })

  if (candidates.length === 0) return null
  const timestamp = Math.min(...candidates)
  return {
    timestamp,
    time: formatHHmm(timestamp),
    diffMinutes: Math.max(0, Math.round((timestamp - nowTs) / 60000)),
  }
})

const nextRunTasks = computed(() => {
  if (!nextRunInfo.value) return []
  const targetTs = nextRunInfo.value.timestamp

  return normalizedItems.value.filter((task) => {
    if (!task.isEnabled) return false

    const hasMatchedPoint = task.points.some(
      (point) => point.type === 'prediction' && point.timestamp === targetTs,
    )

    const nextPointTs = task.nextPoint?.timestamp || 0
    return hasMatchedPoint || nextPointTs === targetTs
  })
})

const nextRunTimeLabel = computed(() => {
  if (!nextRunInfo.value) return '--:--'
  return nextRunInfo.value.time
})

const nextRunRelativeLabel = computed(() => {
  if (!nextRunInfo.value) return '(暂无计划)'
  if (nextRunInfo.value.diffMinutes === 0) return '(即将执行)'
  return `(${nextRunInfo.value.diffMinutes}分钟后)`
})

const nextRunModalSubtitle = computed(() => {
  if (!nextRunInfo.value) return '当前没有可预测的下一时段'
  const date = toDate(nextRunInfo.value.timestamp)
  const dateText = date
    ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${formatHHmm(date)}`
    : nextRunTimeLabel.value
  return `${dateText} ${nextRunRelativeLabel.value}`
})

const getRuleText = (task) => {
  if (!task?.cronExpression) return '未配置规则'
  return translateCron(task.cronExpression)
}

const getPointColor = (task, point) => {
  if (point.status === 'error') return '#ef4444'
  if (point.status === 'warning') return '#f59e0b'
  if (point.status === 'running') return '#3b82f6'
  if (point.status === 'success') return '#10b981'
  return task.color
}

const getPointStatusClass = (point) => {
  if (point.type !== 'history') return ''
  if (point.status === 'error') return 'point-status-error'
  if (point.status === 'warning') return 'point-status-warning'
  if (point.status === 'running') return 'point-status-running'
  if (point.status === 'success') return 'point-status-success'
  return 'point-status-default'
}

const getPointTitle = (task, point) => {
  const timeText = formatHHmm(point.time)
  const typeText = point.type === 'history' ? '历史记录' : '预测计划'
  const labelText = point.label ? ` · ${point.label}` : ''
  return `${task.taskName} · ${typeText} · ${timeText}${labelText}`
}

const getTaskNextTime = (task) => {
  const nowTs = activeNow.value.getTime()
  const candidates = []

  task.points.forEach((point) => {
    if (point.type === 'prediction' && point.timestamp >= nowTs) {
      candidates.push(point.timestamp)
    }
  })

  if (task.nextPoint?.timestamp && task.nextPoint.timestamp >= nowTs) {
    candidates.push(task.nextPoint.timestamp)
  }

  if (!candidates.length) return ''
  return formatHHmm(Math.min(...candidates))
}

const handlePointClick = (task, point) => {
  if (point.type !== 'history') return

  emit('open-log', {
    taskId: task.id,
    taskName: task.taskName,
    taskLogId: point.taskLogId || '',
    timestamp: point.timestamp,
    type: 'history',
    status: point.status || null,
  })
}

const handleManualTimeChange = (event) => {
  const value = event?.target?.value || ''
  timeInputValue.value = value
  const date = toDate(value)
  if (!date) return
  emit('set-reference-time', date)
}

const shiftReferenceTime = (minutes) => {
  const base = toDate(props.referenceTime) || activeNow.value
  const next = new Date(base.getTime() + minutes * 60000)
  timeInputValue.value = toDateTimeLocalValue(next)
  emit('set-reference-time', next)
}

const handleResetToNow = () => {
  emit('reset-reference-time')
}

const openRunningModal = () => {
  runningModalVisible.value = true
}

const closeRunningModal = () => {
  runningModalVisible.value = false
}

const openNextRunModal = () => {
  nextRunModalVisible.value = true
}

const closeNextRunModal = () => {
  nextRunModalVisible.value = false
}
</script>

<style scoped>
.unified-monitor-container {
  background: #ffffff;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 14px 18px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.panel-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 4px 0 0;
}

.mode-switcher {
  display: flex;
  background: #f8fafc;
  padding: 5px;
  border: 1px solid #eef2f7;
  border-radius: 10px;
}

.timeline-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.time-labels {
  position: relative;
  height: 20px;
  margin-bottom: 10px;
}

.time-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.timeline-body {
  position: relative;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow: hidden;
}

.now-axis {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #3b82f6;
  z-index: 10;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.now-tag {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: bold;
  line-height: 1.2;
  z-index: 20;
  pointer-events: none;
}

.grid-lines {
  position: absolute;
  inset: 0;
  display: flex;
}

.grid-line {
  flex: 1;
  border-right: 1px solid #e9eef5;
}

.tracks-container {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 10px 0;
}

.task-track {
  position: relative;
  height: 40px;
  width: 100%;
}

.track-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.task-name-label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.execution-point {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 5;
}

.execution-point:hover {
  transform: translate(-50%, -50%) scale(1.5);
  z-index: 20;
}

.point-solid {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.point-ring {
  background: transparent !important;
  border-width: 2px;
  border-style: dashed;
}

.point-status-success {
  background: #10b981 !important;
}

.point-status-warning {
  background: #f59e0b !important;
}

.point-status-running {
  background: #3b82f6 !important;
}

.point-status-error {
  background: #ef4444 !important;
}

.point-status-default {
  background: #94a3b8 !important;
}

.error-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  border: 1px solid white;
}

.timeline-legend {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-divider {
  width: 1px;
  height: 14px;
  background: #e2e8f0;
  margin: 0 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-history {
  background: #94a3b8;
}

.dot-future {
  border: 2px dashed #94a3b8;
}

.dot-error {
  background: #ef4444;
}

.stats-footer {
  display: flex;
  gap: 16px;
}

.stat-card {
  flex: 1;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #eef2f7;
}

.stat-action {
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.stat-action:hover {
  border-color: #86efac;
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.12);
  transform: translateY(-1px);
}

.stat-card.highlight {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.icon-running {
  background: #dcfce7;
  color: #16a34a;
}

.icon-predict {
  background: #e0f2fe;
  color: #0284c7;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin: 0;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 2px 0 0;
}

.unit {
  font-size: 12px;
  font-weight: normal;
  color: #94a3b8;
}

.time-tester {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.time-input {
  height: 30px;
  border: 1px solid #d8dee9;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  color: #334155;
  background: #fff;
}

.time-btn {
  height: 30px;
  border: 1px solid #d8dee9;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  color: #475569;
  background: #fff;
  cursor: pointer;
}

.time-btn:hover {
  border-color: #3b82f6;
  color: #1d4ed8;
}

.time-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.reset-btn {
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.timeline-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.45);
  display: none;
}

.timeline-modal-mask.active {
  display: block;
}

.timeline-modal-wrap {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.timeline-modal-wrap.active {
  display: flex;
}

.timeline-modal {
  width: min(620px, 100%);
  max-height: 72vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.timeline-modal__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid #eef2f7;
}

.timeline-modal__header h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.timeline-modal__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}

.timeline-modal__close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #475569;
  font-size: 20px;
  cursor: pointer;
}

.timeline-modal__close:hover {
  background: #f1f5f9;
}

.timeline-modal__body {
  max-height: calc(72vh - 84px);
  overflow-y: auto;
  padding: 16px 20px 20px;
}

.task-modal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-modal-item {
  border: 1px solid #eef2f7;
  border-radius: 10px;
  padding: 12px;
  background: #f8fafc;
}

.task-modal-item__main {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}

.task-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-modal-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 8px;
  padding-left: 18px;
  color: #64748b;
  font-size: 12px;
}

.next-run-tag {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
}

.timeline-modal-empty {
  padding: 28px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
</style>
