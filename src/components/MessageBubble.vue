<template>
  <div class="ant-message-container">
    <transition-group name="ant-move-up">
      <div
        v-for="item in messages"
        :key="item.id"
        :class="['ant-message-notice', `is-${item.type}`]"
      >
        <div class="ant-message-notice-content">
          <div class="ant-message-custom-content">
            <span class="anticon" :class="{ 'anticon-spin': item.type === 'loading' }">
              <component :is="iconMap[item.type]" />
            </span>
            <span class="text">{{ item.content }}</span>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import {
  CheckCircleFilled,
  InfoCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  LoadingOutlined
} from '@ant-design/icons-vue'

// 使用 shallowRef 包裹组件映射表
const iconMap = shallowRef({
  success: CheckCircleFilled,
  info: InfoCircleFilled,
  error: CloseCircleFilled,
  warning: ExclamationCircleFilled,
  loading: LoadingOutlined
})

const messages = ref([])
let seed = 0

const add = (config) => {
  const id = seed++
  const _msg = { id, ...config }
  messages.value.push(_msg)

  if (config.duration !== 0) {
    setTimeout(() => {
      remove(id)
    }, config.duration || 3000)
  }

  return () => remove(id)
}

const remove = (id) => {
  const index = messages.value.findIndex(m => m.id === id)
  if (index !== -1) messages.value.splice(index, 1)
}

defineExpose({ add })
</script>

<style scoped>
.ant-message-container {
  position: fixed;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1010;
  pointer-events: none;
}

.ant-message-notice {
  padding: 10px;
  text-align: center;
}

.ant-message-notice-content {
  display: inline-block;
  padding: 12px 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
              0 3px 6px -4px rgba(0, 0, 0, 0.12),
              0 9px 28px 8px rgba(0, 0, 0, 0.05);
  pointer-events: all;
}

.ant-message-custom-content {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
}

.anticon {
  margin-right: 12px;
  font-size: 20px;
  display: inline-flex;
  align-items: center;
}

/* 状态颜色 Ant Design 标准色 */
.is-success .anticon { color: #52c41a; }
.is-info .anticon    { color: #1677ff; }
.is-warning .anticon { color: #faad14; }
.is-error .anticon   { color: #ff4d4f; }
.is-loading .anticon { color: #1677ff; }

/* Loading 旋转动画 */
.anticon-spin {
  display: inline-block;
  animation: ant-spin 1s infinite linear;
}

@keyframes ant-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ant-move-up-enter-active,
.ant-move-up-leave-active {
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}
.ant-move-up-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}
.ant-move-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
