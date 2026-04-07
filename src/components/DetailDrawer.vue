<template>
  <div>
    <div class="ant-drawer-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-drawer-content-wrapper" :class="{ active: visible }">
      <div class="ant-drawer-header">
        <span class="ant-drawer-title">{{ title }}</span>
        <span style="cursor:pointer; float:right;" @click="close">×</span>
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
/* 抽屉样式全局已提供，无需额外添加 */
</style>
