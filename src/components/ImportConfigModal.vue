<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 850px">
        <div class="ant-modal-header">
          <span class="ant-modal-title">导入配置（第 1/2 步：解析与映射）</span>
          <span class="modal-close-btn" @click="close">×</span>
        </div>
        <div class="ant-modal-body">
          <!-- 上传区 -->
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
              <span class="upload-icon">📁</span>
              <p>拖拽或点击上传 Excel / CSV 文件</p>
            </div>
            <div class="dropzone-content success" v-else>
              <span class="upload-icon">✅</span>
              <p>已加载：<strong>{{ fileData.fileName }}</strong></p>
            </div>
          </div>

          <!-- 配置区域 -->
          <div v-if="sheetData.length" class="config-area table-view-wrapper">
            <!-- 第一行：文件名 + 文件类型 + 表头行 + 起始行 -->
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

            <!-- 目标表名 -->
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
                <span class="icon">✅</span>
                表存在，已自动匹配字段映射
              </div>
              <div v-else-if="tableChecked && !tableExists" class="table-info warning">
                <span>
                  <span class="icon">⚠️</span>
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

            <!-- 字段映射 -->
            <div class="form-item">
              <div class="flex-label">
                <span>字段映射（Excel表头 → 数据库字段）</span>
                <div class="mapping-actions">
                  <button
                    class="ant-btn ant-btn-sm ant-btn-purple"
                    @click="addSpecialField('id')"
                  >+ Id主键</button>
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
                    @click="addSpecialField('time')"
                  >+ createdt追溯</button>
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

            <!-- 数据预览（保留第二个版本的功能） -->
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
        </div>

        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" style="margin-right: 12px" @click="close">
            取消
          </button>
          <button
            class="ant-btn ant-btn-primary"
            @click="generateConfig"
            :disabled="!sheetData.length"
          >
            下一步：完善配置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { checkTableExists, createTable } from '@/api/index.js'
import message from '@/components/index.js'

const emit = defineEmits(['imported'])

// ==================== 状态变量 ====================
const visible = ref(false)
const fileInput = ref(null)
const fileData = ref(null)
const fileName = ref('')
const fileType = ref('')
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

const autoStates = ref({
  fileName: false,
  fileType: false,
  headerRow: false,
  dataStartRow: false
})

// ==================== 模态框控制 ====================
function open(keepState = false) {
  visible.value = true
  if (!keepState) reset()
}

function close() {
  visible.value = false
  reset()
}

function reset() {
  fileData.value = null
  fileName.value = ''
  fileType.value = ''
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
}

// ==================== 文件上传 ====================
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

function processFile(file) {
  fileData.value = { fileName: file.name }
  fileName.value = file.name
  fileType.value = '.' + file.name.split('.').pop().toLowerCase()

  // --- 标记这些字段为自动填充状态（触发绿色背景） ---
  if (autoStates.value) {
    autoStates.value.fileName = true
    autoStates.value.fileType = true
    autoStates.value.headerRow = true
    autoStates.value.dataStartRow = true
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    sheetData.value = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
    parseSheet()
  }
  reader.readAsArrayBuffer(file)
}

// ==================== 解析与映射 ====================
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

  // 数据预览逻辑保持不变
  const dataRows = rows.slice(dataStartIndex)
  previewData.value = dataRows.slice(0, 5).map((row) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : ''
    })
    return obj
  })

  // 优化：1:1 映射并添加自动填充标记
  const isAuto = !targetTable.value // 只有在没填目标表时才触发自动 1:1

  fieldMappings.value = headers
    .filter((h) => h !== '')
    .map((h) => ({
      excelHeader: h,
      dbField: isAuto ? h : '', // 自动填入
      dataType: 'string',
      isSystem: false,
      isAutoFilled: isAuto      // 标记是否为自动填入
    }))
}

// ==================== 特殊系统字段 ====================
function addSpecialField(type) {
  const specialMaps = {
    id: { excelHeader: '', dbField: 'Id', dataType: 'string', isSystem: true, isAutoFilled: true },
    row: { excelHeader: '{row}', dbField: 'row', dataType: 'int', isSystem: true, isAutoFilled: true },
    time: { excelHeader: '{createdt}', dbField: 'createdt', dataType: 'date', isSystem: true, isAutoFilled: true },
    path: { excelHeader: '{fullFilePath}', dbField: 'fullFilePath', dataType: 'string', isSystem: true, isAutoFilled: true },
  }
  const newItem = { ...specialMaps[type] }

  if (type === 'id') {
    // ID 主键通常放在表的第一列
    fieldMappings.value.unshift(newItem)
  } else {
    // row, fullFilePath 和 createdt 追溯字段放在表的最后
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

// ==================== 表结构检查 & 自动匹配 ====================
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
    // 系统字段不参与自动匹配
    if (map.isSystem) return map
    const match = dbFieldNames.find((dbName) => dbName === map.excelHeader.toLowerCase())
    return match ? { ...map, dbField: match } : map
  })
}

// ==================== 自动建表 ====================
async function createTableFromMapping() {
  if (!targetTable.value) {
    message('请先输入目标表名')
    return
  }

  const columns = fieldMappings.value
    .filter((m) => m.dbField)
    .map((m) => {
      let type;
      if (m.dataType === 'string') type = 'nvarchar(255)'
      else if (m.dataType === 'number') type = 'float'
      else if (m.dataType === 'int') type = 'int'
      else if (m.dataType === 'date') type = 'datetime'
      else if (m.dataType === 'boolean') type = 'bit'
      else type = m.dataType

      return {
        name: m.dbField,
        type: type,
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
      message('表创建成功！')
      autoMatchMappings()
    } else {
      message('创建表失败')
    }
  } catch (err) {
    console.error('创建表失败', err)
    message('创建表失败，请检查后端服务')
  }
}

// ==================== 生成最终配置 ====================
function generateConfig() {
  // 提取所有的扩展/追溯字段 (排除 Id 主键)
  const extFieldsList = fieldMappings.value
    .filter(m => m.isSystem && m.dbField.toLowerCase() !== 'id' && m.dbField.toLowerCase() !== 'date')
    .map(m => m.dbField);

  const configData = {
    EqName: '',
    TableName: targetTable.value,
    FilePathPattern: '',
    FileNamePattern: fileName.value,
    FileType: fileType.value,
    HeaderRow: headerRow.value,
    StartRow: dataStartRow.value,
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

    // 字段映射（支持系统字段）
    FieldMappings: fieldMappings.value.reduce((acc, m) => {
      if (m.dbField) {
        acc[m.excelHeader || m.dbField] = m.dbField
      }
      return acc
    }, {})
  }

  visible.value = false;

  emit('imported', configData)
}

defineExpose({ open })
</script>

<style scoped>
/* ==================== 保留第二个版本的全部样式 + 新增部分 ==================== */
.modal-close-btn {
  cursor: pointer; float: right; font-size: 20px;
  color: var(--ant-text-secondary); transition: color 0.3s; line-height: 1;
}
.modal-close-btn:hover { color: #ff4d4f; }

.dropzone {
  border: 2px dashed var(--ant-border-color);
  border-radius: 8px;
  padding: 32px;
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
.upload-icon { font-size: 32px; }

.config-area {
  max-height: 550px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row { display: flex; gap: 16px; }
.form-item label {
  display: block; margin-bottom: 8px; font-weight: 500;
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
.table-info .icon { margin-right: 8px; }
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
.mapping-row.system-field {
  background: #f0f5ff;
  border-color: #91caff;
}
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
  overflow: hidden;
}

.mapping-actions {
  display: flex;
  gap: 8px;
}

.auto-filled-input {
  background-color: #f6ffed !important; /* 浅绿色背景 */
  border-color: #b7eb8f !important;      /* 浅绿色边框 */
}

.mapping-row.is-auto {
  border-left: 4px solid #52c41a; /* 绿色左边条 */
}

</style>
