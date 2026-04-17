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
          <template v-for="(item, index) in actionButtons" :key="index">
            <div v-if="Array.isArray(item)" class="ant-btn-group">
              <button
                v-for="btn in item"
                :key="btn.text"
                class="ant-btn"
                :class="getBtnClass(btn)"
                @click="btn.handler"
              >
                {{ btn.text }}
              </button>
            </div>

            <button
              v-else
              class="ant-btn"
              :class="getBtnClass(item)"
              @click="item.handler"
            >
              {{ item.text }}
            </button>
          </template>
        </div>
      </div>

      <TableView
        v-if="isTableView"
        :type="activeTab"
        :tasks="tasks"
        :stats="stats"
        :allGroups="groups"
        :loading="loading"
        :error="error"
        @edit-task="editTask"
      />

      <CardsView
        v-else
        :type="activeTab"
        :items="activeTab === 'group' ? groups : configs"
        :loading="loading"
        :error="error"
        @view-detail="viewDetail"
        @edit-config="editConfig"
        @edit-group="editGroup"
        @selection-change="handleSelectionChange"
        @inspect-source="openInspection"
      />

    </div>
  </div>

  <ConfigModal ref="configModalRef" @saved="onConfigSaved" @goBack="handleGoBackToImport" />
  <GroupModal ref="groupModalRef" @saved="onGroupSaved" />
  <TaskModal ref="taskModalRef" @saved="onTaskSaved" />
  <ImportConfigModal ref="importConfigModalRef" @imported="handleImportSuccess" />
  <BatchAssignModal ref="assignModalRef" @confirm="handleAssignConfirm" />

  <InspectionModal
    ref="inspectionModalRef"
    v-model:visible="inspectionVisible"
    :data="inspectionData"
    @change="handleInspectionMonthChange"
  />

  <DetailDrawer ref="drawerRef" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import message, {
  StatCards, TableView, CardsView,
  ConfigModal, DetailDrawer, GroupModal,
  TaskModal, ImportConfigModal, BatchAssignModal,
  InspectionModal
} from './components'

import * as api from './api'

// ====================== refs ======================
const configModalRef = ref(null)
const drawerRef = ref(null)
const groupModalRef = ref(null)
const taskModalRef = ref(null)
const importConfigModalRef = ref(null)
const assignModalRef = ref(null)
const inspectionModalRef = ref(null)

// ====================== state ======================
const activeTab = ref('overview')
const loading = ref(false)
const error = ref('')

const tasks = ref([])
const groups = ref([])
const configs = ref([])

const selectedIds = ref([])

// 巡检相关状态
const inspectionVisible = ref(false)
const inspectionData = ref(null)
const currentInspectingRow = ref(null)
const inspectionCache = ref({})

// ====================== computed ======================
const stats = computed(() => ({
  tasks: tasks.value.length,
  groups: groups.value.length,
  configs: configs.value.length,
}))

const isTableView = computed(() =>
  activeTab.value === 'overview' || activeTab.value === 'task'
)

const currentTitle = computed(() => ({
  overview: '全量采集总览',
  task: '任务监控详情',
  group: '配置组管理',
  config: '具体配置项',
}[activeTab.value]))

const currentDesc = computed(() => ({
  overview: '概览大盘，展示系统整体运行状态与采集指标',
  task: '任务层级，用于管理采集任务，每个任务可关联多个配置组',
  group: '分组层级，展示任务下的配置组信息',
  config: '原子层级，展示最底层采集配置',
}[activeTab.value]))

// ====================== data loader ======================
const loadAllData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [t, g, c] = await Promise.all([
      api.fetchTasks(),
      api.fetchGroups(),
      api.fetchConfigs(),
    ])

    tasks.value = t.data || []
    groups.value = g.data || []
    configs.value = c.data || []
  } catch  {
    error.value = '数据加载失败'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

// ====================== inspection logic ======================

/**
 * 核心方法：带缓存功能的获取数据
 */
const fetchInspectionData = async (row, year, month) => {
  // 1. 生成唯一的缓存 Key
  const cacheKey = `${row.id}_${year}_${month}`

  // 2. 检查缓存中是否已有数据
  if (inspectionCache.value[cacheKey]) {
    inspectionData.value = inspectionCache.value[cacheKey]
    return
  }

  // 3. 如果没有缓存，展示加载状态（可选）并请求 API
  try {
    const mm = month < 10 ? `0${month}` : month
    const lastDay = new Date(year, month, 0).getDate()
    const startTime = `${year}-${mm}-01`
    const endTime = `${year}-${mm}-${lastDay}`

    const res = await api.fetchInspection({
      configId: row.id,
      startTime: startTime,
      endTime: endTime,
      user: 'et1',
      pass: 'dt123456#'
    })

    const result = res.data[0] || { files: [] }

    // 4. 存入缓存
    inspectionCache.value[cacheKey] = result
    inspectionData.value = result

  } catch (e) {
    console.error('获取巡检数据失败:', e)
    message.error('巡检数据获取失败')
  }
}

/**
 * 如果需要“强制刷新”功能，可以提供这个方法
 */
// const refreshInspection = (row, year, month) => {
//   const cacheKey = `${row.id}_${year}_${month}`
//   delete inspectionCache.value[cacheKey] // 删除特定缓存
//   fetchInspectionData(row, year, month)
// }

/**
 * 首次打开弹窗
 */
const openInspection = async (row) => {
  currentInspectingRow.value = row
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1

  inspectionModalRef.value?.setPeriod(y, m)

  // 这里会自动判断是走缓存还是走接口
  await fetchInspectionData(row, y, m)
  inspectionVisible.value = true
}

/**
 * 切换月份
 */
const handleInspectionMonthChange = ({ year, month }) => {
  if (currentInspectingRow.value) {
    fetchInspectionData(currentInspectingRow.value, year, month)
  }
}

// ====================== 数据更新时清除缓存 ======================
// 当配置保存成功后，建议清空缓存，防止显示旧的巡检状态
const onConfigSaved = () => {
  inspectionCache.value = {}
  message.success('配置保存成功')
  loadAllData()
}

// ====================== Other Handlers (Tab, Task, Group, etc.) ======================
const handleTabChange = (tab) => {
  activeTab.value = tab
  selectedIds.value = []
}

const openNewTask = () => taskModalRef.value?.open(false, null, groups.value)
const editTask = (task) => taskModalRef.value?.open(true, task, groups.value)
const onTaskSaved = () => {
  message.success('任务保存成功')
  loadAllData()
}

const startTask = () => console.log('任务开启...')
const pauseTask = () => console.log('任务暂停...')

const openNewGroup = () => groupModalRef.value?.open(false, null, configs.value)
const editGroup = (group) => groupModalRef.value?.open(true, group, configs.value)
const onGroupSaved = () => {
  message.success('分组保存成功')
  loadAllData()
}
const batchSyncGroups = () => message.success('批量同步进行中')

const openNewConfig = () => configModalRef.value?.open(false)
const editConfig = (config) => configModalRef.value?.open(true, config)

const importConfig = () => importConfigModalRef.value?.open(false)
const handleImportSuccess = (data) => {
  message.success('导入成功，请继续确认配置')
  configModalRef.value?.open(false, data, true)
}
const handleGoBackToImport = () => importConfigModalRef.value?.open(true)

const openAssignModal = () => {
  if (!selectedIds.value.length) {
    message.error('请先选择配置项')
    return
  }
  assignModalRef.value.open(selectedIds.value, groups.value)
}

const handleSelectionChange = (ids) => {
  selectedIds.value = ids
}

const handleAssignConfirm = () => {
  message.success('批量分配完成')
  loadAllData()
  selectedIds.value = []
}

const exportReport = () => message.success('导出功能开发中')
const viewDetail = (item) => drawerRef.value?.open(item.EqName || item.groupName || '详情', item)

// ====================== buttons ======================
// 1. 按钮配置表
const BUTTON_CONFIG_MAP = {
  overview: [
    { text: '刷新大盘', handler: loadAllData, btnType: 'cyan' },
    { text: '导出报告', handler: exportReport, btnType: 'ghost-cyan' },
  ],
  task: [
    // 按钮组：开启和暂停贴在一起
    [
      { text: '开启', handler: startTask, btnType: 'primary' },
      { text: '暂停', handler: pauseTask, btnType: 'default' },
    ],
    { text: '+ 新建任务', handler: openNewTask, btnType: 'gradient-purple' },
  ],
  group: [
    { text: '批量同步', handler: batchSyncGroups, btnType: 'geekblue' },
    { text: '+ 新增组', handler: openNewGroup, btnType: 'primary' },
  ],
  config: [
    { text: '批量分配', handler: openAssignModal, btnType: 'geekblue' },
    { text: '导入配置', handler: importConfig, btnType: 'cyan' },
    { text: '+ 新增配置', handler: openNewConfig, btnType: 'gradient-purple' },
  ],
};

const actionButtons = computed(() => {
  return BUTTON_CONFIG_MAP[activeTab.value] || []
})

const getBtnClass = (btn) => {
  const classes = [];

  if (btn.btnType) {
    if (btn.btnType.startsWith('gradient-')) {
      classes.push(`btn-${btn.btnType}`);
    } else {
      classes.push(`ant-btn-${btn.btnType}`);
    }
  }

  return classes;
};

// ====================== 初始化数据 ======================
onMounted(() => {
  loadAllData()
})
</script>

<style>
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


