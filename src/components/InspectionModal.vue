<template>
  <div v-if="visible" class="ant-modal-mask" @click="close"></div>

  <div v-if="visible" class="ant-modal-wrap" @click="close">
    <div class="ant-modal" :class="{ 'folder-mode': isFolderListMode }" @click.stop>
      <div class="ant-modal-header">
        <h3 class="ant-modal-title">{{ isFolderListMode ? '文件夹巡检详情' : '巡检日历详情' }}</h3>
        <button type="button" class="modal-close-btn" @click="close">x</button>
      </div>

      <div class="ant-modal-body">
        <div class="calendar-nav">
          <button class="nav-btn" @click="changeMonth(-1)">
            <span class="arrow">&lt;</span>
          </button>
          <div class="current-date-display">
            {{ year }} 年 {{ month < 10 ? '0' + month : month }} 月
          </div>
          <button class="nav-btn" @click="changeMonth(1)">
            <span class="arrow">&gt;</span>
          </button>
        </div>

        <template v-if="isFolderListMode">
          <div class="folder-path" :title="getField(data, 'folderPath', 'FolderPath')">
            {{ getField(data, 'folderPath', 'FolderPath') || '-' }}
          </div>

          <div class="folder-list">
            <div class="folder-list-head">
              <span>文件名</span>
              <span>修改时间</span>
              <span>大小</span>
              <span>操作</span>
            </div>

            <div v-if="folderFiles.length === 0" class="folder-empty">
              当前月份目录暂无匹配文件
            </div>

            <div
              v-for="file in folderFiles"
              :key="getField(file, 'fullPath', 'FullPath') || getField(file, 'fileName', 'FileName')"
              class="folder-file-row"
              :title="getField(file, 'fullPath', 'FullPath')"
            >
              <span class="file-name">{{ getField(file, 'fileName', 'FileName') || '-' }}</span>
              <span>{{ formatDateTime(getField(file, 'lastWriteTime', 'LastWriteTime')) }}</span>
              <span>{{ formatFileSize(getField(file, 'fileSize', 'FileSize')) }}</span>
              <button class="download-btn" type="button" @click="downloadInspectionFile(file)">下载</button>
            </div>
          </div>
        </template>

        <template v-else>
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
              :class="[day.status, { downloadable: day.canDownload }]"
              :title="day.date"
              @click="handleDayClick(day)"
            >
              <div class="day-inner">
                {{ day.day }}
              </div>
            </div>
          </div>

          <div v-if="selectedDayFiles.length > 0" class="day-file-panel">
            <div class="day-file-title">{{ selectedDayDate }} 文件列表</div>
            <div class="folder-list day-folder-list">
              <div class="folder-list-head">
                <span>文件名</span>
                <span>修改时间</span>
                <span>大小</span>
                <span>操作</span>
              </div>
              <div
                v-for="file in selectedDayFiles"
                :key="getField(file, 'fullPath', 'FullPath') || getField(file, 'fileName', 'FileName')"
                class="folder-file-row"
                :title="getField(file, 'fullPath', 'FullPath')"
              >
                <span class="file-name">{{ getField(file, 'fileName', 'FileName') || '-' }}</span>
                <span>{{ formatDateTime(getField(file, 'lastWriteTime', 'LastWriteTime')) }}</span>
                <span>{{ formatFileSize(getField(file, 'fileSize', 'FileSize')) }}</span>
                <button class="download-btn" type="button" @click="downloadInspectionFile(file)">下载</button>
              </div>
            </div>
          </div>

          <div class="calendar-footer-info">
            <div class="legend"><i class="dot normal"></i> 正常</div>
            <div class="legend"><i class="dot missing"></i> 缺失</div>
            <div class="legend"><i class="dot future"></i> 未开始</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import message from '@/components/index.js'
import { downloadFile } from '@/api'

const props = defineProps({
  visible: Boolean,
  data: Object
})

const emit = defineEmits(['update:visible', 'change'])

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const selectedDayDate = ref('')
const downloadUser = 'et1'
const downloadPass = 'dt123456#'

const close = () => emit('update:visible', false)

const getField = (source, camelKey, pascalKey) => {
  if (!source) return undefined
  return source[camelKey] ?? source[pascalKey]
}

const isFolderListMode = computed(() =>
  String(getField(props.data, 'discoveryMode', 'DiscoveryMode') || '').toLowerCase() === 'folder-list'
)

const discoveryFiles = computed(() => getField(props.data, 'files', 'Files') || [])

const changeMonth = (step) => {
  selectedDayDate.value = ''
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
  emit('change', { year: year.value, month: month.value })
}

const formatDate = (y, m, d) => {
  const mm = m < 10 ? `0${m}` : m
  const dd = d < 10 ? `0${d}` : d
  return `${y}-${mm}-${dd}`
}

const fileMap = computed(() => {
  const map = {}
  discoveryFiles.value.forEach(file => {
    const detectedDate = getField(file, 'detectedDate', 'DetectedDate')
    if (!detectedDate) return

    const dateKey = String(detectedDate).split('T')[0]
    if (!map[dateKey]) {
      map[dateKey] = {
        status: 'missing',
        files: []
      }
    }

    if (!getField(file, 'isMissing', 'IsMissing')) {
      map[dateKey].status = 'normal'
      map[dateKey].files.push(file)
    }
  })
  return map
})

const selectedDayFiles = computed(() => {
  if (!selectedDayDate.value) return []

  return (fileMap.value[selectedDayDate.value]?.files || [])
    .slice()
    .sort((a, b) => {
      const at = Date.parse(getField(a, 'lastWriteTime', 'LastWriteTime') || '') || 0
      const bt = Date.parse(getField(b, 'lastWriteTime', 'LastWriteTime') || '') || 0
      if (bt !== at) return bt - at
      return String(getField(a, 'fileName', 'FileName') || '')
        .localeCompare(String(getField(b, 'fileName', 'FileName') || ''))
    })
})

const folderFiles = computed(() => {
  return discoveryFiles.value
    .filter(file => !getField(file, 'isMissing', 'IsMissing'))
    .slice()
    .sort((a, b) => {
      const at = Date.parse(getField(a, 'lastWriteTime', 'LastWriteTime') || '') || 0
      const bt = Date.parse(getField(b, 'lastWriteTime', 'LastWriteTime') || '') || 0
      if (bt !== at) return bt - at
      return String(getField(a, 'fileName', 'FileName') || '')
        .localeCompare(String(getField(b, 'fileName', 'FileName') || ''))
    })
})

const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const downloadInspectionFile = async (file) => {
  const fullPath = getField(file, 'fullPath', 'FullPath')
  if (!fullPath) return

  const filename = getField(file, 'fileName', 'FileName') || fullPath.split(/[\\/]/).pop()
  const confirmed = await message.confirm({
    title: '下载文件',
    content: `是否下载 ${filename}？`,
    okText: '下载',
    cancelText: '取消',
  })
  if (!confirmed) return

  try {
    const blob = await downloadFile(fullPath, downloadUser, downloadPass)

    if (blob?.type?.includes('application/json')) {
      const text = await blob.text()
      const result = JSON.parse(text)
      throw new Error(result.info || result.message || '文件下载失败')
    }

    saveBlob(blob, filename)
    message.success('文件下载已开始')
  } catch (error) {
    console.error('文件下载失败:', error)
    message.error('文件下载失败')
  }
}

const handleDayClick = async (day) => {
  if (day.status !== 'normal') return
  selectedDayDate.value = selectedDayDate.value === day.date ? '' : day.date
}

const firstDayOffset = computed(() => {
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
})

const days = computed(() => {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalDays = new Date(year.value, month.value, 0).getDate()

  for (let i = 1; i <= totalDays; i++) {
    const dateStr = formatDate(year.value, month.value, i)
    const currentDate = new Date(year.value, month.value - 1, i)
    const record = fileMap.value[dateStr]

    let status = 'future'
    let file = null

    if (currentDate <= today) {
      status = record?.status || 'missing'
      file = record?.files?.[0] || null
    }

    result.push({
      day: i,
      date: dateStr,
      status,
      file,
      canDownload: status === 'normal' && Boolean(getField(file, 'fullPath', 'FullPath'))
    })
  }
  return result
})

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatFileSize = (value) => {
  const size = Number(value)
  if (!Number.isFinite(size) || size < 0) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

defineExpose({
  setPeriod: (y, m) => {
    year.value = y
    month.value = m
  }
})
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

.ant-modal {
  width: min(600px, calc(100vw - 48px));
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
}

.ant-modal.folder-mode {
  width: min(820px, calc(100vw - 48px));
}

.ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.ant-modal-title {
  margin: 0;
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

.ant-modal-body {
  padding: 24px;
}

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
  cursor: default;
}

.calendar-cell.downloadable {
  cursor: pointer;
}

.day-inner {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

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

.calendar-cell.downloadable:hover .day-inner {
  transform: scale(1.15);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

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

.folder-path {
  margin-bottom: 12px;
  color: #666;
  font-size: 12px;
  word-break: break-all;
}

.folder-list {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  max-height: min(520px, calc(100vh - 260px));
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

.folder-list-head,
.folder-file-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 150px 90px 72px;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.folder-list-head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fafafa;
  color: #595959;
  font-size: 12px;
  font-weight: 600;
}

.folder-file-row {
  min-height: 42px;
  border-top: 1px solid #f5f5f5;
  color: #333;
  font-size: 13px;
}

.folder-file-row:hover {
  background: #f6ffed;
}

.file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-empty {
  padding: 28px 12px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.download-btn {
  height: 28px;
  border: 1px solid #52c41a;
  border-radius: 4px;
  background: #fff;
  color: #52c41a;
  cursor: pointer;
}

.download-btn:hover {
  background: #f6ffed;
}

.day-file-panel {
  margin-top: 14px;
}

.day-file-title {
  margin-bottom: 8px;
  color: #262626;
  font-size: 13px;
  font-weight: 600;
}

.day-folder-list {
  max-height: min(220px, calc(100vh - 500px));
}

.day-folder-list .folder-list-head,
.day-folder-list .folder-file-row {
  grid-template-columns: minmax(180px, 1fr) 132px 72px 64px;
  gap: 8px;
  padding: 8px 10px;
}

.day-folder-list .folder-file-row {
  min-height: 38px;
}

.day-folder-list .folder-list-head span {
  text-align: center;
}

.day-folder-list .folder-file-row span:not(.file-name) {
  text-align: center;
}

.day-folder-list .download-btn {
  width: 56px;
  justify-self: center;
}
</style>
