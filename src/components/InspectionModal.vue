<template>
  <div
    v-if="visible"
    class="ant-modal-mask"
    @click="close"
  ></div>

  <div
    v-if="visible"
    class="ant-modal-wrap"
    @click="close"
  >
    <div class="ant-modal" style="width: 500px;" @click.stop>

      <div class="ant-modal-header">
        <h3 class="ant-modal-title">巡检日历详情</h3>
      </div>

      <div class="ant-modal-body">

        <div class="calendar-nav">
          <button class="nav-btn" @click="changeMonth(-1)">
            <span class="arrow">&lt;</span>
          </button>
          <div class="current-date-display">
            {{ year }}年 {{ month < 10 ? '0' + month : month }}月
          </div>
          <button class="nav-btn" @click="changeMonth(1)">
            <span class="arrow">&gt;</span>
          </button>
        </div>

        <div class="week-header">
          <div v-for="w in ['一', '二', '三', '四', '五', '六', '日']" :key="w" class="week-cell">
            {{ w }}
          </div>
        </div>

        <div class="calendar-grid">
          <div
            v-for="empty in firstDayOffset"
            :key="'empty-' + empty"
            class="calendar-cell empty"
          ></div>

          <div
            v-for="day in days"
            :key="day.date"
            class="calendar-cell"
            :class="day.status"
            :title="day.date"
          >
            <div class="day-inner">
              {{ day.day }}
            </div>
          </div>
        </div>

        <div class="calendar-footer-info">
          <div class="legend"><i class="dot normal"></i> 正常</div>
          <div class="legend"><i class="dot missing"></i> 缺失</div>
          <div class="legend"><i class="dot future"></i> 未开始</div>
        </div>
      </div>

      <div class="ant-modal-footer">
        <button class="ant-btn" @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  data: Object // 接收父组件传入的当前月份巡检数据
})

const emit = defineEmits(['update:visible', 'change'])

// 响应式状态：当前查看的年、月
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

// 关闭弹窗
const close = () => emit('update:visible', false)

// 切换月份
const changeMonth = (step) => {
  let newMonth = month.value + step
  if (newMonth > 12) {
    year.value++
    month.value = 1
  } else if (newMonth < 1) {
    year.value--
    month.value = 12
  } else {
    month.value = newMonth
  }
  // 触发 change 事件，通知父组件重新 fetch 数据
  emit('change', { year: year.value, month: month.value })
}

// 辅助：日期格式化 (YYYY-MM-DD)，用于匹配 fileMap
const formatDate = (y, m, d) => {
  const mm = m < 10 ? `0${m}` : m
  const dd = d < 10 ? `0${d}` : d
  return `${y}-${mm}-${dd}`
}

// 构造 map：将 API 数据转化为 date -> status 映射
const fileMap = computed(() => {
  const map = {}
  props.data?.files?.forEach(f => {
    // 假设 detectedDate 是 "2026-01-01T00:00:00"
    const d = f.detectedDate.split('T')[0]
    map[d] = f.isMissing ? 'missing' : 'normal'
  })
  return map
})

// 计算每月 1 号是星期几（用于计算日历起始位移）
const firstDayOffset = computed(() => {
  // getDay() 0是周日，1-6是周一至周六
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1 // 转换为周一开始排列
})

// 生成当前月的日期数组
const days = computed(() => {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 获取当月总天数
  const totalDays = new Date(year.value, month.value, 0).getDate()

  for (let i = 1; i <= totalDays; i++) {
    const dateStr = formatDate(year.value, month.value, i)
    const currentDate = new Date(year.value, month.value - 1, i)

    let status = 'future'
    if (currentDate <= today) {
      // 如果 fileMap 里没找到，默认视为缺失
      status = fileMap.value[dateStr] || 'missing'
    }

    result.push({
      day: i,
      date: dateStr,
      status
    })
  }
  return result
})

// 对外暴露方法，允许父组件打开时重置年份
defineExpose({
  setPeriod: (y, m) => {
    year.value = y
    month.value = m
  }
})
</script>

<style scoped>
/* 弹窗基础布局 */
.ant-modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
}

.ant-modal-wrap {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.ant-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
}

/* Header & Footer */
.ant-modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.ant-modal-title { margin: 0; font-size: 16px; font-weight: 600; }
.ant-modal-body { padding: 24px; }
.ant-modal-footer {
  padding: 10px 16px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
}

/* 月份切换导航 */
.calendar-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}
.current-date-display {
  font-size: 18px;
  font-weight: bold;
  color: #262626;
  min-width: 140px;
  text-align: center;
}
.nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.nav-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 星期表头 */
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}
.week-cell {
  text-align: center;
  color: #8c8c8c;
  font-size: 14px;
  padding: 8px 0;
}

/* 日历网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px 8px;
}

.calendar-cell {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.day-inner {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* 圆形关键代码 */
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 状态样式 */
.calendar-cell.normal .day-inner {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.calendar-cell.missing .day-inner {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}

.calendar-cell.future .day-inner {
  background: #fafafa;
  color: #bfbfbf;
  border: 1px solid #f0f0f0;
}

.calendar-cell:not(.empty):hover .day-inner {
  transform: scale(1.15);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

/* 底部图例 */
.calendar-footer-info {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
.legend {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #595959;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.dot.normal { background: #52c41a; }
.dot.missing { background: #ff4d4f; }
.dot.future { background: #d9d9d9; }

/* 基础按钮样式 */
.ant-btn {
  padding: 4px 15px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
}
.ant-btn:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}
</style>
