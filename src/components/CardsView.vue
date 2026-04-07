<template>
  <div class="cards-view">
    <div v-if="loading" class="loading-placeholder">加载中...</div>
    <div v-else-if="error" class="error-placeholder">{{ error }}</div>
    <div v-else-if="items.length === 0" class="empty-placeholder">暂无数据</div>
    <div v-else class="config-grid">
      <!-- 配置组卡片 -->
      <template v-if="type === 'group'">
        <div v-for="group in items" :key="group.id" class="config-card">
          <div class="card-header">
            <h4 class="clickable-title" @click.stop="viewDetail(group)">{{ group.groupName || `配置组 ${group.id}` }}</h4>
            <span :style="{ color: group.isEnabled ? '#52c41a' : '#ff4d4f', fontSize: '12px' }">
              ● {{ group.isEnabled ? '启用' : '禁用' }}
            </span>
          </div>
          <div class="card-body">
            <p v-if="group.groupCategory">类别：{{ group.groupCategory }}</p>
            <p v-if="group.groupType">类型：{{ group.groupType }}</p>
            <p>关联配置数：{{ group.configCount || group.ConfigCount || 0 }}</p>
            <p>排序：{{ group.sortOrder ?? group.SortOrder ?? '-' }}</p>
          </div>
          <div class="card-actions">
            <a @click.stop="viewDetail(group)">详情 →</a>
            <a @click.stop="editGroup(group)">编辑组</a>
          </div>
        </div>
      </template>

      <!-- 配置项卡片：悬停显示详细信息 -->
      <template v-else-if="type === 'config'">
        <div v-for="config in items" :key="config.id" class="config-card" @click="editConfig(config)">
          <div class="card-header">
            <h4 class="clickable-title" @click.stop="viewDetail(config)">{{ config.EqName || config.eqName || '未命名设备' }}</h4>
            <span :style="{ color: (config.IsEnabled || config.isEnabled) ? '#52c41a' : '#ff4d4f', fontSize: '12px' }">
              ● {{ (config.IsEnabled || config.isEnabled) ? '运行中' : '已禁用' }}
            </span>
          </div>
          <div class="card-body" @click.stop>
            <p>表名：{{ config.TableName || config.tableName || '-' }}</p>
            <p>类型：<span class="ant-tag">{{ config.FileType || 'csv' }}</span></p>
          </div>
          <div class="card-actions" @click.stop>
            <a @click="viewDetail(config)">详情 →</a>
            <a @click.stop="editConfig(config)">编辑配置</a>
          </div>

          <!-- 悬停时显示的详细信息面板 -->
          <div class="hover-detail">
            <div class="hover-detail-content">
              <div><strong>文件路径规则：</strong>{{ config.FilePathPattern || config.filePathPattern || '-' }}</div>
              <div><strong>文件名规则：</strong>{{ config.FileNamePattern || config.fileNamePattern || '-' }}</div>
              <div><strong>后处理类型：</strong>{{ getPostTypeName(config.PostProcessingType ?? config.postProcessingType) }}</div>
              <div><strong>存储过程/服务：</strong>{{ config.ProcedureName || config.procedureName || '-' }}</div>
              <div><strong>扩展字段：</strong>{{ config.ExtFields || config.extFields || '-' }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const { type, items, loading, error } = defineProps({
  type: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['view-detail', 'edit-config', 'edit-group'])

const viewDetail = (item) => {
  emit('view-detail', item)
}

const editConfig = (config) => {
  emit('edit-config', config)
}

const editGroup = (group) => {
  emit('edit-group', group)
}

const getPostTypeName = (type) => {
  switch (type) {
    case 1: return '调用C#服务'
    case 2: return '调用存储过程'
    default: return '无操作'
  }
}
</script>

<style scoped>
.cards-view {
  width: 100%;
}
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.config-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.config-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.clickable-title {
  color: var(--ant-primary, #1677ff);
  cursor: pointer;
  margin: 0;
}
.card-body p {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
}
.card-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
}
.card-actions a {
  color: var(--ant-primary, #1677ff);
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
}
.ant-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
}
.loading-placeholder,
.error-placeholder,
.empty-placeholder {
  text-align: center;
  padding: 60px;
  color: #999;
}

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
.config-card:hover .hover-detail {
  max-height: 200px;
  opacity: 1;
  margin-top: 12px;
  padding: 12px;
}
.hover-detail-content {
  font-size: 12px;
  color: #555;
  line-height: 1.6;
}
.hover-detail-content div {
  margin-bottom: 6px;
  word-break: break-all;
}
.hover-detail-content strong {
  color: #333;
  margin-right: 6px;
}
</style>
