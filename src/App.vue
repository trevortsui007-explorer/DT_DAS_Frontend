<template>
  <div class="app-form-wrapper">
    <StatCards :activeTab="activeTab" :stats="stats" @update:activeTab="handleTabChange" />

    <div class="module-card" :class="{ 'module-card-overview': activeTab === 'overview' }">
      <div class="header-section">
        <div class="header-main">
          <h3 class="header-title">{{ currentTitle }}</h3>
          <div class="header-desc">{{ currentDesc }}</div>
        </div>

        <div v-if="activeTab === 'log'" class="log-mode-switch ant-btn-group">
          <button
            class="ant-btn log-mode-btn"
            :class="{ 'is-active': logViewMode === 'task' }"
            type="button"
            @click="setLogViewMode('task')"
          >
            <span>按任务</span>
          </button>
          <button
            class="ant-btn log-mode-btn"
            :class="{ 'is-active': logViewMode === 'config' }"
            type="button"
            @click="setLogViewMode('config')"
          >
            <span>按配置</span>
          </button>
          <button
            class="ant-btn log-mode-btn"
            :class="{ 'is-active': logViewMode === 'file' }"
            type="button"
            @click="setLogViewMode('file')"
          >
            <span>按文件</span>
          </button>
        </div>

        <div class="header-actions" :class="{ 'header-actions-overview': activeTab === 'overview' }">
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

          <button
            v-if="showLoginButton"
            class="ant-btn ant-btn-primary"
            type="button"
            @click="openLoginModal"
          >
            <LoginOutlined />
            <span>登录</span>
          </button>
        </div>
      </div>

      <TaskLogView
        v-if="activeTab === 'log'"
        ref="taskLogViewRef"
        :initial-task-log-id="currentTaskLogId"
        :log-view-mode="logViewMode"
      />

      <div v-else-if="activeTab === 'overview'" class="overview-stack">
        <CornTimeFrame
          :items="timelinePanelItems"
          :loading="loading"
          :error="error"
          :max-height="220"
          :reference-time="timelineEffectiveNow"
          :is-test-mode="Boolean(timelineTestNow)"
          @set-reference-time="handleSetTimelineReferenceTime"
          @reset-reference-time="handleResetTimelineReferenceTime"
          @open-log="handleOpenLogFromTimeline"
        />
        <OverviewDashboard
          :status-distribution="taskStatusDistribution"
          :task-logs="overviewTaskLogs"
          :tasks="tasks"
          :configs="configs"
          :stats="stats"
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
        :allConfigs="configs"
        :loading="loading"
        :error="error"
        @edit-task="editTask"
        @edit-config="editConfig"
        @selection-change="handleSelectionChange"
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
        @test-config="openTestAcquisition"
      />
    </div>
  </div>

  <ConfigModal
    ref="configModalRef"
    @saved="onConfigSaved"
    @goBack="handleGoBackToImport"
    @open-template-manager="openTemplateManager"
  />
  <GroupModal ref="groupModalRef" @saved="onGroupSaved" />
  <TaskModal ref="taskModalRef" @saved="onTaskSaved" />
  <ImportConfigModal
    ref="importConfigModalRef"
    @imported="handleImportSuccess"
    @template-imported="handleTemplateImportSuccess"
  />
  <TemplateManagerModal ref="templateManagerModalRef" />
  <BatchAssignModal ref="assignModalRef" @confirm="handleAssignConfirm" />
  <InspectionModal
    ref="inspectionModalRef"
    v-model:visible="inspectionVisible"
    :data="inspectionData"
    @change="handleInspectionMonthChange"
  />
  <GroupInspectionModal
    v-model:visible="groupInspectionVisible"
    :groups="groupInspectionGroups"
  />
  <AcquisitionModal
    v-model:visible="acquisitionActionVisible"
    :task-data="currentConfig"
    @confirm="handleTaskStartConfirm"
  />
  <ReportExportModal
    v-model:visible="reportExportVisible"
    :groups="reportExportGroups"
  />
  <TestAcquisitionModal ref="testAcquisitionModalRef" />

  <DetailDrawer ref="drawerRef" />

  <div
    class="ant-modal-mask"
    :class="{ active: apiAddressModalVisible }"
    @click="closeApiAddressModal"
  ></div>
  <div class="ant-modal-wrap" :class="{ active: apiAddressModalVisible }">
    <div class="ant-modal api-address-modal" @click.stop>
      <div class="ant-modal-header">
        <h3 class="ant-modal-title">切换 API 地址</h3>
        <button type="button" class="modal-close-btn" @click="closeApiAddressModal">×</button>
      </div>

      <div class="ant-modal-body">
        <div class="api-address-current">
          <span>当前生效</span>
          <strong>{{ activeApiBaseUrl || '--' }}</strong>
        </div>
        <div class="api-address-default">
          <span>.env 默认</span>
          <code>{{ defaultApiBaseUrl || '--' }}</code>
        </div>

        <div class="api-address-section-title">预设地址</div>
        <div class="api-address-options">
          <button
            v-for="preset in apiBaseUrlPresets"
            :key="preset.url"
            type="button"
            class="api-address-option"
            :class="{ active: apiAddressDraft === preset.url }"
            @click="selectApiAddress(preset.url)"
          >
            {{ preset.label }}
          </button>
        </div>

        <label class="api-address-custom">
          <span>自定义地址</span>
          <input
            v-model.trim="apiAddressDraft"
            class="ant-input"
            type="text"
            placeholder="例如：http://10.9.10.135:1001"
          />
        </label>
      </div>

      <div class="ant-modal-footer">
        <button type="button" class="ant-btn ant-btn-default" @click="closeApiAddressModal">取消</button>
        <button type="button" class="ant-btn ant-btn-default" @click="restoreDefaultApiAddress">恢复默认</button>
        <button type="button" class="ant-btn ant-btn-primary" @click="saveApiAddress">保存并刷新</button>
      </div>
    </div>
  </div>

  <div
    class="ant-modal-mask"
    :class="{ active: loginVisible }"
    @click="closeLoginModal"
  ></div>
  <div class="ant-modal-wrap" :class="{ active: loginVisible }">
    <div class="ant-modal das-login-modal" @click.stop>
      <div class="ant-modal-header">
        <h3 class="ant-modal-title">管理员登录</h3>
        <button type="button" class="modal-close-btn" @click="closeLoginModal">×</button>
      </div>

      <form @submit.prevent="submitLogin">
        <div class="ant-modal-body">
          <label class="login-field">
            <span>账号</span>
            <input
              v-model.trim="loginForm.account"
              class="ant-input"
              type="text"
              autocomplete="username"
            />
          </label>
          <label class="login-field">
            <span>密码</span>
            <input
              v-model="loginForm.password"
              class="ant-input"
              type="password"
              autocomplete="current-password"
            />
          </label>
          <div v-if="loginError" class="login-error">{{ loginError }}</div>
        </div>

        <div class="ant-modal-footer">
          <button type="button" class="ant-btn ant-btn-default" @click="closeLoginModal">取消</button>
          <button type="submit" class="ant-btn ant-btn-primary">登录</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import message, {
  StatCards, TableView, CardsView,
  ConfigModal, DetailDrawer, GroupModal,
  TaskModal, ImportConfigModal, BatchAssignModal,
  InspectionModal, GroupInspectionModal, AcquisitionModal,
  ReportExportModal,
  TemplateManagerModal,
  TaskLogView,
  TestAcquisitionModal,
} from './components'

import {
  ReloadOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  CopyOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  PartitionOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  SelectOutlined,
  FieldTimeOutlined,
  LoginOutlined,
  FileExcelOutlined,
  ExperimentOutlined,
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
const templateManagerModalRef = ref(null)
const assignModalRef = ref(null)
const inspectionModalRef = ref(null)
const taskLogViewRef = ref(null)
const testAcquisitionModalRef = ref(null)

// ====================== state ======================
const activeTab = ref('overview')
const logViewMode = ref('task')
const loading = ref(false)
const error = ref('')

const tasks = ref([])
const groups = ref([])
const configs = ref([])
const overviewTaskLogs = ref([])

const dashboardLoading = ref(false)
const dashboardError = ref('')
const apiBaseUrlPresets = [
  { label: 'http://10.9.10.135:1001（广州正式服）', url: 'http://10.9.10.135:1001' },
  { label: 'http://10.6.9.15:1001（东莞正式服）', url: 'http://10.6.9.15:1001' },
  { label: 'http://localhost:31173', url: 'http://localhost:31173' },
  { label: 'http://localhost:31177', url: 'http://localhost:31177' },
  { label: 'http://localhost:31175', url: 'http://localhost:31175' },
  { label: 'http://10.6.9.15:8888', url: 'http://10.6.9.15:8888' },
]
const apiAddressModalVisible = ref(false)
const apiAddressDraft = ref('')
const defaultApiBaseUrl = api.getDefaultApiBaseUrl()
const activeApiBaseUrl = ref(api.getActiveApiBaseUrl())

// 统一用“选中的对象数组”保存，避免 modal 里拿不到名称
const selectedItems = ref([])

// 当前最新启动的任务日志 ID，传给 TaskLogView 聚焦
const currentTaskLogId = ref('')

// 巡检相关状态
const inspectionVisible = ref(false)
const inspectionData = ref(null)
const currentInspectingRow = ref(null)
const inspectionCache = ref({})
const groupInspectionVisible = ref(false)
const groupInspectionGroups = ref([])
const reportExportVisible = ref(false)
const reportExportGroups = ref([])

// 采集 Modal 相关
const acquisitionActionVisible = ref(false)
const currentConfig = ref(null)
const timelineRealNow = ref(new Date())
const timelineTestNow = ref(null)
let timelineNowTimer = null
let overviewLogRefreshTimer = null
let overviewLogsRefreshing = false
const OVERVIEW_LOG_REFRESH_INTERVAL = 60000

const LOGIN_HASH_SALT = 'DAS_LOGIN_V1'
const ADMIN_LOGIN_HASH = '4ff5a5f060bb1f71fcef7c93c9e8af9a8ef4962ed54f6238a6864e96f579c69c'
const IS_DEVELOP_MODE = import.meta.env.DEV || import.meta.env.MODE === 'development'

const isAdminLoggedIn = ref(IS_DEVELOP_MODE)
const loginVisible = ref(false)
const loginError = ref('')
const loginForm = ref({
  account: '',
  password: '',
})

// ====================== computed ======================
const isSystemAccount = computed(() => isAdminLoggedIn.value)
const showLoginButton = computed(() => !IS_DEVELOP_MODE && !isSystemAccount.value)

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

const normalizeTaskLog = (raw = {}) => ({
  taskLogId: raw.taskLogId || raw.TaskLogId || raw.id || raw.Id || '',
  taskCode: raw.taskCode || raw.TaskCode || '',
  taskId: raw.taskId ?? raw.TaskId ?? null,
  taskName: raw.taskName || raw.TaskName || '',
  status: raw.status || raw.Status || '',
  startTime: raw.startTime || raw.StartTime || '',
  endTime: raw.endTime || raw.EndTime || '',
})

const normalizeTimelineStatus = (status) => {
  const value = String(status || '').replace(/\s+/g, '').toLowerCase()
  if (value === 'failed') return 'error'
  if (value === 'partialsuccess') return 'warning'
  if (value === 'running') return 'running'
  if (value === 'success') return 'success'
  return 'default'
}

const getTaskId = (task) => task?.id ?? task?.Id ?? null

const taskLogPointsByTaskId = computed(() => {
  const map = new Map()

  overviewTaskLogs.value.forEach((rawLog) => {
    const log = normalizeTaskLog(rawLog)
    const timestamp = new Date(log.startTime || log.endTime || '').getTime()
    if (!Number.isFinite(timestamp)) return

    const point = {
      timestamp,
      time: timestamp,
      type: 'history',
      kind: 'history',
      status: normalizeTimelineStatus(log.status),
      taskLogId: log.taskLogId,
      label: log.taskCode || log.taskLogId,
    }

    const taskId = log.taskId === null || log.taskId === undefined ? '' : String(log.taskId)
    if (!map.has(taskId)) map.set(taskId, [])
    map.get(taskId).push(point)
  })

  return map
})

const timelinePanelItems = computed(() => {
  const items = rawCronTimelineItems.value.map((task, index) => {
    const taskId = getTaskId(task)
    const historyPoints = taskLogPointsByTaskId.value.get(String(taskId)) || []
    const futurePoints = Array.isArray(task.rollingPoints)
      ? task.rollingPoints
          .filter((point) => point.type === 'prediction')
          .map((point) => ({
            timestamp: point.timestamp,
            time: point.timestamp,
            type: 'prediction',
            kind: point.kind,
            status: point.status,
          }))
      : []

    return {
      id: taskId,
      taskName: task.taskName,
      isEnabled: task.isEnabled,
      cronExpression: task.cronExpression,
      color: pickTimelineColor(task.taskName, index),
      points: [...historyPoints, ...futurePoints],
      nextPoint: task.nextPoint || null,
    }
  })

  const timelineTaskIds = new Set(items.map((item) => String(item.id)))
  const unmatchedHistoryPoints = []

  taskLogPointsByTaskId.value.forEach((points, taskId) => {
    if (timelineTaskIds.has(String(taskId))) return
    unmatchedHistoryPoints.push(...points)
  })

  if (unmatchedHistoryPoints.length) {
    items.push({
      id: 'task-log-history',
      taskName: '任务日志记录',
      isEnabled: false,
      cronExpression: '',
      color: '#64748b',
      points: unmatchedHistoryPoints,
      nextPoint: null,
    })
  }

  return items
})

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
const unwrapTaskLogs = (res) => {
  const result = unwrapResult(res)
  return res?.data?.items || result?.items || result || []
}

const refreshOverviewTaskLogs = async () => {
  if (overviewLogsRefreshing || loading.value) return

  overviewLogsRefreshing = true

  try {
    const res = await api.fetchTaskLogs({ pageNo: 1, pageSize: 100 })
    overviewTaskLogs.value = unwrapTaskLogs(res)
    dashboardError.value = ''
  } catch (err) {
    dashboardError.value = '部分总览数据加载失败'
    console.error('自动刷新总览日志失败:', err)
  } finally {
    overviewLogsRefreshing = false
  }
}

const openApiAddressModal = () => {
  activeApiBaseUrl.value = api.getActiveApiBaseUrl()
  apiAddressDraft.value = activeApiBaseUrl.value
  apiAddressModalVisible.value = true
}

const closeApiAddressModal = () => {
  apiAddressModalVisible.value = false
}

const selectApiAddress = (url) => {
  apiAddressDraft.value = url
}

const isValidApiBaseUrl = (url) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch (err) {
    return false
  }
}

const saveApiAddress = async () => {
  const nextUrl = String(apiAddressDraft.value || '').trim()
  if (!isValidApiBaseUrl(nextUrl)) {
    message.warning('请输入有效的 http/https API 地址')
    return
  }

  api.setRuntimeApiBaseUrl(nextUrl)
  activeApiBaseUrl.value = api.getActiveApiBaseUrl()
  apiAddressModalVisible.value = false
  message.success('API 地址已切换，正在刷新大盘')
  await loadAllData()
}

const restoreDefaultApiAddress = async () => {
  api.clearRuntimeApiBaseUrl()
  activeApiBaseUrl.value = api.getActiveApiBaseUrl()
  apiAddressDraft.value = activeApiBaseUrl.value
  apiAddressModalVisible.value = false
  message.success('已恢复 .env 默认 API 地址，正在刷新大盘')
  await loadAllData()
}

const loadAllData = async () => {
  loading.value = true
  dashboardLoading.value = true
  error.value = ''
  dashboardError.value = ''

  const [tasksResult, groupsResult, configsResult, taskLogsResult] =
    await Promise.allSettled([
      api.fetchTasks(),
      api.fetchGroups(),
      api.fetchConfigs(),
      api.fetchTaskLogs({ pageNo: 1, pageSize: 100 }),
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

  overviewTaskLogs.value =
    taskLogsResult.status === 'fulfilled'
      ? unwrapTaskLogs(taskLogsResult.value)
      : []

  if (taskLogsResult.status === 'rejected') {
    dashboardError.value = '部分总览数据加载失败'
  }

  loading.value = false
  dashboardLoading.value = false
}

const exportReport = () => {
  const targetGroups = selectedItems.value.length ? selectedItems.value : groups.value

  if (!targetGroups.length) {
    message.warning('暂无可导出的配置组')
    return
  }

  reportExportGroups.value = [...targetGroups]
  reportExportVisible.value = true
}

// ====================== Task 界面 ======================
const openNewTask = () => taskModalRef.value?.open(false, null, groups.value)
const editTask = (task) => taskModalRef.value?.open(true, task, groups.value)
const onTaskSaved = () => {
  message.success('任务保存成功')
  loadAllData()
}

const deleteTask = async () => {
  if (!selectedItemIds.value.length) {
    message.warning('请先选择任务')
    return
  }

  const confirmed = await message.confirm({
    title: '删除任务',
    content: `确认删除选中的 ${selectedItemIds.value.length} 个任务？`,
    okText: '删除',
    cancelText: '取消',
  })
  if (!confirmed) return

  try {
    await api.deleteTasks(selectedItemIds.value)
    selectedItems.value = []
    message.success('任务删除成功')
    await loadAllData()
  } catch (err) {
    message.error('任务删除失败')
    console.error(err)
  }
}

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

const openGroupInspection = () => {
  const targetGroups = selectedItems.value.length ? selectedItems.value : groups.value

  if (!targetGroups.length) {
    message.warning('暂无可巡检的配置组')
    return
  }

  groupInspectionGroups.value = targetGroups
  groupInspectionVisible.value = true
}

// ====================== Config 界面 ======================
const openNewConfig = () => configModalRef.value?.open(false, null, false, { existingConfigs: configs.value })
const editConfig = (config) =>
  configModalRef.value?.open(true, config, false, { existingConfigs: configs.value })

const copyConfig = () => {
  if (selectedItems.value.length !== 1) {
    message.warning('请选择且只能选择 1 个配置进行复制')
    return
  }

  const selectedId = String(selectedItems.value[0].id)
  const sourceConfig = configs.value.find((item) => String(item.id || item.Id) === selectedId)

  if (!sourceConfig) {
    message.error('未找到选中的配置')
    return
  }

  configModalRef.value?.open(false, { ...sourceConfig, id: '', Id: '' }, false, {
    mode: 'copy',
    existingConfigs: configs.value,
  })
}

const openTestAcquisition = (config) => {
  testAcquisitionModalRef.value?.open(config)
}

const openSelectedTestAcquisition = () => {
  if (selectedItems.value.length !== 1) {
    message.warning('请选择且只能选择 1 个配置进行测试采集')
    return
  }

  const selectedId = String(selectedItems.value[0].id)
  const sourceConfig = configs.value.find((item) => String(item.id ?? item.Id) === selectedId)

  if (!sourceConfig) {
    message.error('未找到选中的配置')
    return
  }

  openTestAcquisition(sourceConfig)
}

// 当配置保存成功后，清空巡检缓存，防止显示旧状态
const onConfigSaved = () => {
  inspectionCache.value = {}
  message.success('配置保存成功')
  loadAllData()
}

const deleteConfig = () => console.log('删除配置')

// 导入配置
const importConfig = () => importConfigModalRef.value?.open(false)
const openTemplateManager = (templateId) => templateManagerModalRef.value?.open(templateId)
const handleImportSuccess = (data) => {
  message.success('导入成功，请继续确认配置')
  configModalRef.value?.open(false, data, true, { existingConfigs: configs.value })
}
const handleTemplateImportSuccess = async () => {
  message.success('模板任务导入成功')
  await loadAllData()
  activeTab.value = 'task'
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
    })

    const result = unwrapResult(res)?.[0] || { files: [] }

    inspectionCache.value[cacheKey] = result
    inspectionData.value = result
  } catch (e) {
    console.error('获取巡检数据失败:', e)
    if (e?.code === 'ECONNABORTED') {
      message.error('巡检扫描超时，请缩小时间范围或检查共享目录响应')
    } else {
      message.error('巡检数据获取失败')
    }
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

const getSelectionLabel = () =>
  ({
    task: '任务',
    group: '配置组',
    config: '配置',
  })[activeTab.value] || '配置'

// ====================== 采集相关 ======================
const handleTimeRangeAcquisition = () => {
  if (!selectedItems.value.length) {
    message.warning(`请先选择${getSelectionLabel()}`)
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
      ids: activeTab.value === 'config' ? ids : [],
      groupIds: activeTab.value === 'group' ? ids : [],
      taskIds: activeTab.value === 'task' ? ids : [],
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

    message.success(`任务已成功下发！${getSelectionLabel()}数：${ids.length}`)
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
    message.warning(`请先选择${getSelectionLabel()}`)
    return
  }

  const hide = message.loading('正在下发采集任务...', 0)

  try {
    const processDate = getTodayForApi()
    const res =
      activeTab.value === 'task'
        ? await api.startExecutionByTasks(selectedItemIds.value, processDate)
        : activeTab.value === 'group'
          ? await api.startExecutionByGroups(selectedItemIds.value, processDate)
          : await api.startExecutionByIds(selectedItemIds.value, processDate)
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
const updateTaskStatus = async (isEnabled) => {
  if (selectedItemIds.value.length === 0) {
    message.warning('请先选择任务')
    return
  }

  const idsToUpdate = [...selectedItemIds.value]
  const actionText = isEnabled ? '开启' : '暂停'
  const hide = message.loading(`正在${actionText}任务...`, 0)

  try {
    await api.setTaskStatus(idsToUpdate, isEnabled)

    tasks.value.forEach((task) => {
      const taskId = String(task.id ?? task.Id)
      if (idsToUpdate.includes(taskId)) {
        task.isEnabled = isEnabled
        task.IsEnabled = isEnabled
      }
    })

    selectedItems.value = []
    message.success(`任务${actionText}成功`)
    await loadAllData()
  } catch (err) {
    message.error(`任务${actionText}失败`)
    console.error(err)
  } finally {
    hide?.()
  }
}

const startTask = () => updateTaskStatus(true)
const pauseTask = () => updateTaskStatus(false)

const updateGroupStatus = async (isEnabled) => {
  if (selectedItemIds.value.length === 0) {
    message.warning('请先选择配置组')
    return
  }

  const idsToUpdate = [...selectedItemIds.value]
  const actionText = isEnabled ? '开启' : '暂停'
  const hide = message.loading(`正在${actionText}配置组...`, 0)

  try {
    await api.setGroupStatus(idsToUpdate, isEnabled)

    groups.value.forEach((group) => {
      const groupId = String(group.id ?? group.Id)
      if (idsToUpdate.includes(groupId)) {
        group.isEnabled = isEnabled
        group.IsEnabled = isEnabled
      }
    })

    selectedItems.value = []
    message.success(`配置组${actionText}成功`)
    await loadAllData()
  } catch (err) {
    message.error(`配置组${actionText}失败`)
    console.error(err)
  } finally {
    hide?.()
  }
}

const startGroup = () => updateGroupStatus(true)
const pauseGroup = () => updateGroupStatus(false)

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

const handleCancelCurrentTask = async () => {
  if (!taskLogViewRef.value?.getCurrentTask) {
    message.warning('日志视图尚未就绪')
    return
  }

  const task = taskLogViewRef.value.getCurrentTask()
  const taskLogId = task?.taskLogId || ''

  if (!taskLogId) {
    message.warning('请先选择任务')
    return
  }

  if (String(task.status || '').replace(/\s+/g, '').toLowerCase() !== 'running') {
    message.warning('当前任务已结束，无需取消')
    return
  }

  const confirmed = await message.confirm({
    title: '取消任务',
    content: '确认取消当前采集任务？取消后任务会停止继续采集，已完成的文件明细会保留。',
    okText: '取消任务',
    cancelText: '返回',
  })
  if (!confirmed) return

  try {
    const res = await api.cancelTaskLog(taskLogId)
    const payload = res?.data || res || {}
    message.success(payload.message || payload.Message || '任务已取消')
    await Promise.all([
      taskLogViewRef.value.refreshCurrentTask?.(),
      taskLogViewRef.value.refreshHistoryList?.(),
    ])
  } catch (err) {
    message.error('取消任务失败')
    console.error(err)
  }
}

const handleRefreshHistoryLogs = async () => {
  if (!taskLogViewRef.value?.refreshHistoryList) {
    message.warning('日志视图尚未就绪')
    return
  }

  await taskLogViewRef.value.refreshHistoryList()
  message.success('历史记录刷新成功')
}

const handleOpenLogFromTimeline = async (payload = {}) => {
  if (payload.taskLogId) {
    currentTaskLogId.value = payload.taskLogId
  }
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

const shouldRefreshOverviewLogs = () => activeTab.value === 'overview' && !timelineTestNow.value

const startOverviewLogAutoRefresh = () => {
  stopOverviewLogAutoRefresh()
  overviewLogRefreshTimer = setInterval(() => {
    if (!shouldRefreshOverviewLogs()) return
    void refreshOverviewTaskLogs()
  }, OVERVIEW_LOG_REFRESH_INTERVAL)
}

const stopOverviewLogAutoRefresh = () => {
  if (!overviewLogRefreshTimer) return
  clearInterval(overviewLogRefreshTimer)
  overviewLogRefreshTimer = null
}

// ====================== 按钮相关 ======================
const BUTTON_CONFIG_MAP = {
  overview: [
    { text: '切换地址', handler: openApiAddressModal, btnType: 'default', icon: SyncOutlined, className: 'api-switch-btn' },
    { text: '刷新大盘', handler: loadAllData, btnType: 'primary', icon: ReloadOutlined, className: 'overview-refresh-btn' },
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
    [
      { text: '报表导出', handler: exportReport, btnType: 'orange', icon: ExportOutlined, className: 'report-export-btn' },
    ],
    [
      { text: '一键巡检', handler: openGroupInspection, btnType: 'blue', icon: SelectOutlined },
      { text: '批量同步', handler: batchSyncGroups, btnType: 'green', icon: SyncOutlined },
    ]
  ],
  config: [
    [
      { text: 'Excel模板', handler: openTemplateManager, btnType: 'blue', icon: FileExcelOutlined },
    ],
    [
      { text: '导入配置', handler: importConfig, btnType: 'aqua', icon: CloudUploadOutlined },
      { text: '新增配置', handler: openNewConfig, btnType: 'primary', icon: PlusOutlined },
      { text: '复制配置', handler: copyConfig, btnType: 'orange', icon: CopyOutlined },
      { text: '删除配置', handler: deleteConfig, btnType: 'red', icon: DeleteOutlined },
    ],
    [
      { text: '开启', handler: startConfig, btnType: 'primary', icon: PlayCircleOutlined },
      { text: '暂停', handler: pauseConfig, btnType: 'darkgray', icon: PauseCircleOutlined },
    ],
    [
      { text: '测试采集', handler: openSelectedTestAcquisition, btnType: 'orange', icon: ExperimentOutlined },
      { text: '今日采集', handler: handleAcquisition, btnType: 'aqua', icon: SelectOutlined },
      { text: '时间段采集', handler: handleTimeRangeAcquisition, btnType: 'blue', icon: FieldTimeOutlined },
    ],
    [
      { text: '批量归组', handler: openAssignModal, btnType: 'green', icon: PartitionOutlined },
    ]
  ],
  log: [
    [
      { text: '取消当前任务', handler: handleCancelCurrentTask, btnType: 'red', icon: CloseCircleOutlined },
    ],
    [
      { text: '刷新任务状态', handler: handleRefreshTaskStatus, btnType: 'blue', icon: ReloadOutlined },
    ],
    [
      { text: '刷新历史记录', handler: handleRefreshHistoryLogs, btnType: 'primary', icon: ReloadOutlined },
    ],
  ],
}

const LIMITED_BUTTON_CONFIG_MAP = {
  overview: [
    { text: '切换地址', handler: openApiAddressModal, btnType: 'default', icon: SyncOutlined, className: 'api-switch-btn' },
    { text: '刷新大盘', handler: loadAllData, btnType: 'primary', icon: ReloadOutlined, className: 'overview-refresh-btn' },
  ],
  group:
  [
    { text: '报表导出', handler: exportReport, btnType: 'orange', icon: ExportOutlined, className: 'report-export-btn' },
    { text: '一键巡检', handler: openGroupInspection, btnType: 'blue', icon: SelectOutlined, className: 'inspection-btn' },
  ],
}

const setLogViewMode = (mode) => {
  logViewMode.value = ['task', 'config', 'file'].includes(mode) ? mode : 'task'
}

const actionButtons = computed(() => {
  const buttonMap = isSystemAccount.value ? BUTTON_CONFIG_MAP : LIMITED_BUTTON_CONFIG_MAP
  if (activeTab.value === 'log') {
    return buttonMap.log || []
  }
  return buttonMap[activeTab.value] || []
})

const sha256Hex = (text) => {
  const bytes = new TextEncoder().encode(text)
  const bitLength = bytes.length * 8
  const dataLength = Math.ceil((bytes.length + 1 + 8) / 64) * 64
  const data = new Uint8Array(dataLength)
  const view = new DataView(data.buffer)

  data.set(bytes)
  data[bytes.length] = 0x80
  view.setUint32(dataLength - 8, Math.floor(bitLength / 0x100000000))
  view.setUint32(dataLength - 4, bitLength >>> 0)

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]
  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]
  const w = new Uint32Array(64)
  const rotateRight = (value, bits) => (value >>> bits) | (value << (32 - bits))

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4)
    }

    for (let i = 16; i < 64; i++) {
      const s0 = rotateRight(w[i - 15], 7) ^ rotateRight(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotateRight(w[i - 2], 17) ^ rotateRight(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, h0] = h

    for (let i = 0; i < 64; i++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h0 + s1 + ch + k[i] + w[i]) >>> 0
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (s0 + maj) >>> 0

      h0 = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h[0] = (h[0] + a) >>> 0
    h[1] = (h[1] + b) >>> 0
    h[2] = (h[2] + c) >>> 0
    h[3] = (h[3] + d) >>> 0
    h[4] = (h[4] + e) >>> 0
    h[5] = (h[5] + f) >>> 0
    h[6] = (h[6] + g) >>> 0
    h[7] = (h[7] + h0) >>> 0
  }

  return h
    .map((value) => value.toString(16).padStart(8, '0'))
    .join('')
}

const openLoginModal = () => {
  loginError.value = ''
  loginForm.value = { account: '', password: '' }
  loginVisible.value = true
}

const closeLoginModal = () => {
  loginVisible.value = false
  loginError.value = ''
  loginForm.value.password = ''
}

const submitLogin = () => {
  const account = loginForm.value.account.trim().toLowerCase()
  const password = loginForm.value.password

  if (!account || !password) {
    loginError.value = '请输入账号和密码'
    return
  }

  try {
    const loginHash = sha256Hex(`${LOGIN_HASH_SALT}:${account}:${password}`)

    if (loginHash !== ADMIN_LOGIN_HASH) {
      loginError.value = '账号或密码错误'
      return
    }

    isAdminLoggedIn.value = true
    closeLoginModal()
    message.success('已登录管理员')
  } catch (e) {
    console.error('登录校验失败:', e)
    loginError.value = '登录校验失败'
  }
}

const getBtnClass = (btn) => {
  const classes = []

  if (btn.className) {
    classes.push(btn.className)
  }

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
  startOverviewLogAutoRefresh()
  loadAllData()
})

onBeforeUnmount(() => {
  stopTimelineClock()
  stopOverviewLogAutoRefresh()
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
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.header-main {
  min-width: 0;
}

.header-actions {
  gap: 14px;
}

.header-actions-overview {
  gap: 18px;
}

.header-actions-overview > .ant-btn + .ant-btn {
  margin-left: 0;
}

.report-export-btn {
  margin-right: 10px;
}

.overview-refresh-btn {
  margin-right: 10px;
}

.api-switch-btn {
  margin-right: 10px;
}

.log-mode-switch {
  margin-left: 18px;
  margin-right: auto;
  flex-shrink: 0;
}

.log-mode-btn {
  min-width: 68px;
  color: #4b5563;
}

.log-mode-btn.is-active {
  border-color: #52c41a;
  background: #f6ffed;
  color: #389e0d;
  font-weight: 600;
}

.inspection-btn {
  margin-right: 10px;
}

.api-address-modal {
  width: 560px;
}

.api-address-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.api-address-modal .modal-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.api-address-modal .modal-close-btn:hover {
  background: #f5f5f5;
  color: #ff4d4f;
}

.api-address-modal .ant-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.api-address-modal .ant-modal-footer .ant-btn {
  min-width: 86px;
}

.api-address-current,
.api-address-default {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px solid #edf0f5;
  border-radius: 6px;
  background: #fafafa;
  color: #64748b;
  font-size: 13px;
}

.api-address-current {
  margin-bottom: 8px;
}

.api-address-current strong,
.api-address-default code {
  color: #111827;
  font-size: 13px;
  word-break: break-all;
}

.api-address-section-title {
  margin: 16px 0 8px;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
}

.api-address-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.api-address-option {
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.api-address-option:hover,
.api-address-option.active {
  border-color: #52c41a;
  background: #f6ffed;
  color: #389e0d;
}

.api-address-custom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  color: #1f2937;
  font-size: 13px;
}

.das-login-modal {
  width: 360px;
}

.das-login-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  color: #1f2937;
  font-size: 13px;
}

.login-error {
  min-height: 20px;
  color: #d93025;
  font-size: 13px;
}
</style>
