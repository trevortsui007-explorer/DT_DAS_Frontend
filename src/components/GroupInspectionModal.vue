<template>
  <div v-if="visible" class="ant-modal-mask" @click="close"></div>

  <div v-if="visible" class="ant-modal-wrap" @click="close">
    <div class="group-inspection-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">配置组一键巡检</h3>
        <button type="button" class="modal-close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="group-switcher">
          <button class="nav-btn" :disabled="!canPrev" @click="changeGroup(-1)">&lt;</button>
          <div class="group-title">{{ currentGroupName }}</div>
          <button class="nav-btn" :disabled="!canNext" @click="changeGroup(1)">&gt;</button>
        </div>

        <div class="date-row">
          <label>巡检日期</label>
          <input v-model="selectedDate" class="date-input" type="date" />
          <button type="button" class="date-step-btn" @click="changeDate(-1)">前一天</button>
          <button type="button" class="date-step-btn" @click="changeDate(1)">后一天</button>
        </div>

        <div v-if="loading" class="state-placeholder">巡检中...</div>
        <div v-else-if="error" class="state-placeholder error">{{ error }}</div>
        <div v-else-if="items.length === 0" class="state-placeholder">暂无配置项</div>

        <div v-else class="result-grid">
          <div
            v-for="item in items"
            :key="item.configId || item.id || item.eqName"
            class="device-card"
            :class="item.isMissing ? 'missing' : 'normal'"
          >
            <div class="device-name">{{ item.eqName || item.EqName || '-' }}</div>
            <div class="device-path">{{ item.fullFilePath || item.FullFilePath || '-' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { fetchGroupInspection } from '@/api'

const props = defineProps({
  visible: Boolean,
  groups: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:visible'])

const loading = ref(false)
const error = ref('')
const items = ref([])
const currentIndex = ref(0)
const selectedDate = ref('')

const FTP_USER = 'et1'
const FTP_PASS = 'dt123456#'

const getToday = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const currentGroup = computed(() => props.groups[currentIndex.value] || null)
const currentGroupId = computed(() => currentGroup.value?.id ?? currentGroup.value?.Id ?? '')
const currentGroupName = computed(() =>
  currentGroup.value?.groupName || currentGroup.value?.GroupName || '当前配置组',
)
const canPrev = computed(() => currentIndex.value > 0)
const canNext = computed(() => currentIndex.value < props.groups.length - 1)

const close = () => emit('update:visible', false)

const changeGroup = (step) => {
  const nextIndex = currentIndex.value + step
  if (nextIndex < 0 || nextIndex >= props.groups.length) return
  currentIndex.value = nextIndex
}

const changeDate = (step) => {
  if (!selectedDate.value) selectedDate.value = getToday()

  const current = new Date(`${selectedDate.value}T00:00:00`)
  if (Number.isNaN(current.getTime())) return

  current.setDate(current.getDate() + step)
  const yyyy = current.getFullYear()
  const mm = String(current.getMonth() + 1).padStart(2, '0')
  const dd = String(current.getDate()).padStart(2, '0')
  selectedDate.value = `${yyyy}-${mm}-${dd}`
}

const loadInspection = async () => {
  if (!props.visible || !currentGroupId.value || !selectedDate.value) return

  loading.value = true
  error.value = ''
  items.value = []

  try {
    const res = await fetchGroupInspection({
      groupId: currentGroupId.value,
      date: selectedDate.value,
      user: FTP_USER,
      pass: FTP_PASS,
    })
    const data = res?.data ?? res
    items.value = data?.items || data?.Items || []
  } catch (err) {
    console.error('配置组巡检失败:', err)
    error.value = '配置组巡检失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    currentIndex.value = 0
    selectedDate.value = getToday()
    loadInspection()
  },
)

watch([currentIndex, selectedDate], loadInspection)
</script>

<style scoped>
.ant-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
}

.ant-modal-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.group-inspection-modal {
  width: min(760px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  color: #262626;
  font-size: 16px;
  font-weight: 600;
}

.modal-close-btn {
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

.modal-close-btn:hover {
  background: #f5f5f5;
  color: #262626;
}

.modal-body {
  max-height: calc(100vh - 130px);
  overflow-y: auto;
  padding: 24px;
}

.group-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}

.group-title {
  min-width: 220px;
  color: #262626;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.nav-btn:disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}

.date-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  color: #595959;
  font-size: 14px;
}

.date-input {
  height: 32px;
  padding: 4px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  color: #262626;
}

.date-step-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #52c41a;
  font-size: 14px;
  cursor: pointer;
}

.date-step-btn:hover {
  border-color: #52c41a;
  background: #f6ffed;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
}

.device-card {
  min-height: 92px;
  padding: 14px;
  border: 1px solid;
  border-radius: 8px;
  background: #fff;
}

.device-card.normal {
  border-color: #b7eb8f;
  background: #f6ffed;
}

.device-card.missing {
  border-color: #ffa39e;
  background: #fff1f0;
}

.device-name {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
  word-break: break-word;
}

.device-card.normal .device-name {
  color: #389e0d;
}

.device-card.missing .device-name {
  color: #cf1322;
}

.device-path {
  color: #595959;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.state-placeholder {
  padding: 32px;
  color: #8c8c8c;
  text-align: center;
}

.state-placeholder.error {
  color: #ff4d4f;
}
</style>
