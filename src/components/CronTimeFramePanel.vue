<template>
  <section class="cron-frame">
    <div class="cron-frame__header">
      <div>
        <h4 class="cron-frame__title">Cron 时间流动图</h4>
        <p class="cron-frame__subtitle">过去 / 现在 / 将来（Cron计划）</p>
      </div>
      <span class="cron-frame__now">Now {{ nowLabel }}</span>
    </div>

    <div class="segment-labels">
      <span class="past">过去</span>
      <span class="now">现在</span>
      <span class="future">将来（Cron）</span>
    </div>

    <div class="cron-frame__body" :style="{ maxHeight: `${maxHeight}px` }">
      <div v-if="loading" class="state-text">时间流数据加载中...</div>
      <div v-else-if="error" class="state-text state-text--error">{{ error }}</div>
      <div v-else-if="items.length === 0" class="state-text">暂无可展示的 Cron 任务</div>

      <div v-else class="lane-list">
        <article
          v-for="(item, index) in items"
          :key="item.id ?? `${item.taskName}-${index}`"
          class="lane-row"
        >
          <div class="lane-meta">
            <div class="lane-meta__top">
              <div class="lane-name" :title="item.taskName">{{ item.taskName }}</div>
              <span :class="['lane-state', item.isEnabled ? 'running' : 'idle']">
                {{ item.isEnabled ? 'Running' : 'Idle' }}
              </span>
            </div>
            <div class="lane-cron" :title="item.cronExpression">{{ item.cronExpression }}</div>
          </div>

          <div class="lane-track">
            <div class="track-bg">
              <div class="track-bg__past"></div>
              <div class="track-bg__future"></div>
            </div>
            <div class="track-line"></div>

            <div class="track-now" :style="{ left: `${safePosition(nowPosition)}%` }">
              <div v-if="index === 0" class="track-now__tag">{{ nowLabel }}</div>
            </div>

            <div
              v-for="(point, pointIndex) in item.pastPoints || []"
              :key="`past-${item.id}-${pointIndex}`"
              class="track-dot track-dot--past"
              :style="{ left: `${safePosition(point.pos)}%` }"
            >
              <span class="track-dot__time">{{ point.time }}</span>
            </div>

            <div
              v-if="item.nextPoint"
              class="track-dot track-dot--future"
              :style="{ left: `${safePosition(item.nextPoint.pos)}%` }"
            >
              <span class="track-dot__time track-dot__time--future">{{ item.nextPoint.time }}</span>
            </div>

            <div v-if="item.parseError" class="track-error">Cron 解析失败</div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getDayProgressPercent } from '../utils/cronTimeline'

defineOptions({
  name: 'CronTimeFramePanel',
})

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  error: {
    type: String,
    default: '',
  },
  maxHeight: {
    type: Number,
    default: 200,
  },
})

const now = ref(new Date())
let timer = null

const nowLabel = computed(() => {
  const hour = String(now.value.getHours()).padStart(2, '0')
  const minute = String(now.value.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
})

const nowPosition = computed(() => getDayProgressPercent(now.value))

const safePosition = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return 0
  return Math.min(98, Math.max(2, num))
}

onMounted(() => {
  now.value = new Date()
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.cron-frame {
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.cron-frame__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.cron-frame__title {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.cron-frame__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.cron-frame__now {
  flex-shrink: 0;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 600;
}

.segment-labels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #64748b;
}

.segment-labels .past {
  text-align: left;
}

.segment-labels .now {
  text-align: center;
  color: #1677ff;
  font-weight: 600;
}

.segment-labels .future {
  text-align: right;
  color: #52c41a;
}

.cron-frame__body {
  overflow-y: auto;
  padding-right: 4px;
}

.lane-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lane-row {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 12px;
  align-items: center;
}

.lane-meta {
  min-width: 0;
}

.lane-meta__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lane-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lane-state {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.lane-state.running {
  color: #0f9b47;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.lane-state.idle {
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.lane-cron {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lane-track {
  position: relative;
  height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  overflow: hidden;
}

.track-bg {
  position: absolute;
  inset: 0;
}

.track-bg__past,
.track-bg__future {
  position: absolute;
  top: 0;
  bottom: 0;
}

.track-bg__past {
  left: 0;
  width: 50%;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0.03));
}

.track-bg__future {
  right: 0;
  width: 50%;
  background: linear-gradient(90deg, rgba(82, 196, 26, 0.03), rgba(82, 196, 26, 0.1));
}

.track-line {
  position: absolute;
  top: 50%;
  left: 10px;
  right: 10px;
  border-top: 2px dashed #d1d5db;
  transform: translateY(-50%);
}

.track-now {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #1677ff;
  transform: translateX(-1px);
}

.track-now__tag {
  position: absolute;
  top: -2px;
  left: 6px;
  transform: translateY(-100%);
  background: #1677ff;
  color: #ffffff;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
}

.track-dot {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.track-dot--past {
  background: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.2);
}

.track-dot--future {
  background: #52c41a;
  box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.16);
}

.track-dot__time {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}

.track-dot__time--future {
  color: #15803d;
  font-weight: 600;
}

.track-error {
  position: absolute;
  right: 8px;
  bottom: 4px;
  font-size: 11px;
  color: #d97706;
}

.state-text {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  padding: 32px 8px;
}

.state-text--error {
  color: #ef4444;
}

@media (max-width: 1280px) {
  .lane-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
