<template>
  <div class="ant-modal-mask" :class="{ active: visible }" @click="handleClose"></div>
  <div class="ant-modal-wrap" :class="{ active: visible }">
    <div class="ant-modal test-acquisition-modal" @click.stop>
      <div class="ant-modal-header">
        <div>
          <h3 class="ant-modal-title">测试采集</h3>
          <div class="modal-subtitle">{{ configName }}</div>
        </div>
        <button type="button" class="modal-close-btn" @click="handleClose">×</button>
      </div>

      <div class="ant-modal-body">
        <div class="test-options">
          <label class="test-option">
            <span>测试文件模式</span>
            <select v-model="form.testFileMode" class="ant-input" :disabled="running">
              <option value="direct">直接使用源文件</option>
              <option value="copy">复制测试文件</option>
            </select>
          </label>
          <label v-if="form.testFileMode === 'copy'" class="test-option">
            <span>复制位置</span>
            <select v-model="form.testFileLocation" class="ant-input" :disabled="running">
              <option value="source">源目录同级</option>
              <option value="local">本机路径</option>
            </select>
          </label>
          <div class="test-post-option">
            <span>是否执行后处理</span>
            <label class="test-checkbox">
              <input v-model="form.runPostProcessing" type="checkbox" :disabled="running" />
              <span>执行后处理</span>
            </label>
          </div>
          <label
            v-if="form.testFileMode === 'copy' && form.testFileLocation === 'local'"
            class="test-option test-option-local"
          >
            <span>本机目录</span>
            <input
              v-model.trim="form.localTestDirectory"
              class="ant-input"
              :disabled="running"
              placeholder="例如 D:\Temp\DAS-Test"
            />
          </label>
          <div v-if="form.testFileMode === 'direct'" class="test-mode-hint">
            <span>直接使用源文件测试，源文件不会删除</span>
            <span>清理时仅删除本次测试新增入库数据和测试日志</span>
          </div>
        </div>

        <div class="test-step-list">
          <div
            v-for="step in steps"
            :key="step.code"
            class="test-step"
            :class="`test-step-${normalizeStatus(step.status)}`"
          >
            <span class="step-index">{{ step.order }}</span>
            <div class="step-main">
              <div class="step-name">{{ step.name }}</div>
              <div v-if="step.message" class="step-message">{{ step.message }}</div>
            </div>
            <span class="step-status">{{ getStepStatusText(step.status) }}</span>
          </div>
        </div>

        <div v-if="result" class="test-result">
          <div class="result-grid">
            <div>
              <span>测试 RunId</span>
              <strong>{{ result.testRunId || result.TestRunId || '-' }}</strong>
            </div>
            <div>
              <span>任务日志 ID</span>
              <strong>{{ result.taskLogId || result.TaskLogId || '-' }}</strong>
            </div>
            <div>
              <span>入库表名</span>
              <strong>{{ result.tableName || result.TableName || '-' }}</strong>
            </div>
            <div>
              <span>处理行数</span>
              <strong>{{ result.processedRows ?? result.ProcessedRows ?? 0 }}</strong>
            </div>
            <div>
              <span>测试模式</span>
              <strong>{{ getTestFileModeText(result.testFileMode || result.TestFileMode) }}</strong>
            </div>
            <div>
              <span>清理方式</span>
              <strong>{{ getCleanupKeyModeText(result.cleanupKeyMode || result.CleanupKeyMode) }}</strong>
            </div>
            <div>
              <span>删除测试文件</span>
              <strong>{{ (result.deleteTestFileOnCleanup ?? result.DeleteTestFileOnCleanup) ? '是' : '否' }}</strong>
            </div>
          </div>

          <div class="path-panel">
            <div class="path-row">
              <span>源文件</span>
              <p>{{ result.sourceFilePath || result.SourceFilePath || '-' }}</p>
            </div>
            <div class="path-row">
              <span>测试文件</span>
              <p>{{ getTestFilePathText(result) }}</p>
            </div>
          </div>

          <div v-if="result.message || result.Message" class="test-message" :class="normalizeStatus(result.status || result.Status)">
            {{ result.message || result.Message }}
          </div>

          <div v-if="details.length" class="test-detail-table">
            <div class="detail-head">
              <span>文件名</span>
              <span>状态</span>
              <span>行数</span>
              <span>错误</span>
            </div>
            <div v-for="item in details" :key="item.id || item.Id" class="detail-row">
              <span class="file-cell">{{ item.fileName || item.FileName }}</span>
              <span>{{ item.status || item.Status }}</span>
              <span>{{ item.processedRows ?? item.ProcessedRows ?? 0 }}</span>
              <span class="error-cell">{{ item.errorMessage || item.ErrorMessage || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ant-modal-footer">
        <button type="button" class="ant-btn ant-btn-default" @click="handleClose">关闭</button>
        <button
          type="button"
          class="ant-btn ant-btn-red"
          :disabled="!canCleanup || cleaning"
          @click="cleanup"
        >
          清理测试数据
        </button>
        <button
          type="button"
          class="ant-btn ant-btn-primary"
          :disabled="running"
          @click="start"
        >
          {{ running ? '测试中...' : '开始测试' }}
        </button>
      </div>
    </div>
    <div v-if="sourceSelectVisible" class="source-select-modal" @click.stop>
      <div class="source-select-header">
        <div>
          <h4>手动选择源文件</h4>
          <p>自动选择源文件失败，请从当前源路径候选文件中选择一个继续测试。</p>
        </div>
      </div>
      <div v-if="sourceCandidates.length" class="source-candidate-list">
        <button
          v-for="item in sourceCandidates"
          :key="item.fullPath || item.FullPath"
          type="button"
          class="source-candidate"
          :class="{ active: selectedSourcePath === (item.fullPath || item.FullPath) }"
          @click="selectedSourcePath = item.fullPath || item.FullPath"
        >
          <strong>{{ item.fileName || item.FileName }}</strong>
          <span>{{ formatCandidateMeta(item) }}</span>
          <small>{{ item.fullPath || item.FullPath }}</small>
        </button>
      </div>
      <div v-else class="source-candidate-empty">{{ sourceCandidateError || '当前路径下未发现可选文件。' }}</div>
      <div class="source-select-footer">
        <button type="button" class="ant-btn ant-btn-default" :disabled="selectingSource" @click="handleClose">关闭</button>
        <button
          type="button"
          class="ant-btn ant-btn-primary"
          :disabled="!selectedSourcePath || selectingSource"
          @click="selectSource"
        >
          {{ selectingSource ? '继续中...' : '选择并继续' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import message from '@/components/index.js'
import * as api from '../api'

const visible = ref(false)
const config = ref(null)
const running = ref(false)
const cleaning = ref(false)
const selectingSource = ref(false)
const result = ref(null)
const selectedSourcePath = ref('')

const form = reactive({
  testFileMode: 'direct',
  testFileLocation: 'source',
  localTestDirectory: '',
  runPostProcessing: true,
})

const defaultSteps = [
  { order: 1, code: 'source', name: '文件源路径通断', status: 'Pending' },
  { order: 2, code: 'latestFile', name: '自动选择最新源文件', status: 'Pending' },
  { order: 3, code: 'copyFile', name: '复制测试文件', status: 'Pending' },
  { order: 4, code: 'mapping', name: '校验模板/字段映射', status: 'Pending' },
  { order: 5, code: 'execute', name: '执行测试采集', status: 'Pending' },
  { order: 6, code: 'verify', name: '人工校验入库结果', status: 'Pending' },
  { order: 7, code: 'cleanup', name: '清理测试数据', status: 'Pending' },
]

const steps = computed(() => {
  const raw = result.value?.steps || result.value?.Steps
  const list = Array.isArray(raw) && raw.length ? raw : defaultSteps
  if (!(result.value?.cleaned || result.value?.Cleaned)) return list

  return list.map((step) =>
    step.code === 'cleanup'
      ? {
          ...step,
          status: 'Success',
          message: result.value?.cleanupMessage || result.value?.CleanupMessage || '测试数据已清理。',
        }
      : step,
  )
})

const details = computed(() => {
  const raw = result.value?.details || result.value?.Details
  return Array.isArray(raw) ? raw : []
})

const canCleanup = computed(() => {
  if (!result.value) return false
  if (result.value.cleaned || result.value.Cleaned) return false
  return Boolean(result.value.canCleanup ?? result.value.CanCleanup)
})

const sourceCandidates = computed(() => {
  const raw = result.value?.sourceCandidates || result.value?.SourceCandidates
  return Array.isArray(raw) ? raw : []
})

const sourceCandidateError = computed(() =>
  result.value?.sourceCandidateError || result.value?.SourceCandidateError || '',
)

const sourceSelectVisible = computed(() => {
  if (!visible.value || !result.value) return false
  const status = String(result.value.status || result.value.Status || '').toLowerCase()
  return Boolean(result.value.manualSourceSelectionRequired ?? result.value.ManualSourceSelectionRequired) ||
    status === 'waitingforsourceselection'
})

const configName = computed(() =>
  config.value?.EqName || config.value?.eqName || config.value?.name || '单配置测试',
)

const unwrap = (res) => res?.data ?? res

const open = (row) => {
  config.value = row
  result.value = null
  selectedSourcePath.value = ''
  form.testFileMode = 'direct'
  form.testFileLocation = 'source'
  form.localTestDirectory = ''
  form.runPostProcessing = true
  visible.value = true
}

const syncSourceSelection = () => {
  const first = sourceCandidates.value[0]
  selectedSourcePath.value = first ? (first.fullPath || first.FullPath || '') : ''
}

const handleClose = () => {
  if (running.value || cleaning.value || selectingSource.value) return
  visible.value = false
}

const start = async () => {
  const configId = config.value?.id ?? config.value?.Id
  if (!configId) {
    message.warning('未找到配置 ID')
    return
  }

  if (form.testFileMode === 'copy' && form.testFileLocation === 'local' && !form.localTestDirectory) {
    message.warning('请选择本机路径时必须填写本机目录')
    return
  }

  running.value = true
  try {
    const res = await api.startTestAcquisition({
      configId,
      testFileMode: form.testFileMode,
      testFileLocation: form.testFileLocation,
      localTestDirectory: form.localTestDirectory,
      runPostProcessing: form.runPostProcessing,
    })
    result.value = unwrap(res)
    syncSourceSelection()
    const status = String(result.value?.status || result.value?.Status || '').toLowerCase()
    if (status === 'waitingforsourceselection' || result.value?.manualSourceSelectionRequired || result.value?.ManualSourceSelectionRequired) {
      message.warning(sourceCandidateError.value || result.value?.message || result.value?.Message || '请手动选择源文件后继续测试')
    } else if (status === 'failed') {
      message.error(result.value?.message || result.value?.Message || '测试采集失败')
    } else {
      message.success('测试采集完成，请人工校验入库数据')
    }
  } catch (err) {
    message.error(err?.response?.data?.info || err?.info || '测试采集失败')
    console.error(err)
  } finally {
    running.value = false
  }
}

const selectSource = async () => {
  const testRunId = result.value?.testRunId || result.value?.TestRunId
  if (!testRunId || !selectedSourcePath.value) {
    message.warning('请选择源文件')
    return
  }

  selectingSource.value = true
  try {
    const res = await api.selectTestAcquisitionSource(testRunId, {
      fullPath: selectedSourcePath.value,
    })
    result.value = unwrap(res)
    syncSourceSelection()
    const status = String(result.value?.status || result.value?.Status || '').toLowerCase()
    if (status === 'failed') {
      message.error(result.value?.message || result.value?.Message || '测试采集失败')
    } else {
      message.success('已选择源文件并继续执行测试')
    }
  } catch (err) {
    message.error(err?.response?.data?.info || err?.info || '选择源文件失败')
    console.error(err)
  } finally {
    selectingSource.value = false
  }
}

const cleanup = async () => {
  const testRunId = result.value?.testRunId || result.value?.TestRunId
  if (!testRunId) {
    message.warning('未找到测试 RunId')
    return
  }

  const confirmed = await message.confirm({
    title: '清理测试数据',
    content: '确认删除本次测试文件、测试入库数据和测试日志？',
    okText: '清理',
    cancelText: '取消',
  })
  if (!confirmed) return

  cleaning.value = true
  try {
    const res = await api.cleanupTestAcquisition(testRunId)
    const payload = unwrap(res)
    message.success(payload?.message || payload?.Message || '测试数据已清理')
    result.value = {
      ...result.value,
      cleaned: true,
      canCleanup: false,
      cleanupMessage: payload?.message || payload?.Message,
    }
  } catch (err) {
    message.error(err?.response?.data?.info || err?.info || '清理测试数据失败')
    console.error(err)
  } finally {
    cleaning.value = false
  }
}

const normalizeStatus = (status) => String(status || 'Pending').trim().toLowerCase()

const getStepStatusText = (status) => {
  const normalized = normalizeStatus(status)
  if (normalized === 'success') return '完成'
  if (normalized === 'failed') return '失败'
  if (normalized === 'running') return '执行中'
  return '等待'
}

const getTestFileModeText = (mode) => {
  return String(mode || 'copy').toLowerCase() === 'direct' ? '直接使用源文件' : '复制测试文件'
}

const getCleanupKeyModeText = (mode) => {
  return String(mode || '').toLowerCase() === 'id' ? '按新增 Id 清理' : '按测试文件标记清理'
}

const getTestFilePathText = (item) => {
  const mode = String(item?.testFileMode || item?.TestFileMode || 'copy').toLowerCase()
  const path = item?.testFilePath || item?.TestFilePath
  if (mode === 'direct') {
    return path || item?.sourceFilePath || item?.SourceFilePath || '直接使用源文件，未复制'
  }
  return path || '-'
}

const formatCandidateMeta = (item) => {
  const timeValue = item?.lastWriteTime || item?.LastWriteTime
  const sizeValue = item?.fileSize ?? item?.FileSize
  const parts = []
  if (timeValue) {
    const date = new Date(timeValue)
    if (!Number.isNaN(date.getTime())) {
      parts.push(date.toLocaleString('zh-CN', { hour12: false }))
    }
  }
  if (sizeValue !== undefined && sizeValue !== null) {
    const size = Number(sizeValue)
    if (!Number.isNaN(size)) {
      parts.push(size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`)
    }
  }
  return parts.join(' / ') || '-'
}

defineExpose({ open })
</script>

<style scoped>
.test-acquisition-modal {
  width: 760px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
}

.test-acquisition-modal .ant-modal-header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
}

.test-acquisition-modal .ant-modal-body {
  min-height: 0;
  overflow-y: auto;
}

.modal-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8c8c8c;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.modal-close-btn:hover {
  background: #f5f5f5;
  color: #ff4d4f;
}

.modal-subtitle {
  margin-top: 4px;
  color: #8c8c8c;
  font-size: 12px;
}

.test-options {
  display: grid;
  grid-template-columns: 205px 210px 257px;
  column-gap: 20px;
  justify-content: start;
  align-items: start;
  margin-bottom: 14px;
}

.test-options:has(.test-mode-hint) {
  grid-template-columns: 220px 195px minmax(0, 1fr);
  column-gap: 11px;
  justify-content: start;
}

.test-options:has(.test-mode-hint) .test-post-option {
  width: 195px;
}

.test-options:has(.test-mode-hint) .test-checkbox {
  width: 185px;
}

.test-option {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #4b5563;
  font-size: 13px;
  box-sizing: border-box;
  min-width: 0;
}

.test-post-option {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #4b5563;
  font-size: 13px;
  box-sizing: border-box;
  width: 257px;
  min-width: 0;
}

.test-option-local {
  grid-column: 2 / -1;
  min-width: 0;
}

.test-option .ant-input {
  height: 36px;
  min-width: 0;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.test-option .ant-input:focus,
.test-option .ant-input:focus-visible {
  outline: none;
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.14);
}

.test-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  box-sizing: border-box;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #edf0f2;
  border-radius: 6px;
  background: #fafafa;
  color: #4b5563;
  font-size: 12px;
  white-space: nowrap;
  transition: border-color 0.2s, background 0.2s;
  width: 247px;
  min-width: 0;
}

.test-checkbox:hover {
  border-color: #b7eb8f;
  background: #f6ffed;
}

.test-checkbox input {
  width: 14px;
  height: 14px;
  margin: 0;
}

.test-mode-hint {
  grid-column: 3;
  align-self: end;
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid #d9f7be;
  border-radius: 6px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 12px;
  line-height: 1.5;
}

.test-mode-hint span {
  display: block;
}

.test-step-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-step {
  display: grid;
  grid-template-columns: 28px 1fr 64px;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #fff;
}

.step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  font-weight: 700;
}

.step-name {
  font-weight: 600;
  color: #111827;
}

.step-message {
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
  word-break: break-all;
}

.step-status {
  color: #8c8c8c;
  font-size: 12px;
  text-align: right;
}

.test-step-success {
  border-color: #b7eb8f;
  background: #f6ffed;
}

.test-step-success .step-index,
.test-step-success .step-status {
  color: #52c41a;
}

.test-step-failed {
  border-color: #ffa39e;
  background: #fff1f0;
}

.test-step-failed .step-index,
.test-step-failed .step-status {
  color: #f5222d;
}

.test-result {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.result-grid > div {
  grid-column: span 3;
  padding: 10px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
}

.result-grid > div:nth-child(-n + 3) {
  grid-column: span 4;
}

.result-grid span {
  display: block;
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 5px;
}

.result-grid strong {
  display: block;
  color: #111827;
  font-size: 13px;
  word-break: break-all;
}

.result-grid > div:nth-child(n + 5) strong {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 22px;
  padding: 2px 8px;
  border: 1px solid #bae7ff;
  border-radius: 4px;
  background: #e6f7ff;
  color: #096dd9;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
}

.path-panel {
  margin: 12px 0 10px;
  padding: 10px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #fff;
}

.path-row {
  margin: 0;
}

.path-row + .path-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.path-row span {
  display: block;
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 4px;
}

.path-row p {
  margin: 0;
  color: #4b5563;
  font-size: 12px;
  word-break: break-all;
}

.test-message {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #d9f7be;
  border-radius: 6px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 13px;
}

.test-message.failed {
  border-color: #ffa39e;
  background: #fff1f0;
  color: #cf1322;
}

.test-detail-table {
  margin-top: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.detail-head,
.detail-row {
  display: grid;
  grid-template-columns: 2fr 90px 80px 2fr;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
}

.detail-head {
  background: #fafafa;
  color: #4b5563;
  font-weight: 600;
  font-size: 12px;
}

.detail-row {
  border-top: 1px solid #f5f5f5;
  color: #374151;
  font-size: 12px;
}

.file-cell,
.error-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ant-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ant-modal-footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 10px;
}

.source-select-modal {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 20;
  width: 560px;
  max-width: calc(100vw - 64px);
  transform: translate(-50%, -50%);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.source-select-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.source-select-header h4 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 16px;
}

.source-select-header p {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
}

.source-candidate-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  padding: 14px 18px;
  overflow-y: auto;
}

.source-candidate {
  display: grid;
  gap: 5px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.source-candidate:hover,
.source-candidate.active {
  border-color: #52c41a;
  background: #f6ffed;
  box-shadow: inset 0 0 0 1px rgba(82, 196, 26, 0.16);
}

.source-candidate strong {
  color: #111827;
  font-size: 13px;
}

.source-candidate span,
.source-candidate small {
  color: #6b7280;
  font-size: 12px;
  word-break: break-all;
}

.source-candidate-empty {
  padding: 32px 18px;
  color: #8c8c8c;
  text-align: center;
}

.source-select-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 720px) {
  .result-grid {
    grid-template-columns: 1fr;
  }

  .test-options {
    grid-template-columns: 1fr;
  }

  .test-options:has(.test-mode-hint) {
    grid-template-columns: 1fr;
    column-gap: 10px;
    justify-content: stretch;
  }

  .test-post-option,
  .test-checkbox,
  .test-mode-hint {
    width: 100%;
  }

  .test-option-local,
  .test-mode-hint {
    grid-column: auto;
  }

  .source-select-modal {
    width: calc(100vw - 32px);
  }
}
</style>
