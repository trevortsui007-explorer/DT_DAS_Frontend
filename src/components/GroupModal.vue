<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 600px;">
        <div class="ant-modal-header">
          <span class="ant-modal-title">{{ isEdit ? '编辑配置组' : '新建配置组' }}</span>
          <span style="cursor:pointer; float:right;" @click="close">×</span>
        </div>
        <div class="ant-modal-body">
          <input type="hidden" v-model="formData.id" />

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-column">
              <div class="form-item">
                <label><span style="color:red;">*</span> 配置组名称</label>
                <input type="text" class="ant-input" v-model="formData.groupName" placeholder="请输入名称" />
              </div>

              <div class="form-item" style="margin-top:16px;">
                <label>组类别</label>
                <input type="text" class="ant-input" v-model="formData.groupCategory" placeholder="如：二厂" />
              </div>

              <div class="form-item" style="margin-top:16px;">
                <label>排序序号</label>
                <input type="number" class="ant-input" v-model="formData.sortOrder" />
              </div>
            </div>

            <div class="form-column">
              <div class="form-item">
                <label>组类型</label>
                <input type="text" class="ant-input" v-model="formData.groupType" placeholder="如：周期执行" />
              </div>

              <div class="form-item" style="margin-top:16px;">
                <label>状态</label>
                <label class="toggle-switch" style="display: block; margin-top: 8px;">
                  <input type="checkbox" v-model="formData.isEnabled" />
                  <span class="toggle-slider"></span>
                </label>
                <span style="font-size: 12px; color: #999;">{{ formData.isEnabled ? '当前已启用' : '当前已禁用' }}</span>
              </div>
            </div>
          </div>

          <div v-if="isEdit && associatedConfigs.length > 0" style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #e8e8e8;">
            <label style="display:block; margin-bottom: 8px; font-weight: bold; color: #555;">包含的配置项 ({{ associatedConfigs.length }})</label>
            <div class="config-tag-container">
              <span v-for="conf in associatedConfigs" :key="conf.Id" class="config-mini-tag">
                {{ conf.EqName || conf.eqName }}
              </span>
            </div>
          </div>
        </div>
        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" @click="close">取消</button>
          <button class="ant-btn ant-btn-primary" @click="save">保存配置组</button>
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
const associatedConfigs = ref([]) // 存储关联的配置列表

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
    // 获取关联的配置列表（从 mock 数据或接口里拿）
    associatedConfigs.value = data.AssociatedConfigs || []
  } else {
    formData.value = { id: null, groupName: '', groupCategory: '', groupType: '', sortOrder: 0, isEnabled: true }
    associatedConfigs.value = []
  }
  visible.value = true
}

function close() { visible.value = false }

async function save() {
  if (!formData.value.groupName.trim()) {
    alert('请填写配置组名称')
    return
  }
  const payload = {
    Id: formData.value.id,
    GroupName: formData.value.groupName,
    GroupCategory: formData.value.groupCategory,
    GroupType: formData.value.groupType,
    SortOrder: parseInt(formData.value.sortOrder) || 0,
    IsEnabled: formData.value.isEnabled
  }
  console.log('提交组数据：', payload)
  alert('保存成功！')
  close()
  emit('saved')
}

defineExpose({ open })
</script>

<style scoped>
.config-tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 100px;
  overflow-y: auto;
}
.config-mini-tag {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: #666;
}
/* 这里的样式会自动继承你全局定义的 ant-input, ant-btn 等 */
</style>
