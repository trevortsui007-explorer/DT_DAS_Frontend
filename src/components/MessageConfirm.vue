<template>
  <div v-if="visible" class="message-confirm-mask" @click="handleCancel"></div>

  <div v-if="visible" class="message-confirm-wrap" @click="handleCancel">
    <div class="message-confirm-modal" @click.stop>
      <div class="message-confirm-header">
        <span class="message-confirm-icon">
          <ExclamationCircleFilled />
        </span>
        <h3>{{ title }}</h3>
      </div>

      <div class="message-confirm-body">{{ content }}</div>

      <div class="message-confirm-footer">
        <button type="button" class="message-confirm-btn cancel" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button type="button" class="message-confirm-btn ok" @click="handleOk">
          {{ okText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ExclamationCircleFilled } from '@ant-design/icons-vue'

const visible = ref(false)
const title = ref('提示')
const content = ref('')
const okText = ref('确定')
const cancelText = ref('取消')

let resolveConfirm = null

const close = (result) => {
  visible.value = false
  if (resolveConfirm) {
    resolveConfirm(result)
    resolveConfirm = null
  }
}

const handleOk = () => close(true)
const handleCancel = () => close(false)

const confirm = (config) => {
  const options = typeof config === 'string' ? { content: config } : (config || {})

  title.value = options.title || '提示'
  content.value = options.content || ''
  okText.value = options.okText || '确定'
  cancelText.value = options.cancelText || '取消'
  visible.value = true

  return new Promise((resolve) => {
    resolveConfirm = resolve
  })
}

defineExpose({ confirm })
</script>

<style scoped>
.message-confirm-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.32);
  z-index: 1200;
}

.message-confirm-wrap {
  position: fixed;
  inset: 0;
  z-index: 1201;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.message-confirm-modal {
  width: min(420px, calc(100vw - 48px));
  overflow: hidden;
  border: 1px solid #e8f5df;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
}

.message-confirm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px 10px;
}

.message-confirm-icon {
  display: inline-flex;
  color: #52c41a;
  font-size: 20px;
}

.message-confirm-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
}

.message-confirm-body {
  padding: 6px 24px 22px 54px;
  color: #475569;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.message-confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 24px 18px;
  border-top: 1px solid #f0f0f0;
}

.message-confirm-btn {
  height: 32px;
  min-width: 72px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.message-confirm-btn.cancel {
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #475569;
}

.message-confirm-btn.cancel:hover {
  border-color: #52c41a;
  color: #52c41a;
}

.message-confirm-btn.ok {
  border: 1px solid #52c41a;
  background: #52c41a;
  color: #fff;
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.25);
}

.message-confirm-btn.ok:hover {
  border-color: #3fad0f;
  background: #3fad0f;
}
</style>
