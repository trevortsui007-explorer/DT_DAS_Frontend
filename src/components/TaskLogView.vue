<template>
  <div class="task-log-view">
    <div class="task-log-layout">
      <section class="task-log-card">
        <div class="task-log-card__header">
          <div class="task-log-card__header-left">
            <div class="task-log-title-row">
            <h3 class="task-log-card__title">{{ isFileLogView ? '当前文件状态' : isConfigLogView ? '当前配置' : '当前任务' }}</h3>
              <button
                v-if="!usesConfigRightList && currentTask"
                type="button"
                class="summary-toggle-btn"
                @click="toggleCurrentTaskSummary"
              >
                {{ currentTaskSummaryCollapsed ? '展开概览' : '收起概览' }}
              </button>
              <button
                v-if="!usesConfigRightList && currentTask"
                type="button"
                class="summary-toggle-btn"
                @click="toggleCurrentTaskDetailSummary"
              >
                {{ currentTaskDetailSummaryCollapsed ? '展开明细' : '收起明细' }}
              </button>
            </div>
            <p class="task-log-card__desc">
              {{ isFileLogView ? '查看当前配置在日期范围内的文件采集水位' : isConfigLogView ? '查看当前配置在日期范围内的采集历史' : '查看当前选中任务的状态、进度和明细' }}
            </p>
          </div>
          <div class="task-log-card__header-right">
            <div class="task-log-filter-row">
              <button
                v-for="tag in visibleDetailFilterTags"
                :key="tag"
                type="button"
                class="status-tag status-tag--filter"
                :class="[getStatusClass(tag), { 'status-tag--active': activeDetailTag === tag }]"
                @click="setActiveDetailTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="currentLogTargetAvailable" class="task-log-current">
          <div v-if="!usesConfigRightList" v-show="!currentTaskSummaryCollapsed" class="task-log-summary-panel">
            <div class="task-log-summary-grid">
              <div class="task-log-summary-item">
                <span class="label">任务编号</span>
                <span class="task-log-summary-trigger">
                  <span class="trigger-tag" :class="getTriggerTypeClass(currentTask.triggerType)">
                    {{ formatTriggerType(currentTask.triggerType) }}
                  </span>
                </span>
                <span class="value mono">{{ currentTask.taskCode || currentTask.taskLogId || '--' }}</span>
              </div>

              <div class="task-log-summary-item">
                <span class="label">状态</span>
                <span class="value">
                  <span class="status-tag" :class="getStatusClass(currentTaskDisplaySummary.status)">
                    {{ currentTaskDisplaySummary.status || '--' }}
                  </span>
                </span>
              </div>

              <div class="task-log-summary-item">
                <span class="label">开始时间</span>
                <span class="value">{{ formatDateTime(currentTask.startTime) }}</span>
              </div>

              <div class="task-log-summary-item">
                <span class="label">结束时间</span>
                <span class="value">{{ formatDateTime(currentTask.endTime) }}</span>
              </div>

              <div class="task-log-summary-item">
                <span class="label">采集单元总数</span>
                <span class="value">{{ currentTask.totalConfigs ?? 0 }}</span>
              </div>

              <div class="task-log-summary-item">
                <span class="label">已处理单元</span>
                <span class="value">{{ currentTaskDisplaySummary.processedCount ?? 0 }}</span>
              </div>

              <div class="task-log-summary-item">
                <span class="label">成功单元</span>
                <span class="value success-text">{{ currentTaskDisplaySummary.successCount ?? 0 }}</span>
              </div>

              <div class="task-log-summary-item">
                <span class="label">失败单元</span>
                <span class="value danger-text">{{ currentTaskDisplaySummary.failureCount ?? 0 }}</span>
              </div>
            </div>

            <div class="task-progress-block">
              <div class="task-progress-meta">
                <span>执行进度</span>
                <span>{{ progressPercent }}%</span>
              </div>

              <div class="task-progress-bar">
                <div class="task-progress-bar__inner" :style="{ width: `${progressPercent}%` }" />
              </div>

              <div class="task-progress-foot">
                <span>上次刷新：{{ formatDateTime(lastRefreshTime) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="task-log-summary-panel">
            <div class="task-log-summary-grid">
              <div class="task-log-summary-item">
                <span class="label">配置名称</span>
                <span class="value mono">{{ getConfigName(selectedConfig) || '--' }}</span>
              </div>
              <div class="task-log-summary-item">
                <span class="label">入库表名</span>
                <span class="value">{{ getField(selectedConfig, ['tableName', 'TableName']) }}</span>
              </div>
              <div class="task-log-summary-item">
                <span class="label">文件类型</span>
                <span class="value">{{ getField(selectedConfig, ['fileType', 'FileType']) }}</span>
              </div>
              <div class="task-log-summary-item">
                <span class="label">采集行数</span>
                <span class="value success-text">{{ selectedConfigHistorySummary.processedRows }}</span>
              </div>
            </div>
          </div>

          <div class="task-log-detail">
            <div v-show="!currentTaskDetailSummaryCollapsed" class="task-log-file-summary-grid">
              <button
                type="button"
                class="task-log-file-summary-item"
                :class="{ 'task-log-file-summary-item--active': isSummaryFilterActive('All') }"
                @click="setActiveDetailTag('All')"
              >
                <span class="label">总文件数</span>
                <span class="value">{{ currentLogFileSummary.totalFiles }}</span>
              </button>
              <button
                type="button"
                class="task-log-file-summary-item"
                :class="{ 'task-log-file-summary-item--active': isSummaryFilterActive('Success') }"
                @click="setActiveDetailTag('Success')"
              >
                <span class="label">成功文件</span>
                <span class="value success-text">{{ currentLogFileSummary.successFiles }}</span>
              </button>
              <button
                v-if="!isFileLogView"
                type="button"
                class="task-log-file-summary-item"
                :class="{ 'task-log-file-summary-item--active': isSummaryFilterActive('Warning') }"
                @click="setActiveDetailTag('Warning')"
              >
                <span class="label">Warning 文件</span>
                <span class="value warning-text">{{ currentLogFileSummary.warningFiles }}</span>
              </button>
              <button
                type="button"
                class="task-log-file-summary-item"
                :class="{ 'task-log-file-summary-item--active': isSummaryFilterActive('Failed') }"
                @click="setActiveDetailTag('Failed')"
              >
                <span class="label">失败文件</span>
                <span class="value danger-text">{{ currentLogFileSummary.failedFiles }}</span>
              </button>
              <div class="task-log-file-summary-rows">
                入库行数 {{ currentLogFileSummary.processedRows }}
              </div>
            </div>
            <div
              v-show="!usesConfigRightList && !currentTaskDetailSummaryCollapsed && activeDetailTag !== 'Success' && hasErrorFiles"
              class="task-log-error-category-panel"
            >
              <div class="task-log-error-category-head">
                <div>
                  <strong>报错分类</strong>
                  <span>按错误原因聚合，点击分类可筛选明细</span>
                </div>
                <button
                  v-if="activeErrorCategory"
                  type="button"
                  class="task-log-error-category-clear"
                  @click="clearActiveErrorCategory"
                >
                  清除分类
                </button>
              </div>
              <div v-if="currentTaskErrorCategories.length" class="task-log-error-category-grid">
                <button
                  v-for="category in currentTaskErrorCategories"
                  :key="category.category"
                  type="button"
                  class="task-log-error-category-item"
                  :class="{ 'task-log-error-category-item--active': activeErrorCategory === category.category }"
                  @click="setActiveErrorCategory(category.category)"
                >
                  <span class="label">{{ category.categoryName }}</span>
                  <strong>{{ category.count }}</strong>
                  <span class="percent">{{ formatPercent(category.percent) }}</span>
                </button>
              </div>
              <div v-else class="task-log-error-category-empty">
                暂无报错分类统计，请刷新任务状态后查看
              </div>
            </div>
            <div v-if="detailsLoading" class="loading-placeholder">正在加载任务明细...</div>

            <div v-else class="task-log-detail-content">
              <div v-if="detailTotal <= 0" class="empty-placeholder">暂无任务明细</div>

              <template v-else>
                <div class="task-log-detail-list">
                  <template v-for="row in displayedTaskDetailRows" :key="row.key">
                  <div v-if="row.type === 'group'" class="task-log-config-group task-log-task-group">
                    <div class="task-log-task-group__main">
                      <span class="mono">{{ row.label }}</span>
                      <span class="status-tag" :class="getStatusClass(row.group?.taskStatus)">
                        {{ row.group?.taskStatus || '--' }}
                      </span>
                      <span class="trigger-tag" :class="getTriggerTypeClass(row.group?.triggerType)">
                        {{ formatTriggerType(row.group?.triggerType) }}
                      </span>
                    </div>
                    <div class="task-log-config-group__stats">
                      <span>开始 {{ formatDateTime(row.group?.startTime) }}</span>
                      <span>结束 {{ formatDateTime(row.group?.endTime) }}</span>
                      <span>总 {{ row.group?.totalFiles ?? row.count }}</span>
                      <span>成功 {{ row.group?.successFiles ?? 0 }}</span>
                      <span>Warning {{ row.group?.warningFiles ?? 0 }}</span>
                      <span>失败 {{ row.group?.failedFiles ?? 0 }}</span>
                      <span>行 {{ row.group?.processedRows ?? 0 }}</span>
                    </div>
                  </div>
                  <div
                    v-else-if="row.type === 'fileState'"
                    class="task-log-detail-item"
                  >
                    <div class="task-log-detail-item__top">
                      <span class="task-log-file">{{ row.item.fileName || '--' }}</span>
                      <span class="status-tag" :class="getStatusClass(row.item.lastStatus)">
                        {{ row.item.lastStatus || '--' }}
                      </span>
                    </div>

                    <div v-if="row.item.fullPath" class="task-log-file-path">
                      {{ row.item.fullPath }}
                    </div>

                    <div class="task-log-detail-item__meta task-log-detail-item__meta--combined">
                      <div class="task-log-detail-item__meta-left">
                        <span class="task-log-row-metric">
                          <span>业务日期</span>
                          <strong>{{ formatDate(row.item.businessDate) }}</strong>
                        </span>
                        <span class="task-log-row-metric">
                          <span>数据行数</span>
                          <strong>{{ row.item.dataRowCount ?? 0 }}</strong>
                        </span>
                        <span class="task-log-row-metric">
                          <span>起始行</span>
                          <strong>{{ row.item.lastStartRow ?? 0 }}</strong>
                        </span>
                        <span class="task-log-row-metric">
                          <span>新增行</span>
                          <strong>{{ row.item.lastProcessedRows ?? 0 }}</strong>
                        </span>
                        <span class="task-log-row-metric">
                          <span>来源</span>
                          <strong>{{ row.item.lastUpdateSource || '--' }}</strong>
                        </span>
                        <span class="task-log-row-metric">
                          <span>大小</span>
                          <strong>{{ formatFileSize(row.item.fileSize) }}</strong>
                        </span>
                      </div>
                      <div class="task-log-detail-item__meta-time">
                        <span class="task-log-meta-chip task-log-meta-chip--time">
                          <span>文件修改</span>
                          <strong>{{ formatDateTime(row.item.lastWriteTime) }}</strong>
                        </span>
                        <span class="task-log-meta-chip task-log-meta-chip--time">
                          <span>状态更新</span>
                          <strong>{{ formatDateTime(row.item.updateTime) }}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="task-log-detail-item"
                    :class="{ 'is-warning': isWarningDetail(row.item) }"
                    role="button"
                    tabindex="0"
                    @click="openDetailModal(row.item)"
                    @keydown.enter="openDetailModal(row.item)"
                    @keydown.space.prevent="openDetailModal(row.item)"
                  >
                    <div class="task-log-detail-item__top">
                      <span class="task-log-file">{{ getDetailTitle(row.item) }}</span>
                      <span class="status-tag" :class="getStatusClass(getDetailDisplayStatus(row.item))">
                        {{ getDetailDisplayStatus(row.item) || '--' }}
                      </span>
                    </div>

                    <div v-if="row.item.fullFilePath" class="task-log-file-path">
                      {{ row.item.fullFilePath }}
                    </div>

                    <div class="task-log-detail-item__meta task-log-detail-item__meta--combined">
                      <div class="task-log-detail-item__meta-left">
                        <span class="task-log-meta-chip task-log-meta-chip--config">
                          <span>{{ getDetailConfigDisplay(row.item).label }}</span>
                          <strong>{{ getDetailConfigDisplay(row.item).value }}</strong>
                        </span>
                        <span class="task-log-row-metric">
                          <span>起始行</span>
                          <strong>{{ row.item.startRow ?? 0 }}</strong>
                        </span>
                        <span class="task-log-row-metric">
                          <span>处理行数</span>
                          <strong>{{ row.item.processedRows ?? 0 }}</strong>
                        </span>
                      </div>
                      <div class="task-log-detail-item__meta-time">
                        <span class="task-log-meta-chip task-log-meta-chip--time">
                          <span>开始</span>
                          <strong>{{ formatDateTime(row.item.startTime) }}</strong>
                        </span>
                        <span class="task-log-meta-chip task-log-meta-chip--time">
                          <span>结束</span>
                          <strong>{{ formatDateTime(row.item.endTime) }}</strong>
                        </span>
                      </div>
                    </div>

                    <div
                      v-if="row.item.errorMessage"
                      class="task-log-error"
                      :class="{ 'task-log-warning': isWarningDetail(row.item) }"
                    >
                      <span v-if="row.item.errorCategoryName" class="task-log-error-category-tag">
                        {{ row.item.errorCategoryName }}
                      </span>
                      {{ row.item.errorMessage }}
                    </div>
                  </div>
                  </template>
                </div>

                <div class="task-log-detail-footer">
                  <span class="task-log-detail-total">总 {{ detailTotal }} 条</span>
                  <button
                    type="button"
                    class="task-log-page-btn"
                    :disabled="detailPageNo <= 1 || detailsLoading"
                    @click="changeDetailPage(detailPageNo - 1)"
                  >
                    &lt;
                  </button>
                  <button
                    v-for="page in detailVisiblePageItems"
                    :key="page.key"
                    type="button"
                    class="task-log-page-btn"
                    :class="{ active: page.value === detailPageNo }"
                    :disabled="page.type === 'ellipsis' || detailsLoading"
                    @click="page.type === 'page' && changeDetailPage(page.value)"
                  >
                    {{ page.label }}
                  </button>
                  <button
                    type="button"
                    class="task-log-page-btn"
                    :disabled="detailPageNo >= detailTotalPages || detailsLoading"
                    @click="changeDetailPage(detailPageNo + 1)"
                  >
                    &gt;
                  </button>
                  <select
                    v-model.number="detailPageSize"
                    class="task-log-page-size"
                    :disabled="detailsLoading"
                    @change="changeDetailPageSize"
                  >
                    <option v-for="size in detailPageSizeOptions" :key="size" :value="size">
                      {{ size }}
                    </option>
                  </select>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div v-else class="empty-placeholder">
          {{ usesConfigRightList ? '请选择右侧配置查看记录。' : '暂无任务日志。请先执行采集任务。' }}
        </div>
      </section>

      <aside class="task-log-card task-log-history">
        <div class="task-log-card__header task-log-history-header">
          <div class="task-log-history-header__left">
            <h3 class="task-log-card__title">{{ usesConfigRightList ? '配置列表' : '历史任务' }}</h3>
            <p class="task-log-card__desc">{{ isFileLogView ? '点击配置查看文件状态' : isConfigLogView ? '点击配置查看采集历史' : '点击切换查看不同任务' }}</p>
          </div>
          <div class="task-log-history-header__right">
            <div class="history-date-filter">
              <label class="history-date-filter__item">
                <span>开始日期</span>
                <input
                  v-model="historyStartDateInput"
                  type="date"
                  class="history-date-filter__input ant-input"
                  @change="applyHistoryDateFilter"
                />
              </label>
              <label class="history-date-filter__item">
                <span>结束日期</span>
                <input
                  v-model="historyEndDateInput"
                  type="date"
                  class="history-date-filter__input ant-input"
                  @change="applyHistoryDateFilter"
                />
              </label>
              <button
                type="button"
                class="ant-btn ant-btn-gray history-date-filter__clear"
                :disabled="!historyStartDateInput && !historyEndDateInput"
                @click="clearHistoryDateFilter"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        <div v-if="historyDateFilterError" class="history-date-filter__error">
          {{ historyDateFilterError }}
        </div>

        <div v-if="listLoading" class="loading-placeholder">{{ usesConfigRightList ? '正在加载配置列表...' : '正在加载历史任务...' }}</div>

        <div v-else-if="rightListTotal <= 0" class="empty-placeholder">{{ usesConfigRightList ? '暂无配置' : '暂无历史任务' }}</div>

        <div v-else-if="!rightListItems.length" class="empty-placeholder">
          {{ usesConfigRightList ? '当前页暂无配置记录' : '当前筛选条件下暂无历史任务记录' }}
        </div>

        <div v-else class="task-log-history-list">
          <div
            v-for="item in rightListItems"
            :key="usesConfigRightList ? item.id : item.taskLogId"
            class="task-log-history-item"
            :class="{ active: usesConfigRightList ? selectedConfig?.id === item.id : currentTask?.taskLogId === item.taskLogId }"
            @click="usesConfigRightList ? selectConfig(item) : selectTask(item)"
          >
            <template v-if="usesConfigRightList">
              <div class="task-log-history-item__top task-log-history-item__top--config">
                <span class="mono task-log-history-id task-log-config-title">
                  <span class="task-log-config-title__prefix">配置</span>
                  <strong>{{ getConfigName(item) || item.id || '--' }}</strong>
                </span>
                <span class="task-log-config-metrics">
                  <span v-if="isFileLogView && getRightConfigSummary(item.id).totalFiles > 0" class="processed-rows-summary-tag">
                    文件{{ getRightConfigSummary(item.id).totalFiles }}
                  </span>
                  <span v-if="!isFileLogView && getRightConfigSummary(item.id).warningFiles > 0" class="warning-summary-tag">
                    Warning {{ getRightConfigSummary(item.id).warningFiles }}
                  </span>
                  <span v-if="getRightConfigSummary(item.id).failedFiles > 0" class="failed-summary-tag">
                    Failed {{ getRightConfigSummary(item.id).failedFiles }}
                  </span>
                  <span v-if="isFileLogView && getRightConfigSummary(item.id).newFiles > 0" class="processed-rows-summary-tag">
                    New {{ getRightConfigSummary(item.id).newFiles }}
                  </span>
                  <span v-if="getRightConfigSummary(item.id).processedRows > 1" class="processed-rows-summary-tag">
                    采集{{ getRightConfigSummary(item.id).processedRows }}行
                  </span>
                </span>
              </div>

              <div class="task-log-history-item__meta">
                <span>入库表 {{ getField(item, ['tableName', 'TableName']) }}</span>
                <span>类型 {{ getField(item, ['fileType', 'FileType']) }}</span>
              </div>
            </template>

            <template v-else>
              <div class="task-log-history-item__top">
              <span class="mono task-log-history-id">{{ item.taskCode || item.taskLogId || '--' }}</span>
              <span v-if="getTaskDisplaySummary(item).warningCount > 0" class="warning-summary-tag">
                存在{{ getTaskDisplaySummary(item).warningCount }}项无文件
              </span>
              <span v-if="getHistoryTaskProcessedRows(item) > 1" class="processed-rows-summary-tag">
                采集{{ getHistoryTaskProcessedRows(item) }}行
              </span>
              <span class="status-tag" :class="getStatusClass(getTaskDisplaySummary(item).status)">
                {{ getTaskDisplaySummary(item).status || '--' }}
              </span>
            </div>

            <div class="task-log-history-item__meta">
              <span>总数 {{ item.totalConfigs ?? 0 }}</span>
              <span>成功 {{ getTaskDisplaySummary(item).successCount ?? 0 }}</span>
              <span>失败 {{ getTaskDisplaySummary(item).failureCount ?? 0 }}</span>
              <span class="trigger-inline">
                <span
                  class="trigger-tag"
                  :class="getTriggerTypeClass(item.triggerType)"
                >
                  {{ formatTriggerType(item.triggerType) }}
                </span>
              </span>
            </div>

            <div class="task-log-history-item__meta">
              <span>{{ formatDateTime(item.startTime) }}</span>
            </div>
            </template>
          </div>
        </div>

        <div v-if="rightListTotal > 0" class="task-log-history-footer">
          <div class="task-log-history-footer__summary">
            共 {{ rightListTotal }} 条，第 {{ taskListPageNo }} / {{ totalPages }} 页
          </div>

          <div class="task-log-history-pagination">
            <button
              type="button"
              class="ant-btn ant-btn-gray"
              :disabled="taskListPageNo <= 1 || listLoading"
              @click="changeTaskListPage(taskListPageNo - 1)"
            >
              上一页
            </button>

            <button
              v-for="page in visiblePageNumbers"
              :key="page"
              type="button"
              class="ant-btn"
              :class="page === taskListPageNo ? 'ant-btn-primary' : 'ant-btn-gray'"
              :disabled="listLoading"
              @click="changeTaskListPage(page)"
            >
              {{ page }}
            </button>

            <button
              type="button"
              class="ant-btn ant-btn-gray"
              :disabled="taskListPageNo >= totalPages || listLoading"
              @click="changeTaskListPage(taskListPageNo + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </aside>
    </div>

    <div class="ant-modal-mask" :class="{ active: detailModalVisible }" @click="closeDetailModal"></div>
    <div class="ant-modal-wrap" :class="{ active: detailModalVisible }">
      <div class="ant-modal task-log-detail-modal">
        <div class="ant-modal-header">
          <span class="ant-modal-title">日志明细</span>
          <span class="task-log-modal-close" @click="closeDetailModal">×</span>
        </div>

        <div class="ant-modal-body task-log-detail-modal__body">
          <div v-if="detailModalLoading" class="loading-placeholder">正在加载配置详情...</div>
          <template v-else-if="selectedDetail">
            <section
              v-for="section in detailModalSections"
              :key="section.title"
              class="detail-section"
            >
              <h4 class="detail-section__title">{{ section.title }}</h4>
              <div class="detail-section__grid">
                <div
                  v-for="field in section.fields"
                  :key="field.label"
                  class="detail-field"
                >
                  <span class="detail-field__label">{{ field.label }}</span>
                  <span
                    v-if="field.tag"
                    class="detail-value-tag"
                    :class="field.tagClass"
                  >
                    {{ field.value }}
                  </span>
                  <span
                    v-else
                    class="detail-field__value"
                    :class="[field.valueClass, { 'danger-text': field.danger, 'warning-text': field.warning }]"
                  >
                    {{ field.value }}
                  </span>
                </div>
              </div>
            </section>
          </template>
          <div v-else class="empty-placeholder">暂无日志明细</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as api from '../api'

// 本地安全提示，避免依赖 components/index.js 导出格式
const notify = {
  error(text) {
    console.error(text)
  },
  warning(text) {
    console.warn(text)
  },
  success(text) {
    console.log(text)
  },
}

const props = defineProps({
  initialTaskLogId: {
    type: String,
    default: '',
  },
  logViewMode: {
    type: String,
    default: 'task',
  },
})

const emit = defineEmits(['task-selected'])

const currentTask = ref(null)
const taskList = ref([])
const taskDetails = ref([])
const taskDetailConfigGroups = ref([])
const configList = ref([])
const selectedConfig = ref(null)
const configHistoryTaskGroups = ref([])
const configHistorySummaryById = ref({})
const configFileStateSummaryById = ref({})
const fileStateList = ref([])
const detailCacheByTaskId = ref({})
const configCacheById = ref({})
const taskDisplaySummaryById = ref({})
const warningSummaryLoadingIds = new Set()
const taskFileSummaryLoadingIds = new Set()
const detailFilterTags = ['All', 'Success', 'Warning', 'Failed', 'New']
const fileStateFilterTags = ['All', 'Success', 'Failed', 'New']
const activeDetailTag = ref('All')
const activeErrorCategory = ref('')
const currentTaskSummaryCollapsed = ref(false)
const currentTaskDetailSummaryCollapsed = ref(true)
const historyStartDateInput = ref('')
const historyEndDateInput = ref('')
const effectiveHistoryStartDate = ref('')
const effectiveHistoryEndDate = ref('')
const historyDateFilterError = ref('')

const taskListTotal = ref(0)
const taskListPageNo = ref(1)
const taskListPageSize = ref(10)
const detailTotal = ref(0)
const detailPageNo = ref(1)
const detailPageSize = ref(10)
const detailPageSizeOptions = [10, 20, 50, 100]
const taskFileSummaryById = ref({})

const toggleCurrentTaskSummary = () => {
  const nextCollapsed = !currentTaskSummaryCollapsed.value
  currentTaskSummaryCollapsed.value = nextCollapsed
  if (!nextCollapsed) {
    currentTaskDetailSummaryCollapsed.value = true
  }
}

const toggleCurrentTaskDetailSummary = () => {
  const nextCollapsed = !currentTaskDetailSummaryCollapsed.value
  currentTaskDetailSummaryCollapsed.value = nextCollapsed
  if (!nextCollapsed) {
    currentTaskSummaryCollapsed.value = true
  }
}

const listLoading = ref(false)
const detailsLoading = ref(false)
const polling = ref(false)
const pollingTimer = ref(null)
const pollingRefreshing = ref(false)
const lastRefreshTime = ref(null)
const detailModalVisible = ref(false)
const detailModalLoading = ref(false)
const selectedDetail = ref(null)
const selectedDetailConfig = ref(null)

const progressPercent = computed(() => {
  const item = currentTask.value
  if (!item) return 0

  if (typeof item.progress === 'number') {
    return Math.max(0, Math.min(100, item.progress))
  }

  const total = item.totalConfigs ?? 0
  const processed = item.processedCount ?? (item.successCount ?? 0) + (item.failureCount ?? 0)

  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((processed / total) * 100)))
})

const hasRunningTask = computed(() => {
  if (normalizeStatus(currentTask.value?.status) === 'running') return true
  return taskList.value.some((item) => normalizeStatus(item.status) === 'running')
})

const totalPages = computed(() => {
  const total = Number(rightListTotal.value || 0)
  const pageSize = Number(taskListPageSize.value || 10)
  return Math.max(1, Math.ceil(total / pageSize))
})

const detailTotalPages = computed(() => {
  const total = Number(detailTotal.value || 0)
  const pageSize = Number(detailPageSize.value || 10)
  return Math.max(1, Math.ceil(total / pageSize))
})

const buildCompactPageItems = (total, current) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => ({
      type: 'page',
      value: index + 1,
      label: String(index + 1),
      key: `page-${index + 1}`,
    }))
  }

  const pageSet = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) {
    pageSet.add(2)
    pageSet.add(3)
  }
  if (current >= total - 2) {
    pageSet.add(total - 1)
    pageSet.add(total - 2)
  }

  const pages = [...pageSet]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const items = []
  pages.forEach((page, index) => {
    const previous = pages[index - 1]
    if (previous && page - previous > 1) {
      items.push({
        type: 'ellipsis',
        value: null,
        label: '...',
        key: `ellipsis-${previous}-${page}`,
      })
    }
    items.push({
      type: 'page',
      value: page,
      label: String(page),
      key: `page-${page}`,
    })
  })

  return items
}

const detailVisiblePageItems = computed(() =>
  buildCompactPageItems(detailTotalPages.value, detailPageNo.value),
)

const visiblePageNumbers = computed(() => {
  const total = totalPages.value
  const current = taskListPageNo.value
  const start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  const pages = []
  for (let i = adjustedStart; i <= end; i += 1) {
    pages.push(i)
  }
  return pages
})

const normalizeStatus = (status) =>
  String(status || '')
    .replace(/\s+/g, '')
    .toLowerCase()

const MISSING_FILE_TEXT = '文件未找到'

const FILE_MISSING_ERROR_KEYWORDS = [MISSING_FILE_TEXT, '文件未找到', '未找到可处理文件', '不存在', 'File not found']

const isMissingFileDetail = (item = {}) => {
  if (String(item.errorCategory || '').toLowerCase() === 'filemissing') return true
  const errorMessage = String(item.errorMessage || '')
  return FILE_MISSING_ERROR_KEYWORDS.some((keyword) => errorMessage.includes(keyword))
}

const isPostProcessingDetail = (item = {}) => {
  if (String(item.errorCategory || '').toLowerCase() === 'postprocessing') return true
  return String(item.errorMessage || '').includes('Post processing failed')
}

const isWarningDetail = (item = {}) => isMissingFileDetail(item) || isPostProcessingDetail(item)

const getDetailDisplayStatus = (item = {}) => (isWarningDetail(item) ? 'Warning' : item.status || '')

const hasFileExtension = (name = '') => /\.[^\\/.\s]+$/.test(String(name || '').trim())

const isPathSegmentOnlyFileName = (name = '') => {
  const value = String(name || '').trim()
  if (!value) return true
  if (hasFileExtension(value)) return false
  if (/^\d{1,4}$/.test(value)) return true
  if (/^\d{4}[-_/]?\d{1,2}([-_/]?\d{1,2})?$/.test(value)) return true
  return !/[\\/]/.test(value)
}

const getDetailTitle = (item = {}) => {
  const fileName = String(item.fileName || '').trim()
  if (isMissingFileDetail(item) && isPathSegmentOnlyFileName(fileName)) {
    return '文件缺失'
  }
  return fileName || '--'
}

const calculateWarningSummary = (details = []) => {
  const warningCount = details.filter(isWarningDetail).length

  return {
    warningCount,
  }
}

const setTaskDisplaySummary = (taskLogId, details = []) => {
  if (!taskLogId) return

  taskDisplaySummaryById.value = {
    ...taskDisplaySummaryById.value,
    [taskLogId]: calculateWarningSummary(details),
  }
}

const getTaskDisplayStatus = (task = {}, successCount = 0, failureCount = 0) => {
  const status = task.status || ''
  const normalizedStatus = normalizeStatus(status)

  if (failureCount === 0 && successCount > 0 && ['failed', 'partialsuccess'].includes(normalizedStatus)) {
    return 'Success'
  }

  return status
}

const getTaskDisplaySummary = (task = {}) => {
  const rawSuccessCount = Number(task.successCount ?? 0)
  const rawFailureCount = Number(task.failureCount ?? 0)
  const rawProcessedCount = Number(task.processedCount ?? rawSuccessCount + rawFailureCount)
  const summary = taskDisplaySummaryById.value[task.taskLogId]
  const fileSummary = taskFileSummaryById.value[task.taskLogId]
  const warningCount = Math.max(Number(summary?.warningCount ?? 0), Number(fileSummary?.warningFiles ?? 0))
  const displaySuccessCount = rawSuccessCount + warningCount
  const displayFailureCount = Math.max(rawFailureCount - warningCount, 0)

  return {
    ...task,
    successCount: displaySuccessCount,
    rawSuccessCount,
    rawFailureCount,
    failureCount: displayFailureCount,
    processedCount: rawProcessedCount,
    warningCount,
    status: getTaskDisplayStatus(task, displaySuccessCount, displayFailureCount),
  }
}

const currentTaskDisplaySummary = computed(() => getTaskDisplaySummary(currentTask.value || {}))

const emptyTaskFileSummary = {
  totalFiles: 0,
  successFiles: 0,
  warningFiles: 0,
  failedFiles: 0,
  processedRows: 0,
  newFiles: 0,
  errorCategories: [],
}

const normalizeErrorCategory = (value = '') => String(value || '').replace(/\s+/g, '').toLowerCase()

const getErrorCategoryCount = (categories = [], category) => {
  const normalizedCategory = normalizeErrorCategory(category)
  const item = categories.find((entry = {}) => normalizeErrorCategory(entry.category) === normalizedCategory)
  return Number(item?.count ?? 0)
}

const normalizeTaskFileSummary = (raw = {}) => {
  const errorCategories = (raw.errorCategories || raw.ErrorCategories || []).map((item = {}) => ({
    category: item.category || item.Category || '',
    categoryName: item.categoryName || item.CategoryName || item.category || item.Category || '',
    count: Number(item.count ?? item.Count ?? 0),
    percent: Number(item.percent ?? item.Percent ?? 0),
  })).filter((item) => item.category && item.count > 0)
  const rawWarningFiles = Number(raw.warningFiles ?? raw.WarningFiles ?? 0)
  const rawFailedFiles = Number(raw.failedFiles ?? raw.FailedFiles ?? 0)
  const postProcessingFiles = getErrorCategoryCount(errorCategories, 'PostProcessing')

  return {
    totalFiles: Number(raw.totalFiles ?? raw.TotalFiles ?? 0),
    successFiles: Number(raw.successFiles ?? raw.SuccessFiles ?? 0),
    rawWarningFiles,
    rawFailedFiles,
    warningFiles: rawWarningFiles + postProcessingFiles,
    failedFiles: Math.max(rawFailedFiles - postProcessingFiles, 0),
    processedRows: Number(raw.processedRows ?? raw.ProcessedRows ?? 0),
    newFiles: Number(raw.newFiles ?? raw.NewFiles ?? 0),
    errorCategories,
  }
}

const currentTaskFileSummary = computed(() => {
  const taskLogId = currentTask.value?.taskLogId
  if (!taskLogId) return emptyTaskFileSummary
  return taskFileSummaryById.value[taskLogId] || emptyTaskFileSummary
})

const getHistoryTaskProcessedRows = (task = {}) => {
  const taskLogId = task.taskLogId
  if (!taskLogId) return 0
  return Number(taskFileSummaryById.value[taskLogId]?.processedRows ?? 0)
}

const currentTaskErrorCategories = computed(() => currentTaskFileSummary.value.errorCategories || [])

const hasErrorFiles = computed(() =>
  Number(currentTaskFileSummary.value.warningFiles || 0) + Number(currentTaskFileSummary.value.failedFiles || 0) > 0
)

const detailNameCollator = new Intl.Collator('zh-Hans-CN', {
  numeric: true,
  sensitivity: 'base',
})

const getDetailSortName = (detail = {}) => {
  const configName = getDetailConfigName(detail)
  if (configName && configName !== '--') return configName
  if (detail.configId !== undefined && detail.configId !== null) return `配置${detail.configId}`
  return detail.fileName || ''
}

const sortedTaskDetails = computed(() =>
  [...taskDetails.value].sort((a, b) => {
    const nameResult = detailNameCollator.compare(getDetailSortName(a), getDetailSortName(b))
    if (nameResult !== 0) return nameResult

    const configResult = Number(a.configId || 0) - Number(b.configId || 0)
    if (configResult !== 0) return configResult

    return detailNameCollator.compare(a.fileName || '', b.fileName || '')
  }),
)

const filteredTaskDetails = computed(() => {
  return taskDetails.value
})

const isConfigLogView = computed(() => props.logViewMode === 'config')
const isFileLogView = computed(() => props.logViewMode === 'file')
const usesConfigRightList = computed(() => isConfigLogView.value || isFileLogView.value)
const visibleDetailFilterTags = computed(() =>
  isFileLogView.value ? fileStateFilterTags : detailFilterTags,
)

const getConfigHistorySummary = (configId) =>
  configHistorySummaryById.value[configId] || emptyTaskFileSummary

const getConfigFileStateSummary = (configId) =>
  configFileStateSummaryById.value[configId] || emptyTaskFileSummary

const getRightConfigSummary = (configId) =>
  isFileLogView.value ? getConfigFileStateSummary(configId) : getConfigHistorySummary(configId)

const selectedConfigHistorySummary = computed(() =>
  isFileLogView.value
    ? getConfigFileStateSummary(selectedConfig.value?.id)
    : getConfigHistorySummary(selectedConfig.value?.id),
)

const currentLogFileSummary = computed(() =>
  usesConfigRightList.value ? selectedConfigHistorySummary.value : currentTaskFileSummary.value,
)

const currentLogTargetAvailable = computed(() =>
  usesConfigRightList.value ? Boolean(selectedConfig.value) : Boolean(currentTask.value),
)

const rightListTotal = computed(() =>
  usesConfigRightList.value ? configList.value.length : taskListTotal.value,
)

const rightListItems = computed(() => {
  if (!usesConfigRightList.value) return filteredHistoryTaskList.value

  const pageSize = Number(taskListPageSize.value || 10)
  const start = (Number(taskListPageNo.value || 1) - 1) * pageSize
  return configList.value.slice(start, start + pageSize)
})

const getDetailRowKey = (item = {}, index = 0) =>
  item.id || `${item.configId || 'unknown'}-${item.fileName || 'file'}-${item.startTime || index}-${index}`

const displayedTaskDetailRows = computed(() => {
  if (isFileLogView.value) {
    return fileStateList.value.map((item, index) => ({
      type: 'fileState',
      key: `file-state-${item.id || index}`,
      item,
    }))
  }

  if (!isConfigLogView.value) {
    return filteredTaskDetails.value.map((item, index) => ({
      type: 'detail',
      key: `detail-${getDetailRowKey(item, index)}`,
      item,
    }))
  }

  const rows = []
  configHistoryTaskGroups.value.forEach((group, groupIndex) => {
    const groupKey = String(group.taskLogId || group.taskCode || groupIndex)
    rows.push({
      type: 'group',
      key: `group-${groupKey}`,
      label: group.taskCode || group.taskLogId || `任务 ${groupIndex + 1}`,
      count: group.totalFiles,
      group,
    })
    group.latestDetails.forEach((item, index) => {
      rows.push({
        type: 'detail',
        key: `group-${groupKey}-detail-${getDetailRowKey(item, index)}`,
        item,
      })
    })
  })
  return rows
})

const getStartOfDayMs = (dateString) => {
  if (!dateString) return null
  const date = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const getEndOfDayMs = (dateString) => {
  if (!dateString) return null
  const date = new Date(`${dateString}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const getTaskStartTimeMs = (task) => {
  const date = new Date(task?.startTime || '')
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const filteredHistoryTaskList = computed(() => {
  const startBoundary = getStartOfDayMs(effectiveHistoryStartDate.value)
  const endBoundary = getEndOfDayMs(effectiveHistoryEndDate.value)

  return taskList.value.filter((item) => {
    const taskStartTimeMs = getTaskStartTimeMs(item)
    if (taskStartTimeMs === null) {
      return startBoundary === null && endBoundary === null
    }
    if (startBoundary !== null && taskStartTimeMs < startBoundary) return false
    if (endBoundary !== null && taskStartTimeMs > endBoundary) return false
    return true
  })
})

const setActiveDetailTag = async (tag) => {
  if (!visibleDetailFilterTags.value.includes(tag)) return
  if (activeDetailTag.value === tag && !activeErrorCategory.value) return
  activeDetailTag.value = tag
  activeErrorCategory.value = ''
  detailPageNo.value = 1

  if (isFileLogView.value && selectedConfig.value?.id) {
    await loadConfigFileStates(selectedConfig.value.id, { pageNo: 1 })
  } else if (isConfigLogView.value && selectedConfig.value?.id) {
    await loadConfigHistory(selectedConfig.value.id, { pageNo: 1 })
  } else if (currentTask.value?.taskLogId) {
    await loadTaskDetails(currentTask.value.taskLogId, { force: true, pageNo: 1 })
  }
}

const isSummaryFilterActive = (tag) => activeDetailTag.value === tag

const setActiveErrorCategory = async (category) => {
  if (!category) return
  activeErrorCategory.value = activeErrorCategory.value === category ? '' : category
  if (activeDetailTag.value === 'Success' || activeDetailTag.value === 'New' || isFileLogView.value) {
    activeDetailTag.value = 'All'
  }
  detailPageNo.value = 1

  if (isFileLogView.value && selectedConfig.value?.id) {
    await loadConfigFileStates(selectedConfig.value.id, { pageNo: 1 })
  } else if (isConfigLogView.value && selectedConfig.value?.id) {
    await loadConfigHistory(selectedConfig.value.id, { pageNo: 1 })
  } else if (currentTask.value?.taskLogId) {
    await loadTaskDetails(currentTask.value.taskLogId, { force: true, pageNo: 1 })
  }
}

const clearActiveErrorCategory = async () => {
  if (!activeErrorCategory.value) return
  activeErrorCategory.value = ''
  detailPageNo.value = 1

  if (isFileLogView.value && selectedConfig.value?.id) {
    await loadConfigFileStates(selectedConfig.value.id, { pageNo: 1 })
  } else if (isConfigLogView.value && selectedConfig.value?.id) {
    await loadConfigHistory(selectedConfig.value.id, { pageNo: 1 })
  } else if (currentTask.value?.taskLogId) {
    await loadTaskDetails(currentTask.value.taskLogId, { force: true, pageNo: 1 })
  }
}

const applyHistoryDateFilter = async () => {

  const startDateValue = historyStartDateInput.value
  const endDateValue = historyEndDateInput.value
  const nextStartMs = getStartOfDayMs(startDateValue)
  const nextEndMs = getEndOfDayMs(endDateValue)

  if (nextStartMs !== null && nextEndMs !== null && nextStartMs > nextEndMs) {
    historyDateFilterError.value = '开始日期不能晚于结束日期'
    notify.warning('开始日期不能晚于结束日期')
    return
  }

  historyDateFilterError.value = ''
  effectiveHistoryStartDate.value = startDateValue
  effectiveHistoryEndDate.value = endDateValue
  if (usesConfigRightList.value) {
    detailPageNo.value = 1
    if (isFileLogView.value) {
      await hydrateConfigFileStateSummaries()
      await loadConfigFileStates(selectedConfig.value?.id, { pageNo: 1 })
    } else {
      await hydrateConfigHistorySummaries()
      await loadConfigHistory(selectedConfig.value?.id, { pageNo: 1 })
    }
  } else {
    await loadTaskList(1)
  }
}

const clearHistoryDateFilter = async () => {
  historyStartDateInput.value = ''
  historyEndDateInput.value = ''
  effectiveHistoryStartDate.value = ''
  effectiveHistoryEndDate.value = ''
  historyDateFilterError.value = ''
  if (usesConfigRightList.value) {
    detailPageNo.value = 1
    if (isFileLogView.value) {
      await hydrateConfigFileStateSummaries()
      await loadConfigFileStates(selectedConfig.value?.id, { pageNo: 1 })
    } else {
      await hydrateConfigHistorySummaries()
      await loadConfigHistory(selectedConfig.value?.id, { pageNo: 1 })
    }
  } else {
    await loadTaskList(1)
  }
}

const normalizeTask = (raw = {}) => ({
  taskLogId: raw.taskLogId || raw.TaskLogId || raw.id || raw.Id || '',
  taskCode: raw.taskCode || raw.TaskCode || '',
  triggerType: raw.triggerType || raw.TriggerType || '',
  taskId: raw.taskId ?? raw.TaskId ?? 0,
  status: raw.status || raw.Status || '',
  startTime: raw.startTime || raw.StartTime || '',
  endTime: raw.endTime || raw.EndTime || '',
  totalConfigs: raw.totalConfigs ?? raw.TotalConfigs ?? 0,
  successCount: raw.successCount ?? raw.SuccessCount ?? 0,
  failureCount: raw.failureCount ?? raw.FailureCount ?? 0,
  processedCount:
    raw.processedCount ??
    raw.ProcessedCount ??
    (raw.successCount ?? raw.SuccessCount ?? 0) + (raw.failureCount ?? raw.FailureCount ?? 0),
  progress: raw.progress ?? raw.Progress,
  message: raw.message || raw.Message || '',
})

const normalizeDetail = (raw = {}) => ({
  id: raw.id || raw.Id || '',
  taskLogId: raw.taskLogId || raw.TaskLogId || '',
  configId: raw.configId ?? raw.ConfigId,
  fileName: raw.fileName || raw.FileName || '',
  fullFilePath: raw.fullFilePath || raw.FullFilePath || '',
  status: raw.status || raw.Status || '',
  startRow: raw.startRow ?? raw.StartRow ?? 0,
  processedRows: raw.processedRows ?? raw.ProcessedRows ?? 0,
  startTime: raw.startTime || raw.StartTime || '',
  endTime: raw.endTime || raw.EndTime || '',
  errorMessage: raw.errorMessage || raw.ErrorMessage || '',
  errorCategory: raw.errorCategory || raw.ErrorCategory || '',
  errorCategoryName: raw.errorCategoryName || raw.ErrorCategoryName || '',
  config: raw.config || raw.Config || null,
})

const normalizeConfigDetailGroup = (raw = {}) => ({
  type: 'group',
  configId: raw.configId ?? raw.ConfigId ?? 0,
  configName: raw.configName || raw.ConfigName || '',
  totalFiles: Number(raw.totalFiles ?? raw.TotalFiles ?? 0),
  successFiles: Number(raw.successFiles ?? raw.SuccessFiles ?? 0),
  warningFiles: Number(raw.warningFiles ?? raw.WarningFiles ?? 0),
  failedFiles: Number(raw.failedFiles ?? raw.FailedFiles ?? 0),
  processedRows: Number(raw.processedRows ?? raw.ProcessedRows ?? 0),
  latestDetails: (raw.latestDetails || raw.LatestDetails || []).map(normalizeDetail),
})

const normalizeConfigHistoryTaskGroup = (raw = {}) => ({
  type: 'taskGroup',
  taskLogId: raw.taskLogId || raw.TaskLogId || '',
  taskCode: raw.taskCode || raw.TaskCode || '',
  triggerType: raw.triggerType || raw.TriggerType || '',
  taskStatus: raw.taskStatus || raw.TaskStatus || '',
  startTime: raw.startTime || raw.StartTime || '',
  endTime: raw.endTime || raw.EndTime || '',
  totalFiles: Number(raw.totalFiles ?? raw.TotalFiles ?? 0),
  successFiles: Number(raw.successFiles ?? raw.SuccessFiles ?? 0),
  warningFiles: Number(raw.warningFiles ?? raw.WarningFiles ?? 0),
  failedFiles: Number(raw.failedFiles ?? raw.FailedFiles ?? 0),
  processedRows: Number(raw.processedRows ?? raw.ProcessedRows ?? 0),
  latestDetails: (raw.latestDetails || raw.LatestDetails || []).map(normalizeDetail),
})

const normalizeFileState = (raw = {}) => ({
  id: raw.id ?? raw.Id ?? '',
  configId: raw.configId ?? raw.ConfigId ?? 0,
  businessDate: raw.businessDate || raw.BusinessDate || '',
  fileName: raw.fileName || raw.FileName || '',
  fullPath: raw.fullPath || raw.FullPath || '',
  dataRowCount: Number(raw.dataRowCount ?? raw.DataRowCount ?? 0),
  lastStartRow: Number(raw.lastStartRow ?? raw.LastStartRow ?? 0),
  lastProcessedRows: Number(raw.lastProcessedRows ?? raw.LastProcessedRows ?? 0),
  lastTaskLogId: raw.lastTaskLogId || raw.LastTaskLogId || '',
  lastStatus: raw.lastStatus || raw.LastStatus || '',
  lastUpdateSource: raw.lastUpdateSource || raw.LastUpdateSource || '',
  isSealed: Boolean(raw.isSealed ?? raw.IsSealed ?? false),
  sealTime: raw.sealTime || raw.SealTime || '',
  lastScanTime: raw.lastScanTime || raw.LastScanTime || '',
  lastWriteTime: raw.lastWriteTime || raw.LastWriteTime || '',
  lastWriteTimeUtc: raw.lastWriteTimeUtc || raw.LastWriteTimeUtc || '',
  fileSize: raw.fileSize ?? raw.FileSize ?? null,
  createTime: raw.createTime || raw.CreateTime || '',
  updateTime: raw.updateTime || raw.UpdateTime || '',
})

const attachTaskGroupToDetails = (group = {}) => ({
  ...group,
  latestDetails: (group.latestDetails || []).map((detail) => ({
    ...detail,
    taskContext: {
      taskLogId: group.taskLogId,
      taskCode: group.taskCode,
      triggerType: group.triggerType,
      status: group.taskStatus,
      startTime: group.startTime,
      endTime: group.endTime,
      totalConfigs: group.totalFiles,
      successCount: group.successFiles,
      failureCount: group.failedFiles,
      processedCount: group.totalFiles,
      progress: 100,
    },
  })),
})

const normalizeConfig = (raw = {}) => ({
  ...raw,
  id: raw.id ?? raw.Id ?? 0,
  eqName: raw.eqName || raw.EqName || '',
  tableName: raw.tableName || raw.TableName || '',
  fileType: raw.fileType || raw.FileType || '',
  filePathPattern: raw.filePathPattern || raw.FilePathPattern || '',
  fileNamePattern: raw.fileNamePattern || raw.FileNamePattern || '',
  isEnabled: raw.isEnabled ?? raw.IsEnabled,
})

const getField = (source, keys, fallback = '--') => {
  if (!source) return fallback

  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value
  }

  return fallback
}

const getConfigName = (config) => getField(config, ['eqName', 'EqName', 'name', 'Name'], '')

const getDetailConfigName = (detail = {}) => {
  const directName = getConfigName(detail.config)
  if (directName) return directName

  const cachedName = getConfigName(configCacheById.value[detail.configId])
  return cachedName || '--'
}

const getDetailConfigDisplay = (detail = {}) => {
  const configName = getDetailConfigName(detail)

  if (configName && configName !== '--') {
    return {
      label: '设备',
      value: configName,
    }
  }

  return {
    label: '配置ID',
    value: detail.configId ?? '--',
  }
}

const fetchConfigForCache = async (configId) => {
  if (!configId || configCacheById.value[configId]) return

  try {
    const res = await api.fetchConfigById(configId)
    configCacheById.value = {
      ...configCacheById.value,
      [configId]: res?.data || res || null,
    }
  } catch (err) {
    console.error('预加载配置名称失败', err)
  }
}

const preloadDetailConfigs = (details = []) => {
  const configIds = [...new Set(details.map((item) => item.configId).filter(Boolean))]
  configIds.forEach((configId) => {
    void fetchConfigForCache(configId)
  })
}

const formatEnabled = (value) => {
  if (value === true) return '启用'
  if (value === false) return '禁用'
  return '--'
}

const formatPostProcessingType = (value) => {
  if (value === null || value === undefined || value === '') return '--'
  const type = Number(value)
  if (type === 0) return '无后处理'
  if (type === 1) return '服务'
  if (type === 2) return '存储过程'
  return '--'
}

const getEnabledClass = (value) => {
  if (value === true) return 'detail-tag--success'
  if (value === false) return 'detail-tag--muted'
  return 'detail-tag--default'
}

const getPostProcessingClass = (value) => {
  if (value === null || value === undefined || value === '') return 'detail-tag--default'
  const type = Number(value)
  if (type === 1) return 'detail-tag--blue'
  if (type === 2) return 'detail-tag--gold'
  return 'detail-tag--muted'
}

const detailModalSections = computed(() => {
  const detail = selectedDetail.value || {}
  const task = detail.taskContext || currentTask.value || {}
  const taskSummary = detail.taskContext ? task : currentTaskDisplaySummary.value
  const detailStatus = getDetailDisplayStatus(detail)
  const config = selectedDetailConfig.value || detail.config || {}

  return [
    {
      title: '任务信息',
      fields: [
        { label: '任务编号', value: task.taskCode || task.taskLogId || '--', valueClass: 'detail-value--primary' },
        { label: 'TaskLog ID', value: task.taskLogId || '--' },
        { label: '任务ID', value: task.taskId ?? '--' },
        {
          label: '触发类型',
          value: formatTriggerType(task.triggerType),
          tag: true,
          tagClass: getTriggerTypeClass(task.triggerType),
        },
        {
          label: '状态',
          value: taskSummary.status || '--',
          tag: true,
          tagClass: getStatusClass(taskSummary.status),
        },
        { label: '开始时间', value: formatDateTime(task.startTime) },
        { label: '结束时间', value: formatDateTime(task.endTime) },
        { label: '总任务数', value: task.totalConfigs ?? 0, valueClass: 'detail-value--primary' },
        { label: '已处理', value: taskSummary.processedCount ?? 0, valueClass: 'detail-value--blue' },
        { label: '成功', value: taskSummary.successCount ?? 0, valueClass: 'detail-value--success' },
        { label: '失败', value: taskSummary.failureCount ?? 0, danger: Number(taskSummary.failureCount || 0) > 0 },
        { label: '执行进度', value: `${progressPercent.value}%`, valueClass: 'detail-value--primary' },
      ],
    },
    {
      title: '配置信息',
      fields: [
        { label: '配置ID', value: getField(config, ['id', 'Id'], detail.configId ?? '--'), valueClass: 'detail-value--primary' },
        { label: '设备名称', value: getField(config, ['eqName', 'EqName']), valueClass: 'detail-value--primary' },
        { label: '目标表名', value: getField(config, ['tableName', 'TableName']), valueClass: 'detail-value--blue' },
        { label: '文件路径规则', value: getField(config, ['filePathPattern', 'FilePathPattern']) },
        { label: '文件名规则', value: getField(config, ['fileNamePattern', 'FileNamePattern']) },
        {
          label: '文件类型',
          value: getField(config, ['fileType', 'FileType']),
          tag: true,
          tagClass: 'detail-tag--blue',
        },
        { label: '表头行号', value: getField(config, ['headerRow', 'HeaderRow']) },
        { label: '数据起始行', value: getField(config, ['startRow', 'StartRow']) },
        {
          label: '后处理类型',
          value: formatPostProcessingType(getField(config, ['postProcessingType', 'PostProcessingType'], null)),
          tag: true,
          tagClass: getPostProcessingClass(getField(config, ['postProcessingType', 'PostProcessingType'], null)),
        },
        { label: '存储过程/服务名', value: getField(config, ['procedureName', 'ProcedureName', 'serviceName', 'ServiceName']), valueClass: 'detail-value--primary' },
        { label: '扩展字段', value: getField(config, ['extFields', 'ExtFields']) },
        {
          label: '启用状态',
          value: formatEnabled(getField(config, ['isEnabled', 'IsEnabled'], null)),
          tag: true,
          tagClass: getEnabledClass(getField(config, ['isEnabled', 'IsEnabled'], null)),
        },
      ],
    },
    {
      title: '日志明细',
      fields: [
        { label: '文件名', value: getDetailTitle(detail), valueClass: 'detail-value--primary' },
        { label: '完整路径', value: detail.fullFilePath || '--' },
        { label: '配置ID', value: detail.configId ?? '--', valueClass: 'detail-value--primary' },
        {
          label: '状态',
          value: detailStatus || '--',
          tag: true,
          tagClass: getStatusClass(detailStatus),
        },
        { label: '起始行', value: detail.startRow ?? 0 },
        { label: '处理行数', value: detail.processedRows ?? 0, valueClass: 'detail-value--blue' },
        { label: '开始时间', value: formatDateTime(detail.startTime) },
        { label: '结束时间', value: formatDateTime(detail.endTime) },
        {
          label: '报错分类',
          value: detail.errorCategoryName || '--',
          tag: Boolean(detail.errorCategoryName),
          tagClass: 'detail-tag--gold',
        },
        {
          label: '错误信息',
          value: detail.errorMessage || '--',
          danger: Boolean(detail.errorMessage) && !isWarningDetail(detail),
          warning: isWarningDetail(detail),
        },
      ],
    },
  ]
})

const formatDateTime = (value) => {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const formatDate = (value) => {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const formatFileSize = (value) => {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const formatPercent = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return '0%'
  return `${num.toFixed(num >= 10 ? 0 : 1)}%`
}

const getTodayDateString = () => {
  const today = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
}

const getStatusClass = (status) => {
  const s = normalizeStatus(status)

  if (s === 'success') return 'status-tag--success'
  if (s === 'failed') return 'status-tag--failed'
  if (s === 'running') return 'status-tag--running'
  if (s === 'warning') return 'status-tag--warning'
  if (s === 'new') return 'status-tag--new'
  if (s === 'partialsuccess') return 'status-tag--partial'
  if (s === 'cancelled' || s === 'canceled') return 'status-tag--cancelled'
  return 'status-tag--default'
}

const formatTriggerType = (triggerType) => {
  const type = String(triggerType || '').toUpperCase()

  if (type === 'MAN') return '手动触发'
  if (type === 'SCH') return '定时执行'

  return '--'
}

const getTriggerTypeClass = (triggerType) => {
  const type = String(triggerType || '').toUpperCase()

  if (type === 'MAN') return 'trigger-tag--manual'
  if (type === 'SCH') return 'trigger-tag--scheduled'

  return 'trigger-tag--default'
}

const shouldLoadWarningSummary = (task = {}) =>
  Number(task.failureCount || 0) > 0 || ['failed', 'partialsuccess'].includes(normalizeStatus(task.status))

const loadTaskWarningSummaryLegacy = async (task = {}) => {
  const taskLogId = task.taskLogId
  if (!taskLogId || taskDisplaySummaryById.value[taskLogId] || warningSummaryLoadingIds.has(taskLogId)) return

  warningSummaryLoadingIds.add(taskLogId)
  try {
    const res = await api.fetchTaskLogDetails(taskLogId)
    const normalizedDetails = (res?.data || res || []).map(normalizeDetail)
    detailCacheByTaskId.value = {
      ...detailCacheByTaskId.value,
      [taskLogId]: normalizedDetails,
    }
    preloadDetailConfigs(normalizedDetails)
    setTaskDisplaySummary(taskLogId, normalizedDetails)
  } catch (err) {
    console.error('加载任务告警统计失败', err)
  } finally {
    warningSummaryLoadingIds.delete(taskLogId)
  }
}

const hydrateTaskWarningSummaries = (list = []) => {
  const taskLogIds = list
    .filter(shouldLoadWarningSummary)
    .map((task) => task.taskLogId)
    .filter((taskLogId) => taskLogId && !taskDisplaySummaryById.value[taskLogId] && !warningSummaryLoadingIds.has(taskLogId))

  if (!taskLogIds.length) return

  taskLogIds.forEach((taskLogId) => warningSummaryLoadingIds.add(taskLogId))

  void (async () => {
    try {
      const res = await api.fetchTaskLogWarningSummary(taskLogIds)
      const rows = res?.data || res || []
      const nextSummary = { ...taskDisplaySummaryById.value }

      taskLogIds.forEach((taskLogId) => {
        nextSummary[taskLogId] = { warningCount: 0 }
      })

      ;(Array.isArray(rows) ? rows : []).forEach((row) => {
        const taskLogId = row.taskLogId || row.TaskLogId
        if (!taskLogId) return
        nextSummary[taskLogId] = {
          warningCount: Number(row.warningCount ?? row.WarningCount ?? 0),
        }
      })

      taskDisplaySummaryById.value = nextSummary
    } catch (err) {
      console.error('鍔犺浇浠诲姟鍛婅缁熻澶辫触', err)
    } finally {
      taskLogIds.forEach((taskLogId) => warningSummaryLoadingIds.delete(taskLogId))
    }
  })()
}

const hydrateTaskFileSummaries = (list = []) => {
  const taskLogIds = list
    .map((task) => task.taskLogId)
    .filter((taskLogId) => taskLogId && !taskFileSummaryById.value[taskLogId] && !taskFileSummaryLoadingIds.has(taskLogId))

  if (!taskLogIds.length) return

  taskLogIds.forEach((taskLogId) => taskFileSummaryLoadingIds.add(taskLogId))

  void (async () => {
    await Promise.all(taskLogIds.map(async (taskLogId) => {
      try {
        const res = await api.fetchTaskDetailSummary(taskLogId)
        const summary = normalizeTaskFileSummary(res?.data || res || {})
        taskFileSummaryById.value = {
          ...taskFileSummaryById.value,
          [taskLogId]: summary,
        }
      } catch (err) {
        console.error('加载历史任务文件统计失败', err)
      } finally {
        taskFileSummaryLoadingIds.delete(taskLogId)
      }
    }))
  })()
}

const getHistoryQueryRange = () => ({
  startTime: effectiveHistoryStartDate.value || undefined,
  endTime: effectiveHistoryEndDate.value
    ? getDateStringAfterDays(effectiveHistoryEndDate.value, 1)
    : undefined,
})

const getFileStateQueryRange = () => ({
  startTime: effectiveHistoryStartDate.value || undefined,
  endTime: effectiveHistoryEndDate.value || undefined,
})

const hydrateConfigHistorySummaries = async (list = configList.value) => {
  const configIds = list
    .map((config) => config.id)
    .filter((id) => Number(id) > 0)

  if (!configIds.length) return

  try {
    const res = await api.fetchConfigHistorySummary(configIds, getHistoryQueryRange())
    const summaries = res?.data || res || []
    const next = {}
    ;(Array.isArray(summaries) ? summaries : []).forEach((item = {}) => {
      const configId = item.configId ?? item.ConfigId
      if (!configId) return
      next[configId] = {
        totalFiles: Number(item.totalFiles ?? item.TotalFiles ?? 0),
        successFiles: Number(item.successFiles ?? item.SuccessFiles ?? 0),
        warningFiles: Number(item.warningFiles ?? item.WarningFiles ?? 0),
        failedFiles: Number(item.failedFiles ?? item.FailedFiles ?? 0),
        processedRows: Number(item.processedRows ?? item.ProcessedRows ?? 0),
        errorCategories: [],
      }
    })
    configHistorySummaryById.value = next
  } catch (err) {
    console.error('加载配置历史汇总失败', err)
  }
}

const hydrateConfigFileStateSummaries = async (list = configList.value) => {
  const configIds = list
    .map((config) => config.id)
    .filter((id) => Number(id) > 0)

  if (!configIds.length) return

  try {
    const res = await api.fetchConfigFileStateSummary(configIds, getFileStateQueryRange())
    const summaries = res?.data || res || []
    const next = {}
    ;(Array.isArray(summaries) ? summaries : []).forEach((item = {}) => {
      const configId = item.configId ?? item.ConfigId
      if (!configId) return
      next[configId] = {
        totalFiles: Number(item.totalFiles ?? item.TotalFiles ?? 0),
        successFiles: Number(item.successFiles ?? item.SuccessFiles ?? 0),
        warningFiles: 0,
        failedFiles: Number(item.failedFiles ?? item.FailedFiles ?? 0),
        processedRows: Number(item.processedRows ?? item.ProcessedRows ?? 0),
        newFiles: Number(item.newFiles ?? item.NewFiles ?? 0),
        errorCategories: [],
      }
    })
    configFileStateSummaryById.value = next
  } catch (err) {
    console.error('加载配置文件状态汇总失败', err)
  }
}

const loadConfigList = async ({ silent = false } = {}) => {
  if (!silent) {
    listLoading.value = true
  }

  try {
    const res = await api.fetchConfigs()
    const rawList = res?.data || res || []
    const list = (Array.isArray(rawList) ? rawList : []).map(normalizeConfig)

    configList.value = list
    taskListPageNo.value = Math.min(taskListPageNo.value, Math.max(1, Math.ceil(list.length / taskListPageSize.value)))
    if (isFileLogView.value) {
      await hydrateConfigFileStateSummaries(list)
    } else {
      await hydrateConfigHistorySummaries(list)
    }

    const currentId = selectedConfig.value?.id
    const matched = currentId ? list.find((item) => item.id === currentId) : null
    if (matched) {
      selectedConfig.value = matched
      if (isFileLogView.value) {
        await loadConfigFileStates(matched.id, { silent: true })
      } else {
        await loadConfigHistory(matched.id, { silent: true })
      }
      return
    }

    if (list.length) {
      await selectConfig(list[0])
    } else {
      selectedConfig.value = null
      configHistoryTaskGroups.value = []
      fileStateList.value = []
      taskDetails.value = []
      detailTotal.value = 0
    }
  } catch (err) {
    console.error('加载配置列表失败', err)
    notify.error('加载配置列表失败')
  } finally {
    if (!silent) {
      listLoading.value = false
    }
  }
}

const loadTaskList = async (pageNo = taskListPageNo.value, { silent = false } = {}) => {
  if (!silent) {
    listLoading.value = true
  }
  try {
    const params = {
      pageNo,
      pageSize: taskListPageSize.value,
    }

    if (effectiveHistoryStartDate.value) params.startTime = effectiveHistoryStartDate.value
    if (effectiveHistoryEndDate.value) params.endTime = getDateStringAfterDays(effectiveHistoryEndDate.value, 1)

    const res = await api.fetchTaskLogs(params)
    const rawList = res?.data?.items || res?.data || res || []
    const list = Array.isArray(rawList) ? rawList.map(normalizeTask) : []

    taskList.value = list
    taskListTotal.value = res?.data?.total ?? list.length
    taskListPageNo.value = res?.data?.pageNo ?? pageNo
    taskListPageSize.value = res?.data?.pageSize ?? taskListPageSize.value
    hydrateTaskWarningSummaries(list)
    hydrateTaskFileSummaries(list)

    if (!silent && props.initialTaskLogId) {
      const matched = list.find((item) => item.taskLogId === props.initialTaskLogId)
      if (matched) {
        await selectTask(matched)
        return
      }
    }

    if (currentTask.value?.taskLogId) {
      const currentInPage = list.find((item) => item.taskLogId === currentTask.value.taskLogId)
      if (currentInPage) {
        currentTask.value = normalizeTask(currentInPage)
        return
      }
    }

    if (!silent && list.length) {
      await selectTask(list[0])
    } else if (!silent) {
      currentTask.value = null
      taskDetails.value = []
      detailTotal.value = 0
    }
  } catch (err) {
    console.error('加载任务日志列表失败', err)
    notify.error('加载任务日志列表失败')
  } finally {
    if (!silent) {
      listLoading.value = false
    }
  }
}

const getDateStringAfterDays = (dateString, days = 0) => {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const changeTaskListPage = async (page) => {
  if (page < 1 || page > totalPages.value || page === taskListPageNo.value) return
  if (usesConfigRightList.value) {
    taskListPageNo.value = page
  } else {
    await loadTaskList(page)
  }
}

const changeDetailPage = async (page) => {
  if (page < 1 || page > detailTotalPages.value || page === detailPageNo.value) return
  if (isFileLogView.value) {
    await loadConfigFileStates(selectedConfig.value?.id, { pageNo: page })
  } else if (isConfigLogView.value) {
    await loadConfigHistory(selectedConfig.value?.id, { pageNo: page })
  } else {
    await loadTaskDetails(currentTask.value?.taskLogId, { pageNo: page })
  }
}

const changeDetailPageSize = async () => {
  detailPageNo.value = 1
  if (isFileLogView.value) {
    await loadConfigFileStates(selectedConfig.value?.id, { pageNo: 1 })
  } else if (isConfigLogView.value) {
    await loadConfigHistory(selectedConfig.value?.id, { pageNo: 1 })
  } else {
    await loadTaskDetails(currentTask.value?.taskLogId, { pageNo: 1 })
  }
}

const loadTaskStatus = async (taskLogId) => {
  if (!taskLogId) return

  try {
    const res = await api.fetchTaskLogStatus(taskLogId)
    currentTask.value = normalizeTask(res?.data || res || {})
    lastRefreshTime.value = new Date()

    taskList.value = taskList.value.map((item) =>
      item.taskLogId === currentTask.value.taskLogId ? { ...item, ...currentTask.value } : item,
    )
  } catch (err) {
    console.error('加载任务状态失败', err)
    notify.error('加载任务状态失败')
  }
}

const loadTaskFileSummary = async (taskLogId) => {
  if (!taskLogId) return

  try {
    const res = await api.fetchTaskDetailSummary(taskLogId)
    const summary = normalizeTaskFileSummary(res?.data || res || {})
    taskFileSummaryById.value = {
      ...taskFileSummaryById.value,
      [taskLogId]: summary,
    }
  } catch (err) {
    console.error('加载任务文件统计失败', err)
  }
}

const getDetailStatusParam = () => {
  const tag = activeDetailTag.value
  const normalizedTag = normalizeStatus(tag)
  return normalizedTag === 'all' || normalizedTag === 'new' ? undefined : tag
}

const isProcessedRowsFilterActive = () => normalizeStatus(activeDetailTag.value) === 'new'

const loadTaskDetails = async (taskLogId, { pageNo = detailPageNo.value, silent = false } = {}) => {
  if (!taskLogId) return

  if (!silent) {
    detailsLoading.value = true
  }
  try {
    const res = await api.fetchTaskLogDetails(taskLogId, {
      pageNo,
      pageSize: detailPageSize.value,
      status: getDetailStatusParam(),
      errorCategory: activeDetailTag.value === 'Success' || isProcessedRowsFilterActive() ? undefined : activeErrorCategory.value || undefined,
      hasProcessedRows: isProcessedRowsFilterActive() ? true : undefined,
      viewMode: isConfigLogView.value ? 'config' : undefined,
    })
    const payload = res?.data || res || {}
    const rawItems = Array.isArray(payload) ? payload : payload.items || payload.Items || []
    const normalizedDetails = isConfigLogView.value
      ? rawItems
          .map(normalizeConfigDetailGroup)
          .flatMap((group) => group.latestDetails)
      : rawItems.map(normalizeDetail)

    preloadDetailConfigs(normalizedDetails)
    taskDetailConfigGroups.value = isConfigLogView.value
      ? rawItems.map(normalizeConfigDetailGroup)
      : []
    taskDetails.value = normalizedDetails
    fileStateList.value = []
    detailTotal.value = Array.isArray(payload) ? normalizedDetails.length : payload.total ?? payload.Total ?? normalizedDetails.length
    detailPageNo.value = Array.isArray(payload) ? pageNo : payload.pageNo ?? payload.PageNo ?? pageNo
    detailPageSize.value = Array.isArray(payload)
      ? detailPageSize.value
      : payload.pageSize ?? payload.PageSize ?? detailPageSize.value
  } catch (err) {
    console.error('加载任务明细失败', err)
    notify.error('加载任务明细失败')
  } finally {
    if (!silent) {
      detailsLoading.value = false
    }
  }
}

const loadConfigHistory = async (configId = selectedConfig.value?.id, { pageNo = detailPageNo.value, silent = false } = {}) => {
  if (!configId) return

  if (!silent) {
    detailsLoading.value = true
  }

  try {
    const res = await api.fetchConfigHistory(configId, {
      ...getFileStateQueryRange(),
      pageNo,
      pageSize: detailPageSize.value,
      status: getDetailStatusParam(),
      errorCategory: activeDetailTag.value === 'Success' || isProcessedRowsFilterActive() ? undefined : activeErrorCategory.value || undefined,
      hasProcessedRows: isProcessedRowsFilterActive() ? true : undefined,
    })
    const payload = res?.data || res || {}
    const rawItems = Array.isArray(payload) ? payload : payload.items || payload.Items || []
    const groups = rawItems.map(normalizeConfigHistoryTaskGroup).map(attachTaskGroupToDetails)
    const details = groups.flatMap((group) => group.latestDetails)

    preloadDetailConfigs(details)
    configHistoryTaskGroups.value = groups
    taskDetailConfigGroups.value = []
    taskDetails.value = details
    fileStateList.value = []
    detailTotal.value = Array.isArray(payload) ? groups.length : payload.total ?? payload.Total ?? groups.length
    detailPageNo.value = Array.isArray(payload) ? pageNo : payload.pageNo ?? payload.PageNo ?? pageNo
    detailPageSize.value = Array.isArray(payload)
      ? detailPageSize.value
      : payload.pageSize ?? payload.PageSize ?? detailPageSize.value
  } catch (err) {
    console.error('加载配置采集历史失败', err)
    notify.error('加载配置采集历史失败')
  } finally {
    if (!silent) {
      detailsLoading.value = false
    }
  }
}

const loadConfigFileStates = async (configId = selectedConfig.value?.id, { pageNo = detailPageNo.value, silent = false } = {}) => {
  if (!configId) return

  if (!silent) {
    detailsLoading.value = true
  }

  try {
    const res = await api.fetchConfigFileStates(configId, {
      ...getHistoryQueryRange(),
      pageNo,
      pageSize: detailPageSize.value,
      status: getDetailStatusParam(),
      hasProcessedRows: isProcessedRowsFilterActive() ? true : undefined,
    })
    const payload = res?.data || res || {}
    const rawItems = Array.isArray(payload) ? payload : payload.items || payload.Items || []

    fileStateList.value = rawItems.map(normalizeFileState)
    configHistoryTaskGroups.value = []
    taskDetailConfigGroups.value = []
    taskDetails.value = []
    detailTotal.value = Array.isArray(payload) ? fileStateList.value.length : payload.total ?? payload.Total ?? fileStateList.value.length
    detailPageNo.value = Array.isArray(payload) ? pageNo : payload.pageNo ?? payload.PageNo ?? pageNo
    detailPageSize.value = Array.isArray(payload)
      ? detailPageSize.value
      : payload.pageSize ?? payload.PageSize ?? detailPageSize.value
  } catch (err) {
    console.error('加载配置文件状态失败', err)
    notify.error('加载配置文件状态失败')
  } finally {
    if (!silent) {
      detailsLoading.value = false
    }
  }
}

const openDetailModal = async (item) => {
  selectedDetail.value = item
  selectedDetailConfig.value = item.config || null
  detailModalLoading.value = false
  detailModalVisible.value = true

  if (!item.configId || item.config) return

  const cachedConfig = configCacheById.value[item.configId]
  if (cachedConfig) {
    selectedDetailConfig.value = cachedConfig
    return
  }

  detailModalLoading.value = true
  try {
    const res = await api.fetchConfigById(item.configId)
    const config = res?.data || res || null
    if (selectedDetail.value !== item) return
    selectedDetailConfig.value = config
    configCacheById.value = {
      ...configCacheById.value,
      [item.configId]: config,
    }
  } catch (err) {
    console.error('加载配置详情失败', err)
    notify.error('加载配置详情失败')
  } finally {
    detailModalLoading.value = false
  }
}

const closeDetailModal = () => {
  detailModalVisible.value = false
}

const selectTask = async (item) => {
  currentTask.value = normalizeTask(item)
  activeDetailTag.value = 'All'
  activeErrorCategory.value = ''
  detailPageNo.value = 1
  detailTotal.value = 0
  taskDetails.value = []
  taskDetailConfigGroups.value = []
  emit('task-selected', currentTask.value)

  await Promise.all([
    loadTaskStatus(currentTask.value.taskLogId),
    loadTaskFileSummary(currentTask.value.taskLogId),
    loadTaskDetails(currentTask.value.taskLogId),
  ])
}

const selectConfig = async (item) => {
  selectedConfig.value = normalizeConfig(item)
  activeDetailTag.value = 'All'
  activeErrorCategory.value = ''
  detailPageNo.value = 1
  detailTotal.value = 0
  taskDetails.value = []
  taskDetailConfigGroups.value = []
  configHistoryTaskGroups.value = []
  fileStateList.value = []

  if (isFileLogView.value) {
    await loadConfigFileStates(selectedConfig.value.id, { pageNo: 1 })
  } else {
    await loadConfigHistory(selectedConfig.value.id, { pageNo: 1 })
  }
}

const refreshCurrentTask = async ({ silent = false } = {}) => {
  if (usesConfigRightList.value) {
    if (isFileLogView.value) {
      await Promise.all([
        hydrateConfigFileStateSummaries(),
        loadConfigFileStates(selectedConfig.value?.id, { silent }),
      ])
    } else {
      await Promise.all([
        hydrateConfigHistorySummaries(),
        loadConfigHistory(selectedConfig.value?.id, { silent }),
      ])
    }
    return
  }

  if (!currentTask.value?.taskLogId) {
    if (!silent) {
      notify.warning('当前没有可刷新的任务')
    }
    return
  }

  await Promise.all([
    loadTaskStatus(currentTask.value.taskLogId),
    loadTaskFileSummary(currentTask.value.taskLogId),
    loadTaskDetails(currentTask.value.taskLogId, { force: true, silent }),
  ])
}

const refreshHistoryList = async () => {
  if (usesConfigRightList.value) {
    await loadConfigList()
  } else {
    await loadTaskList(taskListPageNo.value)
  }
}

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
  polling.value = false
}

const refreshRunningTaskState = async () => {
  if (pollingRefreshing.value) return
  pollingRefreshing.value = true
  try {
    await refreshCurrentTask({ silent: true })

    if (usesConfigRightList.value) {
      await loadConfigList({ silent: true })
    } else {
      await loadTaskList(taskListPageNo.value, { silent: true })
    }
  } finally {
    pollingRefreshing.value = false
  }
}

const startPolling = () => {
  if (pollingTimer.value) return
  polling.value = true

  pollingTimer.value = setInterval(async () => {
    await refreshRunningTaskState()
    if (!hasRunningTask.value) {
      stopPolling()
    }
  }, 3000)
}

const syncPollingState = () => {
  if (hasRunningTask.value) {
    startPolling()
  } else {
    stopPolling()
  }
}

watch(hasRunningTask, syncPollingState)

watch(
  () => props.initialTaskLogId,
  async (val) => {
    if (!val || !taskList.value.length) return
    const matched = taskList.value.find((item) => item.taskLogId === val)
    if (matched) {
      await selectTask(matched)
    }
  },
)

// 获取一个月起点
watch(
  () => props.logViewMode,
  async () => {
    detailPageNo.value = 1
    detailTotal.value = 0
    taskDetails.value = []
    taskDetailConfigGroups.value = []
    configHistoryTaskGroups.value = []
    fileStateList.value = []
    if (!visibleDetailFilterTags.value.includes(activeDetailTag.value)) {
      activeDetailTag.value = 'All'
    }

    if (usesConfigRightList.value) {
      taskListPageNo.value = 1
      await loadConfigList()
      return
    }

    if (currentTask.value?.taskLogId) {
      await loadTaskDetails(currentTask.value.taskLogId, { pageNo: 1 })
    } else {
      await loadTaskList(1)
    }
  },
)

const getDateStringOneMonthAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 默认查看一个月
onMounted(async () => {
  const todayDate = getTodayDateString()
  const oneMonthAgoDate = getDateStringOneMonthAgo()

  historyStartDateInput.value = oneMonthAgoDate
  historyEndDateInput.value = todayDate
  effectiveHistoryStartDate.value = oneMonthAgoDate
  effectiveHistoryEndDate.value = todayDate

  if (usesConfigRightList.value) {
    await loadConfigList()
  } else {
    await loadTaskList()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})

defineExpose({
  refreshHistoryList,
  refreshCurrentTask,
  getCurrentTask: () => currentTask.value,
})
</script>

<style scoped>
.task-log-view {
  width: 100%;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.task-log-card {
  background: #fafafa;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 12px;
  padding: 16px;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-card__header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.task-log-card__header-left,
.task-log-card__header-right {
  flex: 0 0 50%;
  min-width: 0;
}

.task-log-card__header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-left: 20px;
  border-left: 1px solid #eef2f6;
  box-sizing: border-box;
}

.task-log-history-header {
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.task-log-history-header__left {
  min-width: 0;
}

.task-log-history-header__right {
  margin-left: auto;
}

.history-date-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 8px 12px;
}

.history-date-filter__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.history-date-filter__input {
  min-width: 150px;
  height: 30px;
}

.history-date-filter__clear {
  height: 30px;
  min-width: 64px;
}

.history-date-filter__error {
  margin-bottom: 12px;
  font-size: 12px;
  color: #cf1322;
}

.task-log-card__header-left,
.task-log-card__header-right {
  flex: 0 0 50%;
  min-width: 0;
}

.task-log-card__header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-left: 20px;
  border-left: 1px solid #eef2f6;
  box-sizing: border-box;
}

.task-log-history {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.task-log-history-header {
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.task-log-history-header__left {
  min-width: 0;
}

.task-log-history-header__right {
  margin-left: auto;
}

.history-date-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 8px 12px;
}

.history-date-filter__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.history-date-filter__input {
  min-width: 150px;
  height: 30px;
}

.history-date-filter__clear {
  height: 30px;
  min-width: 64px;
}

.history-date-filter__error {
  margin-bottom: 12px;
  font-size: 12px;
  color: #cf1322;
}

.task-log-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-log-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.task-log-card__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-log-current {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-summary-panel {
  flex-shrink: 0;
}

.summary-toggle-btn {
  height: 26px;
  padding: 0 12px;
  border: 1px solid #52c41a;
  border-radius: 999px;
  background: #fff;
  color: #52c41a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.summary-toggle-btn:hover {
  background: #f6ffed;
  border-color: #3fad0f;
  color: #3fad0f;
}

.task-log-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.task-log-summary-item {
  background: #fff;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.task-log-summary-item--clickable {
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.task-log-summary-item--clickable:hover {
  border-color: #52c41a;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.12);
  transform: translateY(-1px);
}

.task-log-summary-item--clickable:focus-visible {
  outline: 2px solid rgba(82, 196, 26, 0.35);
  outline-offset: 2px;
}

.task-log-summary-item--active {
  background: #f6ffed;
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.14);
}

.task-log-summary-trigger {
  position: absolute;
  top: 12px;
  right: 12px;
}

.task-log-summary-item .label {
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-log-summary-item .value {
  font-size: 15px;
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-progress-block {
  background: #fff;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.task-progress-meta,
.task-progress-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-progress-meta {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-progress-foot {
  margin-top: 8px;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #f0f0f0;
  overflow: hidden;
}

.task-progress-bar__inner {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #52c41a 0%, #95de64 100%);
  transition: width 0.3s ease;
}

.task-log-detail {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-file-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  padding-top: 2px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.task-log-file-summary-item,
.task-log-file-summary-rows {
  min-height: 54px;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 10px;
  background: #fff;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.task-log-file-summary-item {
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.task-log-file-summary-item:hover {
  border-color: #52c41a;
  background: #fbfff7;
  box-shadow: inset 0 0 0 1px rgba(82, 196, 26, 0.18);
}

.task-log-file-summary-item:focus-visible {
  outline: 2px solid rgba(82, 196, 26, 0.35);
  outline-offset: 2px;
}

.task-log-file-summary-item--active {
  background: #f6ffed;
  border-color: #52c41a;
  box-shadow: inset 0 0 0 1px rgba(82, 196, 26, 0.28);
}

.task-log-file-summary-item .label,
.task-log-file-summary-rows {
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-log-file-summary-item .value {
  font-size: 16px;
  font-weight: 700;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.task-log-file-summary-rows {
  white-space: normal;
  align-items: flex-start;
  font-weight: 600;
}

.task-log-error-category-panel {
  border: 1px solid #ffccc7;
  border-radius: 10px;
  background: #fffafa;
  padding: 10px 12px 12px;
  margin: 0 0 12px;
  flex-shrink: 0;
}

.task-log-error-category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.task-log-error-category-head > div {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.task-log-error-category-head strong {
  color: #cf1322;
  font-size: 13px;
}

.task-log-error-category-head span {
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
  font-size: 12px;
}

.task-log-error-category-clear {
  height: 24px;
  padding: 0 10px;
  border: 1px solid #ffa39e;
  border-radius: 999px;
  background: #fff;
  color: #cf1322;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.task-log-error-category-clear:hover {
  background: #fff1f0;
}

.task-log-error-category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.task-log-error-category-item {
  min-height: 48px;
  border: 1px solid #ffd8bf;
  border-radius: 10px;
  background: #fff7e6;
  padding: 7px 10px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "label count"
    "percent percent";
  gap: 3px 8px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.task-log-error-category-item:hover,
.task-log-error-category-item--active {
  border-color: #ff7875;
  background: #fff1f0;
  box-shadow: inset 0 0 0 1px rgba(255, 120, 117, 0.18);
}

.task-log-error-category-item .label {
  grid-area: label;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-log-error-category-item strong {
  grid-area: count;
  color: #cf1322;
  font-size: 15px;
}

.task-log-error-category-item .percent {
  grid-area: percent;
  color: #8c8c8c;
  font-size: 11px;
}

.task-log-error-category-empty {
  padding: 10px 12px;
  border: 1px dashed #ffa39e;
  border-radius: 8px;
  background: #fff;
  color: #cf1322;
  font-size: 12px;
}

.task-log-detail-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-log-filter-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 0;
}

.task-log-section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
  flex-shrink: 0;
}

.task-log-detail-list,
.task-log-history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
  padding-right: 4px;
  padding-bottom: 36px;
}

.task-log-history-list {
  padding-bottom: 12px;
}

.task-log-detail-list {
  padding-bottom: 8px;
}

.task-log-detail-item,
.task-log-history-item {
  background: #fff;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s ease;
}

.task-log-detail-item {
  cursor: pointer;
}

.task-log-config-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid #d9f7be;
  border-radius: 8px;
  background: #f6ffed;
  color: #237804;
  font-size: 13px;
  font-weight: 600;
}

.task-log-task-group {
  align-items: flex-start;
  flex-wrap: wrap;
}

.task-log-task-group__main {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 220px;
}

.task-log-config-group strong {
  min-width: 32px;
  text-align: right;
}

.task-log-config-group__stats {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #389e0d;
}

.task-log-config-group__stats span {
  padding: 2px 7px;
  border: 1px solid #b7eb8f;
  border-radius: 999px;
  background: #fff;
}

.task-log-detail-item.is-warning {
  background: #fff;
  border-color: #ffe58f;
}

.task-log-detail-item:focus-visible {
  outline: 2px solid rgba(82, 196, 26, 0.35);
  outline-offset: 2px;
}

.task-log-history-item {
  cursor: pointer;
}

.task-log-history-item:hover,
.task-log-history-item.active,
.task-log-detail-item:hover {
  border-color: var(--ant-primary, #52c41a);
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.12);
}

.task-log-detail-item__top,
.task-log-detail-item__meta,
.task-log-history-item__meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px 24px;
  flex-wrap: wrap;
}

.task-log-history-item__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.task-log-history-item__top--config {
  align-items: flex-start;
}

.task-log-detail-item__top,
.task-log-history-item__top {
  margin-bottom: 8px;
}

.task-log-detail-item__meta,
.task-log-history-item__meta {
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
  margin-top: 4px;
}

.task-log-detail-item__meta {
  gap: 8px 10px;
}

.task-log-detail-item__meta--combined {
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 8px 16px;
}

.task-log-detail-item__meta-left,
.task-log-detail-item__meta-time {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.task-log-detail-item__meta-left {
  min-width: 0;
}

.task-log-detail-item__meta-time {
  margin-left: auto;
  justify-content: flex-end;
}

.task-log-row-metric {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f0f7ff;
  border: 1px solid #b7dcff;
  color: #096dd9;
  line-height: 1.45;
}

.task-log-row-metric strong {
  font-size: 13px;
  color: #0958d9;
}

.task-log-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 6px;
  line-height: 1.45;
  white-space: nowrap;
}

.task-log-meta-chip strong {
  font-size: 13px;
  font-weight: 700;
}

.task-log-meta-chip--config {
  background: #f9f0ff;
  border: 1px solid #d3adf7;
  color: #722ed1;
}

.task-log-meta-chip--config strong {
  color: #531dab;
}

.task-log-meta-chip--time {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
}

.task-log-meta-chip--time strong {
  color: #237804;
}

.task-log-file {
  font-weight: 700;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

.task-log-file-path {
  margin: -2px 0 8px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.task-log-error {
  margin-top: 8px;
  padding: 8px 10px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #cf1322;
  font-size: 12px;
  word-break: break-word;
}

.task-log-warning {
  background: #fffbe6;
  border-color: #ffe58f;
  color: #d48806;
}

.task-log-error-category-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  margin-right: 8px;
  padding: 0 8px;
  border-radius: 999px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.task-log-history-id {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  font-weight: 600;
}

.task-log-config-title {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  line-height: 1.4;
  word-break: normal;
}

.task-log-config-title__prefix {
  color: #237804;
  font-size: 13px;
  font-weight: 700;
}

.task-log-config-title strong {
  min-width: 0;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-log-config-metrics {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  max-width: 62%;
}

.warning-summary-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  background: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.failed-summary-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  background: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffccc7;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.processed-rows-summary-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  background: #e6f4ff;
  color: #1677ff;
  border: 1px solid #91caff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.task-log-history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0 4px;
  margin-top: 12px;
  border-top: 1px solid #eef2f6;
  flex-shrink: 0;
  background: #fafafa;
  padding-bottom: 25px;
}

.task-log-history-footer__summary {
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.task-log-history-pagination {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

.task-log-detail-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0 22px;
  margin-top: 4px;
  border-top: 1px solid #eef2f6;
  flex-shrink: 0;
}

.task-log-detail-total {
  margin-right: 4px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
  font-size: 13px;
}

.task-log-page-btn {
  min-width: 36px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
  font-size: 14px;
  line-height: 30px;
  cursor: pointer;
}

.task-log-page-btn.active {
  border-color: var(--ant-primary, #52c41a);
  background: var(--ant-primary, #52c41a);
  color: #fff;
  font-weight: 600;
}

.task-log-page-btn:disabled {
  cursor: not-allowed;
  color: rgba(0, 0, 0, 0.25);
  background: #f5f5f5;
}

.task-log-page-size {
  height: 32px;
  min-width: 56px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  padding: 0 8px;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  box-sizing: border-box;
  flex-shrink: 0;
}

.status-tag--filter {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.status-tag--filter:hover {
  transform: translateY(-1px);
}

.status-tag--active {
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.18);
}

.status-tag--success {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.status-tag--failed {
  background: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffccc7;
}

.status-tag--running {
  background: #e6f7ff;
  color: #096dd9;
  border: 1px solid #91d5ff;
}

.status-tag--partial {
  background: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
}

.status-tag--warning {
  background: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
}

.status-tag--new {
  background: #e6f4ff;
  color: #1677ff;
  border: 1px solid #91caff;
}

.status-tag--cancelled {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #bfbfbf;
}

.status-tag--default {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.success-text {
  color: #389e0d !important;
}

.danger-text {
  color: #cf1322 !important;
}

.warning-text {
  color: #d48806 !important;
}

.mono {
  font-family: Consolas, Monaco, monospace;
}

.loading-placeholder,
.empty-placeholder {
  text-align: center;
  padding: 40px 24px;
  color: #999;
}

@media (max-width: 1280px) {
  .task-log-layout {
    grid-template-columns: 1fr;
  }

  .task-log-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-log-history-header {
    align-items: stretch;
  }

  .history-date-filter {
    justify-content: flex-start;
  }

  .task-log-history-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .task-log-history-pagination {
    justify-content: flex-start;
  }
}

.trigger-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.trigger-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  box-sizing: border-box;
  flex-shrink: 0;
}

.trigger-tag--manual {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.trigger-tag--scheduled {
  background: #e6f7ff;
  color: #096dd9;
  border: 1px solid #91d5ff;
}

.trigger-tag--default {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.task-log-detail-modal {
  width: min(860px, calc(100vw - 48px));
}

.task-log-detail-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-log-modal-close {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
  font-size: 20px;
  line-height: 1;
}

.task-log-modal-close:hover {
  background: #f5f5f5;
  color: #cf1322;
}

.task-log-detail-modal__body {
  max-height: 72vh;
  overflow-y: auto;
}

.detail-section + .detail-section {
  margin-top: 18px;
}

.detail-section__title {
  margin: 0 0 10px;
  padding-left: 10px;
  border-left: 3px solid var(--ant-primary, #52c41a);
  font-size: 14px;
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
}

.detail-section__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.detail-field {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--ant-border-color, #f0f0f0);
  border-radius: 8px;
  background: #fafafa;
}

.detail-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--ant-text-secondary, rgba(0, 0, 0, 0.45));
}

.detail-field__value {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--ant-text-primary, rgba(0, 0, 0, 0.85));
  word-break: break-all;
}

.detail-value--primary {
  color: var(--ant-primary, #52c41a);
}

.detail-value--blue {
  color: #1677ff;
}

.detail-value--success {
  color: #389e0d;
}

.detail-value-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  box-sizing: border-box;
}

.detail-value-tag.status-tag--success,
.detail-value-tag.trigger-tag--manual,
.detail-value-tag.detail-tag--success {
  background: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.detail-value-tag.status-tag--failed {
  background: #fff2f0;
  color: #cf1322;
  border: 1px solid #ffccc7;
}

.detail-value-tag.status-tag--running,
.detail-value-tag.trigger-tag--scheduled,
.detail-value-tag.detail-tag--blue {
  background: #e6f7ff;
  color: #096dd9;
  border: 1px solid #91d5ff;
}

.detail-value-tag.status-tag--partial,
.detail-value-tag.status-tag--warning,
.detail-value-tag.detail-tag--gold {
  background: #fffbe6;
  color: #d48806;
  border: 1px solid #ffe58f;
}

.detail-value-tag.status-tag--default,
.detail-value-tag.trigger-tag--default,
.detail-value-tag.detail-tag--default,
.detail-value-tag.detail-tag--muted {
  background: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
}

@media (max-width: 760px) {
  .detail-section__grid {
    grid-template-columns: 1fr;
  }
}
</style>
