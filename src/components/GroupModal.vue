<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 550px;">
        <div class="ant-modal-header">
          <span class="ant-modal-title">{{ isEdit ? '编辑配置组' : '新建配置组' }}</span>
          <span style="cursor:pointer; float:right;" @click="close">×</span>
        </div>
        <div class="ant-modal-body">
          <input type="hidden" v-model="formData.id" />

          <div class="form-item">
            <label><span style="color:red;">*</span> 配置组名称</label>
            <input type="text" class="ant-input" v-model="formData.groupName" placeholder="请输入配置组名称" />
          </div>

          <div class="form-item" style="margin-top:16px;">
            <label>组类别</label>
            <input type="text" class="ant-input" v-model="formData.groupCategory" placeholder="例如：二厂、三厂" />
          </div>

          <div class="form-item" style="margin-top:16px;">
            <label>组类型</label>
            <input type="text" class="ant-input" v-model="formData.groupType" placeholder="例如：默认周期执行组" />
          </div>

          <div class="form-item" style="margin-top:16px;">
            <label>排序序号</label>
            <input type="number" class="ant-input" v-model="formData.sortOrder" placeholder="数字越小越靠前" />
          </div>

          <div class="form-item" style="margin-top:16px;">
            <label>状态</label>
            <label class="toggle-switch" style="display: block;">
              <input type="checkbox" v-model="formData.isEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" @click="close">取消</button>
          <button class="ant-btn ant-btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['saved'])

const visible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: null,
  groupName: '',
  groupCategory: '',
  groupType: '',
  sortOrder: 0,
  isEnabled: true
})

function open(edit = false, data = null) {
  isEdit.value = edit
  if (edit && data) {
    formData.value = {
      id: data.id || data.Id || null,
      groupName: data.groupName || data.GroupName || '',
      groupCategory: data.groupCategory || data.GroupCategory || '',
      groupType: data.groupType || data.GroupType || '',
      sortOrder: data.sortOrder ?? data.SortOrder ?? 0,
      isEnabled: data.isEnabled !== undefined ? data.isEnabled : (data.IsEnabled ?? true)
    }
  } else {
    formData.value = {
      id: null,
      groupName: '',
      groupCategory: '',
      groupType: '',
      sortOrder: 0,
      isEnabled: true
    }
  }
  visible.value = true
}

function close() {
  visible.value = false
}

async function save() {
  if (!formData.value.groupName.trim()) {
    alert('请填写配置组名称')
    return
  }

  // 组装提交数据（与后端字段名一致：PascalCase）
  const payload = {
    GroupName: formData.value.groupName,
    GroupCategory: formData.value.groupCategory,
    GroupType: formData.value.groupType,
    SortOrder: parseInt(formData.value.sortOrder) || 0,
    IsEnabled: formData.value.isEnabled
  }
  if (isEdit.value && formData.value.id) {
    payload.Id = formData.value.id  // 编辑时可能只需要 id 放在 URL 中，这里按需调整
  }

  // TODO: 替换为真实 API 调用
  console.log('保存配置组', payload)
  alert('配置组保存成功！（实际项目中请替换为接口调用）')
  close()
  emit('saved')
}

defineExpose({ open })
</script>

<style scoped>
/* 表单样式复用全局即可 */
</style>
