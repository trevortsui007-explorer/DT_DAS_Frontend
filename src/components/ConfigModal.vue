<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 700px;">
        <div class="ant-modal-header">
          <span class="ant-modal-title">
            {{ isFromImport ? '导入配置（第 2/2 步：完善配置）' : (isEdit ? '编辑配置项' : '新建配置项') }}
          </span>
          <span style="cursor:pointer; float:right;" @click="close">×</span>
        </div>

        <div class="ant-modal-body">
          <input type="hidden" v-model="formData.id" />

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-column">
              <div class="form-item">
                <label><span style="color:red;">*</span> 设备名称 (EqName)</label>
                <input type="text" class="ant-input" v-model="formData.eqName" placeholder="请输入设备名称" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label><span style="color:red;">*</span> 目标表名 (TableName)</label>
                <input type="text" class="ant-input" :class="{ 'auto-filled-input': isAuto('TableName') }" v-model="formData.tableName" placeholder="请输入数据库目标表名" @input="autoMarkers.TableName = false" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label><span style="color:red;">*</span> 文件路径规则</label>
                <input type="text" class="ant-input" :class="{ 'auto-filled-input': isAuto('FileNamePattern') }" v-model="formData.filePathPattern" placeholder="例如: D:/Desktop/{yyyy}.{MM}.{dd}/" @input="autoMarkers.FileNamePattern = false" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label>文件名规则</label>
                <input type="text" class="ant-input" v-model="formData.fileNamePattern" placeholder="例如: Log.csv" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label>文件类型</label>
                <select class="ant-input" v-model="formData.fileType">
                  <option value="csv">CSV 文件</option>
                  <option value="txt">TXT 文件</option>
                  <option value="xlsx">Excel 文件</option>
                </select>
              </div>
            </div>

            <div class="form-column">
              <div class="form-item">
                <label>表头行号 (HeaderRow)</label>
                <input type="number" class="ant-input" :class="{ 'auto-filled-input': isAuto('headerRow') }" v-model="formData.headerRow" @input="autoMarkers.headerRow = false" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label>数据起始行 (StartRow)</label>
                <input type="number" class="ant-input" v-model="formData.startRow" />
              </div>

              <div class="form-item" style="margin-top:12px;">
                <label>后处理类型</label>
                <div class="segmented-control" id="post-type-segmented">
                  <div class="segment-pill" :style="{ left: pillLeft }"></div>
                  <div class="segment-options">
                    <div
                      v-for="(opt, idx) in postTypes"
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

              <div class="form-item" style="margin-top:12px;">
                <label>存储过程/服务名</label>
                <input type="text" class="ant-input" v-model="formData.procedureName" placeholder="后处理类型为2时填写" />
              </div>

              <div class="form-item" style="margin-top:12px; display: flex; flex-direction: column;">
                <label>状态</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="formData.isEnabled" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-item" style="margin-top:12px;">
            <label>扩展字段 (ExtFields)</label>
            <input type="text" class="ant-input" v-model="formData.extFields" placeholder="例如: row, fullFilePath" />
          </div>

          <div class="form-item" style="margin-top:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label>字段映射关系 (JSON 格式)</label>
              <button class="ant-btn ant-btn-default" style="height:26px; padding:0 12px; font-size:13px;" @click="formatJson">
                格式化 JSON
              </button>
            </div>
            <textarea class="ant-input" v-model="formData.fieldMappings" style="height:88px; resize:vertical; width:100%;"
                      placeholder='例如: {"环境温度": "Temperature", "环境湿度": "Humidity"}'></textarea>
          </div>
        </div>

        <div class="ant-modal-footer" style="display: flex; justify-content: space-between;">
          <div>
            <button v-if="isFromImport" class="ant-btn ant-btn-default" @click="goBack">
              ← 上一步 (修改映射)
            </button>
          </div>
          <div>
            <button class="ant-btn ant-btn-default" style="margin-right: 12px;" @click="close">取消</button>
            <button class="ant-btn ant-btn-primary" @click="save">保存配置</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['saved', 'goBack'])

const visible = ref(false)
const isEdit = ref(false)
const isFromImport = ref(false) // 标记是否为导入流程

const formData = ref({
  id: '', eqName: '', tableName: '', filePathPattern: '', fileNamePattern: '',
  fileType: 'csv', headerRow: 1, startRow: 2, postProcessingType: 0,
  procedureName: '', isEnabled: true, extFields: '', fieldMappings: ''
})

const autoMarkers = ref({})

const postTypes = [
  { value: 0, label: '无操作' },
  { value: 1, label: '调用C#服务' },
  { value: 2, label: '调用存储过程' }
]

const pillLeft = computed(() => {
  const index = postTypes.findIndex(t => t.value === formData.value.postProcessingType)
  return `${index * 33.333}%`
})

function open(edit = false, data = null, fromImport = false) {
  isEdit.value = edit
  isFromImport.value = fromImport

  // 每次打开时先重置标记
  autoMarkers.value = {}

  if (edit && data) {
    // 编辑逻辑...
    formData.value = { ...data } // 假设编辑模式直接赋值
  } else if (data && !edit) {
    // 导入过来的数据填充
    formData.value = {
      id: '',
      eqName: data.eqName || '',
      tableName: data.TableName || '',
      filePathPattern: data.FilePathPattern || '',
      fileNamePattern: data.FileNamePattern || '',
      fileType: data.FileType || 'csv',
      headerRow: data.HeaderRow || 1,
      startRow: data.StartRow || 2,
      postProcessingType: data.PostProcessingType || 0,
      procedureName: data.ProcedureName || '',
      isEnabled: data.IsEnabled !== undefined ? data.IsEnabled : true,
      extFields: data.ExtFields || '',
      fieldMappings: typeof data.FieldMappings === 'object'
        ? JSON.stringify(data.FieldMappings, null, 2)
        : (data.FieldMappings || '')
    }

    // --- 核心修改：如果是导入，且携带了标记对象 ---
    if (fromImport && data._autoFilledFields) {
      // 直接继承第一步传过来的标记
      autoMarkers.value = { ...data._autoFilledFields }
    } else if (fromImport) {
      // 兼容逻辑：如果没有标记对象，但来自导入，默认让关键字段变绿
      autoMarkers.value = {
        tableName: !!data.TableName,
        fileNamePattern: !!data.FileNamePattern,
        fileType: !!data.FileType,
        headerRow: true,
        startRow: true
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
  formData.value = { id: '', eqName: '', tableName: '', filePathPattern: '', fileNamePattern: '', fileType: 'csv', headerRow: 1, startRow: 2, postProcessingType: 0, procedureName: '', isEnabled: true, extFields: '', fieldMappings: '' }
}

function close() { visible.value = false }

function goBack() {
  visible.value = false
  emit('goBack') // 通知父组件退回上一步
}

function formatJson() {
  try {
    const parsed = JSON.parse(formData.value.fieldMappings)
    formData.value.fieldMappings = JSON.stringify(parsed, null, 2)
  } catch (err) {
    alert('JSON 格式有误，请检查后再试～')
  }
}

async function save() {
  const payload = { ...formData.value }
  console.log('保存数据：', payload)
  alert('保存成功！')
  close()
  emit('saved')
}

defineExpose({ open })
</script>

<style scoped>
.form-grid { margin-bottom: 16px; }
.segmented-control { position: relative; display: flex; background-color: #f0f2f5; border-radius: 9999px; padding: 4px; height: 36px; width: 100%; }
.segment-pill { position: absolute; top: 4px; left: 0; height: calc(100% - 8px); width: calc(33.333% - 4px); background-color: var(--ant-primary, #52c41a); border-radius: 9999px; transition: left 0.35s cubic-bezier(0.645, 0.045, 0.355, 1); z-index: 1; }
.segment-options { display: flex; position: relative; z-index: 2; width: 100%; height: 100%; }
.segment-option { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; color: var(--ant-text-secondary); cursor: pointer; transition: color 0.3s ease; border-radius: 9999px; user-select: none; }
.segment-option.active { color: #ffffff; font-weight: 600; }
</style>
