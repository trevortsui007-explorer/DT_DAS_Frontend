<template>
  <div class="dashboard-container">
    <h3 class="dashboard-title">实时数据监控</h3>
    <div class="dashboard-grid">
      <div class="chart-card">
        <div ref="taskChartRef" class="chart"></div>
      </div>

      <div class="chart-card center-card">
        <div ref="trendChartRef" class="chart"></div>
      </div>

      <div class="chart-card list-card">
        <h4>最新动态</h4>
        <ul>
          <li><span class="time">14:25</span> Task 001 执行成功</li>
          <li><span class="time">14:20</span> Config [Modbus_A] 更新</li>
          <li class="error"><span class="time">14:15</span> 机台 192.168.1.10 连接超时</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const taskChartRef = ref(null)
const trendChartRef = ref(null)
let taskChart = null
let trendChart = null

const initCharts = () => {
  // 1. 初始化 Task 环形图
  taskChart = echarts.init(taskChartRef.value)
  taskChart.setOption({
    title: { text: 'Task 状态分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 12, name: 'Running', itemStyle: { color: '#10b981' } }, // 绿
          { value: 3, name: 'Stopped', itemStyle: { color: '#94a3b8' } }, // 灰
          { value: 1, name: 'Error', itemStyle: { color: '#ef4444' } }, // 红
        ],
      },
    ],
  })

  // 2. 初始化 今日趋势折线图
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    title: { text: '今日采集趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['08:00', '10:00', '12:00', '14:00', '16:00'] },
    yAxis: { type: 'value' },
    series: [
      {
        data: [120, 200, 150, 300, 280],
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.2, color: '#3b82f6' },
        lineStyle: { color: '#3b82f6' },
      },
    ],
  })
}

// 监听窗口大小变化，图表自适应
const handleResize = () => {
  taskChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  taskChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  margin-top: 20px;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.dashboard-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr; /* 1:2:1 比例 */
  gap: 16px;
  height: 250px; /* 控制整体高度 */
}
.chart-card {
  background: #f8fafc;
  border-radius: 6px;
  padding: 12px;
  height: 100%;
}
.chart {
  width: 100%;
  height: 100%;
}
.list-card ul {
  list-style: none;
  padding: 0;
  margin: 10px 0;
  font-size: 13px;
  overflow-y: auto;
  max-height: 200px;
}
.list-card li {
  margin-bottom: 8px;
}
.list-card .time {
  color: #64748b;
  margin-right: 8px;
}
.list-card .error {
  color: #ef4444;
}
</style>
