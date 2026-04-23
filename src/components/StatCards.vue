<template>
  <div class="stat-row">
    <div
      v-for="card in cards"
      :key="card.tab"
      class="stat-card"
      :class="{ active: activeTab === card.tab }"
      @click="$emit('update:activeTab', card.tab)"
    >
      <div class="stat-title">{{ card.title }}</div>
      <div class="stat-value">{{ card.value }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: String,
  stats: Object
})

const cards = computed(() => [
  { tab: 'overview', title: '总览', value: 'Dashboard' },
  { tab: 'task', title: '任务数', value: props.stats?.tasks ?? '--' },
  { tab: 'group', title: '配置组数', value: props.stats?.groups ?? '--' },
  { tab: 'config', title: '配置数', value: props.stats?.configs ?? '--' },
  { tab: 'log', title: '日志中心', value: props.stats?.logs ?? 'Monitor' }
])

defineEmits(['update:activeTab'])
</script>
