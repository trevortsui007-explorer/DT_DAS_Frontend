<template>
  <div class="table-view">
    <div v-if="loading" class="loading-placeholder">加载中...</div>
    <div v-else-if="error" class="error-placeholder">{{ error }}</div>
    <div v-else>
      <table v-if="type === 'overview'" class="ant-table ant-table-overview">
        <thead>
        <tr><th>指标</th><th>当前值</th><th>状态</th></tr>
        </thead>
        <tbody>
        <tr><td>总任务数</td><td><b class="text-primary">{{ stats.tasks }}</b></td><td><span class="status-dot green">正常</span></td></tr>
        <tr><td>配置组数</td><td><b class="text-primary">{{ stats.groups }}</b></td><td><span class="status-dot green">正常</span></td></tr>
        <tr><td>配置项数</td><td><b class="text-primary">{{ stats.configs }}</b></td><td><span class="status-dot green">正常</span></td></tr>
        </tbody>
      </table>

      <table v-else-if="type === 'task'" class="ant-table">
        <thead>
        <tr>
          <th style="width: 48px"></th> <th>任务名称</th>
          <th>模式</th>
          <th>执行频率</th>
          <th>关联组</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="task in tasks" :key="task.id">
          <tr class="main-row" :class="{ 'is-expanded': expandedRows.has(task.id) }">
            <td class="text-center">
                <span class="expand-toggle" @click="toggleRow(task.id)">
                  {{ expandedRows.has(task.id) ? '▼' : '▶' }}
                </span>
            </td>
            <td class="font-600">{{ task.taskName || task.TaskName || '-' }}</td>
            <td>
              <span class="ant-tag">{{ getTaskMode(task) }}</span>
            </td>
            <td><code>{{ translateCron(task.cronExpression || task.CronExpression) }}</code></td>
            <td>
                <span class="group-count-link" @click="toggleRow(task.id)">
                  {{ (task.groupIds || []).length }} 个配置组
                </span>
            </td>
            <td>
                <span :class="['status-dot', task.isEnabled ? 'green' : 'red']">
                  {{ task.isEnabled ? '启用' : '禁用' }}
                </span>
            </td>
            <td>
              <button class="ant-btn-link" @click="editTask(task)">编辑</button>
            </td>
          </tr>

          <tr v-if="expandedRows.has(task.id)" class="sub-table-row">
            <td></td> <td colspan="6">
            <div class="sub-table-container">
              <div class="sub-header">关联的配置组详情：</div>
              <div v-if="getTaskGroups(task).length > 0" class="sub-grid">
                <div v-for="g in getTaskGroups(task)" :key="g.id" class="mini-group-card">
                  <span class="g-name">{{ g.groupName }}</span>
                  <span class="g-count">{{ g.configCount || 0 }} 项</span>
                </div>
              </div>
              <div v-else class="empty-sub">暂未关联任何配置组</div>
            </div>
          </td>
          </tr>
        </template>
        <tr v-if="tasks.length === 0">
          <td colspan="7" class="empty-placeholder">暂无任务数据</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { translateCron } from '@/utils/cron'

const props = defineProps({
  type: String,
  tasks: { type: Array, default: () => [] },
  allGroups: { type: Array, default: () => [] }, // 需要父组件把全量Group传进来用于匹配
  stats: { type: Object, default: () => ({ tasks: 0, groups: 0, configs: 0 }) },
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['edit-task'])

// 控制行展开的 Set
const expandedRows = ref(new Set())

const toggleRow = (id) => {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
}

// 根据任务里存的 groupIds 找到对应的 Group 对象
const getTaskGroups = (task) => {
  const ids = task.groupIds || []
  return props.allGroups.filter(g => ids.includes(g.id))
}

const getTaskMode = (task) => {
  const mode = task.TaskMode ?? task.taskMode
  return mode === 1 ? '周期执行' : '常规任务'
}

const editTask = (task) => {
  emit('edit-task', task)
}
</script>

<style scoped>
/* 1. 基础表格样式优化 */
.ant-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.ant-table th {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
}
.ant-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.ant-table-overview th {
  padding: 12px 20px;
  font-size: 14px;
}

.ant-table-overview td {
  padding: 12px 20px;
  font-size: 16px;
}

/* 2. 展开按钮 & 链接交互 */
.expand-toggle {
  cursor: pointer;
  color: #bfbfbf;
  font-size: 10px;
  transition: all 0.2s;
}
.expand-toggle:hover { color: #52c41a; }
.main-row:hover td { background-color: #f6ffed !important; }
.is-expanded td { background: #fbfbfb; }

.group-count-link {
  color: #52c41a;
  text-decoration: underline;
  cursor: pointer;
  font-size: 13px;
}

/* 3. 子表容器样式 */
.sub-table-row td {
  padding: 0 !important;
  background: #fafafa;
}
.sub-table-container {
  padding: 12px 24px 24px 12px;
  border-left: 2px solid #52c41a; /* 绿色左边线，引导视觉 */
  margin: 8px 0;
}
.sub-header {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: bold;
}
.sub-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mini-group-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 4px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.mini-group-card .g-name { color: #262626; }
.mini-group-card .g-count { color: #52c41a; font-weight: bold; }

/* 4. 状态点 & 标签 */
.status-dot {
  position: relative;
  padding-left: 14px;
}
.status-dot::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-dot.green::before { background: #52c41a; box-shadow: 0 0 4px #52c41a; }
.status-dot.red::before { background: #ff4d4f; }

.ant-tag {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.text-primary { color: #52c41a; }
.font-600 { font-weight: 600; }
.ant-btn-link {
  color: #52c41a;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.ant-btn-link:hover { text-decoration: underline; }
.empty-placeholder { text-align: center; padding: 40px; color: #bfbfbf; }

.table-view {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
}

.ant-table-overview {
  min-height: auto;
}

.font-600 {
  font-weight: 600;
  color: #262626;
}

code {
  font-family: 'Cascadia Code', Consolas, monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #cf1322;
}

.text-primary {
  color: #52c41a;
  font-size: 18px;
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.ant-table-overview .text-primary {
  font-size: 20px;
  font-weight: 700;
}

.ant-table > thead > tr > th,
.ant-table > tbody > tr > td {
  text-align: center;
}

.sub-table-container {
  text-align: left;
  padding: 12px 24px 24px 12px;
  border-left: 2px solid #52c41a;
  margin: 8px 0;
}

.sub-header {
  text-align: left;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 12px;
  font-weight: bold;
}

.sub-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}
</style>
