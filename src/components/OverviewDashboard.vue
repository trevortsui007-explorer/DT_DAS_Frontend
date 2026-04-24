<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div>
        <h3 class="dashboard-title">实时数据监控</h3>
        <p class="dashboard-subtitle">总览页聚合任务、配置组、配置项与动态趋势数据</p>
      </div>
      <span v-if="error" class="dashboard-error">{{ error }}</span>
    </div>

    <div class="dashboard-grid">
      <div class="chart-card">
        <div ref="taskChartRef" class="chart"></div>
      </div>

      <div class="chart-card">
        <div ref="trendChartRef" class="chart"></div>
      </div>

      <div class="chart-card list-card">
        <h4>最新动态</h4>
        <div v-if="loading" class="state-text">总览数据加载中...</div>
        <div v-else-if="latestActivities.length === 0" class="state-text">暂无动态数据</div>
        <ul v-else>
          <li
            v-for="item in latestActivities"
            :key="`${item.time}-${item.text}`"
            :class="['activity-item', item.level || 'info']"
          >
            <span class="time">{{ item.time }}</span>
            <span class="activity-text">{{ item.text }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  statusDistribution: {
    type: Array,
    default: () => [],
  },
  trendData: {
    type: Array,
    default: () => [],
  },
  latestActivities: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  error: {
    type: String,
    default: '',
  },
})

const taskChartRef = ref(null)
const trendChartRef = ref(null)
let taskChart = null
let trendChart = null

const renderTaskChart = () => {
  if (!taskChartRef.value) return
  if (!taskChart) taskChart = echarts.init(taskChartRef.value)

  const data = props.statusDistribution
    .filter((item) => item.value > 0)
    .map((item) => ({
      value: item.value,
      name: item.name,
      itemStyle: { color: item.color },
    }))

  taskChart.setOption({
    title: { text: '任务状态分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        label: { formatter: '{b}' },
        data:
          data.length > 0
            ? data
            : [{ value: 1, name: '暂无数据', itemStyle: { color: '#d9d9d9' } }],
      },
    ],
  })
}

const renderTrendChart = () => {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)

  trendChart.setOption({
    title: { text: '今日采集趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 56, bottom: 32 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.trendData.map((item) => item.time),
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: props.trendData.map((item) => item.value),
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.18, color: '#3b82f6' },
        lineStyle: { color: '#3b82f6', width: 3 },
        itemStyle: { color: '#2563eb' },
      },
    ],
  })
}

const resizeCharts = () => {
  taskChart?.resize()
  trendChart?.resize()
}

const initCharts = async () => {
  await nextTick()
  renderTaskChart()
  renderTrendChart()
}

watch(
  () => props.statusDistribution,
  () => {
    renderTaskChart()
  },
  { deep: true },
)

watch(
  () => props.trendData,
  () => {
    renderTrendChart()
  },
  { deep: true },
)

onMounted(() => {
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  taskChart?.dispose()
  trendChart?.dispose()
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
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.dashboard-title {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.dashboard-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.dashboard-error {
  color: #ef4444;
  font-size: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
  min-height: 280px;
}

.chart-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  min-height: 280px;
}

.chart {
  width: 100%;
  height: 256px;
}

.list-card h4 {
  margin: 4px 0 12px;
  font-size: 18px;
  color: #111827;
}

.list-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  max-height: 224px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  line-height: 1.5;
}

.activity-item .time {
  color: #64748b;
  min-width: 42px;
}

.activity-item.info .activity-text {
  color: #1f2937;
}

.activity-item.success .activity-text {
  color: #059669;
}

.activity-item.warning .activity-text {
  color: #d97706;
}

.activity-item.error .activity-text {
  color: #ef4444;
}

.state-text {
  color: #94a3b8;
  font-size: 13px;
  padding-top: 8px;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    min-height: 240px;
  }
}
</style>
