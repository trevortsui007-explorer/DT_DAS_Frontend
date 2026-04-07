<template>
  <div class="table-view">
    <div v-if="loading" class="loading-placeholder">加载中...</div>
    <div v-else-if="error" class="error-placeholder">{{ error }}</div>
    <div v-else>
      <!-- 总览表格 -->
      <table v-if="type === 'overview'" class="ant-table">
        <thead>
        <tr><th>指标</th><th>当前值</th><th>状态</th></tr>
        </thead>
        <tbody>
        <tr><td>总任务数</td><td>{{ stats.tasks }}</td><td style="color:#52c41a;">正常</td></tr>
        <tr><td>配置组数</td><td>{{ stats.groups }}</td><td style="color:#52c41a;">正常</td></tr>
        <tr><td>配置项数</td><td>{{ stats.configs }}</td><td style="color:#52c41a;">正常</td></tr>
        </tbody>
      </table>

      <!-- 任务表格 -->
      <table v-else-if="type === 'task'" class="ant-table">
        <thead>
        <tr><th>任务名称</th><th>描述</th><th>模式</th><th>执行频率</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
        <tr v-for="task in tasks" :key="task.id">
          <td>{{ task.taskName || task.TaskName || '-' }}</td>
          <td><span style="color:#666;">{{ task.description || task.Description || '-' }}</span></td>
          <td>{{ getTaskMode(task) }}</td>
          <td><code>{{ translateCron(task.cronExpression || task.CronExpression) }}</code></td>
          <td :style="{ color: task.isEnabled ? '#52c41a' : '#ff4d4f' }">
            {{ task.isEnabled ? '● 启用' : '○ 禁用' }}
          </td>
          <td>
            <button class="ant-btn-link" @click="editTask(task)">编辑</button>
          </td>
        </tr>
        <tr v-if="tasks.length === 0"><td colspan="6" style="text-align:center;">暂无任务</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { translateCron } from '@/utils/cron'

const props = defineProps({
  type: {
    type: String,
    required: true, // 'overview' 或 'task'
  },
  tasks: {
    type: Array,
    default: () => [],
  },
  stats: {
    type: Object,
    default: () => ({ tasks: 0, groups: 0, configs: 0 }),
  },
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['edit-task'])

const getTaskMode = (task) => {
  const mode = task.TaskMode ?? task.taskMode
  return mode === 1 ? '周期执行' : mode === 0 ? '常规任务' : '-'
}

const editTask = (task) => {
  emit('edit-task', task)
}
</script>

<style scoped>
.table-view {
  width: 100%;
  overflow-x: auto;
}
.ant-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.ant-table th,
.ant-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}
.ant-table th {
  background: #fafafa;
  font-weight: 600;
}
.ant-btn-link {
  background: none;
  border: none;
  color: var(--ant-primary, #1677ff);
  cursor: pointer;
  padding: 0;
}
.loading-placeholder,
.error-placeholder {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
