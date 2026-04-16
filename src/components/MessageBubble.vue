<template>
  <div class="bubble-container">
    <transition-group name="bubble-fade">
      <div v-for="item in messages" :key="item.id" :class="['bubble-item', `is-${item.type}`]">
        <span class="icon"></span> <span class="text">{{ item.content }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const messages = ref([])
let seed = 0

// 暴露给外部调用的增加方法
const add = (config) => {
  const id = seed++
  const _msg = { id, ...config }
  messages.value.push(_msg)

  // 自动销毁逻辑
  setTimeout(() => {
    remove(id)
  }, config.duration || 3000)
}

const remove = (id) => {
  messages.value = messages.value.filter((m) => m.id !== id)
}

// 暴露方法给外部
defineExpose({ add })
</script>

<style scoped>
.bubble-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bubble-item {
  margin-bottom: 12px;
  padding: 8px 16px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  /* 这里可以根据 type 设置不同的 border 或 color */
}

/* Vue 动画 */
.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: all 0.3s ease;
}
.bubble-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.bubble-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
