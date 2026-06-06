<template>
  <div>
    <div class="ant-drawer-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-drawer-content-wrapper" :class="{ active: visible }">
      <div class="ant-drawer-header">
        <span class="ant-drawer-title">{{ title }}</span>
        <button type="button" class="drawer-close-btn" @click="close">×</button>
      </div>
      <div class="ant-drawer-body">
        <pre v-if="detailData" style="white-space: pre-wrap; word-break: break-all;">{{ formattedData }}</pre>
        <p v-else style="color:#999; text-align:center;">暂无详情数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const visible = ref(false)
const title = ref('详情')
const detailData = ref(null)

function open(t, data) {
  title.value = t || '详情'
  detailData.value = data
  visible.value = true
}

function close() {
  visible.value = false
}

const formattedData = computed(() => {
  if (!detailData.value) return ''
  return JSON.stringify(detailData.value, null, 2)
})

defineExpose({ open })
</script>

<style scoped>
.ant-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-close-btn {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #8c8c8c;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.drawer-close-btn:hover {
  background: #f5f5f5;
  color: #262626;
}
</style>
