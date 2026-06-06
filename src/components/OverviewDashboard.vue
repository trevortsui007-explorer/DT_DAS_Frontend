<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div>
        <h3 class="dashboard-title">实时数据监控</h3>
      </div>
      <span v-if="error" class="dashboard-error">{{ error }}</span>
    </div>

    <div class="dashboard-grid">
      <div class="chart-card">
        <div class="chart-card__header">
          <h4>任务状态分布</h4>
        </div>
        <div ref="taskChartRef" class="chart"></div>
      </div>

      <div class="chart-card">
        <div class="chart-card__header">
          <h4>今日采集趋势</h4>
        </div>
        <div v-if="!loading && trendData.length === 0" class="state-panel">暂无趋势数据</div>
        <div v-else ref="trendChartRef" class="chart"></div>
      </div>

      <div class="chart-card list-card">
        <div class="chart-card__header">
          <h4>最新动态</h4>
        </div>
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
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#64748b', fontSize: 12 },
    },
    graphic: {
      type: 'text',
      left: 'center',
      top: '45%',
      style: {
        text: `${props.statusDistribution.reduce((sum, item) => sum + Number(item.value || 0), 0)}`,
        fill: '#0f172a',
        fontSize: 22,
        fontWeight: 700,
        textAlign: 'center',
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '46%'],
        label: { show: false },
        labelLine: { show: false },
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
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 18, top: 14, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.trendData.map((item) => item.time),
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
  async () => {
    await nextTick()
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

.dashboard-error {
  color: #ef4444;
  font-size: 12px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.1fr 2.1fr 1.1fr;
  gap: 16px;
  min-height: 280px;
}

.chart-card {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 16px;
  min-height: 280px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.chart-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-card__header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.chart {
  width: 100%;
  height: 236px;
}

.list-card h4 {
  margin: 0;
  font-size: 15px;
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

.state-panel {
  height: 236px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
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
