<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 700px">
        <div class="ant-modal-header">
          <span class="ant-modal-title">
            {{
              isFromImport
                ? '导入配置（第 2/2 步：完善配置）'
                : isEdit
                  ? '编辑配置项'
                  : '新建配置项'
            }}
          </span>
          <span style="cursor: pointer; float: right" @click="close">×</span>
        </div>

        <div class="ant-modal-body">
          <input type="hidden" v-model="formData.id" />

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-column">
              <div class="form-item">
                <label><span style="color: red">*</span> 设备名称 (EqName)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.eqName"
                  placeholder="请输入设备名称"
                />
              </div>

              <div class="form-item" style="margin-top: 12px">
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

              <div class="form-item" style="margin-top: 12px">
                <label><span style="color: red">*</span> 文件路径规则</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.filePathPattern"
                  placeholder="例如: D:/Desktop/{yyyy}.{MM}.{dd}/"
                />
              </div>

              <div class="form-item" style="margin-top: 12px">
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

              <div class="form-item" style="margin-top: 12px">
                <label>文件类型</label>
                <select
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('FileType') }"
                  v-model="formData.fileType"
                  @change="autoMarkers.FileType = false"
                >
                  <option value=".csv">CSV 文件</option>
                  <option value=".txt">TXT 文件</option>
                  <option value=".xlsx">Excel 文件</option>
                </select>
              </div>
            </div>

            <div class="form-column">
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

              <div class="form-item" style="margin-top: 12px">
                <label>数据起始行 (StartRow)</label>
                <input
                  type="number"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('StartRow') }"
                  v-model="formData.startRow"
                  @input="autoMarkers.StartRow = false"
                />
              </div>

              <div class="form-item" style="margin-top: 12px">
                <label>后处理类型</label>
                <div class="segmented-control" id="post-type-segmented">
                  <div class="segment-pill" :style="{ left: pillLeft }"></div>
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

              <div class="form-item" style="margin-top: 12px">
                <label>存储过程/服务名</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.procedureName"
                  placeholder="需进行后处理时填写"
                />
              </div>

              <div
                class="form-item"
                style="margin-top: 12px; display: flex; flex-direction: column"
              >
                <label>状态</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="formData.isEnabled" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-item" style="margin-top: 12px">
            <label>扩展字段 (ExtFields)</label>
            <input
              type="text"
              class="ant-input"
              :class="{ 'auto-filled-input': isAuto('ExtFields') }"
              v-model="formData.extFields"
              placeholder="例如: row, fullFilePath"
              @input="autoMarkers.ExtFields = false"
            />
          </div>

          <div class="form-item" style="margin-top: 12px">
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
              "
            >
              <label>字段映射关系 (JSON 格式)</label>
              <button
                class="ant-btn ant-btn-default"
                style="height: 26px; padding: 0 12px; font-size: 13px"
                @click="formatJson"
              >
                格式化 JSON
              </button>
            </div>
            <textarea
              class="ant-input"
              v-model="formData.fieldMappings"
              style="height: 88px; resize: vertical; width: 100%"
              placeholder='例如: {"环境温度": "Temperature", "环境湿度": "Humidity"}'
            ></textarea>
          </div>
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as api from '@/api'
import message from '@/components/index.js'

const emit = defineEmits(['saved', 'goBack'])

const visible = ref(false)
const isEdit = ref(false)
const isFromImport = ref(false) // 标记是否为导入流程

const formData = ref({
  id: '',
  eqName: '',
  tableName: '',
  filePathPattern: '',
  fileNamePattern: '',
  fileType: 'csv',
  headerRow: 1,
  startRow: 2,
  postProcessingType: 0,
  procedureName: '',
  isEnabled: true,
  extFields: '',
  fieldMappings: '',
})

const autoMarkers = ref({})

const postTypes = [
  { value: 0, label: '无操作' },
  { value: 1, label: '调用C#服务' },
  { value: 2, label: '调用存储过程' },
]

const pillLeft = computed(() => {
  const index = postTypes.findIndex((t) => t.value === formData.value.postProcessingType)
  return `${index * 33.333}%`
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

function open(edit = false, data = null, fromImport = false) {
  isEdit.value = edit
  isFromImport.value = fromImport

  // 每次打开时先重置标记
  autoMarkers.value = {}

  if (data) {
    // 兼容后端的大写字段和前端的小写字段
    formData.value = {
      id: data.id || data.Id || '',
      eqName: data.eqName || data.EqName || '',
      tableName: data.tableName || data.TableName || '',
      filePathPattern: data.filePathPattern || data.FilePathPattern || '',
      fileNamePattern: data.fileNamePattern || data.FileNamePattern || '',
      fileType: data.fileType || data.FileType || 'csv',
      headerRow: data.headerRow || data.HeaderRow || 1,
      startRow: data.startRow || data.StartRow || 2,
      postProcessingType: data.postProcessingType ?? data.PostProcessingType ?? 0,
      procedureName: data.procedureName || data.ProcedureName || '',
      isEnabled: data.isEnabled ?? data.IsEnabled ?? true,
      extFields: data.extFields || data.ExtFields || '',
      fieldMappings:
        typeof (data.fieldMappings || data.FieldMappings) === 'object'
          ? JSON.stringify(data.fieldMappings || data.FieldMappings, null, 2)
          : data.fieldMappings || data.FieldMappings || '',
    }

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
    fileType: 'csv',
    headerRow: 1,
    startRow: 2,
    postProcessingType: 0,
    procedureName: '',
    isEnabled: true,
    extFields: '',
    fieldMappings: '',
  }
}

function close() {
  visible.value = false
}

function goBack() {
  visible.value = false
  emit('goBack') // 通知父组件退回上一步
}

function formatJson() {
  try {
    const parsed = JSON.parse(formData.value.fieldMappings)
    formData.value.fieldMappings = JSON.stringify(parsed, null, 2)
  } catch (err) {
    message('JSON 格式有误，请检查后再试～', err)
  }
}

async function save() {
  try {
    // ================= 1. 校验 =================
    if (!formData.value.eqName || !formData.value.tableName) {
      message('请填写必填项：设备名称和目标表名')
      return
    }

    // ================= 2. 构造 payload =================
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

      PostTableName: '',
      ServiceName: formData.value.postProcessingType === 1 ? formData.value.procedureName : '',
      Flag: '',
      FlagName: '',
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
.form-grid {
  margin-bottom: 16px;
}
.segmented-control {
  position: relative;
  display: flex;
  background-color: #f0f2f5;
  border-radius: 9999px;
  padding: 4px;
  height: 26px;
  width: 100%;
}
.segment-pill {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  width: calc(33.333% - 4px);
  background-color: var(--ant-primary, #52c41a);
  border-radius: 9999px;
  transition: left 0.35s cubic-bezier(0.645, 0.045, 0.355, 1);
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
  font-size: 14px;
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
