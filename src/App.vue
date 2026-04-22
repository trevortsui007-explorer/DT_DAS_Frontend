<template>
  <div class="app-form-wrapper">
    <StatCards :activeTab="activeTab" :stats="stats" @update:activeTab="handleTabChange" />

    <div class="module-card" :class="{ 'module-card-overview': activeTab === 'overview' }">
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
                <component v-if="btn.icon" :is="btn.icon" />
                <span>{{ btn.text }}</span>
              </button>
            </div>

            <button
              v-else
              class="ant-btn"
              :class="getBtnClass(item)"
              @click="item.handler"
            >
              <component v-if="item.icon" :is="item.icon" />
              <span>{{ item.text }}</span>
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
      <OverviewDashboard
        v-if="activeTab === 'overview'"
        :status-distribution="taskStatusDistribution"
        :trend-data="overviewTrend"
        :latest-activities="overviewActivities"
        :loading="dashboardLoading"
        :error="dashboardError"
      />
    </div>
  </div>

  <ConfigModal ref="configModalRef" @saved="onConfigSaved" @goBack="handleGoBackToImport" />
  <GroupModal ref="groupModalRef" @saved="onGroupSaved" />
  <TaskModal ref="taskModalRef" @saved="onTaskSaved" />
  <ImportConfigModal ref="importConfigModalRef" @imported="handleImportSuccess" />
  <BatchAssignModal ref="assignModalRef" @confirm="handleAssignConfirm" />
  <InspectionModal ref="inspectionModalRef" v-model:visible="inspectionVisible" :data="inspectionData" @change="handleInspectionMonthChange" />
  <AcquisitionModal v-model:visible="acquisitionActionVisible" :task-data="currentConfig" @confirm="handleTaskStartConfirm" />

  <DetailDrawer ref="drawerRef" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import message, {
  StatCards, TableView, CardsView,
  ConfigModal, DetailDrawer, GroupModal,
  TaskModal, ImportConfigModal, BatchAssignModal,
  InspectionModal, AcquisitionModal,
} from './components'

import {
  ReloadOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  PartitionOutlined,
  DeleteOutlined,
  SelectOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons-vue';

import * as api from './api'

import OverviewDashboard from './components/OverviewDashboard.vue'

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
const overviewTrend = ref([])
const overviewActivities = ref([])

const selectedIds = ref([])
const dashboardLoading = ref(false)
const dashboardError = ref('')

// 巡检相关状态
const inspectionVisible = ref(false)
const inspectionData = ref(null)
const currentInspectingRow = ref(null)
const inspectionCache = ref({})

// 采集Modal相关
const acquisitionActionVisible = ref(false)
const currentConfig = ref(null)

// ====================== computed ======================
const stats = computed(() => ({
  tasks: tasks.value.length,
  groups: groups.value.length,
  configs: configs.value.length,
}))

const taskStatusDistribution = computed(() => {
  const enabledTasks = tasks.value.filter((task) => task.isEnabled ?? task.IsEnabled).length
  const disabledTasks = tasks.value.length - enabledTasks

  return [
    { name: '启用任务', value: enabledTasks, color: '#10b981' },
    { name: '禁用任务', value: disabledTasks, color: '#94a3b8' },
  ]
})

const isTableView = computed(() => activeTab.value === 'overview' || activeTab.value === 'task')

const currentTitle = computed(
  () =>
    ({
      overview: '全量采集总览',
      task: '任务监控详情',
      group: '配置组管理',
      config: '具体配置项',
    })[activeTab.value],
)

const currentDesc = computed(
  () =>
    ({
      overview: '概览大盘，展示系统整体运行状态与采集指标',
      task: '任务层级，用于管理采集任务，每个任务可关联多个配置组',
      group: '分组层级，展示任务下的配置组信息',
      config: '原子层级，展示最底层采集配置',
    })[activeTab.value],
)

// ====================== Overview 界面 ======================
const loadAllData = async () => {
  loading.value = true
  dashboardLoading.value = true
  error.value = ''
  dashboardError.value = ''

  const [tasksResult, groupsResult, configsResult, trendResult, activitiesResult] =
    await Promise.allSettled([
      api.fetchTasks(),
      api.fetchGroups(),
      api.fetchConfigs(),
      api.fetchOverviewTrend(),
      api.fetchOverviewActivities(),
    ])

  const baseDataFailed = [tasksResult, groupsResult, configsResult].some(
    (result) => result.status === 'rejected',
  )

  if (baseDataFailed) {
    error.value = '数据加载失败'
    message.error(error.value)
  } else {
    tasks.value = tasksResult.value.data || []
    groups.value = groupsResult.value.data || []
    configs.value = configsResult.value.data || []
  }

  overviewTrend.value = trendResult.status === 'fulfilled' ? trendResult.value.data || [] : []
  overviewActivities.value =
    activitiesResult.status === 'fulfilled' ? activitiesResult.value.data || [] : []

  if (trendResult.status === 'rejected' || activitiesResult.status === 'rejected') {
    dashboardError.value = '部分总览数据加载失败'
  }

  loading.value = false
  dashboardLoading.value = false
}

const exportReport = () => message.success('导出功能开发中')

// ====================== Task 界面 ======================
const openNewTask = () => taskModalRef.value?.open(false, null, groups.value)
const editTask = (task) => taskModalRef.value?.open(true, task, groups.value)
const onTaskSaved = () => {
  message.success('任务保存成功')
  loadAllData()
}

const deleteTask = () => console.log('删除任务')

// ====================== Group 界面 ======================
const openNewGroup = () => groupModalRef.value?.open(false, null, configs.value)
const editGroup = (group) => groupModalRef.value?.open(true, group, configs.value)
const onGroupSaved = () => {
  message.success('分组保存成功')
  loadAllData()
}

const deleteGroup = () => message.success('删除配置组')

// 批量同步
const batchSyncGroups = () => message.success('批量同步进行中')

// ====================== Config 界面 ======================
const openNewConfig = () => configModalRef.value?.open(false)
const editConfig = (config) => configModalRef.value?.open(true, config)
// 当配置保存成功后，建议清空缓存，防止显示旧的巡检状态
const onConfigSaved = () => {
  inspectionCache.value = {}
  message.success('配置保存成功')
  loadAllData()
}
const deleteConfig = () => console.log('删除配置')

// 导入配置
const importConfig = () => importConfigModalRef.value?.open(false)
const handleImportSuccess = (data) => {
  message.success('导入成功，请继续确认配置')
  configModalRef.value?.open(false, data, true)
}
const handleGoBackToImport = () => importConfigModalRef.value?.open(true)

// 批量归组
const openAssignModal = () => {
  if (!selectedIds.value.length) {
    message.error('请先选择配置项')
    return
  }
  assignModalRef.value.open(selectedIds.value, groups.value)
}
const handleAssignConfirm = async (data) => {
  const hideLoading = message.loading('正在同步关联关系，请稍候...')

  try {
    // 获取当前原始状态（假设从 groups 列表里拿到的该组现有 ids）
    const currentGroup = groups.value.find(g => g.id === data.groupId);
    const originIds = currentGroup?.configIds || [];

    // 用户当前选择的最新列表（先做个内部去重）
    const selectedIds = [...new Set(data.configIds)];

    // 1. 找出真正需要新增的：在 selected 里，但不在 origin 里
    const idsToAdd = selectedIds.filter(id => !originIds.includes(id));

    // 2. 找出真正需要删除的：在 origin 里，但不在 selected 里
    const idsToRemove = originIds.filter(id => !selectedIds.includes(id));

    // 如果没有任何变化，直接结束
    if (idsToAdd.length === 0 && idsToRemove.length === 0) {
      message.info('数据未发生变化');
      return;
    }

    // 3. 按序发送请求
    if (idsToRemove.length > 0) {
      await api.removeConfigsFromGroup(data.groupId, idsToRemove);
    }
    if (idsToAdd.length > 0) {
      await api.bindConfigsToGroup(data.groupId, idsToAdd);
    }

    message.success('更新成功');
    await loadAllData();
  } catch (error) {
    console.error("处理失败", error);
  } finally {
    hideLoading()
  }
}

// ====================== 卡片功能（Config)：源路径检视 逻辑 ======================
// 核心方法：带缓存功能的获取数据
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
      pass: 'dt123456#',
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

// 首次打开弹窗
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

// 切换月份
const handleInspectionMonthChange = ({ year, month }) => {
  if (currentInspectingRow.value) {
    fetchInspectionData(currentInspectingRow.value, year, month)
  }
}

// ====================== Tab 切换 ======================
const handleTabChange = (tab) => {
  activeTab.value = tab
  selectedIds.value = []
}

// ====================== 卡片 相关 ======================
// 查看
const viewDetail = (item) => drawerRef.value?.open(item.EqName || item.groupName || '详情', item)

// 选择
const handleSelectionChange = (items) => {
  selectedIds.value = items
}

// ====================== 采集 相关 ======================
// 触发弹窗（例如点击表格中的启动按钮）
const handleTimeRangeAcquisition = () => {
  if (!selectedIds.value.length) {
    message.warning("请先选择配置")
    return
  }
  currentConfig.value = selectedIds.value
  acquisitionActionVisible.value = true
}

// 确认提交
const handleTaskStartConfirm = (data) => {
  const hide = message.loading('正在下发采集任务...', 0)
  console.log('下发数据:', data)

  // 模拟请求
  setTimeout(() => {
    hide()
    message.success(`任务已启动，采集配置数：[${currentConfig.value.length}] ，采集区间：${data.startTime} 至 ${data.endTime}`)
  }, 1000)
}

const handleAcquisition = () => message.success('采集成功')

// ====================== 启停 相关 ======================
const startTask = () => message.success('任务开启...')
const pauseTask = () => message.success('任务暂停...')

const startGroup = () => message.success('配置组开启...')
const pauseGroup = () => message.success('配置组暂停...')

const startConfig = () => {
  if (selectedIds.value.length === 0) {
    message.warning('请先选择配置')
    return
  }
  const idsToUpdate = [...selectedIds.value]

  try {
    api.setConfigStatus(idsToUpdate, true)
    message.success('开启成功')

    configs.value.forEach(cfg => {
      if (idsToUpdate.includes(cfg.id)) {
        cfg.isEnabled = true
      }
    })

    selectedIds.value = []
  } catch (err) {
    message.error('操作失败',err)
  }
}

const pauseConfig = () => {
  if (selectedIds.value.length === 0) {
    message.warning('请先选择配置')
    return
  }

  const idsToUpdate = [...selectedIds.value]

  try {
    api.setConfigStatus(idsToUpdate, false)
    message.success('暂停成功')

    configs.value.forEach(cfg => {
      if (idsToUpdate.includes(cfg.id)) {
        cfg.isEnabled = false
      }
    })

    selectedIds.value = []
  } catch (err) {
    message.error('操作失败',err)
  }
}

// ====================== 按钮 相关 ======================
// 1. 按钮配置表
const BUTTON_CONFIG_MAP = {
  overview: [
    { text: '刷新大盘', handler: loadAllData, btnType: 'primary', icon: ReloadOutlined },
    { text: '导出报告', handler: exportReport, btnType: 'aqua', icon: ExportOutlined },
  ],
  task: [
    [
      { text: '新建任务', handler: openNewTask, btnType: 'primary', icon: PlusOutlined },
      { text: '删除任务', handler: deleteTask, btnType: 'red', icon: DeleteOutlined },
    ],
    [
      { text: '开启', handler: startTask, btnType: 'primary', icon: PlayCircleOutlined },
      { text: '暂停', handler: pauseTask, btnType: 'darkgray', icon: PauseCircleOutlined },
    ],
    [
      { text: '今日采集', handler: handleAcquisition, btnType: 'aqua', icon: SelectOutlined },
      { text: '时间段采集', handler: handleTimeRangeAcquisition, btnType: 'blue', icon: FieldTimeOutlined },
    ],
  ],
  group: [
    [
      { text: '新增组', handler: openNewGroup, btnType: 'primary', icon: PlusOutlined },
      { text: '删除组', handler: deleteGroup, btnType: 'red', icon: DeleteOutlined },
    ],
    [
      { text: '开启', handler: startGroup, btnType: 'primary', icon: PlayCircleOutlined },
      { text: '暂停', handler: pauseGroup, btnType: 'darkgray', icon: PauseCircleOutlined },
    ],
    [
      { text: '今日采集', handler: handleAcquisition, btnType: 'aqua', icon: SelectOutlined },
      { text: '时间段采集', handler: handleTimeRangeAcquisition, btnType: 'blue', icon: FieldTimeOutlined },
    ],
    { text: '批量同步', handler: batchSyncGroups, btnType: 'green', icon: SyncOutlined },
  ],
  config: [
    [
      { text: '导入配置', handler: importConfig, btnType: 'aqua', icon: CloudUploadOutlined },
      { text: '新增配置', handler: openNewConfig, btnType: 'primary', icon: PlusOutlined },
      { text: '删除配置', handler: deleteConfig, btnType: 'red', icon: DeleteOutlined },
    ],
    [
      { text: '开启', handler: startConfig, btnType: 'primary', icon: PlayCircleOutlined },
      { text: '暂停', handler: pauseConfig, btnType: 'darkgray', icon: PauseCircleOutlined },
    ],
    [
      { text: '今日采集', handler: handleAcquisition, btnType: 'aqua', icon: SelectOutlined },
      { text: '时间段采集', handler: handleTimeRangeAcquisition, btnType: 'blue', icon: FieldTimeOutlined },
    ],
    { text: '批量归组', handler: openAssignModal, btnType: 'green', icon: PartitionOutlined },
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
.module-card-overview {
  padding: 28px 28px 32px;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.module-card-overview .header-section {
  margin-bottom: 28px;
}
.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}
.module-card-overview .header-title {
  font-size: 20px;
}
.header-desc {
  font-size: 14px;
  color: #8c8c8c;
}
.module-card-overview .header-desc {
  font-size: 15px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
</style>
