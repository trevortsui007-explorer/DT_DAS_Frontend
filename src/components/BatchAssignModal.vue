<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal" style="width: 400px;">
        <div class="ant-modal-header">
          <span class="ant-modal-title">分配至配置组</span>
          <span style="cursor:pointer; float:right;" @click="close">×</span>
        </div>
        <div class="ant-modal-body" style="padding-top: 10px;">
          <p style="margin-bottom: 12px; margin-top: 8px; color: #666;">
            已选择 <strong style="color: #1677ff;">{{ targetItemIds.length }}</strong> 个配置项，请选择目标组：
          </p>
          <div class="group-list-selector">
            <div
              v-for="group in groups"
              :key="group.id"
              class="group-select-item"
              :class="{ active: selectedGroupId === group.id }"
              @click="selectedGroupId = group.id"
            >
              <span class="group-name">{{ group.groupName || group.GroupName }}</span>
              <span class="group-meta">{{ group.groupCategory || group.GroupCategory }}</span>
            </div>
          </div>
        </div>
        <div class="ant-modal-footer">
          <button class="ant-btn ant-btn-default" @click="close">取消</button>
          <button
            class="ant-btn ant-btn-primary"
            :disabled="!selectedGroupId"
            @click="handleConfirm"
          >确认分配</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['confirm'])
const visible = ref(false)
const groups = ref([])
const targetItemIds = ref([])
const selectedGroupId = ref(null)

// 打开弹窗：传入要分配的项ID列表，以及所有可选的组列表
function open(itemIds, allGroups) {
  targetItemIds.value = itemIds
  groups.value = allGroups
  selectedGroupId.value = null
  visible.value = true
}

function close() { visible.value = false }

function handleConfirm() {
  const payload = {
    groupId: selectedGroupId.value,
    configIds: targetItemIds.value
  }
  console.log('执行批量分配 API:', payload)
  emit('confirm', payload)
  close()
}

defineExpose({ open })
</script>

<style scoped>
.group-list-selector {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}
.group-select-item {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f9f9f9;
}
.group-select-item:hover { background: #f0f7ff; }
.group-select-item.active { background: #e6f7ff; border-left: 4px solid #1677ff; }
.group-name { font-weight: 500; }
.group-meta { font-size: 12px; color: #999; }

.ant-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

</style>
