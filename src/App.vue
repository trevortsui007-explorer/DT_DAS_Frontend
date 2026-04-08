<template>
  <div class="app-form-wrapper">
    <StatCards :activeTab="activeTab" :stats="stats" @update:activeTab="handleTabChange" />
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
            :class="[
              btn.btnType ? `ant-btn-${btn.btnType}` : (btn.primary ? 'ant-btn-primary' : 'ant-btn-default')
            ]"
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
        :allGroups="groups"
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
        @selection-change="handleSelectionChange"
      />
    </div>
  </div>

  <ConfigModal ref="configModalRef" @saved="onConfigSaved" @goBack="handleGoBackToImport" />
  <DetailDrawer ref="drawerRef" />
  <GroupModal ref="groupModalRef" @saved="onGroupSaved" />
  <TaskModal ref="taskModalRef" @saved="onTaskSaved" />
  <ImportConfigModal ref="importConfigModalRef" @imported="handleImportSuccess" />
  <BatchAssignModal ref="assignModalRef" @confirm="handleAssignConfirm" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatCards from './components/StatCards.vue'
import TableView from './components/TableView.vue'
import CardsView from './components/CardsView.vue'
import ConfigModal from './components/ConfigModal.vue'
import DetailDrawer from './components/DetailDrawer.vue'
import GroupModal from './components/GroupModal.vue'
import TaskModal from './components/TaskModal.vue'
import ImportConfigModal from './components/ImportConfigModal.vue'
import BatchAssignModal from './components/BatchAssignModal.vue'
import { fetchTasks, fetchGroups, fetchConfigs } from './api'

// ====================== 组件 refs ======================
const configModalRef = ref(null)
const drawerRef = ref(null)
const groupModalRef = ref(null)
const taskModalRef = ref(null)
const importConfigModalRef = ref(null)
const assignModalRef = ref(null)

// ====================== 数据状态 ======================
const activeTab = ref('overview')
const loading = ref(false)
const error = ref('')
const tasks = ref([])
const groups = ref([])
const configs = ref([])
const selectedIds = ref([])

const stats = computed(() => ({
  tasks: tasks.value.length,
  groups: groups.value.length,
  configs: configs.value.length,
}))

const currentTitle = computed(() => {
  const titles = {
    overview: '全量采集总览',
    task: '任务监控详情',
    group: '配置组管理',
    config: '具体配置项',
  }
  return titles[activeTab.value] || ''
})

const currentDesc = computed(() => {
  const descs = {
    overview: '概览大盘：显示系统整体运行状态与采集指标',
    task: '任务层级：管理采集任务，每个任务关联多个配置组',
    group: '组层级：显示任务下的配置组，每个组关联具体的配置项',
    config: '原子层级：最底层的采集配置，直接对接物理资源',
  }
  return descs[activeTab.value] || ''
})

// ====================== 动态按钮组 ======================
const actionButtons = computed(() => {
  switch (activeTab.value) {
    case 'overview':
      return [
        { text: '刷新大盘', handler: refreshOverview, btnType: 'cyan' },
        { text: '导出报告', handler: exportReport, btnType: 'ghost-cyan' },
      ]
    case 'task':
      return [
        { text: '+ 新建采集任务', handler: openNewTask, btnType: 'gradient-purple' },
      ]
    case 'group':
      return [
        { text: '批量同步', handler: batchSyncGroups, btnType: 'geekblue' },
        { text: '+ 新增配置组', handler: openNewGroup, btnType: 'primary' },
      ]
    case 'config':
      return [
        { text: '批量分配组', handler: openAssignModal, btnType: 'geekblue' },
        { text: '导入配置', handler: importConfig, btnType: 'cyan' },
        { text: '+ 新增配置项', handler: openNewConfig, btnType: 'gradient-purple' },
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

const batchSyncGroups = () => {
  alert('触发同步组策略')
}

const openNewGroup = () => {
  groupModalRef.value?.open(false) // false 表示新建模式
}

// ====================== 配置组相关 ======================
const openNewConfig = () => {
  configModalRef.value?.open(false) // 新建模式
}

const editGroup = (group) => {
  groupModalRef.value?.open(true, group)
}

const onGroupSaved = () => {
  loadAllData()
}

// ====================== 任务相关 ======================
const onTaskSaved = () => {
  loadAllData()
}

const openNewTask = () => {
  taskModalRef.value?.open(false, null, groups.value)
}

const editTask = (task) => {
  taskModalRef.value?.open(true, task, groups.value)
}

// ====================== 配置相关：Excel/Csv解析相关 ======================
// 点击“导入配置”按钮：初始化打开导入弹窗
const importConfig = () => {
  importConfigModalRef.value?.open(false)
}

// 步骤接力：从“导入弹窗”跳转到“配置弹窗”
const handleImportSuccess = (configData) => {
  // 参数解释：open(isEdit = false, data = configData, isFromImport = true)
  configModalRef.value?.open(false, configData, true)
}

// 步骤回退：从“配置弹窗”回到“导入弹窗”
const handleGoBackToImport = () => {
  // 传 true 表示保留之前上传的文件、解析结果和映射关系
  importConfigModalRef.value?.open(true)
}

// 批量分配功能
const openAssignModal = () => {
  if (selectedIds.value.length === 0) {
    alert('请先框选需要分配的配置项！')
    return
  }
  // 传 true 表示保留之前上传的文件、解析结果和映射关系
  assignModalRef.value.open(selectedIds.value, groups.value)
}

// 获取传回选择的id
const handleSelectionChange = (ids) => {
  selectedIds.value = ids
}

// 分配完后清空选中状态
const handleAssignConfirm = () => {
  loadAllData()
  selectedIds.value = []
}

// ====================== 数据加载 ======================
const loadAllData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [tasksRes, groupsRes, configsRes] = await Promise.all([
      fetchTasks(),
      fetchGroups(),
      fetchConfigs(),
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
  selectedIds.value = []
}

const editConfig = (config) => {
  configModalRef.value?.open(true, config)
}

const viewDetail = (item) => {
  drawerRef.value?.open(item.EqName || item.groupName || '详情', item)
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
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
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
