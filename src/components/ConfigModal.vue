<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 700px;">
        <div class="ant-modal-header">
          <span class="ant-modal-title">{{ isEdit ? '编辑配置项' : '新建配置项' }}</span>
          <span style="cursor:pointer; float:right;" @click="close">×</span>
        </div>
        <div class="ant-modal-body">
          <input type="hidden" id="cfg-id" v-model="formData.id" />

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <!-- 左侧 -->
            <div class="form-column">
              <div class="form-item">
                <label><span style="color:red;">*</span> 设备名称 (EqName)</label>
                <input type="text" class="ant-input" v-model="formData.eqName" placeholder="请输入设备名称" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label><span style="color:red;">*</span> 目标表名 (TableName)</label>
                <input type="text" class="ant-input" v-model="formData.tableName" placeholder="请输入数据库目标表名" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label><span style="color:red;">*</span> 文件路径规则</label>
                <input type="text" class="ant-input" v-model="formData.filePathPattern" placeholder="例如: D:/Desktop/{yyyy}.{MM}.{dd}/" />
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

            <!-- 右侧 -->
            <div class="form-column">
              <div class="form-item">
                <label>表头行号 (HeaderRow)</label>
                <input type="number" class="ant-input" v-model="formData.headerRow" />
              </div>
              <div class="form-item" style="margin-top:12px;">
                <label>数据起始行 (StartRow)</label>
                <input type="number" class="ant-input" v-model="formData.startRow" />
              </div>

              <!-- 后处理类型 -->
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

              <!-- 状态 -->
              <div class="form-item" style="margin-top:12px; display: flex; flex-direction: column;">
                <label>状态</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="formData.isEnabled" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- 扩展字段 -->
          <div class="form-item" style="margin-top:12px;">
            <label>扩展字段 (ExtFields)</label>
            <input type="text" class="ant-input" v-model="formData.extFields" placeholder="例如: row, fullFilePath" />
          </div>

          <!-- 字段映射关系 -->
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
        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" @click="close">取消</button>
          <button class="ant-btn ant-btn-primary" @click="save">保存配置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['saved'])

// 控制显示
const visible = ref(false)
const isEdit = ref(false)
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
  fieldMappings: ''
})

const postTypes = [
  { value: 0, label: '无操作' },
  { value: 1, label: '调用C#服务' },
  { value: 2, label: '调用存储过程' }
]

// 胶囊滑动位置
const pillLeft = computed(() => {
  const index = postTypes.findIndex(t => t.value === formData.value.postProcessingType)
  return `${index * 33.333}%`
})

// 打开弹窗
function open(edit = false, data = null) {
  isEdit.value = edit
  if (edit && data) {
    // 映射字段名（旧项目使用 PascalCase，这里做兼容）
    formData.value = {
      id: data.Id || data.id || '',
      eqName: data.EqName || data.eqName || '',
      tableName: data.TableName || data.tableName || '',
      filePathPattern: data.FilePathPattern || data.filePathPattern || '',
      fileNamePattern: data.FileNamePattern || data.fileNamePattern || '',
      fileType: data.FileType || data.fileType || 'csv',
      headerRow: data.HeaderRow ?? data.headerRow ?? 1,
      startRow: data.StartRow ?? data.startRow ?? 2,
      postProcessingType: data.PostProcessingType ?? data.postProcessingType ?? 0,
      procedureName: data.ProcedureName || data.procedureName || '',
      isEnabled: data.IsEnabled !== undefined ? data.IsEnabled : (data.isEnabled !== undefined ? data.isEnabled : true),
      extFields: data.ExtFields || data.extFields || '',
      fieldMappings: typeof (data.FieldMappings || data.fieldMappings) === 'object'
        ? JSON.stringify(data.FieldMappings || data.fieldMappings, null, 2)
        : (data.FieldMappings || data.fieldMappings || '')
    }
  } else {
    // 重置表单
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
      fieldMappings: ''
    }
  }
  visible.value = true
}

function close() {
  visible.value = false
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
  // 组装提交数据（字段名与后端一致）
  const payload = {
    EqName: formData.value.eqName,
    TableName: formData.value.tableName,
    FilePathPattern: formData.value.filePathPattern,
    FileNamePattern: formData.value.fileNamePattern,
    FileType: formData.value.fileType,
    HeaderRow: parseInt(formData.value.headerRow),
    StartRow: parseInt(formData.value.startRow),
    PostProcessingType: parseInt(formData.value.postProcessingType),
    ProcedureName: formData.value.procedureName,
    IsEnabled: formData.value.isEnabled,
    ExtFields: formData.value.extFields,
    FieldMappings: formData.value.fieldMappings
  }
  if (isEdit.value && formData.value.id) {
    payload.Id = formData.value.id
  }

  // TODO: 替换为真实 API 调用
  console.log('保存配置', payload)
  alert('配置保存成功！（实际项目中请替换为接口调用）')
  close()
  emit('saved')
}

defineExpose({ open })
</script>

<style scoped>
/* 弹窗内表单布局微调，全局样式已提供大部分样式，这里只补充 */
.form-grid {
  margin-bottom: 16px;
}
</style>
