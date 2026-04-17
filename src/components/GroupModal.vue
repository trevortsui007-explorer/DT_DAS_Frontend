<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>

    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 640px">
        <!-- Header -->
        <div class="ant-modal-header">
          <span class="ant-modal-title">
            {{ isEdit ? '编辑配置组' : '新建配置组' }}
          </span>
          <span class="close-btn" @click="close">×</span>
        </div>

        <!-- Body -->
        <div class="ant-modal-body scrollable-body">
          <input type="hidden" v-model="formData.id" />

          <!-- 基础信息 -->
          <div class="form-item">
            <label class="required">配置组名称</label>
            <input class="ant-input" v-model="formData.groupName" />
          </div>

          <div class="form-item">
            <label>组类别</label>
            <input class="ant-input" v-model="formData.groupCategory" />
          </div>

          <div class="form-item">
            <label>组类型</label>
            <input class="ant-input" v-model="formData.groupType" />
          </div>

          <div class="form-item">
            <label>排序</label>
            <input type="number" class="ant-input" v-model="formData.sortOrder" />
          </div>

          <!-- 状态 -->
          <div class="form-item inline-flex">
            <label>启用状态</label>
            <label class="toggle-switch">
              <input type="checkbox" v-model="formData.isEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- 配置项选择 -->
          <div class="form-item">
            <div class="label-with-extra">
              <label>关联配置项</label>
            </div>

            <div class="config-selector-wrapper">
              <!-- 顶部工具栏 -->
              <div class="config-toolbar">
                <input
                  v-model="searchKeyword"
                  class="search-input"
                  placeholder="搜索配置项名称..."
                />

                <div class="select-actions">
                  <label class="select-all-box" @click="toggleSelectAll">
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      :indeterminate="isIndeterminate"
                    />
                    <span>
                      {{ isAllSelected ? '取消全选' : isIndeterminate ? '部分已选' : '全选' }}
                    </span>
                  </label>

                  <span class="selected-count"> 已选 {{ formData.configIds.length }} 项 </span>
                </div>
              </div>

              <!-- 配置列表 -->
              <div class="config-select-grid">
                <div
                  v-for="conf in filteredConfigs"
                  :key="conf.eqName || conf.EqName"
                  class="config-checkbox-card"
                  :class="{
                    'is-checked': formData.configIds.includes(conf.eqName || conf.EqName),
                  }"
                  @click="toggleConfig(conf.eqName || conf.EqName)"
                >
                  <div class="checkbox-status">
                    <div class="inner-dot"></div>
                  </div>

                  <div class="config-card-name">
                    {{ conf.eqName || conf.EqName }}
                  </div>
                </div>

                <div v-if="filteredConfigs.length === 0" class="empty-inline">暂无匹配项</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" @click="close">取消</button>
          <button class="ant-btn ant-btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import message from '@/components/index.js'

const emit = defineEmits(['saved'])

const visible = ref(false)
const isEdit = ref(false)
const searchKeyword = ref('')

const allConfigs = ref([])

const formData = ref({
  id: null,
  groupName: '',
  groupCategory: '',
  groupType: '',
  sortOrder: 0,
  isEnabled: true,
  configIds: [],
})

const filteredConfigs = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) return allConfigs.value

  return allConfigs.value.filter((conf) =>
    (conf.eqName || conf.EqName || '').toLowerCase().includes(keyword),
  )
})

const isAllSelected = computed(() => {
  return (
    filteredConfigs.value.length > 0 &&
    filteredConfigs.value.every((conf) =>
      formData.value.configIds.includes(conf.eqName || conf.EqName),
    )
  )
})

const isIndeterminate = computed(() => {
  const selectedCount = filteredConfigs.value.filter((conf) =>
    formData.value.configIds.includes(conf.eqName || conf.EqName),
  ).length

  return selectedCount > 0 && selectedCount < filteredConfigs.value.length
})

const toggleSelectAll = () => {
  const visibleIds = filteredConfigs.value.map((conf) => conf.eqName || conf.EqName)

  if (isAllSelected.value) {
    formData.value.configIds = formData.value.configIds.filter((id) => !visibleIds.includes(id))
  } else {
    const merged = new Set([...formData.value.configIds, ...visibleIds])

    formData.value.configIds = [...merged]
  }
}

/* ========================
   选择配置项
======================== */
const toggleConfig = (id) => {
  const index = formData.value.configIds.indexOf(id)
  if (index > -1) {
    formData.value.configIds.splice(index, 1)
  } else {
    formData.value.configIds.push(id)
  }
}

/* ========================
   打开弹窗
======================== */
function open(edit = false, data = null, configs = []) {
  isEdit.value = edit
  allConfigs.value = configs

  if (edit && data) {
    formData.value = {
      id: data.id || data.Id || null,
      groupName: data.groupName || data.GroupName || '',
      groupCategory: data.groupCategory || data.GroupCategory || '',
      groupType: data.groupType || data.GroupType || '',
      sortOrder: data.sortOrder ?? data.SortOrder ?? 0,
      isEnabled: data.isEnabled ?? data.IsEnabled ?? true,

      // 回显
      configIds: (data.associatedConfigs || []).map((c) => c.eqName || c.EqName),
    }
  } else {
    formData.value = {
      id: null,
      groupName: '',
      groupCategory: '',
      groupType: '',
      sortOrder: 0,
      isEnabled: true,
      configIds: [],
    }
  }

  visible.value = true
}

/* ========================
   保存
======================== */
function save() {
  if (!formData.value.groupName.trim()) {
    message('请输入配置组名称')
    return
  }

  const payload = {
    Id: formData.value.id,
    GroupName: formData.value.groupName,
    GroupCategory: formData.value.groupCategory,
    GroupType: formData.value.groupType,
    SortOrder: Number(formData.value.sortOrder) || 0,
    IsEnabled: formData.value.isEnabled,

    // 关键：关联配置
    ConfigIds: formData.value.configIds,
  }

  console.log('提交数据:', payload)

  close()
  emit('saved')
}

function close() {
  visible.value = false
}

defineExpose({ open })
</script>

<style scoped>
.ant-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ant-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.scrollable-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px;
}

.form-item {
  margin-bottom: 18px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.required::before {
  content: '*';
  color: red;
  margin-right: 4px;
}

.inline-flex {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== 配置选择（Task同款） ===== */

.label-with-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.extra-info {
  font-size: 12px;
  color: #52c41a;
}

.config-select-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
  max-height: 220px;
  overflow-y: auto;
}

.config-checkbox-card {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.config-checkbox-card:hover {
  border-color: #52c41a;
  background: #f6ffed;
}

.config-checkbox-card.is-checked {
  border-color: #52c41a;
  background: #f6ffed;
}

.checkbox-status {
  width: 16px;
  height: 16px;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.is-checked .checkbox-status {
  background: #52c41a;
  border-color: #52c41a;
}

.config-card-name {
  font-size: 13px;
}

.empty-inline {
  grid-column: span 2;
  text-align: center;
  color: #999;
  padding: 20px;
}

.close-btn {
  font-size: 20px;
  cursor: pointer;
}

.config-selector-wrapper {
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
  padding: 12px;
}

.config-toolbar {
  margin-bottom: 12px;
}

.search-input {
  width: 95%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  margin-bottom: 10px;
}

.select-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-all-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.selected-count {
  font-size: 12px;
  color: #52c41a;
}
</style>
