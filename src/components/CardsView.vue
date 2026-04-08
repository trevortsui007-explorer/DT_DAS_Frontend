<template>
  <div class="cards-view">
    <div v-if="loading" class="loading-placeholder">加载中...</div>
    <div v-else-if="error" class="error-placeholder">{{ error }}</div>
    <div v-else-if="items.length === 0" class="empty-placeholder">暂无数据</div>

    <div v-else class="config-grid" ref="gridRef" @mousedown="onMouseDown">

      <div
        v-if="isSelecting"
        class="selection-box"
        :style="{ left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: box.height + 'px' }"
      ></div>

      <template v-if="type === 'group'">
        <div v-for="group in items" :key="group.id"
             class="config-card"
             :class="{
               'preview-toggle': previewIds.has(group.id || group.Id),
               'selected': selectedIds.has(group.id || group.Id)
             }"
             :data-id="group.id || group.Id"
             @click="handleCardClick(group, 'group')">

          <div class="card-header">
            <h4 class="clickable-title" @click.stop="viewDetail(group)">{{ group.groupName || group.GroupName || `配置组 ${group.id}` }}</h4>
            <span :style="{ color: group.isEnabled ?? group.IsEnabled ? '#52c41a' : '#ff4d4f', fontSize: '12px' }">
              ● {{ group.isEnabled ?? group.IsEnabled ? '启用' : '禁用' }}
            </span>
          </div>
          <div class="card-body">
            <p>类别：{{ group.groupCategory || group.GroupCategory || '-' }}</p>
            <p>类型：{{ group.groupType || group.GroupType || '-' }}</p>
            <p>关联配置数：{{ group.configCount || group.ConfigCount || 0 }}</p>
          </div>
          <div class="card-actions" @click.stop>
            <a @click="viewDetail(group)">详情 →</a>
            <a @click="editGroup(group)">编辑组</a>
          </div>

          <div class="hover-detail">
            <div class="hover-detail-content">
              <div><strong>排序序号：</strong>{{ group.sortOrder ?? group.SortOrder ?? '-' }}</div>
              <div>
                <strong>包含配置项：</strong>
                <template v-if="group.AssociatedConfigs && group.AssociatedConfigs.length">
                  {{ group.AssociatedConfigs.map(c => c.EqName || c.eqName).join(', ') }}
                </template>
                <template v-else>
                  <span style="color: #999;">暂无关联配置</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="type === 'config'">
        <div v-for="config in items" :key="config.id"
             class="config-card"
             :class="{
               'preview-toggle': previewIds.has(config.id || config.Id),
               'selected': selectedIds.has(config.id || config.Id)
             }"
             :data-id="config.id || config.Id"
             @click="handleCardClick(config, 'config')">
          <div class="card-header">
            <h4 class="clickable-title" @click.stop="viewDetail(config)">{{ config.EqName || config.eqName || '未命名设备' }}</h4>
            <span :style="{ color: (config.IsEnabled ?? config.isEnabled) ? '#52c41a' : '#ff4d4f', fontSize: '12px' }">
              ● {{ (config.IsEnabled ?? config.isEnabled) ? '运行中' : '已禁用' }}
            </span>
          </div>
          <div class="card-body">
            <p>表名：{{ config.TableName || config.tableName || '-' }}</p>
            <p>类型：<span class="ant-tag">{{ config.FileType || config.fileType || 'csv' }}</span></p>
          </div>
          <div class="card-actions" @click.stop>
            <a @click="viewDetail(config)">详情 →</a>
            <a @click="editConfig(config)">编辑配置</a>
          </div>

          <div class="hover-detail">
            <div class="hover-detail-content">
              <div><strong>文件路径规则：</strong>{{ config.FilePathPattern || config.filePathPattern || '-' }}</div>
              <div><strong>文件名规则：</strong>{{ config.FileNamePattern || config.fileNamePattern || '-' }}</div>
              <div><strong>扩展字段：</strong>{{ config.ExtFields || config.extFields || '-' }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
  items: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['view-detail', 'edit-config', 'edit-group', 'selection-change'])

// ================= 状态管理 =================
const gridRef = ref(null)
const isSelecting = ref(false)
const hasDragged = ref(false)
const box = ref({ left: 0, top: 0, width: 0, height: 0 })
let startPos = { x: 0, y: 0 }

const selectedIds = ref(new Set())
const previewIds = ref(new Set())
const formatId = (id) => isNaN(Number(id)) ? id : Number(id)

watch(() => props.items, () => {
  selectedIds.value.clear()
  emit('selection-change', [])
})

// ================= 交互逻辑 =================

const handleCardClick = (item, typeStr) => {
  if (hasDragged.value) return

  const id = formatId(item.id || item.Id)

  // 如果点击时按住了 Ctrl 键，或者该卡片已经被选中，则切换选中状态
  // 否则执行默认的编辑/详情跳转
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
    emit('selection-change', Array.from(selectedIds.value))
  } else {
    if (typeStr === 'group') emit('edit-group', item)
    else emit('edit-config', item)
  }
}

const onMouseDown = (e) => {
  if (e.target.tagName === 'A' || e.target.closest('.card-actions')) return

  isSelecting.value = true
  hasDragged.value = false
  previewIds.value.clear()

  const rect = gridRef.value.getBoundingClientRect()
  // 考虑滚动条偏移
  startPos.x = e.clientX - rect.left
  startPos.y = e.clientY - rect.top

  box.value = { left: startPos.x, top: startPos.y, width: 0, height: 0 }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e) => {
  if (!isSelecting.value) return

  const rect = gridRef.value.getBoundingClientRect()
  const currentX = e.clientX - rect.left
  const currentY = e.clientY - rect.top

  box.value.left = Math.min(startPos.x, currentX)
  box.value.top = Math.min(startPos.y, currentY)
  box.value.width = Math.abs(currentX - startPos.x)
  box.value.height = Math.abs(currentY - startPos.y)

  if (box.value.width > 5 || box.value.height > 5) {
    hasDragged.value = true
  }

  // 碰撞检测
  const cards = gridRef.value.querySelectorAll('.config-card')
  previewIds.value.clear()

  cards.forEach(card => {
    // 使用 getBoundingClientRect 进行更精确的屏幕坐标碰撞检测
    const cRect = card.getBoundingClientRect()
    const containerRect = gridRef.value.getBoundingClientRect()

    const l = cRect.left - containerRect.left
    const t = cRect.top - containerRect.top
    const r = l + cRect.width
    const b = t + cRect.height

    const isOverlapped = !(r < box.value.left || l > box.value.left + box.value.width ||
      b < box.value.top || t > box.value.top + box.value.height)

    if (isOverlapped) {
      const id = card.getAttribute('data-id')
      if (id) previewIds.value.add(formatId(id))
    }
  })
}

const onMouseUp = () => {
  isSelecting.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)

  if (!hasDragged.value) return

  // 合并预览到选中
  previewIds.value.forEach(id => {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  })
  previewIds.value.clear()
  // 通知父组件
  emit('selection-change', Array.from(selectedIds.value))
}
</script>

<style scoped>
.cards-view { width: 100%; }
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  position: relative; /* 为 selection-box 定位 */
  user-select: none;  /* 拖拽时防文字选中 */
}

/* ================= 框选工具样式 ================= */
.selection-box {
  position: absolute;
  border: 1px dashed #52c41a;
  background-color: rgba(82, 196, 26, 0.15);
  z-index: 999;
  pointer-events: none;
}

/* 卡片基础样式 */
.config-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 碰到的预览样式 */
.config-card.preview-toggle {
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}

/* 最终选中的样式 */
.config-card.selected {
  border-color: #52c41a;
  background-color: #f6ffed;
}

/* 悬停浮起效果，如果是选中状态就不浮起了，避免乱飞 */
.config-card:not(.selected):hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.clickable-title { color: var(--ant-primary, #1677ff); margin: 0; }
.card-body p { margin: 8px 0; font-size: 13px; color: #666; }
.card-actions { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; }
.card-actions a { color: var(--ant-primary, #1677ff); font-size: 13px; text-decoration: none; }

/* 悬停详细信息面板 */
.hover-detail {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  background: #f9f9f9;
  border-radius: 6px;
  margin-top: 0;
  padding: 0 12px;
  transition: max-height 0.4s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.3s ease, margin 0.2s ease;
}
/* 注意：为了防止拖拽框选时弹出一大片详情，加了 :not(.preview-toggle) */
.config-card:hover:not(.preview-toggle) .hover-detail {
  max-height: 200px;
  opacity: 1;
  margin-top: 12px;
  padding: 12px;
}
.hover-detail-content { font-size: 12px; color: #555; line-height: 1.6; }
.hover-detail-content div { margin-bottom: 6px; word-break: break-all; }
.hover-detail-content strong { color: #333; margin-right: 6px; }
</style>
