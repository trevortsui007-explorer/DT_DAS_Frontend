<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h3 class="dashboard-title">实时数据监控</h3>
      <span v-if="error" class="dashboard-error">{{ error }}</span>
    </div>

    <div class="metric-strip">
      <div class="metric-card metric-card--success">
        <span class="metric-icon">✓</span>
        <div class="metric-main">
          <span class="metric-label">采集成功率</span>
          <strong>{{ successRate }}%</strong>
          <small>{{ successConfigs }} / {{ processedConfigs }} 个配置成功</small>
          <span class="metric-bar"><i :style="{ width: `${successRate}%` }"></i></span>
        </div>
      </div>
      <div class="metric-card metric-card--blue">
        <span class="metric-icon">↻</span>
        <div class="metric-main">
          <span class="metric-label">最近采集</span>
          <strong>{{ recentRuns }}</strong>
          <small>日志中心最近 {{ normalizedLogs.length }} 条记录</small>
          <span class="metric-bar"><i :style="{ width: recentRunsBarWidth }"></i></span>
        </div>
      </div>
      <div class="metric-card metric-card--warning">
        <span class="metric-icon">!</span>
        <div class="metric-main">
          <span class="metric-label">失败配置</span>
          <strong>{{ failedConfigs }}</strong>
          <small>{{ failedRuns }} 次任务异常</small>
          <span class="metric-bar"><i :style="{ width: failureBarWidth }"></i></span>
        </div>
      </div>
      <div class="metric-card metric-card--violet">
        <span class="metric-icon">#</span>
        <div class="metric-main">
          <span class="metric-label">运行资源</span>
          <strong>{{ enabledTaskCount }}</strong>
          <small>{{ stats.groups || 0 }} 组 / {{ stats.configs || 0 }} 项配置</small>
          <span class="metric-bar"><i :style="{ width: resourceBarWidth }"></i></span>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <section class="chart-card chart-card--health">
        <div class="chart-card__header">
          <h4>采集健康度</h4>
          <span :class="['health-badge', healthLevel.className]">{{ healthLevel.label }}</span>
        </div>
        <div ref="healthChartRef" class="chart chart--compact"></div>
      </section>

      <section class="chart-card chart-card--wide">
        <div class="chart-card__header">
          <h4>近次采集吞吐</h4>
          <span class="chart-hint">成功 / 失败配置数</span>
        </div>
        <div v-if="!loading && throughputData.length === 0" class="state-panel">暂无任务日志数据</div>
        <div v-else ref="throughputChartRef" class="chart"></div>
      </section>

      <section class="chart-card">
        <div class="chart-card__header">
          <h4>失败热点</h4>
          <span class="chart-hint">按任务聚合</span>
        </div>
        <div v-if="!loading && failureHotspots.length === 0" class="state-panel">暂无失败记录</div>
        <div v-else ref="failureChartRef" class="chart"></div>
      </section>

      <section class="chart-card activity-card">
        <div class="chart-card__header">
          <h4>最新采集记录</h4>
          <span class="chart-hint">来自日志中心</span>
        </div>
        <div v-if="loading" class="state-text">总览数据加载中...</div>
        <ul v-else-if="activityItems.length > 0" class="activity-list">
          <li v-for="item in activityItems" :key="item.key" :class="['activity-item', item.level]">
            <span class="activity-dot"></span>
            <div class="activity-main">
              <div class="activity-line">
                <strong>{{ item.title }}</strong>
                <span>{{ item.time }}</span>
              </div>
              <p>{{ item.text }}</p>
            </div>
          </li>
        </ul>
        <div v-else class="state-text">暂无动态数据</div>
      </section>

      <section class="chart-card insight-card">
        <div class="chart-card__header">
          <h4>任务排班概览</h4>
          <span class="chart-hint">任务启用与模式</span>
        </div>
        <div class="insight-grid">
          <div class="insight-item">
            <span>启用任务</span>
            <strong>{{ taskInsight.enabled }}</strong>
          </div>
          <div class="insight-item">
            <span>暂停任务</span>
            <strong>{{ taskInsight.disabled }}</strong>
          </div>
          <div class="insight-item">
            <span>周期任务</span>
            <strong>{{ taskInsight.scheduled }}</strong>
          </div>
          <div class="insight-item">
            <span>常规任务</span>
            <strong>{{ taskInsight.manual }}</strong>
          </div>
        </div>
        <div class="health-row">
          <span>任务启用率</span>
          <div class="health-track"><i :style="{ width: `${taskInsight.enabledRate}%` }"></i></div>
          <b>{{ taskInsight.enabledRate }}%</b>
        </div>
        <p class="insight-note">{{ taskInsight.summary }}</p>
      </section>

      <section class="chart-card insight-card">
        <div class="chart-card__header">
          <h4>配置覆盖情况</h4>
          <span class="chart-hint">文件类型与启用状态</span>
        </div>
        <div class="config-cover">
          <div class="cover-number">
            <strong>{{ configInsight.enabled }}</strong>
            <span>启用配置 / 共 {{ stats.configs || 0 }} 项</span>
          </div>
          <div class="health-row">
            <span>配置启用率</span>
            <div class="health-track"><i :style="{ width: `${configInsight.enabledRate}%` }"></i></div>
            <b>{{ configInsight.enabledRate }}%</b>
          </div>
          <div class="file-type-list">
            <span
              v-for="item in configInsight.fileTypes"
              :key="item.name"
              class="file-type-chip"
            >
              {{ item.name }} · {{ item.value }}
            </span>
            <span v-if="configInsight.fileTypes.length === 0" class="empty-chip">暂无文件类型</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  statusDistribution: {
    type: Array,
    default: () => [],
  },
  taskLogs: {
    type: Array,
    default: () => [],
  },
  tasks: {
    type: Array,
    default: () => [],
  },
  configs: {
    type: Array,
    default: () => [],
  },
  stats: {
    type: Object,
    default: () => ({ tasks: 0, groups: 0, configs: 0 }),
  },
  loading: Boolean,
  error: {
    type: String,
    default: '',
  },
})

const healthChartRef = ref(null)
const throughputChartRef = ref(null)
const failureChartRef = ref(null)
let healthChart = null
let throughputChart = null
let failureChart = null

const normalizeStatus = (status) => String(status || '').replace(/\s+/g, '').toLowerCase()

const getNumber = (...values) => {
  for (const value of values) {
    const num = Number(value)
    if (Number.isFinite(num)) return num
  }
  return 0
}

const getField = (source, keys, fallback = '') => {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (num) => String(num).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const normalizedLogs = computed(() =>
  (props.taskLogs || [])
    .map((raw, index) => {
      const startTime = getField(raw, ['startTime', 'StartTime'])
      const endTime = getField(raw, ['endTime', 'EndTime'])
      const successCount = getNumber(raw.successCount, raw.SuccessCount)
      const failureCount = getNumber(raw.failureCount, raw.FailureCount)

      return {
        key: getField(raw, ['taskLogId', 'TaskLogId', 'id', 'Id'], `log-${index}`),
        taskName: getField(raw, ['taskName', 'TaskName'], getField(raw, ['taskCode', 'TaskCode'], '未命名任务')),
        status: getField(raw, ['status', 'Status'], ''),
        startTime,
        endTime,
        timestamp: new Date(startTime || endTime || 0).getTime(),
        totalConfigs: getNumber(raw.totalConfigs, raw.TotalConfigs),
        successCount,
        failureCount,
        processedCount: getNumber(raw.processedCount, raw.ProcessedCount, successCount + failureCount),
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp),
)

const processedConfigs = computed(() =>
  normalizedLogs.value.reduce((sum, log) => sum + log.successCount + log.failureCount, 0),
)
const successConfigs = computed(() => normalizedLogs.value.reduce((sum, log) => sum + log.successCount, 0))
const failedConfigs = computed(() => normalizedLogs.value.reduce((sum, log) => sum + log.failureCount, 0))
const failedRuns = computed(() =>
  normalizedLogs.value.filter((log) => ['failed', 'partialsuccess'].includes(normalizeStatus(log.status))).length,
)
const recentRuns = computed(() => normalizedLogs.value.length)
const successRate = computed(() => {
  if (processedConfigs.value <= 0) return 100
  return Math.round((successConfigs.value / processedConfigs.value) * 100)
})

const recentRunsBarWidth = computed(() => `${Math.min(100, recentRuns.value * 12)}%`)
const failureBarWidth = computed(() => {
  if (processedConfigs.value <= 0) return '0%'
  return `${Math.min(100, Math.round((failedConfigs.value / processedConfigs.value) * 100))}%`
})
const resourceBarWidth = computed(() => {
  const total = Number(props.stats.tasks || 0)
  if (total <= 0) return '0%'
  return `${Math.round((enabledTaskCount.value / total) * 100)}%`
})

const enabledTaskCount = computed(() =>
  props.statusDistribution
    .filter((item) => String(item.name || '').includes('启用'))
    .reduce((sum, item) => sum + Number(item.value || 0), 0),
)

const healthLevel = computed(() => {
  if (failedConfigs.value > 0 || failedRuns.value > 0) return { label: '需关注', className: 'warning' }
  if (recentRuns.value === 0) return { label: '待采集', className: 'muted' }
  return { label: '稳定', className: 'success' }
})

const throughputData = computed(() =>
  normalizedLogs.value
    .slice(0, 12)
    .reverse()
    .map((log) => ({
      name: formatDateTime(log.startTime || log.endTime),
      taskName: log.taskName,
      success: log.successCount,
      failed: log.failureCount,
      total: log.totalConfigs || log.processedCount,
    })),
)

const failureHotspots = computed(() => {
  const map = new Map()

  normalizedLogs.value.forEach((log) => {
    const failed = log.failureCount || (normalizeStatus(log.status) === 'failed' ? 1 : 0)
    if (failed <= 0) return
    map.set(log.taskName, (map.get(log.taskName) || 0) + failed)
  })

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
})

const activityItems = computed(() => {
  return normalizedLogs.value.slice(0, 6).map((log) => {
    const status = normalizeStatus(log.status)
    const level = status === 'failed' ? 'error' : status === 'partialsuccess' ? 'warning' : status === 'running' ? 'info' : 'success'
    const resultText =
      log.failureCount > 0
        ? `成功 ${log.successCount}，失败 ${log.failureCount}`
        : `完成 ${log.successCount || log.processedCount || 0} 个配置`

    return {
      key: log.key,
      title: log.taskName,
      time: formatDateTime(log.startTime || log.endTime),
      text: `${log.status || '已记录'} · ${resultText}`,
      level,
    }
  })
})

const isEnabled = (item) => {
  const value = item?.isEnabled ?? item?.IsEnabled
  return value === true || value === 1 || value === '1'
}

const taskInsight = computed(() => {
  const total = props.tasks.length
  const enabled = props.tasks.filter(isEnabled).length
  const scheduled = props.tasks.filter((task) => Number(task?.taskMode ?? task?.TaskMode) === 1).length
  const manual = Math.max(0, total - scheduled)
  const enabledRate = total > 0 ? Math.round((enabled / total) * 100) : 0

  return {
    enabled,
    disabled: Math.max(0, total - enabled),
    scheduled,
    manual,
    enabledRate,
    summary:
      total > 0
        ? `当前 ${scheduled} 个周期任务负责自动采集，${enabled} 个任务处于启用状态。`
        : '暂无任务数据，创建任务后会在这里形成排班概览。',
  }
})

const configInsight = computed(() => {
  const total = props.configs.length
  const enabled = props.configs.filter(isEnabled).length
  const typeMap = new Map()

  props.configs.forEach((config) => {
    const rawType = String(config?.fileType || config?.FileType || '').trim()
    const type = rawType || '未知'
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })

  return {
    enabled,
    enabledRate: total > 0 ? Math.round((enabled / total) * 100) : 0,
    fileTypes: Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  }
})

const renderHealthChart = () => {
  if (!healthChartRef.value) return
  if (!healthChart) healthChart = echarts.init(healthChartRef.value)

  healthChart.setOption({
    series: [
      {
        type: 'gauge',
        radius: '92%',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        pointer: { show: false },
        progress: {
          show: true,
          width: 16,
          roundCap: true,
          itemStyle: { color: successRate.value >= 90 ? '#10b981' : '#f59e0b' },
        },
        axisLine: {
          roundCap: true,
          lineStyle: { width: 16, color: [[1, '#e5edf5']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#0f172a',
          fontSize: 30,
          fontWeight: 800,
          offsetCenter: [0, '8%'],
        },
        title: {
          offsetCenter: [0, '44%'],
          color: '#64748b',
          fontSize: 12,
        },
        data: [{ value: successRate.value, name: '配置成功率' }],
      },
    ],
  })
}

const renderThroughputChart = () => {
  if (!throughputChartRef.value) return
  if (!throughputChart) throughputChart = echarts.init(throughputChartRef.value)

  throughputChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items) => {
        const point = throughputData.value[items?.[0]?.dataIndex] || {}
        return `${point.taskName || ''}<br/>成功：${point.success || 0}<br/>失败：${point.failed || 0}`
      },
    },
    legend: {
      top: 0,
      right: 8,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#64748b', fontSize: 12 },
    },
    grid: { left: 36, right: 16, top: 38, bottom: 30 },
    xAxis: {
      type: 'category',
      data: throughputData.value.map((item) => item.name),
      axisLine: { lineStyle: { color: '#dbe3ef' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#edf2f7' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: '成功',
        type: 'bar',
        stack: 'configs',
        barMaxWidth: 22,
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        data: throughputData.value.map((item) => item.success),
      },
      {
        name: '失败',
        type: 'bar',
        stack: 'configs',
        barMaxWidth: 22,
        itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
        data: throughputData.value.map((item) => item.failed),
      },
    ],
  })
}

const renderFailureChart = () => {
  if (!failureChartRef.value) return
  if (!failureChart) failureChart = echarts.init(failureChartRef.value)

  failureChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 18, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#edf2f7' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'category',
      data: failureHotspots.value.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#334155', width: 110, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { color: '#f97316', borderRadius: [0, 8, 8, 0] },
        label: { show: true, position: 'right', color: '#64748b' },
        data: failureHotspots.value.map((item) => item.value),
      },
    ],
  })
}

const resizeCharts = () => {
  healthChart?.resize()
  throughputChart?.resize()
  failureChart?.resize()
}

const initCharts = async () => {
  await nextTick()
  renderHealthChart()
  renderThroughputChart()
  renderFailureChart()
}

watch(
  () => [props.statusDistribution, props.taskLogs],
  () => initCharts(),
  { deep: true },
)

onMounted(() => {
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  healthChart?.dispose()
  throughputChart?.dispose()
  failureChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  margin-top: 0;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.dashboard-title {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.dashboard-error {
  color: #ef4444;
  font-size: 12px;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #e5edf5;
  background: #f8fafc;
  min-height: 104px;
}

.metric-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 12px;
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
}

.metric-main {
  min-width: 0;
  flex: 1;
}

.metric-main strong {
  display: block;
  margin: 6px 0 4px;
  color: #0f172a;
  font-size: 26px;
  line-height: 1;
}

.metric-main small,
.metric-label,
.chart-hint {
  color: #64748b;
  font-size: 12px;
}

.metric-bar {
  display: block;
  height: 5px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.metric-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: currentColor;
}

.metric-card--success {
  color: #10b981;
  background: #ecfdf5;
  border-color: #bbf7d0;
}

.metric-card--blue {
  color: #3b82f6;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.metric-card--warning {
  color: #f97316;
  background: #fff7ed;
  border-color: #fed7aa;
}

.metric-card--violet {
  color: #8b5cf6;
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.metric-card--success .metric-icon {
  background: #10b981;
}

.metric-card--blue .metric-icon {
  background: #3b82f6;
}

.metric-card--warning .metric-icon {
  background: #f97316;
}

.metric-card--violet .metric-icon {
  background: #8b5cf6;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr 1.25fr 1fr;
  gap: 14px;
}

.chart-card {
  min-height: 270px;
  padding: 16px;
  border: 1px solid #e7eef6;
  border-radius: 10px;
  background: #fbfdff;
}

.chart-card--wide {
  grid-column: span 2;
}

.chart-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.chart-card__header h4 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.health-badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.health-badge.success {
  color: #047857;
  background: #d1fae5;
}

.health-badge.warning {
  color: #b45309;
  background: #fef3c7;
}

.health-badge.muted {
  color: #64748b;
  background: #e2e8f0;
}

.chart {
  width: 100%;
  height: 220px;
}

.chart--compact {
  height: 216px;
}

.activity-card {
  grid-column: span 2;
  background: #ffffff;
}

.insight-card {
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.insight-item {
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.insight-item span,
.cover-number span,
.health-row span {
  color: #64748b;
  font-size: 12px;
}

.insight-item strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 22px;
  line-height: 1;
}

.health-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.health-track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2f7;
}

.health-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #52c41a;
}

.health-row b {
  color: #0f172a;
  font-size: 12px;
}

.insight-note {
  margin: 14px 0 0;
  color: #475569;
  font-size: 12px;
  line-height: 1.6;
}

.config-cover {
  margin-top: 10px;
}

.cover-number {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.cover-number strong {
  color: #0f172a;
  font-size: 34px;
  line-height: 1;
}

.file-type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.file-type-chip,
.empty-chip {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
}

.empty-chip {
  color: #64748b;
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.activity-list {
  max-height: 220px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.activity-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #edf2f7;
}

.activity-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  margin-top: 7px;
  border-radius: 50%;
  background: #3b82f6;
}

.activity-item.success .activity-dot {
  background: #10b981;
}

.activity-item.warning .activity-dot {
  background: #f59e0b;
}

.activity-item.error .activity-dot {
  background: #ef4444;
}

.activity-main {
  min-width: 0;
  flex: 1;
}

.activity-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.activity-line strong {
  color: #0f172a;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-line span,
.activity-main p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.state-text,
.state-panel {
  color: #94a3b8;
  font-size: 13px;
}

.state-panel {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1280px) {
  .metric-strip,
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }

  .chart-card--wide {
    grid-column: span 1;
  }

  .activity-card {
    grid-column: span 2;
  }
}

@media (max-width: 860px) {
  .metric-strip,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .activity-card {
    grid-column: span 1;
  }

  .metric-card {
    min-height: auto;
  }
}
</style>
