<template>
  <div class="cards-view">
    <div v-if="loading" class="loading-placeholder">加载中...</div>
    <div v-else-if="error" class="error-placeholder">{{ error }}</div>
    <div v-else-if="items.length === 0" class="empty-placeholder">暂无数据</div>
    <div v-else class="config-grid">
      <!-- 配置组卡片 -->
      <div v-if="type === 'group'" v-for="group in items" :key="group.id" class="config-card" @click="viewDetail(group)">
        <h4>{{ group.groupName || `配置组 ${group.id}` }}</h4>
        <p>关联配置数：{{ group.configCount || group.ConfigCount || 0 }}</p>
        <p class="detail-link">点击查看详情 →</p>
      </div>

      <!-- 配置项卡片 -->
      <div v-else-if="type === 'config'" v-for="config in items" :key="config.id" class="config-card">
        <div class="card-header">
          <h4 @click="viewDetail(config)" class="clickable-title">{{ config.EqName || config.eqName || '未命名设备' }}</h4>
          <span :style="{ color: (config.IsEnabled || config.isEnabled) ? '#52c41a' : '#ff4d4f', fontSize: '12px' }">
            ● {{ (config.IsEnabled || config.isEnabled) ? '运行中' : '已禁用' }}
          </span>
        </div>
        <div class="card-body">
          <p>表名：{{ config.TableName || config.tableName || '-' }}</p>
          <p>类型：<span class="ant-tag">{{ config.FileType || 'csv' }}</span></p>
        </div>
        <div class="card-actions">
          <a @click="viewDetail(config)">详情 →</a>
          <a @click="editConfig(config)">编辑配置</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    required: true, // 'group' 或 'config'
  },
  items: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['view-detail', 'edit-config'])

const viewDetail = (item) => {
  emit('view-detail', item)
}

const editConfig = (config) => {
  emit('edit-config', config)
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
  transition: box-shadow 0.2s;
  cursor: pointer;
}
.config-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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
.detail-link {
  margin-top: 8px;
  color: var(--ant-primary, #1677ff);
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
</style>
