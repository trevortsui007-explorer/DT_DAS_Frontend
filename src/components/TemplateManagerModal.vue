<template>
  <div>
    <div v-if="visible" class="ant-modal-mask active"></div>
    <div v-if="visible" class="ant-modal-wrap active" @click.self="close">
      <div class="ant-modal template-manager-modal">
        <div class="ant-modal-header">
          <span class="ant-modal-title">Excel模板管理</span>
          <button type="button" class="modal-close-btn" @click="close">×</button>
        </div>

        <div class="ant-modal-body template-manager-body">
          <aside class="template-sidebar">
            <div class="template-sidebar-actions">
              <button type="button" class="ant-btn ant-btn-primary" @click="createNewTemplate">
                <PlusOutlined />
                新增模板
              </button>
              <button type="button" class="ant-btn ant-btn-default" @click="triggerQuickImport">
                <UploadOutlined />
                快速导入
              </button>
              <button
                type="button"
                class="ant-btn ant-btn-default icon-only-btn"
                title="刷新模板"
                aria-label="刷新模板"
                :disabled="loading"
                @click="loadTemplates"
              >
                <ReloadOutlined />
              </button>
              <input
                ref="quickImportInput"
                class="quick-import-input"
                type="file"
                accept=".json,application/json"
                @change="handleQuickImport"
              />
            </div>

            <div v-if="loading" class="template-empty">模板加载中...</div>
            <div v-else-if="!templates.length" class="template-empty">暂无模板</div>
            <button
              v-for="template in templates"
              v-else
              :key="getTemplateId(template)"
              type="button"
              class="template-list-card"
              :class="{ active: String(getTemplateId(template)) === String(form.id) }"
              @click="selectTemplate(template)"
            >
              <span class="template-card-title">{{ getTemplateName(template) }}</span>
              <span class="template-card-code">{{ getTemplateCode(template) }}</span>
              <span class="template-card-meta">
                <span>v{{ getTemplateVersion(template) }}</span>
                <span :class="['template-status', isTemplateEnabled(template) ? 'enabled' : 'disabled']">
                  {{ isTemplateEnabled(template) ? '启用' : '停用' }}
                </span>
              </span>
            </button>
          </aside>

          <main class="template-editor">
            <div class="template-editor-toolbar">
              <div class="template-editor-title">
                {{ form.id ? '编辑模板' : '新增模板' }}
              </div>
              <div class="template-editor-actions">
                <button type="button" class="ant-btn ant-btn-default" :disabled="!form.templateCode" @click="copyTemplate">
                  <CopyOutlined />
                  复制模板
                </button>
                <button type="button" class="ant-btn ant-btn-primary" :disabled="saving || Boolean(parseError)" @click="saveTemplate">
                  <SaveOutlined />
                  {{ saving ? '保存中...' : '保存模板' }}
                </button>
              </div>
            </div>

            <div v-if="parseError" class="template-error">
              模板 JSON 格式异常，已保留原文只读展示。修复 JSON 后再保存，避免覆盖原配置。
            </div>

            <section class="template-section">
              <div class="template-section-title">基础信息</div>
              <div class="template-form-grid">
                <label class="template-form-item">
                  <span>TemplateCode</span>
                  <input v-model.trim="form.templateCode" class="ant-input" type="text" />
                </label>
                <label class="template-form-item">
                  <span>TemplateName</span>
                  <input v-model.trim="form.templateName" class="ant-input" type="text" />
                </label>
                <label class="template-form-item">
                  <span>ParserType</span>
                  <select v-model="form.parserType" class="ant-input">
                    <option value="template-excel">template-excel</option>
                    <option value="standard-table">standard-table</option>
                  </select>
                </label>
                <label class="template-form-item">
                  <span>TemplateVersion</span>
                  <input v-model.number="form.templateVersion" class="ant-input" min="1" type="number" />
                </label>
                <label class="template-check-item">
                  <input v-model="form.isEnabled" type="checkbox" />
                  <span>启用模板</span>
                </label>
              </div>
            </section>

            <template v-if="!parseError">
              <section class="template-section">
                <div class="template-section-title">模板识别</div>
                <div class="template-form-grid">
                  <label class="template-form-item">
                    <span>Sheet名称</span>
                    <input v-model.trim="definition.sheetName" class="ant-input" type="text" placeholder="例如 2.1 FHS" />
                  </label>
                  <label class="template-form-item">
                    <span>标题单元格</span>
                    <input v-model.trim="definition.identity.titleCell" class="ant-input" type="text" placeholder="例如 B2" />
                  </label>
                  <label class="template-form-item template-form-item-wide">
                    <span>标题包含文本</span>
                    <input v-model.trim="definition.identity.titleContains" class="ant-input" type="text" />
                  </label>
                </div>
              </section>

              <section class="template-section">
                <div class="template-section-header">
                  <div class="template-section-title">元数据字段</div>
                  <button type="button" class="ant-btn ant-btn-primary mini-btn" @click="addMetadata">
                    <PlusOutlined />
                    新增字段
                  </button>
                </div>
                <div class="template-table metadata-table">
                  <div class="template-table-head">
                    <span>field</span>
                    <span>source</span>
                    <span>parser</span>
                    <span>options</span>
                    <span>操作</span>
                  </div>
                  <div v-for="(item, index) in definition.metadata" :key="index" class="template-table-row">
                    <input v-model.trim="item.field" class="ant-input" type="text" />
                    <input v-model.trim="item.source" class="ant-input" type="text" />
                    <select v-model="item.parser" class="ant-input">
                      <option
                        v-for="option in METADATA_PARSER_OPTIONS"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <input
                      class="ant-input"
                      type="text"
                      :value="arrayToText(item.options)"
                      @input="item.options = textToArray($event.target.value)"
                    />
                    <button type="button" class="ant-btn ant-btn-danger-light" @click="removeArrayItem(definition.metadata, index)">
                      删除
                    </button>
                  </div>
                  <div v-if="!definition.metadata.length" class="template-empty-row">暂无元数据字段</div>
                </div>
              </section>

              <section class="template-section">
                <div class="template-section-title">数据区域</div>
                <div class="template-form-grid">
                  <label class="template-form-item">
                    <span>数据起始行</span>
                    <input v-model.number="definition.dataRegion.startRow" class="ant-input" min="1" type="number" />
                  </label>
                  <label class="template-form-item template-form-item-wide">
                    <span>继承列</span>
                    <input
                      class="ant-input"
                      type="text"
                      :value="arrayToText(definition.dataRegion.carryForwardColumns)"
                      @input="definition.dataRegion.carryForwardColumns = textToArray($event.target.value)"
                    />
                  </label>
                </div>

                <div class="rule-block">
                  <div class="rule-block-header">
                    <span>停止规则</span>
                    <button type="button" class="ant-btn ant-btn-primary mini-btn" @click="addStopRule">
                      <PlusOutlined />
                      新增规则
                    </button>
                  </div>
                  <div class="template-table rule-table">
                    <div class="template-table-head">
                      <span>type</span>
                      <span>columns</span>
                      <span>keywords</span>
                      <span>count</span>
                      <span>操作</span>
                    </div>
                    <div v-for="(rule, index) in definition.dataRegion.stopRules" :key="index" class="template-table-row">
                      <select v-model="rule.type" class="ant-input">
                        <option value="keyword">keyword</option>
                        <option value="emptyRows">emptyRows</option>
                      </select>
                      <input
                        class="ant-input"
                        type="text"
                        :value="arrayToText(rule.columns)"
                        @input="rule.columns = textToArray($event.target.value)"
                      />
                      <input
                        class="ant-input"
                        type="text"
                        :value="arrayToText(rule.keywords)"
                        @input="rule.keywords = textToArray($event.target.value)"
                      />
                      <input v-model.number="rule.count" class="ant-input" min="0" type="number" />
                      <button type="button" class="ant-btn ant-btn-danger-light" @click="removeArrayItem(definition.dataRegion.stopRules, index)">
                        删除
                      </button>
                    </div>
                  </div>
                </div>

                <div class="rule-block">
                  <div class="rule-block-header">
                    <span>跳过规则</span>
                    <button type="button" class="ant-btn ant-btn-primary mini-btn" @click="addSkipRule">
                      <PlusOutlined />
                      新增规则
                    </button>
                  </div>
                  <div class="template-table skip-table">
                    <div class="template-table-head">
                      <span>type</span>
                      <span>columns</span>
                      <span>操作</span>
                    </div>
                    <div v-for="(rule, index) in definition.dataRegion.skipRules" :key="index" class="template-table-row">
                      <select v-model="rule.type" class="ant-input">
                        <option value="allEmpty">allEmpty</option>
                      </select>
                      <input
                        class="ant-input"
                        type="text"
                        :value="arrayToText(rule.columns)"
                        @input="rule.columns = textToArray($event.target.value)"
                      />
                      <button type="button" class="ant-btn ant-btn-danger-light" @click="removeArrayItem(definition.dataRegion.skipRules, index)">
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section class="template-section">
                <div class="template-section-header">
                  <div class="template-section-title">明细列映射</div>
                  <button type="button" class="ant-btn ant-btn-primary mini-btn" @click="addColumn">
                    <PlusOutlined />
                    新增列
                  </button>
                </div>
                <div class="template-table column-table">
                  <div class="template-table-head">
                    <span>field</span>
                    <span>column</span>
                    <span>type</span>
                    <span>继承</span>
                    <span>ACC列</span>
                    <span>REJ列</span>
                    <span>操作</span>
                  </div>
                  <div v-for="(column, index) in definition.columns" :key="index" class="template-table-row">
                    <input v-model.trim="column.field" class="ant-input" type="text" />
                    <input v-model.trim="column.column" class="ant-input" type="text" />
                    <select v-model="column.type" class="ant-input">
                      <option value="string">string</option>
                      <option value="int">int</option>
                      <option value="decimal">decimal</option>
                      <option value="booleanCheck">booleanCheck</option>
                      <option value="judgmentFromColumns">judgmentFromColumns</option>
                    </select>
                    <label class="center-check">
                      <input v-model="column.carryForward" type="checkbox" />
                    </label>
                    <input v-model.trim="column.accColumn" class="ant-input" type="text" />
                    <input v-model.trim="column.rejColumn" class="ant-input" type="text" />
                    <button type="button" class="ant-btn ant-btn-danger-light" @click="removeArrayItem(definition.columns, index)">
                      删除
                    </button>
                  </div>
                  <div v-if="!definition.columns.length" class="template-empty-row">暂无明细列映射</div>
                </div>
              </section>

              <section class="template-section">
                <div class="template-section-title">系统字段</div>
                <input
                  class="ant-input"
                  type="text"
                  :value="arrayToText(definition.systemFields)"
                  @input="definition.systemFields = textToArray($event.target.value)"
                />
              </section>
            </template>

            <section class="template-section">
              <div class="template-section-header">
                <div class="template-section-title">JSON预览</div>
                <button type="button" class="ant-btn ant-btn-default mini-btn" @click="showJson = !showJson">
                  {{ showJson ? '收起' : '展开' }}
                </button>
              </div>
              <textarea
                v-if="showJson || parseError"
                class="ant-input json-preview"
                readonly
                :value="parseError ? rawDefinitionJson : jsonPreview"
              ></textarea>
            </section>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import {
  CopyOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import message from '@/components/index.js'
import * as api from '@/api'

const visible = ref(false)
const loading = ref(false)
const saving = ref(false)
const templates = ref([])
const parseError = ref('')
const rawDefinitionJson = ref('')
const showJson = ref(false)

const quickImportInput = ref(null)

const TEMPLATE_PACKAGE_FORMAT = 'das-excel-template-package'
const TEMPLATE_PACKAGE_VERSION = 1
const form = reactive(createEmptyForm())
const definition = reactive(createEmptyDefinition())

const METADATA_PARSER_OPTIONS = [
  { label: 'dateFromChineseText', value: 'dateFromChineseText' },
  { label: 'datetimeText', value: 'datetimeText' },
  { label: 'checkedOption', value: 'checkedOption' },
  { label: 'text', value: 'text' },
]

const unwrapList = (res) => {
  const result = res?.data ?? res
  const data = result?.data ?? result?.Data ?? result
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.List)) return data.List
  return []
}

const getTemplateId = (template) => template?.id ?? template?.Id ?? ''
const getTemplateCode = (template) => template?.templateCode ?? template?.TemplateCode ?? ''
const getTemplateName = (template) => template?.templateName ?? template?.TemplateName ?? ''
const getTemplateVersion = (template) => template?.templateVersion ?? template?.TemplateVersion ?? 1
const getTemplateParserType = (template) => template?.parserType ?? template?.ParserType ?? 'template-excel'
const getDefinitionJson = (template) => template?.definitionJson ?? template?.DefinitionJson ?? ''
const isTemplateEnabled = (template) => Boolean(template?.isEnabled ?? template?.IsEnabled ?? true)

function createEmptyForm() {
  return {
    id: '',
    templateCode: '',
    templateName: '',
    parserType: 'template-excel',
    templateVersion: 1,
    isEnabled: true,
  }
}

function createEmptyDefinition() {
  return {
    sheetName: '',
    identity: {
      templateCode: '',
      templateName: '',
      titleCell: 'B2',
      titleContains: '',
    },
    metadata: [],
    dataRegion: {
      startRow: 1,
      stopRules: [],
      skipRules: [],
      carryForwardColumns: [],
    },
    columns: [],
    systemFields: ['SourceRow', 'FileName', 'FullFilePath', 'CreateDt', 'excelname'],
  }
}

const resetObject = (target, source) => {
  Object.keys(target).forEach((key) => delete target[key])
  Object.assign(target, source)
}

const normalizeDefinition = (value) => {
  const next = {
    ...createEmptyDefinition(),
    ...(value || {}),
  }

  next.identity = {
    ...createEmptyDefinition().identity,
    ...(value?.identity || {}),
  }

  next.metadata = Array.isArray(value?.metadata) ? value.metadata : []
  next.columns = Array.isArray(value?.columns) ? value.columns : []
  next.systemFields = Array.isArray(value?.systemFields) ? value.systemFields : createEmptyDefinition().systemFields
  next.dataRegion = {
    ...createEmptyDefinition().dataRegion,
    ...(value?.dataRegion || {}),
  }
  next.dataRegion.stopRules = Array.isArray(value?.dataRegion?.stopRules) ? value.dataRegion.stopRules : []
  next.dataRegion.skipRules = Array.isArray(value?.dataRegion?.skipRules) ? value.dataRegion.skipRules : []
  next.dataRegion.carryForwardColumns = Array.isArray(value?.dataRegion?.carryForwardColumns)
    ? value.dataRegion.carryForwardColumns
    : []

  delete next.filenameParsing
  delete next.FilenameParsing
  return next
}

const applyTemplate = (template) => {
  resetObject(form, {
    id: getTemplateId(template),
    templateCode: getTemplateCode(template),
    templateName: getTemplateName(template),
    parserType: getTemplateParserType(template),
    templateVersion: Number(getTemplateVersion(template)) || 1,
    isEnabled: isTemplateEnabled(template),
  })

  parseError.value = ''
  rawDefinitionJson.value = getDefinitionJson(template)

  if (!rawDefinitionJson.value) {
    resetObject(definition, createEmptyDefinition())
    definition.identity.templateCode = form.templateCode
    definition.identity.templateName = form.templateName
    return
  }

  try {
    const parsed = JSON.parse(rawDefinitionJson.value)
    resetObject(definition, normalizeDefinition(parsed))
    definition.identity.templateCode = definition.identity.templateCode || form.templateCode
    definition.identity.templateName = definition.identity.templateName || form.templateName
  } catch (error) {
    parseError.value = error?.message || 'DefinitionJson parse failed'
    resetObject(definition, createEmptyDefinition())
  }
}

const createNewTemplate = () => {
  resetObject(form, createEmptyForm())
  resetObject(definition, createEmptyDefinition())
  parseError.value = ''
  rawDefinitionJson.value = ''
  showJson.value = false
}

const triggerQuickImport = () => {
  if (!quickImportInput.value) return
  quickImportInput.value.value = ''
  quickImportInput.value.click()
}

const handleQuickImport = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const packageValue = JSON.parse(await file.text())
    if (packageValue?.format !== TEMPLATE_PACKAGE_FORMAT) {
      throw new Error(`format must be ${TEMPLATE_PACKAGE_FORMAT}`)
    }
    if (Number(packageValue?.formatVersion) !== TEMPLATE_PACKAGE_VERSION) {
      throw new Error(`formatVersion must be ${TEMPLATE_PACKAGE_VERSION}`)
    }

    const imported = packageValue?.template
    const importedDefinition = imported?.definition
    if (!imported || !importedDefinition || Array.isArray(importedDefinition)) {
      throw new Error('template.definition is required')
    }

    const templateCode = imported.templateCode ?? imported.TemplateCode ?? ''
    const templateName = imported.templateName ?? imported.TemplateName ?? ''
    if (!templateCode || !templateName) {
      throw new Error('templateCode and templateName are required')
    }

    resetObject(form, {
      id: '',
      templateCode,
      templateName,
      parserType: imported.parserType ?? imported.ParserType ?? 'template-excel',
      templateVersion: Number(imported.templateVersion ?? imported.TemplateVersion) || 1,
      isEnabled: Boolean(imported.isEnabled ?? imported.IsEnabled ?? true),
    })
    resetObject(definition, normalizeDefinition(importedDefinition))
    definition.identity.templateCode = templateCode
    definition.identity.templateName = templateName
    parseError.value = ''
    rawDefinitionJson.value = ''
    showJson.value = true
    message.success(`\u5df2\u5bfc\u5165 ${file.name}\uff0c\u8bf7\u786e\u8ba4\u540e\u4fdd\u5b58`)
  } catch (error) {
    message.error(`\u5feb\u901f\u5bfc\u5165\u5931\u8d25\uff1a${error?.message || 'invalid package'}`)
  }
}

const selectTemplate = (template) => {
  applyTemplate(template)
}

const loadTemplates = async () => {
  loading.value = true
  try {
    templates.value = unwrapList(await api.fetchImportTemplates())
    if (!form.id && templates.value.length) {
      applyTemplate(templates.value[0])
    }
  } catch (error) {
    message.error(error?.message || '模板列表加载失败')
  } finally {
    loading.value = false
  }
}

const open = async (templateId = null) => {
  visible.value = true
  await loadTemplates()
  if (templateId) {
    const matched = templates.value.find((template) => String(getTemplateId(template)) === String(templateId))
    if (matched) {
      applyTemplate(matched)
    }
  }
  if (!templates.value.length) {
    createNewTemplate()
  }
}

const close = () => {
  visible.value = false
}

const arrayToText = (value) => Array.isArray(value) ? value.join(', ') : ''
const textToArray = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

const removeArrayItem = (array, index) => {
  array.splice(index, 1)
}

const addMetadata = () => {
  definition.metadata.push({
    field: '',
    source: '',
    parser: 'text',
    options: [],
  })
}

const addStopRule = () => {
  definition.dataRegion.stopRules.push({
    type: 'keyword',
    columns: [],
    keywords: [],
  })
}

const addSkipRule = () => {
  definition.dataRegion.skipRules.push({
    type: 'allEmpty',
    columns: [],
  })
}

const addColumn = () => {
  definition.columns.push({
    field: '',
    column: '',
    type: 'string',
    carryForward: false,
  })
}

const copyTemplate = () => {
  if (!form.templateCode) return

  form.id = ''
  form.templateCode = `${form.templateCode}-copy`
  form.templateName = `${form.templateName || '未命名模板'}（复制）`
  definition.identity.templateCode = form.templateCode
  definition.identity.templateName = form.templateName
  message.info('已复制为新模板，保存后生效')
}

const buildDefinitionPayload = () => {
  const payload = JSON.parse(JSON.stringify(definition))
  delete payload.filenameParsing
  delete payload.FilenameParsing
  payload.identity = {
    ...(payload.identity || {}),
    templateCode: form.templateCode,
    templateName: form.templateName,
  }
  return payload
}

const jsonPreview = computed(() => JSON.stringify(buildDefinitionPayload(), null, 2))

const buildSavePayload = () => ({
  TemplateCode: form.templateCode,
  TemplateName: form.templateName,
  ParserType: form.parserType || 'template-excel',
  TemplateVersion: Number(form.templateVersion) || 1,
  DefinitionJson: JSON.stringify(buildDefinitionPayload(), null, 2),
  IsEnabled: Boolean(form.isEnabled),
})

const validateForm = () => {
  if (!form.templateCode) {
    message.warning('请填写 TemplateCode')
    return false
  }
  if (!form.templateName) {
    message.warning('请填写 TemplateName')
    return false
  }
  if (parseError.value) {
    message.warning('模板 JSON 格式异常，不能保存')
    return false
  }
  return true
}

const saveTemplate = async () => {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = buildSavePayload()
    if (form.id) {
      await api.updateImportTemplate(form.id, payload)
    } else {
      await api.createImportTemplate(payload)
    }

    message.success('模板保存成功')
    const savedCode = form.templateCode
    const savedVersion = Number(form.templateVersion) || 1
    await loadTemplates()
    const saved = templates.value.find((item) => (
      getTemplateCode(item) === savedCode &&
      Number(getTemplateVersion(item)) === savedVersion
    ))
    if (saved) {
      applyTemplate(saved)
    }
  } catch (error) {
    message.error(error?.message || '模板保存失败')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.template-manager-modal {
  width: min(1180px, calc(100vw - 56px));
  max-height: calc(100vh - 48px);
  overflow: hidden;
}

.template-manager-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 58px;
  padding: 0 24px;
  border-bottom: 1px solid #eef0f4;
}

.template-manager-modal .ant-modal-title {
  display: flex;
  align-items: center;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.template-manager-modal .modal-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #4b5563;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.template-manager-modal .modal-close-btn:hover {
  background: #f3f4f6;
  color: #ef4444;
}

.template-manager-body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  height: min(760px, calc(100vh - 150px));
  padding: 16px 18px 18px;
  overflow: hidden;
  background: #fff;
}

.template-sidebar,
.template-editor {
  min-height: 0;
  overflow: auto;
  padding: 0 10px 0 0;
}

.template-sidebar {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
}

.template-sidebar-actions,
.template-editor-actions,
.template-editor-toolbar,
.template-section-header,
.rule-block-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-sidebar-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 36px;
  margin-bottom: 12px;
}

.template-sidebar-actions .ant-btn {
  min-width: 0;
  padding-inline: 8px;
}

.template-sidebar-actions .icon-only-btn {
  width: 36px;
  padding: 0;
  font-size: 0;
}

.template-sidebar-actions .icon-only-btn :deep(svg) {
  font-size: 16px;
}

.quick-import-input {
  display: none;
}

.template-list-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
}

.template-list-card.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.14);
}

.template-card-title {
  font-weight: 700;
  line-height: 1.35;
}

.template-card-code {
  color: #6b7280;
  font-size: 12px;
  word-break: break-all;
}

.template-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.template-status {
  padding: 2px 8px;
  border-radius: 999px;
}

.template-status.enabled {
  color: #15803d;
  background: #dcfce7;
}

.template-status.disabled {
  color: #6b7280;
  background: #e5e7eb;
}

.template-empty,
.template-empty-row {
  padding: 14px;
  color: #6b7280;
  text-align: center;
}

.template-editor-toolbar {
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 2px 0 0;
}

.template-editor-title {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.template-section {
  margin-bottom: 14px;
  padding: 16px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.template-section-title {
  display: flex;
  align-items: center;
  min-height: 24px;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #52c41a;
  color: #111827;
  font-weight: 700;
  line-height: 1.2;
}

.template-section-header {
  justify-content: space-between;
  margin-bottom: 12px;
  min-height: 32px;
}

.template-section-header .template-section-title {
  margin-bottom: 0;
}

.template-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.template-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.template-manager-modal .ant-input {
  height: 34px;
  line-height: 32px;
}

.template-manager-modal select.ant-input {
  padding-top: 0;
  padding-bottom: 0;
}

.template-form-item-wide {
  grid-column: span 1;
}

.template-check-item,
.center-check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-table {
  border: 1px solid #edf2f7;
  border-radius: 8px;
  overflow: hidden;
}

.template-table-head,
.template-table-row {
  display: grid;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
}

.template-table-head {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.template-table-row {
  border-top: 1px solid #edf2f7;
}

.metadata-table .template-table-head,
.metadata-table .template-table-row {
  grid-template-columns: minmax(150px, 1fr) 110px 160px minmax(220px, 1.35fr) 76px;
}

.rule-table .template-table-head,
.rule-table .template-table-row {
  grid-template-columns: 130px minmax(220px, 1.3fr) minmax(220px, 1.3fr) 86px 76px;
}

.skip-table .template-table-head,
.skip-table .template-table-row {
  grid-template-columns: 150px minmax(320px, 1fr) 76px;
}

.column-table .template-table-head,
.column-table .template-table-row {
  grid-template-columns: minmax(150px, 1fr) 78px 170px 54px 78px 78px 76px;
}

.rule-block {
  margin-top: 14px;
}

.rule-block-header {
  justify-content: space-between;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 700;
}

.mini-btn {
  min-height: 32px;
  padding: 0 10px;
  font-size: 12px;
  line-height: 30px;
}

.template-error {
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  background: #fef2f2;
}

.json-preview {
  min-height: 240px;
  resize: vertical;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;
}

.ant-btn-danger-light {
  color: #ff4d4f;
  border-color: #ffccc7;
  background: #fff2f0;
}

@media (max-width: 960px) {
  .template-manager-body {
    grid-template-columns: 1fr;
  }

  .template-sidebar {
    max-height: 220px;
  }

  .template-form-grid,
  .metadata-table .template-table-head,
  .metadata-table .template-table-row,
  .rule-table .template-table-head,
  .rule-table .template-table-row,
  .skip-table .template-table-head,
  .skip-table .template-table-row,
  .column-table .template-table-head,
  .column-table .template-table-row {
    grid-template-columns: 1fr;
  }
}
</style>
