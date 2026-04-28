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

      <TaskLogView
        v-if="activeTab === 'log'"
        ref="taskLogViewRef"
        :initial-task-log-id="currentTaskLogId"
      />

      <div v-else-if="activeTab === 'overview'" class="overview-stack">
        <CornTimeFrame
          :items="timelinePanelItems"
          :loading="loading"
          :error="error"
          :max-height="160"
          :reference-time="timelineEffectiveNow"
          :is-test-mode="Boolean(timelineTestNow)"
          @set-reference-time="handleSetTimelineReferenceTime"
          @reset-reference-time="handleResetTimelineReferenceTime"
          @open-log="handleOpenLogFromTimeline"
        />
        <OverviewDashboard
          :status-distribution="taskStatusDistribution"
          :trend-data="overviewTrend"
          :latest-activities="overviewActivities"
          :loading="dashboardLoading"
          :error="dashboardError"
        />
      </div>

      <TableView
        v-else-if="activeTab === 'task'"
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
  <AcquisitionModal
    v-model:visible="acquisitionActionVisible"
    :task-data="currentConfig"
    @confirm="handleTaskStartConfirm"
  />

  <DetailDrawer ref="drawerRef" />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import message, {
  StatCards, TableView, CardsView,
  ConfigModal, DetailDrawer, GroupModal,
  TaskModal, ImportConfigModal, BatchAssignModal,
  InspectionModal, AcquisitionModal,
  TaskLogView,
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
} from '@ant-design/icons-vue'

import * as api from './api'
import OverviewDashboard from './components/OverviewDashboard.vue'
import CornTimeFrame from './components/CronTimeFramePanel.vue'
import { buildCronTimelineItems } from './utils/cronTimeline'

// ====================== refs ======================
const configModalRef = ref(null)
const drawerRef = ref(null)
const groupModalRef = ref(null)
const taskModalRef = ref(null)
const importConfigModalRef = ref(null)
const assignModalRef = ref(null)
const inspectionModalRef = ref(null)
const taskLogViewRef = ref(null)

// ====================== state ======================
const activeTab = ref('overview')
const loading = ref(false)
const error = ref('')

const tasks = ref([])
const groups = ref([])
const configs = ref([])
const overviewTrend = ref([])
const overviewActivities = ref([])

const dashboardLoading = ref(false)
const dashboardError = ref('')

// 统一用“选中的对象数组”保存，避免 modal 里拿不到名称
const selectedItems = ref([])

// 当前最新启动的任务日志 ID，传给 TaskLogView 聚焦
const currentTaskLogId = ref('')

// 巡检相关状态
const inspectionVisible = ref(false)
const inspectionData = ref(null)
const currentInspectingRow = ref(null)
const inspectionCache = ref({})

// 采集 Modal 相关
const acquisitionActionVisible = ref(false)
const currentConfig = ref(null)
const timelineRealNow = ref(new Date())
const timelineTestNow = ref(null)
let timelineNowTimer = null

// ====================== computed ======================
const selectedItemIds = computed(() =>
  (selectedItems.value || [])
    .map((item) => item?.id)
    .filter((id) => id !== undefined && id !== null && id !== '')
    .map((id) => String(id)),
)

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

const DEFAULT_TIMELINE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#14b8a6',
  '#6366f1',
  '#ef4444',
]

const pickTimelineColor = (taskName, index) => {
  const key = String(taskName || index || '')
  let hash = 0

  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }

  return DEFAULT_TIMELINE_COLORS[Math.abs(hash) % DEFAULT_TIMELINE_COLORS.length]
}

const timelineEffectiveNow = computed(() => timelineTestNow.value || timelineRealNow.value)

const rawCronTimelineItems = computed(() =>
  buildCronTimelineItems(tasks.value, timelineEffectiveNow.value),
)

const timelinePanelItems = computed(() =>
  rawCronTimelineItems.value.map((task, index) => {
    const points = Array.isArray(task.rollingPoints)
      ? task.rollingPoints.map((point) => ({
          timestamp: point.timestamp,
          time: point.timestamp,
          type: point.type,
          kind: point.kind,
          status: point.status,
        }))
      : []

    return {
      id: task.id,
      taskName: task.taskName,
      isEnabled: task.isEnabled,
      cronExpression: task.cronExpression,
      color: pickTimelineColor(task.taskName, index),
      points,
      nextPoint: task.nextPoint || null,
    }
  }),
)

const currentTitle = computed(
  () =>
    ({
      overview: '全量采集总览',
      task: '任务监控详情',
      group: '配置组管理',
      config: '具体配置项',
      log: '任务日志中心',
    })[activeTab.value],
)

const currentDesc = computed(
  () =>
    ({
      overview: '概览大盘，展示系统整体运行状态与采集指标',
      task: '任务层级，用于管理采集任务，每个任务可关联多个配置组',
      group: '分组层级，展示任务下的配置组信息',
      config: '原子层级，展示最底层采集配置',
      log: '查看采集任务的运行状态、执行进度和文件级日志明细',
    })[activeTab.value],
)

// ====================== helpers ======================
const unwrapResult = (res) => res?.data ?? res

const formatApiDate = (dateStr) => {
  if (!dateStr) return ''
  return String(dateStr).split('T')[0].replace(/-/g, '.')
}

const getTodayForApi = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

const openLogTabForTask = async (taskLogId) => {
  currentTaskLogId.value = taskLogId
  activeTab.value = 'log'

  await nextTick()

  if (taskLogViewRef.value?.refreshCurrentTask) {
    await taskLogViewRef.value.refreshCurrentTask()
  }
}

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
    tasks.value = unwrapResult(tasksResult.value) || []
    groups.value = unwrapResult(groupsResult.value) || []
    configs.value = unwrapResult(configsResult.value) || []
  }

  overviewTrend.value = trendResult.status === 'fulfilled' ? (unwrapResult(trendResult.value) || []) : []
  overviewActivities.value =
    activitiesResult.status === 'fulfilled' ? (unwrapResult(activitiesResult.value) || []) : []

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

// 当配置保存成功后，清空巡检缓存，防止显示旧状态
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
  if (!selectedItemIds.value.length) {
    message.error('请先选择配置项')
    return
  }
  assignModalRef.value.open(selectedItemIds.value, groups.value)
}

const handleAssignConfirm = async (data) => {
  const hideLoading = message.loading('正在同步关联关系，请稍候...')

  try {
    const currentGroup = groups.value.find((g) => g.id === data.groupId)
    const originIds = currentGroup?.configIds || []

    const selectedIds = [...new Set(data.configIds)]
    const idsToAdd = selectedIds.filter((id) => !originIds.includes(id))
    const idsToRemove = originIds.filter((id) => !selectedIds.includes(id))

    if (idsToAdd.length === 0 && idsToRemove.length === 0) {
      message.info('数据未发生变化')
      return
    }

    if (idsToRemove.length > 0) {
      await api.removeConfigsFromGroup(data.groupId, idsToRemove)
    }
    if (idsToAdd.length > 0) {
      await api.bindConfigsToGroup(data.groupId, idsToAdd)
    }

    message.success('更新成功')
    await loadAllData()
  } catch (error) {
    console.error('处理失败', error)
    message.error('更新失败')
  } finally {
    hideLoading()
  }
}

// ====================== 卡片功能（Config)：源路径检视 ======================
const fetchInspectionData = async (row, year, month) => {
  const cacheKey = `${row.id}_${year}_${month}`

  if (inspectionCache.value[cacheKey]) {
    inspectionData.value = inspectionCache.value[cacheKey]
    return
  }

  try {
    const mm = month < 10 ? `0${month}` : month
    const lastDay = new Date(year, month, 0).getDate()
    const startTime = `${year}-${mm}-01`
    const endTime = `${year}-${mm}-${lastDay}`

    const res = await api.fetchInspection({
      configId: row.id,
      startTime,
      endTime,
      user: 'et1',
      pass: 'dt123456#',
    })

    const result = unwrapResult(res)?.[0] || { files: [] }

    inspectionCache.value[cacheKey] = result
    inspectionData.value = result
  } catch (e) {
    console.error('获取巡检数据失败:', e)
    message.error('巡检数据获取失败')
  }
}

// 首次打开弹窗
const openInspection = async (row) => {
  currentInspectingRow.value = row
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1

  inspectionModalRef.value?.setPeriod(y, m)

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
const handleTabChange = async (tab) => {
  activeTab.value = tab
  selectedItems.value = []
}

// ====================== 卡片相关 ======================
const viewDetail = (item) => drawerRef.value?.open(item.EqName || item.groupName || '详情', item)

const handleSelectionChange = (items) => {
  selectedItems.value = Array.isArray(items) ? items : []
}

// ====================== 采集相关 ======================
const handleTimeRangeAcquisition = () => {
  if (!selectedItems.value.length) {
    message.warning('请先选择配置')
    return
  }

  currentConfig.value = [...selectedItems.value]
  acquisitionActionVisible.value = true
}

// 时间段采集
const handleTaskStartConfirm = async (data) => {
  const hide = message.loading('正在下发采集任务...', 0)

  try {
    const ids = (data.tasks || []).map((item) => String(item.id))
    const startDate = formatApiDate(data.startTime)
    const endDate = formatApiDate(data.endTime)

    const res = await api.startExecutionConfigsRange({
      ids,
      startDate,
      endDate,
    })

    const result = unwrapResult(res)
    const taskLogId = result?.taskLogId || ''

    hide()

    if (!taskLogId) {
      message.warning(result?.message || '未生成任务日志，请检查条件')
      return
    }

    message.success(`任务已成功下发！采集配置数：${ids.length}`)
    await openLogTabForTask(taskLogId)
  } catch (error) {
    hide()
    message.error('任务下发失败，请重试')
    console.error(error)
  }
}

// 单时间采集
const handleAcquisition = async () => {
  if (!selectedItemIds.value.length) {
    message.warning('请先选择配置')
    return
  }

  const hide = message.loading('正在下发采集任务...', 0)

  try {
    const processDate = getTodayForApi()
    const res = await api.startExecutionByIds(selectedItemIds.value, processDate)
    const result = unwrapResult(res)
    const taskLogId = result?.taskLogId || ''

    hide()

    if (!taskLogId) {
      message.warning(result?.message || '未生成任务日志，请检查所选配置')
      return
    }

    message.success('采集任务已启动')
    await openLogTabForTask(taskLogId)
  } catch (error) {
    hide()
    message.error('采集任务下发失败')
    console.error(error)
  }
}

// ====================== 启停相关 ======================
const startTask = () => message.success('任务开启...')
const pauseTask = () => message.success('任务暂停...')

const startGroup = () => message.success('配置组开启...')
const pauseGroup = () => message.success('配置组暂停...')

const startConfig = async () => {
  if (selectedItemIds.value.length === 0) {
    message.warning('请先选择配置')
    return
  }

  const idsToUpdate = [...selectedItemIds.value]

  try {
    await api.setConfigStatus(idsToUpdate, true)
    message.success('开启成功')

    configs.value.forEach((cfg) => {
      if (idsToUpdate.includes(String(cfg.id))) {
        cfg.isEnabled = true
      }
    })

    selectedItems.value = []
  } catch (err) {
    message.error('操作失败')
    console.error(err)
  }
}

const pauseConfig = async () => {
  if (selectedItemIds.value.length === 0) {
    message.warning('请先选择配置')
    return
  }

  const idsToUpdate = [...selectedItemIds.value]

  try {
    await api.setConfigStatus(idsToUpdate, false)
    message.success('暂停成功')

    configs.value.forEach((cfg) => {
      if (idsToUpdate.includes(String(cfg.id))) {
        cfg.isEnabled = false
      }
    })

    selectedItems.value = []
  } catch (err) {
    message.error('操作失败')
    console.error(err)
  }
}

const handleRefreshTaskStatus = async () => {
  if (!taskLogViewRef.value?.refreshCurrentTask) {
    message.warning('日志视图尚未就绪')
    return
  }

  await taskLogViewRef.value.refreshCurrentTask()
}

const handleRefreshHistoryLogs = async () => {
  if (!taskLogViewRef.value?.refreshHistoryList) {
    message.warning('日志视图尚未就绪')
    return
  }

  await taskLogViewRef.value.refreshHistoryList()
  message.success('历史记录刷新成功')
}

const handleOpenLogFromTimeline = async () => {
  activeTab.value = 'log'
  await nextTick()
  await taskLogViewRef.value?.refreshHistoryList?.()
}

const toDateSafe = (value) => {
  if (!value && value !== 0) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const handleSetTimelineReferenceTime = (value) => {
  const parsed = toDateSafe(value)
  if (!parsed) return
  timelineTestNow.value = parsed
}

const handleResetTimelineReferenceTime = () => {
  timelineTestNow.value = null
  timelineRealNow.value = new Date()
}

const syncTimelineNow = () => {
  timelineRealNow.value = new Date()
}

const startTimelineClock = () => {
  syncTimelineNow()
  timelineNowTimer = setInterval(syncTimelineNow, 60000)
}

const stopTimelineClock = () => {
  if (!timelineNowTimer) return
  clearInterval(timelineNowTimer)
  timelineNowTimer = null
}

// ====================== 按钮相关 ======================
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
  log: [
    [
      { text: '刷新任务状态', handler: handleRefreshTaskStatus, btnType: 'blue', icon: ReloadOutlined },
    ],
    [
      { text: '刷新历史记录', handler: handleRefreshHistoryLogs, btnType: 'primary', icon: ReloadOutlined },
    ],
  ],
}

const actionButtons = computed(() => {
  return BUTTON_CONFIG_MAP[activeTab.value] || []
})

const getBtnClass = (btn) => {
  const classes = []

  if (btn.btnType) {
    if (btn.btnType.startsWith('gradient-')) {
      classes.push(`btn-${btn.btnType}`)
    } else {
      classes.push(`ant-btn-${btn.btnType}`)
    }
  }

  return classes
}

// ====================== 初始化数据 ======================
onMounted(() => {
  startTimelineClock()
  loadAllData()
})

onBeforeUnmount(() => {
  stopTimelineClock()
})
</script>

<style scoped>
.module-card-overview {
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.overview-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}
</style>
