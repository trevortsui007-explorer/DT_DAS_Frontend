<template>
  <div class="app-form-wrapper">
    <StatCards
      :activeTab="activeTab"
      :stats="stats"
      @update:activeTab="handleTabChange"
    />
    <div class="module-card">
      <div class="header-section">
        <div>
          <h3 class="header-title">{{ currentTitle }}</h3>
          <div class="header-desc">{{ currentDesc }}</div>
        </div>
        <div class="header-actions">
          <button
            v-for="btn in actionButtons"
            :key="btn.text"
            class="ant-btn"
            :class="{ 'ant-btn-primary': btn.primary }"
            @click="btn.handler"
          >
            {{ btn.text }}
          </button>
        </div>
      </div>

      <!-- 表格视图：总览 或 任务 -->
      <TableView
        v-if="activeTab === 'overview' || activeTab === 'task'"
        :type="activeTab"
        :tasks="tasks"
        :stats="stats"
        :loading="loading"
        :error="error"
        @edit-task="editTask"
      />

      <!-- 卡片视图：配置组 或 配置项 -->
      <CardsView
        v-else-if="activeTab === 'group' || activeTab === 'config'"
        :type="activeTab"
        :items="activeTab === 'group' ? groups : configs"
        :loading="loading"
        :error="error"
        @view-detail="viewDetail"
        @edit-config="editConfig"
        @edit-group="editGroup"
      />
    </div>
  </div>

  <ConfigModal ref="configModalRef" @saved="onConfigSaved" />
  <DetailDrawer ref="drawerRef" />
  <GroupModal ref="groupModalRef" @saved="onGroupSaved" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatCards from './components/StatCards.vue'
import TableView from './components/TableView.vue'
import CardsView from './components/CardsView.vue'
import ConfigModal from './components/ConfigModal.vue'
import DetailDrawer from './components/DetailDrawer.vue'
import GroupModal from './components/GroupModal.vue'
import { fetchTasks, fetchGroups, fetchConfigs } from './api'

// ====================== 组件 refs ======================
const configModalRef = ref(null)
const drawerRef = ref(null)

// ====================== 数据状态 ======================
const activeTab = ref('overview')
const loading = ref(false)
const error = ref('')
const tasks = ref([])
const groups = ref([])
const configs = ref([])
const groupModalRef = ref(null)

const stats = computed(() => ({
  tasks: tasks.value.length,
  groups: groups.value.length,
  configs: configs.value.length
}))

const currentTitle = computed(() => {
  const titles = {
    overview: '全量采集总览',
    task: '任务监控详情',
    group: '配置组管理',
    config: '具体配置项'
  }
  return titles[activeTab.value] || ''
})

const currentDesc = computed(() => {
  const descs = {
    overview: '概览大盘：显示系统整体运行状态与采集指标',
    task: '任务层级：管理采集任务，每个任务关联多个配置组',
    group: '组层级：显示任务下的配置组，每个组关联具体的配置项',
    config: '原子层级：最底层的采集配置，直接对接物理资源'
  }
  return descs[activeTab.value] || ''
})

// ====================== 动态按钮组 ======================
const actionButtons = computed(() => {
  switch (activeTab.value) {
    case 'overview':
      return [
        { text: '刷新大盘', handler: refreshOverview, primary: false },
        { text: '导出报告', handler: exportReport, primary: true }
      ]
    case 'task':
      return [
        { text: '+ 新建采集任务', handler: openNewTask, primary: true }
      ]
    case 'group':
      return [
        { text: '批量同步', handler: batchSyncGroups, primary: false },
        { text: '+ 新增配置组', handler: openNewGroup, primary: true }
      ]
    case 'config':
      return [
        { text: '导入配置', handler: importConfig, primary: false },
        { text: '+ 新增配置项', handler: openNewConfig, primary: true }
      ]
    default:
      return []
  }
})

// 按钮处理函数
const refreshOverview = () => {
  loadAllData()
}

const exportReport = () => {
  alert('触发导出大盘报表')
}

const openNewTask = () => {
  // TODO: 后续实现任务弹窗
  alert('新建采集任务（待实现）')
}

const batchSyncGroups = () => {
  alert('触发同步组策略')
}

const openNewGroup = () => {
  groupModalRef.value?.open(false)   // false 表示新建模式
}

const importConfig = () => {
  alert('触发 Excel 导入配置')
}

const openNewConfig = () => {
  configModalRef.value?.open(false) // 新建模式
}

const editGroup = (group) => {
  groupModalRef.value?.open(true, group)
}

const onGroupSaved = () => {
  loadAllData()
}

// ====================== 数据加载 ======================
const loadAllData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [tasksRes, groupsRes, configsRes] = await Promise.all([
      fetchTasks(),
      fetchGroups(),
      fetchConfigs()
    ])
    tasks.value = tasksRes.data || []
    groups.value = groupsRes.data || []
    configs.value = configsRes.data || []
  } catch (err) {
    console.error('加载数据失败', err)
    error.value = '数据加载失败，请检查后端服务'
  } finally {
    loading.value = false
  }
}

// ====================== 事件处理 ======================
const handleTabChange = (tab) => {
  activeTab.value = tab
}

const editConfig = (config) => {
  configModalRef.value?.open(true, config)
}

const viewDetail = (item) => {
  drawerRef.value?.open(item.EqName || item.groupName || '详情', item)
}

const editTask = (task) => {
  console.log('编辑任务', task)
  // TODO: 后续实现任务编辑弹窗
}

const onConfigSaved = () => {
  loadAllData()
}

// ====================== 生命周期 ======================
onMounted(() => {
  loadAllData()
})
</script>

<style>
/* 全局样式（可后续迁移到单独文件） */
.app-form-wrapper {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}
.module-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.03);
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}
.header-desc {
  font-size: 14px;
  color: #8c8c8c;
}
.header-actions {
  display: flex;
  gap: 8px;
}
</style>
