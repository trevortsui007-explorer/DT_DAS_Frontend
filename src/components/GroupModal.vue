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
            <label>厂别归属</label>
            <input class="ant-input" v-model="formData.groupCategory" />
          </div>

          <div class="form-item">
            <label>采集周期类型</label>
            <input class="ant-input" v-model="formData.groupType" />
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
                  :key="getConfigId(conf)"
                  class="config-checkbox-card"
                  :class="{
                    'is-checked': formData.configIds.includes(getConfigId(conf)),
                  }"
                  @click="toggleConfig(getConfigId(conf))"
                >
                  <div class="checkbox-status">
                    <div class="inner-dot"></div>
                  </div>

                  <div class="config-card-name">
                    {{ getConfigName(conf) }}
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
          <button class="ant-btn ant-btn-primary" :disabled="saving" @click="save">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import message from '@/components/index.js'
import * as api from '@/api'

const emit = defineEmits(['saved'])

const visible = ref(false)
const isEdit = ref(false)
const searchKeyword = ref('')
const saving = ref(false)

const allConfigs = ref([])
const originalConfigIds = ref([])

const formData = ref({
  id: null,
  groupName: '',
  groupCategory: '',
  groupType: '',
  isEnabled: true,
  configIds: [],
})

const getConfigId = (conf) => String(conf?.id ?? conf?.Id ?? '')
const getConfigName = (conf) => conf?.eqName || conf?.EqName || conf?.name || conf?.Name || '未命名配置'
const getAssociatedConfigId = (conf) => String(conf?.id ?? conf?.Id ?? conf?.configId ?? conf?.ConfigId ?? '')

const unwrapResult = (res) => res?.data ?? res
const assertSuccess = (res) => {
  const result = unwrapResult(res)

  if (result?.code !== undefined && result.code !== 1) {
    throw new Error(result.info || result.message || '保存失败')
  }

  return result
}

const filteredConfigs = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()

  if (!keyword) return allConfigs.value

  return allConfigs.value.filter((conf) =>
    getConfigName(conf).toLowerCase().includes(keyword),
  )
})

const isAllSelected = computed(() => {
  return (
    filteredConfigs.value.length > 0 &&
    filteredConfigs.value.every((conf) =>
      formData.value.configIds.includes(getConfigId(conf)),
    )
  )
})

const isIndeterminate = computed(() => {
  const selectedCount = filteredConfigs.value.filter((conf) =>
    formData.value.configIds.includes(getConfigId(conf)),
  ).length

  return selectedCount > 0 && selectedCount < filteredConfigs.value.length
})

const toggleSelectAll = () => {
  const visibleIds = filteredConfigs.value.map(getConfigId).filter(Boolean)

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
  if (!id) return

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
  searchKeyword.value = ''

  if (edit && data) {
    const associatedConfigs = data.associatedConfigs || data.AssociatedConfigs || []
    const selectedIds = associatedConfigs.length
      ? associatedConfigs.map(getAssociatedConfigId).filter(Boolean)
      : (data.configIds || data.ConfigIds || []).map((id) => String(id)).filter(Boolean)

    originalConfigIds.value = [...selectedIds]
    formData.value = {
      id: data.id || data.Id || null,
      groupName: data.groupName || data.GroupName || '',
      groupCategory: data.groupCategory || data.GroupCategory || '',
      groupType: data.groupType || data.GroupType || '',
      isEnabled: data.isEnabled ?? data.IsEnabled ?? true,

      // 回显
      configIds: selectedIds,
    }
  } else {
    originalConfigIds.value = []
    formData.value = {
      id: null,
      groupName: '',
      groupCategory: '',
      groupType: '',
      isEnabled: true,
      configIds: [],
    }
  }

  visible.value = true
}

/* ========================
   保存
======================== */
async function save() {
  if (!formData.value.groupName.trim()) {
    message('请输入配置组名称')
    return
  }

  saving.value = true

  const payload = {
    Id: formData.value.id,
    GroupName: formData.value.groupName,
    GroupCategory: formData.value.groupCategory,
    GroupType: formData.value.groupType,
    IsEnabled: formData.value.isEnabled,
  }

  try {
    let groupId = formData.value.id

    if (isEdit.value) {
      assertSuccess(await api.updateGroup(groupId, payload))
    } else {
      const result = assertSuccess(await api.createGroup(payload))
      groupId = result?.data ?? result?.Data ?? result
    }

    const selectedIds = [...new Set(formData.value.configIds.filter(Boolean))]
    const oldIds = [...new Set(originalConfigIds.value.filter(Boolean))]
    const idsToAdd = selectedIds.filter((id) => !oldIds.includes(id))
    const idsToRemove = oldIds.filter((id) => !selectedIds.includes(id))

    if (idsToRemove.length > 0) {
      assertSuccess(await api.removeConfigsFromGroup(groupId, idsToRemove))
    }

    if (idsToAdd.length > 0) {
      assertSuccess(await api.bindConfigsToGroup(groupId, idsToAdd))
    }

    message.success('配置组保存成功')
    close()
    emit('saved')
  } catch (error) {
    console.error('配置组保存失败:', error)
    message.error(error.message || '配置组保存失败')
  } finally {
    saving.value = false
  }
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
