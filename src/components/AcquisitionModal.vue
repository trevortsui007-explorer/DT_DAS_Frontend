<template>
  <div v-if="visible" class="ant-modal-mask active"></div>
  <div v-if="visible" class="ant-modal-wrap active" @click.self="handleCancel">
    <div class="ant-modal task-action-modal">
      <div class="ant-modal-header">
        <div class="ant-modal-title">
          <FieldTimeOutlined style="color: #52c41a; margin-right: 8px;" />
          任务采集计划设置
        </div>
      </div>

      <div class="ant-modal-body">
        <div class="selected-info-box">
          <div class="info-label">已选待执行任务 ({{ taskData?.length || 0 }})</div>
          <div class="info-content">
            <div v-for="item in taskData" :key="item.id" class="task-item-wrapper">
              <span class="task-tag">
                {{ item.eqName || item.groupName || '未命名任务' }}
              </span>
            </div>

            <div v-if="!taskData || taskData.length === 0" style="color: #bfbfbf; font-size: 13px;">
              未选择任何任务
            </div>
          </div>
        </div>

        <div class="date-picker-grid">
          <div class="form-item">
            <label class="date-label">开始日期</label>
            <input
              type="datetime-local"
              class="ant-input"
              v-model="form.startTime"
            />
          </div>
          <div class="form-item">
            <label class="date-label">结束日期</label>
            <input
              type="datetime-local"
              class="ant-input"
              v-model="form.endTime"
            />
          </div>
        </div>

        <div class="modal-tips">
          * 系统将对上述 <b>{{ taskData?.length || 0 }}</b> 个项目进行批量补录或定时采集。
        </div>
      </div>

      <div class="ant-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
        <button class="ant-btn ant-btn-gray" @click="handleCancel">取消</button>
        <button
          class="ant-btn ant-btn-primary"
          :disabled="!taskData || taskData.length === 0"
          @click="handleConfirm"
        >
          <PlayCircleOutlined /> 确认启动 ({{ taskData?.length || 0 }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { FieldTimeOutlined, PlayCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  visible: Boolean,
  // 确认类型为 Array
  taskData: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const form = reactive({
  startTime: '',
  endTime: ''
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    // 转换为 input datetime-local 要求的格式 (YYYY-MM-DDTHH:mm)
    const offset = now.getTimezoneOffset() * 60000
    form.startTime = new Date(now - offset).toISOString().slice(0, 16)
    form.endTime = new Date(tomorrow - offset).toISOString().slice(0, 16)
  }
})

const handleCancel = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  // 传回完整表单和选中的所有任务数据
  emit('confirm', {
    ...form,
    tasks: props.taskData // 传出数组供 API 使用
  })
  handleCancel()
}
</script>

<style scoped>
.task-action-modal {
  width: 600px !important; /* 稍微调宽一点，方便显示多个标签 */
}

.selected-info-box {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  max-height: 200px;
  overflow-y: auto;
}

/* 标签容器布局 */
.info-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #d9f7be;
  padding: 4px 12px;
  border-radius: 4px;
}

.info-label {
  font-size: 12px;
  color: #52c41a;
  margin-bottom: 12px;
  font-weight: bold;
}

.task-tag {
  color: #52c41a;
  font-weight: 500;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.task-id {
  color: #bfbfbf;
  font-family: monospace;
  font-size: 11px;
}

.date-picker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.date-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.modal-tips {
  margin-top: 16px;
  font-size: 12px;
  color: #8c8c8c;
}

.ant-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
