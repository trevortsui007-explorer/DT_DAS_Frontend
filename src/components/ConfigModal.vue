<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal config-modal" style="width: 700px">
        <div class="ant-modal-header">
          <span class="ant-modal-title">{{ modalTitle }}</span>
          <span class="modal-close" @click="close">×</span>
        </div>

        <div class="ant-modal-body">
          <input type="hidden" v-model="formData.id" />

          <section class="form-section">
            <div class="section-title">基础配置信息</div>
            <div class="form-grid top-form-grid">
              <div class="form-item">
                <label><span style="color: red">*</span> 设备名称 (EqName)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.eqName"
                  placeholder="请输入设备名称"
                />
              </div>

              <div class="form-item status-form-item">
                <label>状态</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="formData.isEnabled" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title">文件采集信息</div>
            <div class="form-grid">
              <div class="form-item">
                <label><span style="color: red">*</span> 目标表名 (TableName)</label>
                <input
                  type="text"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('TableName') }"
                  v-model="formData.tableName"
                  placeholder="请输入数据库目标表名"
                  @input="autoMarkers.TableName = false"
                />
              </div>

              <div class="form-item">
                <label><span style="color: red">*</span> 文件路径规则</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.filePathPattern"
                  placeholder="例如: D:/Desktop/{yyyy}.{MM}.{dd}/"
                />
              </div>

              <div class="form-item">
                <label>文件名规则</label>
                <input
                  type="text"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('FileNamePattern') }"
                  v-model="formData.fileNamePattern"
                  placeholder="例如: Log.csv"
                  @input="autoMarkers.FileNamePattern = false"
                />
              </div>

              <div class="form-item">
                <label>文件类型</label>
                <select
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('FileType') }"
                  v-model="formData.fileType"
                  @change="autoMarkers.FileType = false"
                >
                  <option value=".csv">.csv</option>
                  <option value=".xlsx">.xlsx</option>
                  <option value=".txt">.txt</option>
                </select>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title">文件内容信息</div>
            <div class="form-grid">
              <div class="form-item">
                <label>表头行号 (HeaderRow)</label>
                <input
                  type="number"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('HeaderRow') }"
                  v-model="formData.headerRow"
                  @input="autoMarkers.HeaderRow = false"
                />
              </div>

              <div class="form-item">
                <label>数据起始行 (StartRow)</label>
                <input
                  type="number"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('StartRow') }"
                  v-model="formData.startRow"
                  @input="autoMarkers.StartRow = false"
                />
              </div>
            </div>

            <div class="form-item">
              <label class="label-with-help">
                扩展字段 (ExtFields)
                <HelpTooltip text="扩展字段为非文件内字段" />
              </label>
              <input
                type="text"
                class="ant-input"
                :class="{ 'auto-filled-input': isAuto('ExtFields') }"
                v-model="formData.extFields"
                placeholder="例如: row, fullFilePath"
                @input="autoMarkers.ExtFields = false"
              />
            </div>

            <div class="form-item mapping-form-item">
              <div class="label-row">
                <label>字段映射关系</label>
                <button
                  type="button"
                  class="ant-btn ant-btn-default"
                  style="height: 26px; padding: 0 12px; font-size: 13px"
                  @click="showFieldMappingJson"
                >
                  查看JSON
                </button>
              </div>
              <div class="mapping-table">
                <div class="mapping-table__head">
                  <span>文件字段</span>
                  <span>入库字段</span>
                  <span>操作</span>
                </div>
                <div
                  v-for="(row, index) in fieldMappingRows"
                  :key="row.key"
                  class="mapping-table__row"
                >
                  <input
                    class="ant-input"
                    v-model="row.source"
                    placeholder="例如: PCB号"
                  />
                  <input
                    class="ant-input"
                    v-model="row.target"
                    placeholder="例如: pcbNo"
                  />
                  <button
                    type="button"
                    class="mapping-remove-btn"
                    @click="removeMappingRow(index)"
                  >
                    删除
                  </button>
                </div>
                <button type="button" class="mapping-add-btn" @click="addMappingRow">
                  + 新增映射
                </button>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title">后处理信息</div>
            <div class="form-grid">
              <div class="form-item">
                <label>后处理类型</label>
                <div class="segmented-control" id="post-type-segmented">
                  <div class="segment-pill" :style="pillStyle"></div>
                  <div class="segment-options">
                    <div
                      v-for="(opt) in postTypes"
                      :key="opt.value"
                      class="segment-option"
                      :class="{ active: formData.postProcessingType === opt.value }"
                      @click="formData.postProcessingType = opt.value"
                    >
                      {{ opt.label }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-item">
                <label>存储过程/服务名</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.procedureName"
                  placeholder="需进行后处理时填写"
                />
              </div>

              <div class="form-item">
                <label>后处理表 (PostTableName)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.postTableName"
                  placeholder="后处理写入表名"
                />
              </div>

              <div class="form-item">
                <label>存储过程Flag (Flag)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.flag"
                  placeholder="例如: MasonETFailureService"
                />
              </div>

              <div class="form-item">
                <label>后处理解释 (FlagName)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.flagName"
                  placeholder="后处理说明"
                />
              </div>
            </div>
          </section>
        </div>

        <div class="ant-modal-footer" style="display: flex; justify-content: space-between">
          <div>
            <button v-if="isFromImport" class="ant-btn ant-btn-default" @click="goBack">
              ← 上一步 (修改映射)
            </button>
          </div>
          <div>
            <button class="ant-btn ant-btn-default" style="margin-right: 12px" @click="close">
              取消
            </button>
            <button class="ant-btn ant-btn-primary" @click="save">保存配置</button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="ant-modal-mask json-preview-mask"
      :class="{ active: jsonPreviewVisible }"
      @click="closeFieldMappingJson"
    ></div>
    <div class="ant-modal-wrap json-preview-wrap" :class="{ active: jsonPreviewVisible }">
      <div class="ant-modal json-preview-modal" style="width: 520px">
        <div class="ant-modal-header">
          <span class="ant-modal-title">字段映射 JSON</span>
          <span class="modal-close" @click="closeFieldMappingJson">×</span>
        </div>
        <div class="ant-modal-body">
          <pre class="json-preview-content">{{ fieldMappingJsonText }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as api from '@/api'
import message from '@/components/index.js'
import HelpTooltip from './HelpTooltip.vue'

const emit = defineEmits(['saved', 'goBack'])

const visible = ref(false)
const isEdit = ref(false)
const isFromImport = ref(false) // 标记是否为导入流程
const modalMode = ref('create')
const existingConfigs = ref([])
const jsonPreviewVisible = ref(false)
const fieldMappingJsonText = ref('{}')

const formData = ref({
  id: '',
  eqName: '',
  tableName: '',
  filePathPattern: '',
  fileNamePattern: '',
  fileType: '.csv',
  headerRow: 1,
  startRow: 2,
  postProcessingType: 0,
  postTableName: '',
  procedureName: '',
  serviceName: '',
  flag: '',
  flagName: '',
  isEnabled: true,
  extFields: '',
  fieldMappings: '',
})

const autoMarkers = ref({})
const fieldMappingRows = ref([])
let mappingRowSeed = 0

const postTypes = [
  { value: 0, label: '无操作' },
  { value: 1, label: '调用C#服务' },
  { value: 2, label: '调用存储过程' },
]

const modalTitle = computed(() => {
  if (isFromImport.value) return '导入配置'
  if (isEdit.value) return '编辑配置项'
  if (modalMode.value === 'copy') return '复制配置项'
  return '新增配置项'
})

const normalizeFileType = (value) => {
  const fileType = String(value || '').trim().toLowerCase()
  if (!fileType) return '.csv'
  return fileType.startsWith('.') ? fileType : `.${fileType}`
}

const createMappingRow = (source = '', target = '') => {
  mappingRowSeed += 1
  return {
    key: `mapping-${mappingRowSeed}`,
    source,
    target,
  }
}

const parseMappingObject = (value) => {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return null

  let text = value.trim().replace(/^\uFEFF/, '')
  for (let i = 0; i < 3; i += 1) {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
      if (typeof parsed === 'string' && parsed !== text) {
        text = parsed.trim()
        continue
      }
      break
    } catch {
      break
    }
  }

  const normalizedText = text.replace(/\\"/g, '"').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  const rows = {}
  const pairPattern = /"([^"]+)"\s*:\s*"([^"]*)"/g
  let match = pairPattern.exec(normalizedText)
  while (match) {
    rows[match[1]] = match[2]
    match = pairPattern.exec(normalizedText)
  }

  return Object.keys(rows).length ? rows : null
}

const parseFieldMappingsToRows = (value) => {
  if (!value) return [createMappingRow()]

  const parsed = parseMappingObject(value)

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [createMappingRow()]
  }

  const rows = Object.entries(parsed).map(([source, target]) =>
    createMappingRow(source, String(target ?? '')),
  )

  return rows.length ? rows : [createMappingRow()]
}

const buildFieldMappingsJson = () => {
  const mappings = {}

  fieldMappingRows.value.forEach((row) => {
    const source = String(row.source || '').trim()
    const target = String(row.target || '').trim()
    if (source && target) {
      mappings[source] = target
    }
  })

  return JSON.stringify(mappings, null, 2)
}

const syncFieldMappingsFromRows = () => {
  formData.value.fieldMappings = buildFieldMappingsJson()
}

const addMappingRow = () => {
  fieldMappingRows.value.push(createMappingRow())
}

const removeMappingRow = (index) => {
  fieldMappingRows.value.splice(index, 1)
  if (!fieldMappingRows.value.length) {
    fieldMappingRows.value.push(createMappingRow())
  }
}

const pillStyle = computed(() => {
  const index = postTypes.findIndex((t) => t.value === formData.value.postProcessingType)
  return {
    transform: `translateX(${Math.max(index, 0) * 100}%)`,
  }
})

// ==================== 后处理类型联动 ExtFields ====================
watch(
  () => formData.value.postProcessingType,
  (newVal) => {
    // 将当前的扩展字段转为数组处理，去除空格并过滤掉空值
    let fields = formData.value.extFields
      ? formData.value.extFields
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f)
      : []

    const targetField = 'IsProcessed'

    if (newVal !== 0) {
      // 切换到非 0 (C#服务或存储过程): 如果没有 IsProcessed，则添加
      if (!fields.includes(targetField)) {
        fields.push(targetField)
      }
    } else {
      // 切换到 0 (无操作): 如果有 IsProcessed，则移除
      fields = fields.filter((f) => f !== targetField)
    }

    // 重新拼回字符串，并更新标记让它也变绿（如果是自动新增的话）
    formData.value.extFields = fields.join(', ')

    // 如果是由于切换导致的变动，我们可以视其为一种“自动填充”
    if (newVal !== 0) {
      autoMarkers.value.ExtFields = true
    }
  },
)

function open(edit = false, data = null, fromImport = false, options = {}) {
  isEdit.value = edit
  isFromImport.value = fromImport
  modalMode.value = options.mode || (edit ? 'edit' : 'create')
  existingConfigs.value = Array.isArray(options.existingConfigs) ? options.existingConfigs : []

  // 每次打开时先重置标记
  autoMarkers.value = {}

  if (data) {
    // 兼容后端的大写字段和前端的小写字段
    const rawFieldMappings =
      typeof (data.fieldMappings || data.FieldMappings) === 'object'
        ? JSON.stringify(data.fieldMappings || data.FieldMappings, null, 2)
        : data.fieldMappings || data.FieldMappings || ''

    formData.value = {
      id: data.id || data.Id || '',
      eqName: data.eqName || data.EqName || '',
      tableName: data.tableName || data.TableName || '',
      filePathPattern: data.filePathPattern || data.FilePathPattern || '',
      fileNamePattern: data.fileNamePattern || data.FileNamePattern || '',
      fileType: normalizeFileType(data.fileType || data.FileType),
      headerRow: data.headerRow || data.HeaderRow || 1,
      startRow: data.startRow || data.StartRow || 2,
      postProcessingType: data.postProcessingType ?? data.PostProcessingType ?? 0,
      postTableName: data.postTableName || data.PostTableName || '',
      procedureName: data.procedureName || data.ProcedureName || '',
      serviceName: data.serviceName || data.ServiceName || '',
      flag: data.flag || data.Flag || '',
      flagName: data.flagName || data.FlagName || '',
      isEnabled: data.isEnabled ?? data.IsEnabled ?? true,
      extFields: data.extFields || data.ExtFields || '',
      fieldMappings: rawFieldMappings,
    }

    fieldMappingRows.value = parseFieldMappingsToRows(rawFieldMappings)

    // 如果是导入，才处理绿色高亮标记
    if (fromImport && data._autoFilledFields) {
      autoMarkers.value = { ...data._autoFilledFields }
    } else if (fromImport) {
      autoMarkers.value = {
        TableName: !!data.TableName,
        FileNamePattern: !!data.FileNamePattern,
        FileType: !!data.FileType,
        HeaderRow: true,
        StartRow: true,
      }
    }
  } else {
    resetForm()
  }
  visible.value = true
}

// 提供一个辅助函数判断是否变绿
const isAuto = (key) => autoMarkers.value[key] === true

const resetForm = () => {
  formData.value = {
    id: '',
    eqName: '',
    tableName: '',
    filePathPattern: '',
    fileNamePattern: '',
    fileType: '.csv',
    headerRow: 1,
    startRow: 2,
    postProcessingType: 0,
    postTableName: '',
    procedureName: '',
    serviceName: '',
    flag: '',
    flagName: '',
    isEnabled: true,
    extFields: '',
    fieldMappings: '',
  }
  fieldMappingRows.value = [createMappingRow()]
}

const getConfigId = (item) => item?.id ?? item?.Id ?? ''
const getConfigName = (item) => String(item?.eqName || item?.EqName || '').trim()

const hasDuplicateConfigName = () => {
  const currentName = String(formData.value.eqName || '').trim().toLowerCase()
  const currentId = String(formData.value.id || '')

  if (!currentName) return false

  return existingConfigs.value.some((item) => {
    const itemName = getConfigName(item).toLowerCase()
    const itemId = String(getConfigId(item))

    return itemName === currentName && itemId !== currentId
  })
}

function close() {
  visible.value = false
  jsonPreviewVisible.value = false
}

function closeFieldMappingJson() {
  jsonPreviewVisible.value = false
}

function goBack() {
  visible.value = false
  emit('goBack') // 通知父组件退回上一步
}

function showFieldMappingJson() {
  syncFieldMappingsFromRows()
  fieldMappingJsonText.value = formData.value.fieldMappings || '{}'
  jsonPreviewVisible.value = true
}

async function save() {
  try {
    // ================= 1. 校验 =================
    if (!formData.value.eqName || !formData.value.tableName) {
      message('请填写必填项：设备名称和目标表名')
      return
    }

    if (hasDuplicateConfigName()) {
      message('设备名称已存在，请修改后再保存')
      return
    }

    // ================= 2. 构造 payload =================
    syncFieldMappingsFromRows()

    const payload = {
      EqName: formData.value.eqName,
      TableName: formData.value.tableName,
      FilePathPattern: formData.value.filePathPattern,
      FileNamePattern: formData.value.fileNamePattern,
      FileType: formData.value.fileType,
      HeaderRow: Number(formData.value.headerRow) || 0,
      StartRow: Number(formData.value.startRow) || 1,
      IsEnabled: formData.value.isEnabled,
      PostProcessingType: parseInt(formData.value.postProcessingType),
      ProcedureName: formData.value.procedureName,
      ExtFields: formData.value.extFields,
      FieldMappings: formData.value.fieldMappings,

      PostTableName: formData.value.postTableName,
      ServiceName:
        formData.value.postProcessingType === 1
          ? formData.value.procedureName
          : formData.value.serviceName,
      Flag: formData.value.flag,
      FlagName: formData.value.flagName,
    }

    console.log('提交数据:', payload)

    // ================= 3. 调用 API =================
    let result

    if (formData.value.id) {
      // 更新
      result = await api.updateConfig(formData.value.id, payload)
    } else {
      // 新增
      result = await api.createConfig(payload)
    }

    // ================= 4. 处理结果 =================
    if (result?.code === '1' || result?.info == '新增成功' || result?.info == '更新成功') {
      message(`保存成功！ID: ${result.data || formData.value.id}`)
      close()
      emit('saved')
    } else {
      message('保存失败：' + (result?.msg || result?.message || '未知错误'))
    }
  } catch (err) {
    console.error('请求异常:', err)
    message('请求失败：' + (err?.message || '服务器错误'))
  }
}

defineExpose({ open })
</script>

<style scoped>
.config-modal {
  border-radius: 10px;
  overflow: hidden;
}

.config-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-close {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #262626;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f5f5f5;
}

.config-modal .ant-modal-body {
  max-height: 72vh;
  overflow-y: auto;
}

.form-section {
  padding: 14px 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:first-of-type {
  padding-top: 0;
}

.form-section:last-of-type {
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #52c41a;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.top-form-grid {
  align-items: end;
}

.form-item {
  margin: 0;
}

.form-item + .form-item {
  margin-top: 0;
}

.form-section > .form-item {
  margin-top: 14px;
}

.mapping-form-item {
  margin-top: 18px;
}

.form-item label {
  display: inline-flex;
  align-items: center;
  margin-bottom: 6px;
  color: #262626;
  font-weight: 500;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.label-row label {
  margin-bottom: 0;
}

.status-form-item {
  display: flex;
  flex-direction: column;
}

.status-form-item .toggle-switch {
  margin-top: 0;
}

.mapping-table {
  border: 1px solid #edf0f2;
  border-radius: 7px;
  overflow: hidden;
  background: #fff;
}

.mapping-table__head,
.mapping-table__row {
  display: grid;
  grid-template-columns: 1fr 1fr 68px;
  gap: 8px;
  align-items: center;
}

.mapping-table__head {
  padding: 8px 10px;
  background: #fafafa;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.mapping-table__row {
  padding: 8px 10px;
  border-top: 1px solid #f0f0f0;
}

.mapping-table__row .ant-input {
  height: 32px;
}

.mapping-remove-btn {
  height: 30px;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  background: #fff2f0;
  color: #f5222d;
  cursor: pointer;
}

.mapping-remove-btn:hover {
  border-color: #ff7875;
}

.mapping-add-btn {
  width: 100%;
  height: 34px;
  border: 0;
  border-top: 1px solid #f0f0f0;
  background: #fbfffa;
  color: #32b313;
  font-weight: 600;
  cursor: pointer;
}

.mapping-add-btn:hover {
  background: #f6ffed;
}

.label-with-help {
  display: inline-flex;
  align-items: center;
}

.config-modal .ant-input,
.config-modal select.ant-input {
  height: 34px;
  border-radius: 7px;
}

.config-modal textarea.ant-input {
  height: 88px;
  border-radius: 7px;
}

.json-preview-mask {
  z-index: 1100;
}

.json-preview-wrap {
  z-index: 1101;
}

.json-preview-modal {
  border-radius: 10px;
  overflow: hidden;
}

.json-preview-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.json-preview-modal .ant-modal-body {
  max-height: 56vh;
  overflow: auto;
}

.json-preview-content {
  min-height: 220px;
  margin: 0;
  padding: 12px;
  border: 1px solid #edf0f2;
  border-radius: 7px;
  background: #fafafa;
  color: #1f2937;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.segmented-control {
  position: relative;
  display: flex;
  background-color: #f2f4f6;
  border-radius: 9999px;
  padding: 4px;
  height: 34px;
  width: 100%;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}
.segment-pill {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  width: calc((100% - 8px) / 3);
  background-color: var(--ant-primary, #52c41a);
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.28);
  transition: transform 0.28s cubic-bezier(0.645, 0.045, 0.355, 1);
  z-index: 1;
}
.segment-options {
  display: flex;
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
}
.segment-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--ant-text-secondary);
  cursor: pointer;
  transition: color 0.3s ease;
  border-radius: 9999px;
  user-select: none;
}
.segment-option.active {
  color: #ffffff;
  font-weight: 600;
}
.auto-filled-input {
  background-color: #f6ffed !important;
  border-color: #b7eb8f !important;
  transition: all 0.3s;
}
.auto-filled-input:focus {
  background-color: #ffffff !important;
  border-color: var(--ant-primary, #1677ff) !important;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2) !important;
}
</style>
