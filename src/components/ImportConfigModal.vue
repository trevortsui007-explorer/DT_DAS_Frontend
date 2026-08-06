<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal import-config-modal">
        <div class="ant-modal-header">
          <span class="ant-modal-title">{{ modalTitle }}</span>
          <span class="modal-close-btn" @click="close">×</span>
        </div>
        <div class="ant-modal-body">
          <div class="mode-switch">
            <button
              type="button"
              class="mode-switch__item"
              :class="{ active: importMode === 'standard' }"
              @click="setImportMode('standard')"
            >
              普通表格导入
            </button>
            <button
              type="button"
              class="mode-switch__item"
              :class="{ active: importMode === 'template' }"
              @click="setImportMode('template')"
            >
              固定模板导入
            </button>
          </div>

          <div
            class="dropzone"
            :class="{ 'has-file': fileData }"
            @dragover.prevent
            @drop="handleDrop"
            @click="triggerFileInput"
          >
            <input
              type="file"
              ref="fileInput"
              accept=".xlsx, .xls, .csv"
              @change="handleFileChange"
              style="display: none"
            />
            <div class="dropzone-content" v-if="!fileData">
              <span class="upload-icon">FILE</span>
              <p>拖拽或点击上传 Excel / CSV 文件</p>
            </div>
            <div class="dropzone-content success" v-else>
              <span class="upload-icon">OK</span>
              <p>已加载：<strong>{{ fileData.fileName }}</strong></p>
            </div>
          </div>

          <div v-if="importMode === 'standard' && sheetData.length" class="config-area table-view-wrapper">
            <div class="form-row">
              <div class="form-item" style="flex: 2">
                <label>解析文件名</label>
                <input
                  type="text"
                  v-model="fileName"
                  class="ant-input"
                  placeholder="配置中的文件名规则"
                />
              </div>
              <div class="form-item" style="flex: 1">
                <label>文件类型</label>
                <input
                  type="text"
                  v-model="fileType"
                  class="ant-input"
                  readonly
                  style="background: #f5f5f5"
                />
              </div>
              <div class="form-item" style="flex: 0.5">
                <label>表头行</label>
                <input
                  type="number"
                  v-model.number="headerRow"
                  min="1"
                  class="ant-input"
                  @change="parseSheet"
                />
              </div>
              <div class="form-item" style="flex: 0.5">
                <label>起始行</label>
                <input
                  type="number"
                  v-model.number="dataStartRow"
                  min="1"
                  class="ant-input"
                  @change="parseSheet"
                />
              </div>
            </div>

            <div class="form-item">
              <label>目标表名</label>
              <div class="table-check">
                <input
                  type="text"
                  v-model="targetTable"
                  class="ant-input"
                  placeholder="输入或选择已有表"
                  @blur="fetchTableSchema"
                />
                <button
                  class="ant-btn ant-btn-default"
                  @click="fetchTableSchema"
                >
                  检查表结构
                </button>
              </div>
              <div v-if="tableExists" class="table-info success">
                <span class="icon">通过</span>
                表存在，已自动匹配字段映射
              </div>
              <div v-else-if="tableChecked && !tableExists" class="table-info warning">
                <span>
                  <span class="icon">提示</span>
                  表 <strong>"{{ targetTable }}"</strong> 不存在
                </span>
                <button
                  class="ant-btn ant-btn-primary create-btn"
                  @click="createTableFromMapping"
                >
                  自动创建表
                </button>
              </div>
            </div>

            <div class="form-item">
              <div class="flex-label">
                <span>字段映射（Excel表头 → 数据库字段）</span>
                <div class="mapping-actions">
                  <button
                    class="ant-btn ant-btn-sm ant-btn-purple"
                    @click="addSpecialField('idGuid')"
                  >+ Id(Guid)</button>
                  <button
                    class="ant-btn ant-btn-sm ant-btn-purple"
                    @click="addSpecialField('idSnowflake')"
                  >+ Id(雪花算法)</button>
                  <button
                    class="ant-btn ant-btn-sm ant-btn-orange"
                    @click="addSpecialField('row')"
                  >+ row追溯</button>
                  <button
                    class="ant-btn ant-btn-sm ant-btn-orange"
                    @click="addSpecialField('path')"
                  >+ 完整路径追溯</button>
                  <button
                    class="ant-btn ant-btn-sm ant-btn-cyan"
                    @click="addSpecialField('excelname')"
                  >+ excelname</button>
                  <button
                    class="ant-btn ant-btn-sm ant-btn-cyan"
                    @click="addSpecialField('createDt')"
                  >+ CreateDt</button>
                  <button
                    class="ant-btn ant-btn-sm ant-btn-cyan"
                    @click="addSpecialField('rowData')"
                  >+ RowData(str)</button>
                  <button
                    class="ant-btn ant-btn-primary ant-btn-sm"
                    @click="addMapping"
                  >+ 添加映射</button>
                </div>
              </div>

              <div class="mapping-list cards-view-wrapper" style="margin-top: 10px;">
                <div
                  v-for="(map, idx) in fieldMappings"
                  :key="idx"
                  class="mapping-row"
                  :class="{ 'system-field': map.isSystem, 'is-auto': map.isAutoFilled }"
                >
                  <div class="mapping-col header-col">
                    <span v-if="map.isSystem" class="system-tag">系统</span>
                    <span class="excel-header" :title="map.excelHeader">
                      {{ map.excelHeader || '(内置固定值)' }}
                    </span>
                  </div>
                  <span class="arrow">→</span>
                  <div class="mapping-col input-col">
                    <input
                      type="text"
                      v-model="map.dbField"
                      class="ant-input"
                      :class="{ 'auto-filled-input': map.isAutoFilled }"
                      placeholder="数据库字段名"
                      @input="map.isAutoFilled = false"
                    />
                  </div>
                  <div class="mapping-col select-col">
                    <select v-model="map.dataType" class="ant-input">
                      <option value="string">字符串(NVARCHAR)</option>
                      <option value="number">数字(FLOAT)</option>
                      <option value="int">整数(INT)</option>
                      <option value="date">时间(DATETIME)</option>
                      <option value="boolean">布尔</option>
                    </select>
                  </div>
                  <button
                    class="ant-btn-link danger"
                    @click="removeMapping(idx)"
                  >删除</button>
                </div>
              </div>
            </div>

            <div class="form-item">
              <label>数据预览（前5行）</label>
              <div class="preview-table table-container">
                <table class="ant-table">
                  <thead>
                  <tr>
                    <th v-for="col in previewHeaders" :key="col">{{ col }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(row, idx) in previewData" :key="idx">
                    <td v-for="col in previewHeaders" :key="col">{{ row[col] }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-if="importMode === 'template' && sheetData.length" class="template-area">
            <div class="form-row">
              <div class="form-item" style="flex: 1.4">
                <label>模板</label>
                <select v-model="selectedTemplateId" class="ant-input" @change="parseTemplatePreview">
                  <option
                    v-for="tpl in importTemplates"
                    :key="tpl.id"
                    :value="tpl.id"
                  >
                    {{ tpl.templateName || tpl.TemplateName }}
                  </option>
                </select>
              </div>
              <div class="form-item" style="flex: 1">
                <label>目标表</label>
                <input class="ant-input" :value="templatePreview?.template?.targetTable || ''" readonly />
              </div>
              <div class="form-item" style="flex: 1">
                <label>解析结果</label>
                <input
                  class="ant-input"
                  :value="templatePreview ? `${templatePreview.records.length} 条记录` : ''"
                  readonly
                />
              </div>
            </div>

            <div v-if="templatePreview" class="template-summary">
              <div class="summary-item" :class="{ warning: !templatePreview.matched }">
                <span>模板识别</span>
                <strong>{{ templatePreview.matched ? '已匹配' : '未匹配标题，请确认文件' }}</strong>
              </div>
              <div
                v-for="item in metadataItems"
                :key="item.field"
                class="summary-item"
              >
                <span>{{ item.label }}</span>
                <strong>{{ templatePreview.metadata[item.field] || '--' }}</strong>
              </div>
              <div class="summary-item summary-item--wide">
                <span>停止原因</span>
                <strong>{{ templatePreview.stopReason }}</strong>
              </div>
            </div>

            <div class="template-form">
              <div class="form-item">
                <label>配置名称 (EqName)</label>
                <input v-model="templateForm.eqName" class="ant-input" />
              </div>
              <div class="form-item">
                <label>文件路径规则</label>
                <input
                  v-model="templateForm.filePathPattern"
                  class="ant-input"
                  placeholder="例如：\\\\10.9.10.49\\文件服务器\\品质中心\\..."
                />
              </div>
              <div class="form-item">
                <label>配置组名称</label>
                <input v-model="templateForm.groupName" class="ant-input" />
              </div>
              <div class="form-item">
                <label>任务名称</label>
                <input v-model="templateForm.taskName" class="ant-input" />
              </div>
              <div class="form-item">
                <label>Cron 表达式</label>
                <input v-model="templateForm.cronExpression" class="ant-input" />
              </div>
              <div class="form-item">
                <label>文件名规则</label>
                <input v-model="templateForm.fileNamePattern" class="ant-input" />
              </div>
            </div>

            <div v-if="templatePreview" class="form-item">
              <label>模板解析预览（前5行）</label>
              <div class="preview-table table-container">
                <table class="ant-table">
                  <thead>
                  <tr>
                    <th v-for="col in templatePreview.previewHeaders" :key="col">{{ col }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(row, idx) in templatePreview.previewRows" :key="idx">
                    <td v-for="col in templatePreview.previewHeaders" :key="col">{{ formatPreviewValue(row[col]) }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" style="margin-right: 12px" @click="close">
            取消
          </button>
          <button
            v-if="importMode === 'standard'"
            class="ant-btn ant-btn-primary"
            @click="generateConfig"
            :disabled="!sheetData.length"
          >
            下一步：完善配置
          </button>
          <button
            v-else
            class="ant-btn ant-btn-primary"
            @click="confirmTemplateImport"
            :disabled="!canImportTemplate || templateSubmitting"
          >
            {{ templateSubmitting ? '导入中...' : '确认导入模板任务' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import * as XLSX from 'xlsx'
import {
  checkTableExists,
  createTable,
  fetchImportTemplates,
  importTaskTemplate,
} from '@/api/index.js'
import message from '@/components/index.js'
import {
  AUTOLINE_WIDTH_TEMPLATE,
  BUILTIN_EXCEL_TEMPLATES,
  LAMINATION_THICKNESS_TEMPLATE,
  buildTemplateImportPayload,
  createTemplateExcelPreview,
  findTemplateById,
  getTemplateId,
  mergeImportTemplates,
  normalizeExcelTemplate,
} from '@/utils/templateExcelPreview'

const emit = defineEmits(['imported', 'template-imported'])

const visible = ref(false)
const importMode = ref('standard')
const fileInput = ref(null)
const fileData = ref(null)
const fileName = ref('')
const fileType = ref('')
const workbookData = ref(null)
const sheetData = ref([])
const headerRow = ref(1)
const dataStartRow = ref(2)
const targetTable = ref('')
const tableExists = ref(false)
const tableChecked = ref(false)
const tableColumns = ref([])
const fieldMappings = ref([])
const previewHeaders = ref([])
const previewData = ref([])
const importTemplates = ref(BUILTIN_EXCEL_TEMPLATES)
const selectedTemplateId = ref(AUTOLINE_WIDTH_TEMPLATE.id)
const templatePreview = ref(null)
const templateSubmitting = ref(false)
const templateForm = ref({
  eqName: AUTOLINE_WIDTH_TEMPLATE.configDefaults.eqName,
  filePathPattern: AUTOLINE_WIDTH_TEMPLATE.configDefaults.filePathPattern,
  fileNamePattern: '*.xlsx',
  groupName: AUTOLINE_WIDTH_TEMPLATE.configDefaults.groupName,
  taskName: AUTOLINE_WIDTH_TEMPLATE.configDefaults.taskName,
  cronExpression: AUTOLINE_WIDTH_TEMPLATE.configDefaults.cronExpression,
})

const autoStates = ref({
  fileName: false,
  fileType: false,
  headerRow: false,
  dataStartRow: false
})

const modalTitle = computed(() =>
  importMode.value === 'template'
    ? '导入模板任务（配置 + 分组 + 任务）'
    : '导入配置（第 1/2 步：解析与映射）',
)

const metadataItems = computed(() => templatePreview.value?.template?.metadata || [])

const canImportTemplate = computed(() =>
  templatePreview.value?.matched &&
  templatePreview.value.records.length > 0 &&
  templateForm.value.eqName.trim() &&
  templateForm.value.groupName.trim() &&
  templateForm.value.taskName.trim(),
)

async function open(keepState = false) {
  visible.value = true
  if (!keepState) reset()
  await loadImportTemplates()
}

function close() {
  visible.value = false
  reset()
}

function reset() {
  fileData.value = null
  fileName.value = ''
  fileType.value = ''
  workbookData.value = null
  sheetData.value = []
  headerRow.value = 1
  dataStartRow.value = 2
  targetTable.value = ''
  tableExists.value = false
  tableChecked.value = false
  tableColumns.value = []
  fieldMappings.value = []
  previewHeaders.value = []
  previewData.value = []
  templatePreview.value = null
  templateSubmitting.value = false
  templateForm.value = {
    eqName: AUTOLINE_WIDTH_TEMPLATE.configDefaults.eqName,
    filePathPattern: AUTOLINE_WIDTH_TEMPLATE.configDefaults.filePathPattern,
    fileNamePattern: '*.xlsx',
    groupName: AUTOLINE_WIDTH_TEMPLATE.configDefaults.groupName,
    taskName: AUTOLINE_WIDTH_TEMPLATE.configDefaults.taskName,
    cronExpression: AUTOLINE_WIDTH_TEMPLATE.configDefaults.cronExpression,
  }
}

async function loadImportTemplates() {
  try {
    const res = await fetchImportTemplates()
    const list = res?.data || res || []
    importTemplates.value = mergeImportTemplates(Array.isArray(list) ? list : [])
  } catch {
    importTemplates.value = BUILTIN_EXCEL_TEMPLATES
  }

  if (!findTemplateById(importTemplates.value, selectedTemplateId.value)) {
    selectedTemplateId.value = getTemplateId(AUTOLINE_WIDTH_TEMPLATE)
  }
}

function setImportMode(mode) {
  importMode.value = mode
  if (!sheetData.value.length) return

  if (mode === 'template') {
    parseTemplatePreview()
    return
  }

  parseSheet()
}

function triggerFileInput() {
  fileInput.value.click()
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

const decodeWithEncoding = (buffer, encoding) => {
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(buffer)
  } catch {
    return ''
  }
}

const getDecodeScore = (text) => {
  const replacementCount = (text.match(/\uFFFD/g) || []).length
  const mojibakeCount = (text.match(/[ÃÂÅÆÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/g) || []).length
  const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length

  return replacementCount * 20 + mojibakeCount * 2 - cjkCount
}

const decodeCsvBuffer = (arrayBuffer) => {
  const buffer = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer)
  const candidates = ['utf-8', 'gb18030', 'gbk', 'gb2312']
    .map((encoding) => ({
      encoding,
      text: decodeWithEncoding(buffer, encoding),
    }))
    .filter((item) => item.text)
    .map((item) => ({
      ...item,
      score: getDecodeScore(item.text),
    }))
    .sort((a, b) => a.score - b.score)

  return candidates[0]?.text?.replace(/^\uFEFF/, '') || ''
}

function processFile(file) {
  fileData.value = { fileName: file.name }
  fileName.value = file.name
  fileType.value = '.' + file.name.split('.').pop().toLowerCase()
  templateForm.value.fileNamePattern = fileType.value === '.xlsx' || fileType.value === '.xls'
    ? '*.xlsx'
    : file.name

  if (autoStates.value) {
    autoStates.value.fileName = true
    autoStates.value.fileType = true
    autoStates.value.headerRow = true
    autoStates.value.dataStartRow = true
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = e.target.result
    const isCsv = fileType.value === '.csv'
    const workbook = isCsv
      ? XLSX.read(decodeCsvBuffer(data), { type: 'string', raw: true })
      : XLSX.read(new Uint8Array(data), { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

    workbookData.value = workbook
    sheetData.value = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })

    if (importMode.value === 'template') {
      parseTemplatePreview()
    } else {
      parseSheet()
    }
  }
  reader.readAsArrayBuffer(file)
}

function parseSheet() {
  if (!sheetData.value.length) return

  const rows = sheetData.value
  const headerIndex = headerRow.value - 1
  const dataStartIndex = dataStartRow.value - 1

  if (headerIndex < 0 || headerIndex >= rows.length) {
    message('表头行超出范围')
    return
  }

  const headers = rows[headerIndex].map((cell) =>
    cell === undefined || cell === null ? '' : String(cell).trim()
  )

  previewHeaders.value = headers

  const dataRows = rows.slice(dataStartIndex)
  previewData.value = dataRows.slice(0, 5).map((row) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : ''
    })
    return obj
  })

  const isAuto = !targetTable.value

  fieldMappings.value = headers
    .filter((h) => h !== '')
    .map((h) => ({
      excelHeader: h,
      dbField: isAuto ? h : '',
      dataType: 'string',
      isSystem: false,
      isAutoFilled: isAuto
    }))
}

function parseTemplatePreview() {
  if (!['.xlsx', '.xls'].includes(fileType.value)) {
    templatePreview.value = null
    message('固定模板导入仅支持 Excel 文件')
    return
  }

  const createCandidate = (rawTemplate) => {
    const template = normalizeExcelTemplate(rawTemplate)
    const sheet = template.sheetName
      ? workbookData.value?.Sheets?.[template.sheetName]
      : workbookData.value?.Sheets?.[workbookData.value?.SheetNames?.[0]]
    if (!sheet) return null

    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
    range.s = { r: 0, c: 0 }
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      range: XLSX.utils.encode_range(range),
    })
    return {
      preview: createTemplateExcelPreview(rows, fileName.value, template),
      rows,
    }
  }

  const selectedTemplate = findTemplateById(importTemplates.value, selectedTemplateId.value) || LAMINATION_THICKNESS_TEMPLATE
  let candidate = createCandidate(selectedTemplate)
  if (!candidate) {
    templatePreview.value = null
    message('\u672a\u627e\u5230\u6a21\u677f\u914d\u7f6e\u7684\u5de5\u4f5c\u8868\uff1a' + (normalizeExcelTemplate(selectedTemplate).sheetName || 'Sheet 1'))
    return
  }

  if (!candidate.preview.matched) {
    const matchedCandidate = importTemplates.value
      .map(createCandidate)
      .find((item) => item?.preview.matched && item.preview.records.length > 0)

    if (matchedCandidate) {
      selectedTemplateId.value = getTemplateId(matchedCandidate.preview.template)
      candidate = matchedCandidate
    }
  }

  sheetData.value = candidate.rows
  const preview = candidate.preview
  const defaults = preview.template.configDefaults || {}
  templateForm.value = {
    ...templateForm.value,
    eqName: defaults.eqName || templateForm.value.eqName,
    filePathPattern: defaults.filePathPattern ?? templateForm.value.filePathPattern,
    groupName: defaults.groupName || templateForm.value.groupName,
    taskName: defaults.taskName || templateForm.value.taskName,
    cronExpression: defaults.cronExpression || templateForm.value.cronExpression,
  }
  templatePreview.value = preview
}

function addSpecialField(type) {
  const specialMaps = {
    idGuid: { excelHeader: '{Id(Guid)}', dbField: 'Id(Guid)', dataType: 'string', isSystem: true, isAutoFilled: true },
    idSnowflake: { excelHeader: '{Id(雪花算法)}', dbField: 'Id(雪花算法)', dataType: 'string', isSystem: true, isAutoFilled: true },
    row: { excelHeader: '{row}', dbField: 'row', dataType: 'int', isSystem: true, isAutoFilled: true },
    createDt: { excelHeader: '{CreateDt}', dbField: 'CreateDt', dataType: 'date', isSystem: true, isAutoFilled: true },
    rowData: { excelHeader: '{RowData(str)}', dbField: 'RowData(str)', dataType: 'string', isSystem: true, isAutoFilled: true },
    path: { excelHeader: '{fullFilePath}', dbField: 'fullFilePath', dataType: 'string', isSystem: true, isAutoFilled: true },
    excelname: { excelHeader: '{excelname}', dbField: 'excelname', dataType: 'string', isSystem: true, isAutoFilled: true },
  }
  const newItem = { ...specialMaps[type] }

  if (type === 'idGuid' || type === 'idSnowflake') {
    fieldMappings.value.unshift(newItem)
  } else {
    fieldMappings.value.push(newItem)
  }
}

function addMapping() {
  fieldMappings.value.push({
    excelHeader: '',
    dbField: '',
    dataType: 'string',
    isSystem: false
  })
}

function removeMapping(idx) {
  fieldMappings.value.splice(idx, 1)
}

async function fetchTableSchema() {
  if (!targetTable.value) return
  tableChecked.value = true

  try {
    const res = await checkTableExists(targetTable.value)
    if (res.exists) {
      tableExists.value = true
      tableColumns.value = res.columns || []
      autoMatchMappings()
    } else {
      tableExists.value = false
      tableColumns.value = []
    }
  } catch (err) {
    console.error('检查表失败', err)
    message('检查表失败，请确保后端服务正常')
  }
}

function autoMatchMappings() {
  const dbFieldNames = tableColumns.value.map((col) => col.name.toLowerCase())
  fieldMappings.value = fieldMappings.value.map((map) => {
    if (map.isSystem) return map
    const match = dbFieldNames.find((dbName) => dbName === map.excelHeader.toLowerCase())
    return match ? { ...map, dbField: match } : map
  })
}

async function createTableFromMapping() {
  if (!targetTable.value) {
    message('请先输入目标表名')
    return
  }

  const columns = fieldMappings.value
    .filter((m) => m.dbField)
    .map((m) => {
      let type
      if (m.dataType === 'string') type = 'nvarchar(255)'
      else if (m.dataType === 'number') type = 'float'
      else if (m.dataType === 'int') type = 'int'
      else if (m.dataType === 'date') type = 'datetime'
      else if (m.dataType === 'boolean') type = 'bit'
      else type = m.dataType

      return {
        name: m.dbField,
        type,
        comment: m.excelHeader || m.dbField
      }
    })

  if (columns.length === 0) {
    message('至少需要一个有效的字段映射')
    return
  }

  try {
    const success = await createTable(targetTable.value, columns)
    if (success) {
      tableExists.value = true
      tableColumns.value = columns
      message('表创建成功')
      autoMatchMappings()
    } else {
      message('创建表失败')
    }
  } catch (err) {
    console.error('创建表失败', err)
    message('创建表失败，请检查后端服务')
  }
}

function generateConfig() {
  const extFieldsList = fieldMappings.value
    .filter(m => m.isSystem && m.dbField.toLowerCase() !== 'id' && m.dbField.toLowerCase() !== 'date')
    .map(m => m.dbField)

  const configData = {
    EqName: '',
    TableName: targetTable.value,
    FilePathPattern: '',
    FileNamePattern: fileName.value,
    FileType: fileType.value,
    HeaderRow: headerRow.value,
    StartRow: dataStartRow.value,
    ParserType: 'standard-table',
    TemplateId: null,
    ParserOptions: '',
    PostProcessingType: 0,
    ProcedureName: '',
    IsEnabled: true,
    ExtFields: extFieldsList.join(', '),

    _autoFilledFields: {
      TableName: !!targetTable.value,
      FileNamePattern: !!fileName.value,
      FileType: !!fileType.value,
      HeaderRow: autoStates.value.headerRow,
      StartRow: autoStates.value.dataStartRow,
      ExtFields: extFieldsList.length > 0,
      FieldMappings: fieldMappings.value.filter(m => m.isAutoFilled).map(m => m.dbField)
    },

    FieldMappings: fieldMappings.value.reduce((acc, m) => {
      if (m.dbField) {
        acc[m.excelHeader || m.dbField] = m.dbField
      }
      return acc
    }, {})
  }

  visible.value = false
  emit('imported', configData)
}

async function confirmTemplateImport() {
  if (!canImportTemplate.value) {
    message('请先上传匹配模板的 Excel，并填写配置组与任务名称')
    return
  }

  templateSubmitting.value = true

  try {
    const payload = buildTemplateImportPayload(templatePreview.value, {
      ...templateForm.value,
      fileNamePattern: templateForm.value.fileNamePattern || '*.xlsx',
    })
    const result = await importTaskTemplate(payload)
    const success = result?.success !== false && result?.code !== '0'

    if (!success) {
      throw new Error(result?.message || result?.msg || '模板任务导入失败')
    }

    visible.value = false
    emit('template-imported', result?.data || result)
    reset()
  } catch (err) {
    console.error('模板任务导入失败', err)
    message(err?.message || '模板任务导入失败')
  } finally {
    templateSubmitting.value = false
  }
}

const formatPreviewValue = (value) => {
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (value === null || value === undefined || value === '') return '--'
  return value
}

defineExpose({ open })
</script>

<style scoped>
.import-config-modal {
  width: 980px;
}

.modal-close-btn {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  color: var(--ant-text-secondary);
  transition: color 0.3s, background 0.3s;
  line-height: 1;
}

.modal-close-btn:hover { background: #f5f5f5; color: #ff4d4f; }

.ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mode-switch {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: #f2f4f6;
}

.mode-switch__item {
  height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  font-weight: 600;
}

.mode-switch__item.active {
  background: #fff;
  color: var(--ant-primary, #1677ff);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
}

.dropzone {
  border: 2px dashed var(--ant-border-color);
  border-radius: 8px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropzone:hover { border-color: var(--ant-primary); background: var(--ant-primary-light); }
.dropzone.has-file { border-color: var(--ant-primary); border-style: solid; background: var(--ant-primary-light); }
.dropzone-content p { margin: 8px 0 0; font-size: 14px; color: var(--ant-text-secondary); }
.dropzone-content.success p { color: var(--ant-primary-active); }
.upload-icon { font-size: 13px; font-weight: 800; letter-spacing: 0; }

.config-area,
.template-area {
  max-height: 560px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row { display: flex; gap: 16px; }
.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--ant-text-primary);
}

.flex-label {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
}

.table-check { display: flex; gap: 12px; }
.table-check .ant-input { flex: 1; }

.table-info {
  margin-top: 12px;
  padding: 10px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.table-info .icon { margin-right: 8px; font-weight: 700; }
.table-info.success {
  background: var(--ant-primary-light);
  border: 1px solid #b7eb8f;
  color: var(--ant-primary-active);
}

.table-info.warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  color: #d46b00;
  justify-content: space-between;
}

.create-btn { height: 28px; padding: 0 12px; font-size: 13px; }

.mapping-list {
  max-height: 240px;
  border: 1px solid var(--ant-border-color);
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}

.mapping-row {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #fff;
  padding: 8px 12px;
  border: 1px solid var(--ant-border-color);
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.mapping-row:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: #d9d9d9;
}

.mapping-row:last-child { margin-bottom: 0; }
.mapping-row.system-field { background: #f0f5ff; border-color: #91caff; }

.system-tag {
  background: #1890ff;
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
  margin-right: 8px;
  white-space: nowrap;
}

.mapping-col { display: flex; align-items: center; }
.header-col { width: 160px; flex-shrink: 0; }
.excel-header {
  font-weight: 600;
  color: var(--ant-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow { color: var(--ant-text-secondary); font-weight: bold; }
.input-col { flex: 1; }
.select-col { width: 140px; flex-shrink: 0; }

.ant-btn-link {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
  transition: color 0.3s;
}

.ant-btn-link.danger { color: #ff4d4f; }
.ant-btn-link.danger:hover { color: #cf1322; }

.ant-btn-sm {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 4px;
}

.preview-table {
  border: 1px solid var(--ant-border-color);
  border-radius: 8px;
  overflow: auto;
}

.mapping-actions {
  display: flex;
  gap: 8px;
}

.auto-filled-input {
  background-color: #f6ffed !important;
  border-color: #b7eb8f !important;
}

.mapping-row.is-auto {
  border-left: 4px solid #52c41a;
}

.template-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 10px 12px;
  border: 1px solid #edf0f2;
  border-radius: 8px;
  background: #fff;
}

.summary-item.warning {
  border-color: #ffd591;
  background: #fff7e6;
}

.summary-item--wide {
  grid-column: span 2;
}

.summary-item span {
  display: block;
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-item strong {
  color: #1f2937;
  font-size: 14px;
}

.template-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

@media (max-width: 860px) {
  .import-config-modal {
    width: calc(100vw - 24px);
  }

  .form-row,
  .flex-label {
    flex-direction: column;
    align-items: stretch;
  }

  .template-summary,
  .template-form {
    grid-template-columns: 1fr;
  }

  .summary-item--wide {
    grid-column: span 1;
  }
}
</style>
