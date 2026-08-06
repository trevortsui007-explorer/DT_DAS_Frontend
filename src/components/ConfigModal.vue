<template>
  <div>
    <div class="ant-modal-mask" :class="{ active: visible }" @click="close"></div>
    <div class="ant-modal-wrap" :class="{ active: visible }">
      <div class="ant-modal config-modal" style="width: 700px">
        <div class="ant-modal-header">
          <span class="ant-modal-title">{{ modalTitle }}</span>
          <span class="modal-close" @click="close">×</span>
        </div>

        <div class="ant-modal-body">
          <input type="hidden" v-model="formData.id" />

          <section class="form-section">
            <div class="section-title">基础配置信息</div>
            <div class="form-grid top-form-grid">
              <div class="form-item">
                <label><span style="color: red">*</span> 设备名称 (EqName)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.eqName"
                  placeholder="请输入设备名称"
                />
              </div>

              <div class="form-item status-form-item">
                <label>状态</label>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="formData.isEnabled" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title">文件采集信息</div>
            <div class="form-grid">
              <div class="form-item">
                <label><span style="color: red">*</span> 目标表名 (TableName)</label>
                <input
                  type="text"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('TableName') }"
                  v-model="formData.tableName"
                  placeholder="请输入数据库目标表名"
                  @input="autoMarkers.TableName = false"
                />
              </div>

              <div class="form-item">
                <label><span style="color: red">*</span> 文件路径规则</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.filePathPattern"
                  placeholder="例如: D:/Desktop/{yyyy}.{MM}.{dd}/"
                />
              </div>

              <div class="form-item">
                <label class="label-with-help template-label-row">
                  文件名规则
                  <HelpTooltip text="规则名为空，则采集这个文件夹的内容" />
                </label>
                <input
                  type="text"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('FileNamePattern') }"
                  v-model="formData.fileNamePattern"
                  placeholder="例如: Log.csv"
                  @input="autoMarkers.FileNamePattern = false"
                  @blur="normalizeFileNamePattern"
                />
              </div>

              <div class="form-item">
                <label>文件类型</label>
                <select
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('FileType') }"
                  v-model="formData.fileType"
                  @change="handleFileTypeChange"
                >
                  <option value=".csv">.csv</option>
                  <option value=".xlsx">.xlsx</option>
                  <option value=".txt">.txt</option>
                </select>
              </div>

              <div class="form-item">
                <label>解析方式 (ParserType)</label>
                <select class="ant-input" v-model="formData.parserType" @change="handleParserTypeChange">
                  <option value="standard-table">普通表格</option>
                  <option value="template-excel">固定模板</option>
                </select>
              </div>

              <div v-if="isTemplateParser" class="form-item">
                <label class="label-with-help">
                  导入模板
                  <HelpTooltip text="按模板名称选择，保存时自动映射为模板 ID" />
                  <button
                    type="button"
                    class="template-view-btn"
                    :disabled="!formData.templateId"
                    @click="openSelectedTemplate"
                  >
                    查看Excel模板
                  </button>
                </label>
                <select
                  v-if="!templateLoadFailed && templateOptions.length"
                  class="ant-input"
                  v-model="formData.templateId"
                  :disabled="templateLoading"
                >
                  <option v-if="templateLoading" value="">模板加载中...</option>
                  <option
                    v-for="tpl in templateOptions"
                    :key="getTemplateId(tpl)"
                    :value="getTemplateId(tpl)"
                  >
                    {{ getTemplateLabel(tpl) }}
                  </option>
                </select>
                <div v-else-if="templateLoading" class="template-state">模板加载中...</div>
                <div v-else class="template-state template-state--error">
                  <span>模板列表加载失败，请重新加载。</span>
                  <button type="button" class="template-retry-btn" @click="loadImportTemplates(true)">
                    重新加载
                  </button>
                </div>
              </div>
            </div>

            <div class="folder-scan-card">
              <div class="folder-scan-card__header">
                <div>
                  <div class="folder-scan-card__title">文件夹扫描设置</div>
                  <div class="folder-scan-card__hint">
                    文件名规则为空时生效；填写具体文件名时仍按单文件模式采集。
                  </div>
                </div>
                <label class="switch-row folder-scan-switch">
                  <input type="checkbox" v-model="formData.folderRecursive" />
                  <span>扫描子文件夹</span>
                </label>
              </div>

              <div class="folder-scan-card__body">
                <div class="form-item">
                  <label class="label-with-help">
                    最大递归层级
                    <HelpTooltip text="0 表示不限制；1 表示只扫描当前文件夹的下一层子文件夹" />
                  </label>
                  <input
                    type="number"
                    min="0"
                    class="ant-input"
                    v-model="formData.folderMaxDepth"
                    :disabled="!formData.folderRecursive"
                  />
                </div>
              </div>
            </div>

            <div class="file-access-card">
              <div class="file-access-card__header">
                <div>
                  <div class="file-access-card__title">访问凭据</div>
                  <div class="file-access-card__hint">
                    用于 FTP 或受密码保护的共享目录；密码保存后不会回显。
                  </div>
                </div>
                <span v-if="formData.accessPasswordSet && !formData.accessUseCurrentWindowsIdentity" class="password-state">已保存密码</span>
              </div>

              <div class="file-access-mode">
                <label class="file-access-mode__item">
                  <input
                    type="radio"
                    :value="true"
                    v-model="formData.accessUseCurrentWindowsIdentity"
                    @change="handleAccessModeChange"
                  />
                  <span class="file-access-mode__dot"></span>
                  <span>使用当前 Windows 身份</span>
                </label>
                <label class="file-access-mode__item">
                  <input
                    type="radio"
                    :value="false"
                    v-model="formData.accessUseCurrentWindowsIdentity"
                    @change="handleAccessModeChange"
                  />
                  <span class="file-access-mode__dot"></span>
                  <span>使用指定账号</span>
                </label>
              </div>

              <div class="file-access-grid">
                <div class="form-item">
                  <label>Domain</label>
                  <input
                    type="text"
                    class="ant-input"
                    v-model.trim="formData.accessDomain"
                    :disabled="formData.accessUseCurrentWindowsIdentity"
                    placeholder="例如: DELTON"
                  />
                </div>
                <div class="form-item">
                  <label>UserName</label>
                  <input
                    type="text"
                    class="ant-input"
                    v-model.trim="formData.accessUserName"
                    :disabled="formData.accessUseCurrentWindowsIdentity"
                    placeholder="共享目录或 FTP 用户名"
                  />
                </div>
                <div class="form-item">
                  <label>Password</label>
                  <input
                    type="password"
                    class="ant-input"
                    v-model="formData.accessPassword"
                    :disabled="formData.accessUseCurrentWindowsIdentity"
                    :placeholder="formData.accessPasswordSet ? '不修改则留空' : '请输入密码'"
                    autocomplete="new-password"
                  />
                </div>
                <div class="file-access-actions">
                  <button
                    v-if="formData.accessPasswordSet && !formData.accessUseCurrentWindowsIdentity"
                    type="button"
                    class="file-access-clear-btn"
                    @click="clearSavedAccessPassword"
                  >
                    清除已保存密码
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title">文件内容信息</div>
            <div class="form-grid">
              <div class="form-item">
                <label>表头行号 (HeaderRow)</label>
                <input
                  type="number"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('HeaderRow') }"
                  v-model="formData.headerRow"
                  @input="autoMarkers.HeaderRow = false"
                />
              </div>

              <div class="form-item">
                <label>数据起始行 (StartRow)</label>
                <input
                  type="number"
                  class="ant-input"
                  :class="{ 'auto-filled-input': isAuto('StartRow') }"
                  v-model="formData.startRow"
                  @input="autoMarkers.StartRow = false"
                />
              </div>
            </div>

            <div class="form-item">
              <label class="label-with-help">
                扩展字段 (ExtFields)
                <HelpTooltip text="扩展字段为非文件内字段" />
              </label>
              <div class="ext-fields-editor" :class="{ 'auto-filled-input': isAuto('ExtFields') }">
                <div v-if="isTemplateParser" class="template-system-fields">
                  <div class="template-system-fields__header">
                    <span>模板继承字段</span>
                    <small>来自所选 Excel 模板，只读且无需重复添加</small>
                  </div>
                  <div v-if="templateLoading" class="template-system-fields__state">
                    正在读取模板字段...
                  </div>
                  <div
                    v-else-if="selectedTemplateSystemFields.error"
                    class="template-system-fields__state template-system-fields__state--error"
                  >
                    {{ selectedTemplateSystemFields.error }}
                  </div>
                  <div
                    v-else-if="selectedTemplateSystemFields.fields.length"
                    class="template-system-fields__tags"
                  >
                    <span
                      v-for="field in selectedTemplateSystemFields.fields"
                      :key="field"
                      class="template-system-field-tag"
                    >
                      {{ field }}
                    </span>
                  </div>
                  <div v-else class="template-system-fields__state">
                    当前模板未配置系统字段
                  </div>
                </div>
                <div v-if="isTemplateParser" class="ext-field-source-label">配置附加字段</div>
                <div class="ext-fields-presets">
                  <button
                    v-for="preset in EXT_FIELD_PRESETS"
                    :key="preset"
                    type="button"
                    class="ext-field-preset"
                    @click="addExtFieldTag(preset)"
                  >
                    + {{ preset }}
                  </button>
                </div>
                <div class="ext-field-tags">
                  <span
                    v-for="tag in extFieldTags"
                    :key="tag"
                    class="ext-field-tag"
                    :class="isSupportedExtField(tag) ? 'ext-field-tag--supported' : 'ext-field-tag--unsupported'"
                  >
                    {{ tag }}
                    <button type="button" @click="removeExtFieldTag(tag)">×</button>
                  </span>
                  <span v-if="!extFieldTags.length" class="ext-field-empty">未选择扩展字段</span>
                </div>
                <input
                  type="text"
                  class="ant-input ext-field-input"
                  v-model="extFieldInput"
                  placeholder="输入后按 Enter，可用逗号一次添加多个"
                  @keydown.enter.prevent="commitExtFieldInput"
                  @input="handleExtFieldInput"
                  @blur="commitExtFieldInput"
                />
              </div>
            </div>

            <div class="metadata-fields-card">
              <div class="metadata-fields-card__header">
                <div>
                  <div class="metadata-fields-card__title">系统字段与固定值</div>
                  <div class="metadata-fields-card__hint">
                    写入每条采集数据；字段名填写目标业务表字段。
                  </div>
                </div>
              </div>

              <div class="system-field-grid">
                <label class="system-field-row">
                  <input type="checkbox" v-model="formData.fileLastWriteTimeEnabled" />
                  <span>文件修改时间</span>
                  <input
                    class="ant-input"
                    v-model.trim="formData.fileLastWriteTimeField"
                    :disabled="!formData.fileLastWriteTimeEnabled"
                    placeholder="FileLastWriteTime"
                  />
                </label>
                <label class="system-field-row">
                  <input type="checkbox" v-model="formData.fileSizeEnabled" />
                  <span>文件大小</span>
                  <input
                    class="ant-input"
                    v-model.trim="formData.fileSizeField"
                    :disabled="!formData.fileSizeEnabled"
                    placeholder="FileSize"
                  />
                </label>
              </div>

              <div class="fixed-field-table">
                <div class="fixed-field-table__head">
                  <span>入库字段</span>
                  <span>固定值</span>
                  <span>操作</span>
                </div>
                <div
                  v-for="(row, index) in fixedFieldRows"
                  :key="row.key"
                  class="fixed-field-table__row"
                >
                  <input
                    class="ant-input"
                    v-model.trim="row.field"
                    placeholder="例如: ShiftType"
                  />
                  <input
                    class="ant-input"
                    v-model="row.value"
                    placeholder="例如: 日班"
                  />
                  <button
                    type="button"
                    class="mapping-remove-btn"
                    @click="removeFixedFieldRow(index)"
                  >
                    删除
                  </button>
                </div>
                <button type="button" class="mapping-add-btn" @click="addFixedFieldRow">
                  + 新增固定字段
                </button>
              </div>
            </div>

            <div class="filename-parsing-card">
              <div class="filename-parsing-card__header">
                <div>
                  <div class="filename-parsing-card__title">文件名解析</div>
                  <div class="filename-parsing-card__hint">
                    从文件名提取业务字段，并写入该文件的每条采集数据。
                  </div>
                </div>
                <label class="filename-parsing-switch">
                  <input type="checkbox" v-model="filenameParsingEnabled" />
                  <span>{{ filenameParsingEnabled ? '已启用' : '未启用' }}</span>
                </label>
              </div>

              <div v-if="filenameParsingEnabled" class="filename-parsing-card__body">
                <div class="filename-parser-grid">
                  <div class="form-item">
                    <label>解析器类型</label>
                    <select class="ant-input" v-model="filenameParserMode" @change="clearFilenameTestResult">
                      <option value="regex">正则表达式</option>
                      <option value="custom">自定义 C# 解析器</option>
                    </select>
                  </div>
                  <div v-if="filenameParserMode === 'custom'" class="form-item">
                    <label>解析器名称 (parserName)</label>
                    <input
                      class="ant-input"
                      v-model.trim="filenameCustomParserName"
                      placeholder="已在 IoC 注册的 parserName"
                    />
                  </div>
                </div>

                <template v-if="filenameParserMode === 'regex'">
                  <div class="form-item">
                    <div class="filename-pattern-label-row">
                      <label>正则表达式</label>
                      <button
                        type="button"
                        class="ant-btn ant-btn-default filename-detect-groups-btn"
                        @click="detectFilenameCaptureGroups"
                      >
                        <SearchOutlined />
                        <span>识别捕获组</span>
                      </button>
                    </div>
                    <textarea
                      class="ant-input filename-pattern-input"
                      v-model="filenameRegexPattern"
                      placeholder="使用命名捕获组，例如 (?&lt;customerPartNo&gt;[^_]+)"
                    ></textarea>
                  </div>
                  <label class="filename-checkbox-row">
                    <input type="checkbox" v-model="filenameIgnoreCase" />
                    <span>忽略大小写</span>
                  </label>

                  <div class="filename-field-table">
                    <div class="filename-field-table__head">
                      <span>入库字段</span>
                      <span>捕获组</span>
                      <span>类型</span>
                      <span>日期格式</span>
                      <span>必填</span>
                      <span>操作</span>
                    </div>
                    <div
                      v-for="(row, index) in filenameFieldRows"
                      :key="row.key"
                      class="filename-field-table__row"
                    >
                      <input class="ant-input" v-model.trim="row.field" placeholder="CustomerPartNo" />
                      <input class="ant-input" v-model.trim="row.group" placeholder="customerPartNo" />
                      <select class="ant-input" v-model="row.type">
                        <option value="text">text</option>
                        <option value="int">int</option>
                        <option value="decimal">decimal</option>
                        <option value="date">date</option>
                      </select>
                      <input
                        class="ant-input"
                        v-model.trim="row.format"
                        :disabled="row.type !== 'date'"
                        placeholder="yyyy.M.d"
                      />
                      <label class="filename-required-check">
                        <input type="checkbox" v-model="row.required" />
                      </label>
                      <button
                        type="button"
                        class="mapping-remove-btn"
                        @click="removeFilenameFieldRow(index)"
                      >
                        删除
                      </button>
                    </div>
                    <button type="button" class="mapping-add-btn" @click="addFilenameFieldRow">
                      + 新增解析字段
                    </button>
                  </div>
                </template>

                <div v-else class="form-item">
                  <label>解析器选项 (options JSON)</label>
                  <textarea
                    class="ant-input filename-options-input"
                    v-model="filenameCustomOptionsText"
                    placeholder="{}"
                  ></textarea>
                </div>

                <div class="filename-test-panel">
                  <div class="filename-test-grid">
                    <div class="form-item">
                      <label>测试文件名</label>
                      <input
                        class="ant-input"
                        v-model.trim="filenameTestFileName"
                        placeholder="例如: PCB_xxx_2026.7.31.xlsx"
                      />
                    </div>
                    <div class="form-item">
                      <label>完整路径（可选）</label>
                      <input
                        class="ant-input"
                        v-model.trim="filenameTestFullPath"
                        placeholder="D:/Reports/sample.xlsx"
                      />
                    </div>
                  </div>
                  <div class="filename-test-actions">
                    <button
                      type="button"
                      class="ant-btn ant-btn-primary"
                      :disabled="filenameTestLoading"
                      @click="testFilenameParsing"
                    >
                      {{ filenameTestLoading ? '解析中...' : '测试解析' }}
                    </button>
                  </div>

                  <div v-if="filenameTestError" class="filename-test-error">
                    {{ filenameTestError }}
                  </div>
                  <div v-else-if="filenameTestResult" class="filename-test-result">
                    <div
                      v-for="[field, value] in filenameTestFieldEntries"
                      :key="field"
                      class="filename-test-result__row"
                    >
                      <span>{{ field }}</span>
                      <code>{{ formatFilenameTestValue(value) }}</code>
                    </div>
                    <div v-if="!filenameTestFieldEntries.length" class="filename-test-empty">
                      解析成功，未返回字段。
                    </div>
                    <div
                      v-for="warning in filenameTestWarnings"
                      :key="warning"
                      class="filename-test-warning"
                    >
                      {{ warning }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="acquisition-mode-card">
              <div class="acquisition-mode-card__header">
                <div>
                  <div class="acquisition-mode-card__title">采集模式</div>
                  <div class="acquisition-mode-card__hint">
                    增量采集保持断点续传；全量覆盖会在文件变化时先删除旧数据再重新入库。
                  </div>
                </div>
              </div>
              <div class="mode-radio-row">
                <label>
                  <input type="radio" value="incremental" v-model="formData.acquisitionMode" />
                  <span>增量采集</span>
                </label>
                <label>
                  <input type="radio" value="full-reload" v-model="formData.acquisitionMode" />
                  <span>全量覆盖</span>
                </label>
              </div>
              <div v-if="formData.acquisitionMode === 'full-reload'" class="reload-condition-grid">
                <label class="switch-row">
                  <input type="checkbox" v-model="formData.fullReloadWhenLastWriteTimeChanged" />
                  <span>文件修改时间变化时覆盖</span>
                </label>
                <label class="switch-row">
                  <input type="checkbox" v-model="formData.fullReloadWhenFileSizeChanged" />
                  <span>文件大小变化时覆盖</span>
                </label>
              </div>
            </div>

            <div class="form-item mapping-form-item">
              <div class="label-row">
                <label>字段映射关系</label>
                <div class="mapping-json-actions">
                  <button
                    type="button"
                    class="ant-btn ant-btn-primary mapping-json-action"
                    @click="openFieldMappingJsonImport"
                  >
                    添加JSON数据
                  </button>
                  <button
                    type="button"
                    class="ant-btn ant-btn-default mapping-json-action"
                    @click="showFieldMappingJson"
                  >
                    查看JSON
                  </button>
                </div>
              </div>
              <div class="mapping-table">
                <div class="mapping-table__head">
                  <span>文件字段</span>
                  <span>入库字段</span>
                  <span>操作</span>
                </div>
                <div
                  v-for="(row, index) in fieldMappingRows"
                  :key="row.key"
                  class="mapping-table__row"
                >
                  <input
                    class="ant-input"
                    v-model="row.source"
                    placeholder="例如: PCB号"
                  />
                  <input
                    class="ant-input"
                    v-model="row.target"
                    placeholder="例如: pcbNo"
                  />
                  <button
                    type="button"
                    class="mapping-remove-btn"
                    @click="removeMappingRow(index)"
                  >
                    删除
                  </button>
                </div>
                <button type="button" class="mapping-add-btn" @click="addMappingRow">
                  + 新增映射
                </button>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-title">后处理信息</div>
            <div class="form-grid">
              <div class="form-item post-type-item">
                <label>后处理类型</label>
                <div class="segmented-control" id="post-type-segmented">
                  <div class="segment-pill" :style="pillStyle"></div>
                  <div class="segment-options">
                    <div
                      v-for="(opt) in postTypes"
                      :key="opt.value"
                      class="segment-option"
                      :class="{ active: formData.postProcessingType === opt.value }"
                      @click="formData.postProcessingType = opt.value"
                    >
                      {{ opt.label }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-item">
                <label>存储过程/服务名</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.procedureName"
                  placeholder="需进行后处理时填写"
                />
              </div>

              <div class="form-item">
                <label>后处理表 (PostTableName)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.postTableName"
                  placeholder="后处理写入表名"
                />
              </div>

              <div class="form-item">
                <label>存储过程Flag (Flag)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.flag"
                  placeholder="例如: MasonETFailureService"
                />
              </div>

              <div class="form-item">
                <label>后处理解释 (FlagName)</label>
                <input
                  type="text"
                  class="ant-input"
                  v-model="formData.flagName"
                  placeholder="后处理说明"
                />
              </div>
            </div>
          </section>
        </div>

        <div class="ant-modal-footer" style="display: flex; justify-content: space-between">
          <div>
            <button v-if="isFromImport" class="ant-btn ant-btn-default" @click="goBack">
              ← 上一步 (修改映射)
            </button>
          </div>
          <div>
            <button class="ant-btn ant-btn-default" style="margin-right: 12px" @click="close">
              取消
            </button>
            <button class="ant-btn ant-btn-primary" @click="save">保存配置</button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="ant-modal-mask json-preview-mask"
      :class="{ active: jsonPreviewVisible }"
      @click="closeFieldMappingJson"
    ></div>
    <div class="ant-modal-wrap json-preview-wrap" :class="{ active: jsonPreviewVisible }">
      <div class="ant-modal json-preview-modal" style="width: 520px">
        <div class="ant-modal-header">
          <span class="ant-modal-title">字段映射 JSON</span>
          <span class="modal-close" @click="closeFieldMappingJson">×</span>
        </div>
        <div class="ant-modal-body">
          <pre class="json-preview-content">{{ fieldMappingJsonText }}</pre>
        </div>
      </div>
    </div>

    <div
      class="ant-modal-mask json-import-mask"
      :class="{ active: jsonImportVisible }"
      @click="closeFieldMappingJsonImport"
    ></div>
    <div class="ant-modal-wrap json-import-wrap" :class="{ active: jsonImportVisible }">
      <div class="ant-modal json-import-modal" style="width: 620px">
        <div class="ant-modal-header">
          <span class="ant-modal-title">添加字段映射 JSON</span>
          <span class="modal-close" @click="closeFieldMappingJsonImport">×</span>
        </div>
        <div class="ant-modal-body">
          <div class="json-import-toolbar">
            <button type="button" class="ant-btn ant-btn-default" @click="formatImportJson">
              整理JSON
            </button>
            <button type="button" class="ant-btn ant-btn-default" @click="copyImportJson">
              复制JSON
            </button>
            <button type="button" class="ant-btn ant-btn-default" @click="pasteImportJson">
              贴入JSON
            </button>
          </div>
          <textarea
            class="ant-input json-import-textarea"
            v-model="jsonImportText"
            placeholder='例如: {"PCB号": "pcbNo", "二维码": "qrCode"}'
          ></textarea>
        </div>
        <div class="ant-modal-footer json-import-footer">
          <button class="ant-btn ant-btn-default" @click="closeFieldMappingJsonImport">取消</button>
          <button class="ant-btn ant-btn-primary" @click="confirmImportFieldMappingJson">
            确认添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import * as api from '@/api'
import message from '@/components/index.js'
import HelpTooltip from './HelpTooltip.vue'

const emit = defineEmits(['saved', 'goBack', 'open-template-manager'])

const visible = ref(false)
const isEdit = ref(false)
const isFromImport = ref(false) // 标记是否为导入流程
const modalMode = ref('create')
const existingConfigs = ref([])
const jsonPreviewVisible = ref(false)
const fieldMappingJsonText = ref('{}')
const jsonImportVisible = ref(false)
const jsonImportText = ref('')
const importTemplates = ref([])
const templateLoading = ref(false)
const templateLoadFailed = ref(false)
const filenameParsingEnabled = ref(false)
const filenameParserMode = ref('regex')
const filenameCustomParserName = ref('')
const filenameRegexPattern = ref('')
const filenameIgnoreCase = ref(true)
const filenameCustomOptionsText = ref('{}')
const filenameFieldRows = ref([])
const filenameTestFileName = ref('')
const filenameTestFullPath = ref('')
const filenameTestLoading = ref(false)
const filenameTestResult = ref(null)
const filenameTestError = ref('')

const formData = ref({
  id: '',
  eqName: '',
  tableName: '',
  filePathPattern: '',
  fileNamePattern: '',
  fileType: '.csv',
  headerRow: 1,
  startRow: 2,
  postProcessingType: 0,
  postTableName: '',
  procedureName: '',
  serviceName: '',
  flag: '',
  flagName: '',
  isEnabled: true,
  extFields: '',
  fieldMappings: '',
  parserType: 'standard-table',
  templateId: null,
  parserOptions: '',
  folderRecursive: false,
  folderMaxDepth: 5,
  fileLastWriteTimeEnabled: false,
  fileLastWriteTimeField: 'FileLastWriteTime',
  fileSizeEnabled: false,
  fileSizeField: 'FileSize',
  acquisitionMode: 'incremental',
  fullReloadWhenLastWriteTimeChanged: true,
  fullReloadWhenFileSizeChanged: true,
  accessUseCurrentWindowsIdentity: false,
  accessDomain: '',
  accessUserName: '',
  accessPassword: '',
  accessPasswordSet: false,
  accessClearPassword: false,
})

const autoMarkers = ref({})
const fieldMappingRows = ref([])
const fixedFieldRows = ref([])
const extFieldTags = ref([])
const extFieldInput = ref('')
let mappingRowSeed = 0
let fixedFieldRowSeed = 0
let filenameFieldRowSeed = 0

const EXT_FIELD_PRESETS = [
  'Id(Guid)',
  'Id(雪花算法)',
  'row',
  'SourceRow',
  'filename',
  'FileName',
  'excelname',
  'fullfilepath',
  'FullFilePath',
  'CreateDt',
  'RowData(str)',
]

const SUPPORTED_EXT_FIELD_KEYS = new Set(['row', 'sourcerow', 'filename', 'excelname', 'fullfilepath', 'createdt'])

const postTypes = [
  { value: 0, label: '无操作' },
  { value: 1, label: '调用C#服务' },
  { value: 2, label: '调用存储过程' },
]

const modalTitle = computed(() => {
  if (isFromImport.value) return '导入配置'
  if (isEdit.value) return '编辑配置项'
  if (modalMode.value === 'copy') return '复制配置项'
  return '新增配置项'
})

const isTemplateParser = computed(() => formData.value.parserType === 'template-excel')
const filenameTestFieldEntries = computed(() =>
  Object.entries(filenameTestResult.value?.fields || filenameTestResult.value?.Fields || {}),
)
const filenameTestWarnings = computed(
  () => filenameTestResult.value?.warnings || filenameTestResult.value?.Warnings || [],
)

const normalizeFileType = (value) => {
  const fileType = String(value || '').trim().toLowerCase()
  if (!fileType) return '.csv'
  return fileType.startsWith('.') ? fileType : `.${fileType}`
}

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }
  return false
}

const supportedFileTypes = ['.csv', '.xlsx', '.txt']

const normalizeFileNamePattern = () => {
  const currentName = String(formData.value.fileNamePattern || '').trim()
  if (!currentName) {
    formData.value.fileNamePattern = ''
    return
  }

  const currentType = normalizeFileType(formData.value.fileType)
  const lowerName = currentName.toLowerCase()
  const matchedType = supportedFileTypes.find((type) => lowerName.endsWith(type))

  if (matchedType) {
    formData.value.fileNamePattern = `${currentName.slice(0, -matchedType.length)}${currentType}`
    return
  }

  const lastSegment = currentName.split(/[\\/]/).pop() || currentName
  if (/\.[^./\\]+$/.test(lastSegment)) {
    formData.value.fileNamePattern = currentName
    return
  }

  formData.value.fileNamePattern = `${currentName}${currentType}`
}

const handleFileTypeChange = () => {
  autoMarkers.value.FileType = false
  formData.value.fileType = normalizeFileType(formData.value.fileType)
  normalizeFileNamePattern()
}

const normalizeExtFieldKey = (value) =>
  String(value || '')
    .trim()
    .replace(/[_-]/g, '')
    .toLowerCase()

const parseExtFields = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const isSupportedExtField = (tag) => {
  const text = String(tag || '').trim()
  if (/^Id\((Guid|Snowflake|雪花算法)\)$/i.test(text)) return true
  if (/^RowData\([A-Za-z_][A-Za-z0-9_]*\)$/i.test(text)) return true
  return SUPPORTED_EXT_FIELD_KEYS.has(normalizeExtFieldKey(text))
}

const syncExtFieldsFromTags = () => {
  formData.value.extFields = extFieldTags.value.join(', ')
}

const setExtFieldTagsFromString = (value) => {
  const seen = new Set()
  extFieldTags.value = parseExtFields(value).filter((tag) => {
    const key = tag.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  syncExtFieldsFromTags()
}

const addExtFieldTag = (value) => {
  const tags = parseExtFields(value)
  if (!tags.length) return

  const existing = new Set(extFieldTags.value.map((tag) => tag.toLowerCase()))
  tags.forEach((tag) => {
    const key = tag.toLowerCase()
    if (existing.has(key)) return
    extFieldTags.value.push(tag)
    existing.add(key)
  })
  syncExtFieldsFromTags()
  autoMarkers.value.ExtFields = false
}

const removeExtFieldTag = (tag) => {
  extFieldTags.value = extFieldTags.value.filter((item) => item !== tag)
  syncExtFieldsFromTags()
  autoMarkers.value.ExtFields = false
}

const commitExtFieldInput = () => {
  addExtFieldTag(extFieldInput.value)
  extFieldInput.value = ''
}

const handleExtFieldInput = () => {
  if (!extFieldInput.value.includes(',')) return
  commitExtFieldInput()
}

const normalizeTemplateList = (result) => {
  const data = result?.data ?? result
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.List)) return data.List
  return []
}

const getTemplateId = (template) => template?.id ?? template?.Id

const isTemplateEnabled = (template) => {
  const enabled = template?.isEnabled ?? template?.IsEnabled ?? true
  return enabled !== false
}

const getTemplateLabel = (template) => {
  if (template?.isUnknown) return `未知模板（ID: ${getTemplateId(template)}）`
  const name = template?.templateName || template?.TemplateName || template?.templateCode || template?.TemplateCode
  const version = template?.templateVersion ?? template?.TemplateVersion
  return version ? `${name} v${version}` : name
}

const readTemplateDefinition = (template) => {
  const raw = template?.definitionJson ?? template?.DefinitionJson ?? template?.definition
  if (!raw) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw !== 'string') return null

  const parsed = JSON.parse(raw)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
}

const getDefinitionPropertyIgnoreCase = (definition, propertyName) => {
  if (!definition || typeof definition !== 'object') return undefined
  const key = Object.keys(definition).find(
    (item) => item.toLowerCase() === propertyName.toLowerCase(),
  )
  return key ? definition[key] : undefined
}

const templateOptions = computed(() => {
  const options = importTemplates.value.filter(isTemplateEnabled)
  const selectedId = formData.value.templateId

  if (!selectedId) return options

  const hasSelected = options.some((tpl) => String(getTemplateId(tpl)) === String(selectedId))
  if (hasSelected) return options

  return [
    {
      id: selectedId,
      templateName: `未知模板（ID: ${selectedId}）`,
      isUnknown: true,
    },
    ...options,
  ]
})

const selectedTemplateSystemFields = computed(() => {
  if (!isTemplateParser.value || !formData.value.templateId) {
    return { fields: [], error: '' }
  }

  const selectedTemplate = importTemplates.value.find(
    (template) => String(getTemplateId(template)) === String(formData.value.templateId),
  )
  if (!selectedTemplate) {
    return {
      fields: [],
      error: templateLoadFailed.value ? '模板加载失败，无法读取继承字段' : '未获取到当前模板定义',
    }
  }

  try {
    const definition = readTemplateDefinition(selectedTemplate)
    if (!definition) return { fields: [], error: '当前模板缺少 DefinitionJson' }

    const rawFields = getDefinitionPropertyIgnoreCase(definition, 'systemFields')
    if (rawFields === undefined || rawFields === null) return { fields: [], error: '' }
    if (!Array.isArray(rawFields)) {
      return { fields: [], error: '模板 systemFields 格式错误，应为数组' }
    }

    const seen = new Set()
    const fields = rawFields
      .map((field) => String(field || '').trim())
      .filter((field) => {
        const key = field.toLowerCase()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    return { fields, error: '' }
  } catch {
    return { fields: [], error: '模板 DefinitionJson 解析失败，无法读取继承字段' }
  }
})

const ensureDefaultTemplate = () => {
  if (!isTemplateParser.value || formData.value.templateId) return

  const firstTemplate = importTemplates.value.find(isTemplateEnabled)

  if (firstTemplate) {
    formData.value.templateId = getTemplateId(firstTemplate)
  }
}

const openSelectedTemplate = () => {
  if (!formData.value.templateId) return
  emit('open-template-manager', formData.value.templateId)
}

const loadImportTemplates = async (force = false) => {
  if (templateLoading.value) return
  if (!force && importTemplates.value.length) {
    ensureDefaultTemplate()
    return
  }

  templateLoading.value = true
  templateLoadFailed.value = false

  try {
    const result = await api.fetchImportTemplates()
    importTemplates.value = normalizeTemplateList(result)
    ensureDefaultTemplate()
  } catch (err) {
    console.error('加载导入模板失败:', err)
    templateLoadFailed.value = true
  } finally {
    templateLoading.value = false
  }
}

const handleParserTypeChange = () => {
  if (!isTemplateParser.value) {
    formData.value.templateId = null
    return
  }

  loadImportTemplates()
}

const parseParserOptionsObject = (value) => {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return { ...value }
  if (typeof value !== 'string') return {}

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const createFilenameFieldRow = (
  field = '',
  group = '',
  type = 'text',
  format = '',
  required = false,
) => {
  filenameFieldRowSeed += 1
  return {
    key: `filename-field-${filenameFieldRowSeed}`,
    field,
    group,
    type,
    format,
    required,
  }
}

const clearFilenameTestResult = () => {
  filenameTestResult.value = null
  filenameTestError.value = ''
}

const resetFilenameParsing = () => {
  filenameParsingEnabled.value = false
  filenameParserMode.value = 'regex'
  filenameCustomParserName.value = ''
  filenameRegexPattern.value = ''
  filenameIgnoreCase.value = true
  filenameCustomOptionsText.value = '{}'
  filenameFieldRows.value = [createFilenameFieldRow()]
  filenameTestFileName.value = ''
  filenameTestFullPath.value = ''
  filenameTestLoading.value = false
  clearFilenameTestResult()
}

const getOptionValue = (value, camelName, pascalName) => {
  if (!value || typeof value !== 'object') return undefined
  if (value[camelName] !== undefined) return value[camelName]
  if (value[pascalName] !== undefined) return value[pascalName]

  const names = new Set([camelName.toLowerCase(), pascalName.toLowerCase()])
  const key = Object.keys(value).find((item) => names.has(item.toLowerCase()))
  return key ? value[key] : undefined
}

const deleteOptionIgnoreCase = (value, name) => {
  Object.keys(value || {}).forEach((key) => {
    if (key.toLowerCase() === name.toLowerCase()) delete value[key]
  })
}

const readFilenameParsing = (value) => {
  const root = parseParserOptionsObject(value)
  const definition = getOptionValue(root, 'filenameParsing', 'FilenameParsing')
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    resetFilenameParsing()
    return
  }

  const parserName = String(getOptionValue(definition, 'parserName', 'ParserName') || '').trim()
  const options = getOptionValue(definition, 'options', 'Options') || {}
  const fields = getOptionValue(options, 'fields', 'Fields')

  filenameParsingEnabled.value = true
  filenameParserMode.value = parserName.toLowerCase() === 'regex' ? 'regex' : 'custom'
  filenameCustomParserName.value = filenameParserMode.value === 'custom' ? parserName : ''
  filenameRegexPattern.value = String(getOptionValue(options, 'pattern', 'Pattern') || '')
  filenameIgnoreCase.value = toBooleanOption(
    getOptionValue(options, 'ignoreCase', 'IgnoreCase'),
    false,
  )
  filenameCustomOptionsText.value = JSON.stringify(options, null, 2)
  filenameFieldRows.value = Array.isArray(fields)
    ? fields.map((field) =>
        createFilenameFieldRow(
          getOptionValue(field, 'field', 'Field') || '',
          getOptionValue(field, 'group', 'Group') || '',
          getOptionValue(field, 'type', 'Type') || 'text',
          getOptionValue(field, 'format', 'Format') || '',
          toBooleanOption(getOptionValue(field, 'required', 'Required'), false),
        ),
      )
    : []
  if (!filenameFieldRows.value.length) {
    filenameFieldRows.value = [createFilenameFieldRow()]
  }
  clearFilenameTestResult()
}

const addFilenameFieldRow = () => {
  filenameFieldRows.value.push(createFilenameFieldRow())
}

const extractNamedCaptureGroups = (pattern) => {
  const groups = []
  const seen = new Set()
  let escaped = false
  let inCharacterClass = false

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (character === '\\') {
      escaped = true
      continue
    }
    if (character === '[') {
      inCharacterClass = true
      continue
    }
    if (character === ']' && inCharacterClass) {
      inCharacterClass = false
      continue
    }
    if (inCharacterClass || pattern.slice(index, index + 3) !== '(?<') continue

    const nameStart = index + 3
    if (pattern[nameStart] === '=' || pattern[nameStart] === '!') continue

    const nameEnd = pattern.indexOf('>', nameStart)
    if (nameEnd < 0) continue

    const groupName = pattern.slice(nameStart, nameEnd)
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(groupName) || seen.has(groupName)) continue

    seen.add(groupName)
    groups.push(groupName)
  }

  return groups
}

const isBlankFilenameFieldRow = (row) =>
  !String(row.field || '').trim() &&
  !String(row.group || '').trim() &&
  (!row.type || row.type === 'text') &&
  !String(row.format || '').trim() &&
  !row.required

const toDefaultTargetField = (groupName) =>
  groupName ? groupName.charAt(0).toUpperCase() + groupName.slice(1) : ''

const detectFilenameCaptureGroups = () => {
  const pattern = filenameRegexPattern.value.trim()
  if (!pattern) {
    message('请先输入正则表达式')
    return
  }

  try {
    new RegExp(pattern)
  } catch (error) {
    message('正则表达式无效：' + (error?.message || '格式错误'))
    return
  }

  const groups = extractNamedCaptureGroups(pattern)
  if (!groups.length) {
    message('未识别到 (?<name>...) 命名捕获组')
    return
  }

  const retainedRows = filenameFieldRows.value.filter((row) => !isBlankFilenameFieldRow(row))
  const existingGroups = new Set(
    retainedRows.map((row) => String(row.group || '').trim()).filter(Boolean),
  )
  const newGroups = groups.filter((groupName) => !existingGroups.has(groupName))

  filenameFieldRows.value = [
    ...retainedRows,
    ...newGroups.map((groupName) =>
      createFilenameFieldRow(toDefaultTargetField(groupName), groupName),
    ),
  ]
  clearFilenameTestResult()
  message('已识别 ' + groups.length + ' 个捕获组，新增 ' + newGroups.length + ' 个字段')
}
const removeFilenameFieldRow = (index) => {
  filenameFieldRows.value.splice(index, 1)
  if (!filenameFieldRows.value.length) {
    filenameFieldRows.value.push(createFilenameFieldRow())
  }
}

const parseCustomFilenameOptions = () => {
  const parsed = JSON.parse(filenameCustomOptionsText.value || '{}')
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('自定义解析器 options 必须是 JSON 对象')
  }
  return parsed
}

const buildFilenameParsingDefinition = () => {
  if (filenameParserMode.value === 'custom') {
    return {
      parserName: filenameCustomParserName.value.trim(),
      options: parseCustomFilenameOptions(),
    }
  }

  return {
    parserName: 'regex',
    options: {
      pattern: filenameRegexPattern.value,
      ignoreCase: !!filenameIgnoreCase.value,
      fields: filenameFieldRows.value.map((row) => {
        const field = {
          field: row.field.trim(),
          group: row.group.trim(),
          type: row.type || 'text',
          required: !!row.required,
        }
        if (field.type === 'date' && row.format.trim()) {
          field.format = row.format.trim()
        }
        return field
      }),
    },
  }
}

const validateFilenameParsing = () => {
  if (!filenameParsingEnabled.value) return ''

  if (filenameParserMode.value === 'custom') {
    if (!filenameCustomParserName.value.trim()) return '请输入自定义解析器名称'
    try {
      parseCustomFilenameOptions()
    } catch (error) {
      return error?.message || '自定义解析器 options JSON 格式错误'
    }
    return ''
  }

  if (!filenameRegexPattern.value.trim()) return '请输入文件名正则表达式'
  try {
    new RegExp(filenameRegexPattern.value)
  } catch (error) {
    return `文件名正则表达式无效：${error?.message || '格式错误'}`
  }

  const targetFields = new Set()
  for (const row of filenameFieldRows.value) {
    const field = row.field.trim()
    const group = row.group.trim()
    if (!field || !group) return '文件名解析字段的入库字段和捕获组不能为空'

    const normalizedField = field.toLowerCase()
    if (targetFields.has(normalizedField)) return `文件名解析入库字段重复：${field}`
    targetFields.add(normalizedField)

    if (!['text', 'int', 'decimal', 'date'].includes(row.type)) {
      return `文件名解析字段 ${field} 的类型不受支持`
    }
  }

  return ''
}

const formatFilenameTestValue = (value) => {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const testFilenameParsing = async () => {
  clearFilenameTestResult()
  const validationError = validateFilenameParsing()
  if (validationError) {
    filenameTestError.value = validationError
    return
  }
  if (!filenameTestFileName.value.trim()) {
    filenameTestError.value = '请输入测试文件名'
    return
  }

  filenameTestLoading.value = true
  try {
    const result = await api.testFileNameParsing({
      FileName: filenameTestFileName.value.trim(),
      FullFilePath: filenameTestFullPath.value.trim(),
      FilenameParsing: buildFilenameParsingDefinition(),
    })
    if (result?.code !== undefined && Number(result.code) !== 1) {
      throw new Error(result.info || result.message || '文件名解析失败')
    }
    filenameTestResult.value = result?.data ?? result
  } catch (error) {
    filenameTestError.value =
      error?.response?.data?.info || error?.info || error?.message || '文件名解析失败'
  } finally {
    filenameTestLoading.value = false
  }
}

const readFolderScanOptions = (value) => {
  const options = parseParserOptionsObject(value)
  const folderScan = options.folderScan || options.FolderScan || {}
  const rawMaxDepth = folderScan.maxDepth ?? folderScan.MaxDepth
  return {
    recursive: !!folderScan.recursive || !!folderScan.Recursive,
    maxDepth: rawMaxDepth === 0 || rawMaxDepth === '0' ? 0 : Number(rawMaxDepth ?? 5) || 5,
  }
}

const readSystemFieldOptions = (value) => {
  const options = parseParserOptionsObject(value)
  const systemFields = options.systemFields || options.SystemFields || {}
  const fileLastWriteTime = systemFields.fileLastWriteTime || systemFields.FileLastWriteTime || ''
  const fileSize = systemFields.fileSize || systemFields.FileSize || ''

  return {
    fileLastWriteTimeEnabled: !!fileLastWriteTime,
    fileLastWriteTimeField: fileLastWriteTime || 'FileLastWriteTime',
    fileSizeEnabled: !!fileSize,
    fileSizeField: fileSize || 'FileSize',
  }
}

const toBooleanOption = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const text = String(value).trim().toLowerCase()
  if (text === 'true' || text === '1' || text === 'yes') return true
  if (text === 'false' || text === '0' || text === 'no') return false
  return fallback
}

const readAcquisitionModeOptions = (value) => {
  const options = parseParserOptionsObject(value)
  const acquisitionMode = options.acquisitionMode || options.AcquisitionMode || {}
  const mode = acquisitionMode.mode || acquisitionMode.Mode || 'incremental'
  const reloadByWriteTime =
    acquisitionMode.fullReloadWhenLastWriteTimeChanged ??
    acquisitionMode.FullReloadWhenLastWriteTimeChanged
  const reloadBySize =
    acquisitionMode.fullReloadWhenFileSizeChanged ??
    acquisitionMode.FullReloadWhenFileSizeChanged

  return {
    acquisitionMode: mode === 'full-reload' ? 'full-reload' : 'incremental',
    fullReloadWhenLastWriteTimeChanged: toBooleanOption(reloadByWriteTime, true),
    fullReloadWhenFileSizeChanged: toBooleanOption(reloadBySize, true),
  }
}

const readFileAccessOptions = (value) => {
  const options = parseParserOptionsObject(value)
  const fileAccess = options.fileAccess || options.FileAccess || {}
  const passwordProtected = fileAccess.passwordProtected || fileAccess.PasswordProtected || ''
  const passwordSet = fileAccess.passwordSet ?? fileAccess.PasswordSet
  const useCurrentWindowsIdentity =
    fileAccess.useCurrentWindowsIdentity ?? fileAccess.UseCurrentWindowsIdentity

  return {
    accessUseCurrentWindowsIdentity: toBooleanOption(useCurrentWindowsIdentity, false),
    accessDomain: fileAccess.domain || fileAccess.Domain || '',
    accessUserName: fileAccess.userName || fileAccess.UserName || '',
    accessPassword: '',
    accessPasswordSet: toBooleanOption(passwordSet, !!passwordProtected),
    accessClearPassword: false,
  }
}

const createFixedFieldRow = (field = '', value = '') => {
  fixedFieldRowSeed += 1
  return {
    key: `fixed-field-${fixedFieldRowSeed}`,
    field,
    value,
  }
}

const parseFixedFieldsToRows = (value) => {
  const options = parseParserOptionsObject(value)
  const fixedFields = options.fixedFields || options.FixedFields || {}
  const rows = Object.entries(fixedFields)
    .filter(([field]) => String(field || '').trim())
    .map(([field, fieldValue]) => createFixedFieldRow(field, fieldValue ?? ''))

  return rows.length ? rows : [createFixedFieldRow()]
}

const buildFixedFieldsObject = () => {
  const result = {}
  fixedFieldRows.value.forEach((row) => {
    const field = String(row.field || '').trim()
    if (!field) return
    result[field] = row.value ?? ''
  })
  return result
}

const buildParserOptions = () => {
  const options = parseParserOptionsObject(formData.value.parserOptions)
  const hadFolderScan = !!(options.folderScan || options.FolderScan)
  delete options.FolderScan
  delete options.SystemFields
  delete options.FixedFields
  delete options.AcquisitionMode
  delete options.FileAccess
  deleteOptionIgnoreCase(options, 'filenameParsing')

  if (filenameParsingEnabled.value) {
    options.filenameParsing = buildFilenameParsingDefinition()
  } else {
    delete options.filenameParsing
  }

  if (formData.value.folderRecursive || hadFolderScan) {
    options.folderScan = {
      recursive: !!formData.value.folderRecursive,
      maxDepth: Math.max(Number(formData.value.folderMaxDepth) || 0, 0),
      includeCurrentFolder: true,
    }
  }

  const systemFields = {}
  if (formData.value.fileLastWriteTimeEnabled && formData.value.fileLastWriteTimeField) {
    systemFields.fileLastWriteTime = formData.value.fileLastWriteTimeField
  }
  if (formData.value.fileSizeEnabled && formData.value.fileSizeField) {
    systemFields.fileSize = formData.value.fileSizeField
  }

  if (Object.keys(systemFields).length) {
    options.systemFields = systemFields
  } else {
    delete options.systemFields
  }

  const fixedFields = buildFixedFieldsObject()
  if (Object.keys(fixedFields).length) {
    options.fixedFields = fixedFields
  } else {
    delete options.fixedFields
  }

  if (formData.value.acquisitionMode === 'full-reload') {
    options.acquisitionMode = {
      mode: 'full-reload',
      fullReloadWhenLastWriteTimeChanged: !!formData.value.fullReloadWhenLastWriteTimeChanged,
      fullReloadWhenFileSizeChanged: !!formData.value.fullReloadWhenFileSizeChanged,
      deleteKey: 'fullPathFirst',
    }
  } else {
    delete options.acquisitionMode
  }

  const accessUseCurrentWindowsIdentity = !!formData.value.accessUseCurrentWindowsIdentity
  const existingFileAccess = options.fileAccess || {}
  const fileAccess = {
    ...existingFileAccess,
    useCurrentWindowsIdentity: accessUseCurrentWindowsIdentity,
  }

  if (accessUseCurrentWindowsIdentity) {
    delete fileAccess.domain
    delete fileAccess.userName
    delete fileAccess.passwordPlain
    delete fileAccess.passwordProtected
    delete fileAccess.passwordSet
    delete fileAccess.clearPassword
  } else {
    fileAccess.domain = String(formData.value.accessDomain || '').trim()
    fileAccess.userName = String(formData.value.accessUserName || '').trim()

    if (formData.value.accessPassword) {
      fileAccess.passwordPlain = formData.value.accessPassword
      fileAccess.passwordSet = true
      delete fileAccess.passwordProtected
      delete fileAccess.clearPassword
    } else if (formData.value.accessClearPassword) {
      fileAccess.clearPassword = true
      delete fileAccess.passwordProtected
      delete fileAccess.passwordSet
      delete fileAccess.passwordPlain
    } else {
      delete fileAccess.passwordPlain
      delete fileAccess.clearPassword
      if (fileAccess.passwordProtected) {
        fileAccess.passwordSet = true
      }
    }
  }

  const hasFileAccess =
    fileAccess.useCurrentWindowsIdentity ||
    !!fileAccess.domain ||
    !!fileAccess.userName ||
    !!fileAccess.passwordPlain ||
    !!fileAccess.passwordProtected ||
    !!fileAccess.clearPassword

  if (hasFileAccess) {
    options.fileAccess = fileAccess
  } else {
    delete options.fileAccess
  }

  return Object.keys(options).length ? JSON.stringify(options) : ''
}

const createMappingRow = (source = '', target = '') => {
  mappingRowSeed += 1
  return {
    key: `mapping-${mappingRowSeed}`,
    source,
    target,
  }
}

const parseMappingObject = (value) => {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return null

  let text = value.trim().replace(/^\uFEFF/, '')
  for (let i = 0; i < 3; i += 1) {
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
      if (typeof parsed === 'string' && parsed !== text) {
        text = parsed.trim()
        continue
      }
      break
    } catch {
      break
    }
  }

  const normalizedText = text.replace(/\\"/g, '"').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  const rows = {}
  const pairPattern = /"([^"]+)"\s*:\s*"([^"]*)"/g
  let match = pairPattern.exec(normalizedText)
  while (match) {
    rows[match[1]] = match[2]
    match = pairPattern.exec(normalizedText)
  }

  return Object.keys(rows).length ? rows : null
}

const parseFieldMappingsToRows = (value) => {
  if (!value) return [createMappingRow()]

  const parsed = parseMappingObject(value)

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [createMappingRow()]
  }

  const rows = Object.entries(parsed).map(([source, target]) =>
    createMappingRow(source, String(target ?? '')),
  )

  return rows.length ? rows : [createMappingRow()]
}

const buildFieldMappingsJson = () => {
  const mappings = {}

  fieldMappingRows.value.forEach((row) => {
    const source = String(row.source || '').trim()
    const target = String(row.target || '').trim()
    if (source && target) {
      mappings[source] = target
    }
  })

  return JSON.stringify(mappings, null, 2)
}

const syncFieldMappingsFromRows = () => {
  formData.value.fieldMappings = buildFieldMappingsJson()
}

const addMappingRow = () => {
  fieldMappingRows.value.push(createMappingRow())
}

const removeMappingRow = (index) => {
  fieldMappingRows.value.splice(index, 1)
  if (!fieldMappingRows.value.length) {
    fieldMappingRows.value.push(createMappingRow())
  }
}

const addFixedFieldRow = () => {
  fixedFieldRows.value.push(createFixedFieldRow())
}

const removeFixedFieldRow = (index) => {
  fixedFieldRows.value.splice(index, 1)
  if (!fixedFieldRows.value.length) {
    fixedFieldRows.value.push(createFixedFieldRow())
  }
}

const mergeMappingRows = (mappingObject) => {
  const merged = new Map()

  fieldMappingRows.value.forEach((row) => {
    const source = String(row.source || '').trim()
    const target = String(row.target || '').trim()
    if (source && target) {
      merged.set(source, target)
    }
  })

  Object.entries(mappingObject).forEach(([source, target]) => {
    const normalizedSource = String(source || '').trim()
    const normalizedTarget = String(target ?? '').trim()
    if (normalizedSource && normalizedTarget) {
      merged.set(normalizedSource, normalizedTarget)
    }
  })

  fieldMappingRows.value = Array.from(merged.entries()).map(([source, target]) =>
    createMappingRow(source, target),
  )

  if (!fieldMappingRows.value.length) {
    fieldMappingRows.value = [createMappingRow()]
  }
}

const pillStyle = computed(() => {
  const index = postTypes.findIndex((t) => t.value === formData.value.postProcessingType)
  return {
    transform: `translateX(${Math.max(index, 0) * 100}%)`,
  }
})

// ==================== 后处理类型联动 ExtFields ====================
watch(
  () => formData.value.postProcessingType,
  (newVal) => {
    const targetField = 'IsProcessed'

    if (newVal !== 0) {
      addExtFieldTag(targetField)
    } else {
      extFieldTags.value = extFieldTags.value.filter((f) => f !== targetField)
      syncExtFieldsFromTags()
    }

    if (newVal !== 0) {
      autoMarkers.value.ExtFields = true
    }
  },
)

function open(edit = false, data = null, fromImport = false, options = {}) {
  isEdit.value = edit
  isFromImport.value = fromImport
  modalMode.value = options.mode || (edit ? 'edit' : 'create')
  existingConfigs.value = Array.isArray(options.existingConfigs) ? options.existingConfigs : []

  // 每次打开时先重置标记
  autoMarkers.value = {}

  if (data) {
    // 兼容后端的大写字段和前端的小写字段
    const rawFieldMappings =
      typeof (data.fieldMappings || data.FieldMappings) === 'object'
        ? JSON.stringify(data.fieldMappings || data.FieldMappings, null, 2)
        : data.fieldMappings || data.FieldMappings || ''
    const rawParserOptions =
      typeof (data.parserOptions || data.ParserOptions) === 'object'
        ? JSON.stringify(data.parserOptions || data.ParserOptions)
        : data.parserOptions || data.ParserOptions || ''
    const folderScan = readFolderScanOptions(rawParserOptions)
    const systemFields = readSystemFieldOptions(rawParserOptions)
    const acquisitionMode = readAcquisitionModeOptions(rawParserOptions)
    const fileAccess = readFileAccessOptions(rawParserOptions)

    formData.value = {
      id: data.id || data.Id || '',
      eqName: data.eqName || data.EqName || '',
      tableName: data.tableName || data.TableName || '',
      filePathPattern: data.filePathPattern || data.FilePathPattern || '',
      fileNamePattern: data.fileNamePattern || data.FileNamePattern || '',
      fileType: normalizeFileType(data.fileType || data.FileType),
      headerRow: data.headerRow || data.HeaderRow || 1,
      startRow: data.startRow || data.StartRow || 2,
      postProcessingType: data.postProcessingType ?? data.PostProcessingType ?? 0,
      postTableName: data.postTableName || data.PostTableName || '',
      procedureName: data.procedureName || data.ProcedureName || '',
      serviceName: data.serviceName || data.ServiceName || '',
      flag: data.flag || data.Flag || '',
      flagName: data.flagName || data.FlagName || '',
      isEnabled: normalizeBoolean(data.isEnabled ?? data.IsEnabled),
      extFields: data.extFields || data.ExtFields || '',
      fieldMappings: rawFieldMappings,
      parserType: data.parserType || data.ParserType || 'standard-table',
      templateId: data.templateId ?? data.TemplateId ?? null,
      parserOptions: rawParserOptions,
      folderRecursive: folderScan.recursive,
      folderMaxDepth: folderScan.maxDepth,
      fileLastWriteTimeEnabled: systemFields.fileLastWriteTimeEnabled,
      fileLastWriteTimeField: systemFields.fileLastWriteTimeField,
      fileSizeEnabled: systemFields.fileSizeEnabled,
      fileSizeField: systemFields.fileSizeField,
      acquisitionMode: acquisitionMode.acquisitionMode,
      fullReloadWhenLastWriteTimeChanged: acquisitionMode.fullReloadWhenLastWriteTimeChanged,
      fullReloadWhenFileSizeChanged: acquisitionMode.fullReloadWhenFileSizeChanged,
      accessUseCurrentWindowsIdentity: fileAccess.accessUseCurrentWindowsIdentity,
      accessDomain: fileAccess.accessDomain,
      accessUserName: fileAccess.accessUserName,
      accessPassword: fileAccess.accessPassword,
      accessPasswordSet: fileAccess.accessPasswordSet,
      accessClearPassword: fileAccess.accessClearPassword,
    }

    setExtFieldTagsFromString(formData.value.extFields)
    fieldMappingRows.value = parseFieldMappingsToRows(rawFieldMappings)
    fixedFieldRows.value = parseFixedFieldsToRows(rawParserOptions)
    readFilenameParsing(rawParserOptions)
    if (formData.value.parserType === 'template-excel') {
      loadImportTemplates()
    }

    // 如果是导入，才处理绿色高亮标记
    if (fromImport && data._autoFilledFields) {
      autoMarkers.value = { ...data._autoFilledFields }
    } else if (fromImport) {
      autoMarkers.value = {
        TableName: !!data.TableName,
        FileNamePattern: !!data.FileNamePattern,
        FileType: !!data.FileType,
        HeaderRow: true,
        StartRow: true,
      }
    }
  } else {
    resetForm()
  }
  visible.value = true
}

// 提供一个辅助函数判断是否变绿
const isAuto = (key) => autoMarkers.value[key] === true

const resetForm = () => {
  formData.value = {
    id: '',
    eqName: '',
    tableName: '',
    filePathPattern: '',
    fileNamePattern: '',
    fileType: '.csv',
    headerRow: 1,
    startRow: 2,
    postProcessingType: 0,
    postTableName: '',
    procedureName: '',
    serviceName: '',
    flag: '',
    flagName: '',
    isEnabled: true,
    extFields: '',
    fieldMappings: '',
    parserType: 'standard-table',
    templateId: null,
    parserOptions: '',
    folderRecursive: false,
    folderMaxDepth: 5,
    fileLastWriteTimeEnabled: false,
    fileLastWriteTimeField: 'FileLastWriteTime',
    fileSizeEnabled: false,
    fileSizeField: 'FileSize',
    acquisitionMode: 'incremental',
    fullReloadWhenLastWriteTimeChanged: true,
    fullReloadWhenFileSizeChanged: true,
    accessUseCurrentWindowsIdentity: false,
    accessDomain: '',
    accessUserName: '',
    accessPassword: '',
    accessPasswordSet: false,
    accessClearPassword: false,
  }
  fieldMappingRows.value = [createMappingRow()]
  fixedFieldRows.value = [createFixedFieldRow()]
  resetFilenameParsing()
  extFieldTags.value = []
  extFieldInput.value = ''
}

const clearSavedAccessPassword = () => {
  formData.value.accessPassword = ''
  formData.value.accessPasswordSet = false
  formData.value.accessClearPassword = true
}

const handleAccessModeChange = () => {
  if (!formData.value.accessUseCurrentWindowsIdentity) return
  formData.value.accessDomain = ''
  formData.value.accessUserName = ''
  formData.value.accessPassword = ''
  formData.value.accessPasswordSet = false
  formData.value.accessClearPassword = true
}

const getConfigId = (item) => item?.id ?? item?.Id ?? ''
const getConfigName = (item) => String(item?.eqName || item?.EqName || '').trim()

const hasDuplicateConfigName = () => {
  const currentName = String(formData.value.eqName || '').trim().toLowerCase()
  const currentId = String(formData.value.id || '')

  if (!currentName) return false

  return existingConfigs.value.some((item) => {
    const itemName = getConfigName(item).toLowerCase()
    const itemId = String(getConfigId(item))

    return itemName === currentName && itemId !== currentId
  })
}

function close() {
  visible.value = false
  jsonPreviewVisible.value = false
  jsonImportVisible.value = false
}

function closeFieldMappingJson() {
  jsonPreviewVisible.value = false
}

function openFieldMappingJsonImport() {
  jsonImportText.value = ''
  jsonImportVisible.value = true
}

function closeFieldMappingJsonImport() {
  jsonImportVisible.value = false
}

function goBack() {
  visible.value = false
  emit('goBack') // 通知父组件退回上一步
}

function showFieldMappingJson() {
  syncFieldMappingsFromRows()
  fieldMappingJsonText.value = formData.value.fieldMappings || '{}'
  jsonPreviewVisible.value = true
}

function formatImportJson() {
  const parsed = parseMappingObject(jsonImportText.value)
  if (!parsed) {
    message('JSON 格式有误，请检查后再整理')
    return
  }
  jsonImportText.value = JSON.stringify(parsed, null, 2)
}

async function copyImportJson() {
  try {
    await navigator.clipboard.writeText(jsonImportText.value || '')
    message('JSON 已复制')
  } catch {
    message('复制失败，请使用 Ctrl+C')
  }
}

async function pasteImportJson() {
  try {
    jsonImportText.value = await navigator.clipboard.readText()
  } catch {
    message('读取剪贴板失败，请使用 Ctrl+V')
  }
}

function confirmImportFieldMappingJson() {
  const parsed = parseMappingObject(jsonImportText.value)
  if (!parsed) {
    message('JSON 格式有误，请检查后再添加')
    return
  }

  mergeMappingRows(parsed)
  syncFieldMappingsFromRows()
  jsonImportVisible.value = false
  message('字段映射已添加')
}

async function save() {
  try {
    // ================= 1. 校验 =================
    if (!formData.value.eqName || !formData.value.tableName) {
      message('请填写必填项：设备名称和目标表名')
      return
    }

    if (hasDuplicateConfigName()) {
      message('设备名称已存在，请修改后再保存')
      return
    }

    if (formData.value.parserType === 'template-excel' && !formData.value.templateId) {
      message('请选择导入模板')
      return
    }

    const filenameParsingError = validateFilenameParsing()
    if (filenameParsingError) {
      message(filenameParsingError)
      return
    }

    // ================= 2. 构造 payload =================
    formData.value.fileType = normalizeFileType(formData.value.fileType)
    normalizeFileNamePattern()
    commitExtFieldInput()
    syncExtFieldsFromTags()
    syncFieldMappingsFromRows()

    const payload = {
      EqName: formData.value.eqName,
      TableName: formData.value.tableName,
      FilePathPattern: formData.value.filePathPattern,
      FileNamePattern: formData.value.fileNamePattern,
      FileType: formData.value.fileType,
      HeaderRow: Number(formData.value.headerRow) || 0,
      StartRow: Number(formData.value.startRow) || 1,
      IsEnabled: normalizeBoolean(formData.value.isEnabled),
      PostProcessingType: parseInt(formData.value.postProcessingType),
      ProcedureName: formData.value.procedureName,
      ExtFields: formData.value.extFields,
      FieldMappings: formData.value.fieldMappings,
      ParserType: formData.value.parserType || 'standard-table',
      TemplateId: formData.value.parserType === 'template-excel' ? formData.value.templateId : null,
      ParserOptions: buildParserOptions(),

      PostTableName: formData.value.postTableName,
      ServiceName:
        formData.value.postProcessingType === 1
          ? formData.value.procedureName
          : formData.value.serviceName,
      Flag: formData.value.flag,
      FlagName: formData.value.flagName,
    }

    // ================= 3. 调用 API =================
    let result

    if (formData.value.id) {
      // 更新
      result = await api.updateConfig(formData.value.id, payload)
    } else {
      // 新增
      result = await api.createConfig(payload)
    }

    // ================= 4. 处理结果 =================
    if (result?.code === '1' || result?.info == '新增成功' || result?.info == '更新成功') {
      message(`保存成功！ID: ${result.data || formData.value.id}`)
      close()
      emit('saved')
    } else {
      message('保存失败：' + (result?.msg || result?.message || '未知错误'))
    }
  } catch (err) {
    console.error('请求异常:', err)
    message('请求失败：' + (err?.message || '服务器错误'))
  }
}

defineExpose({ open })
</script>

<style scoped>
.config-modal {
  border-radius: 10px;
  overflow: hidden;
}

.config-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-close {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #262626;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f5f5f5;
}

.config-modal .ant-modal-body {
  max-height: 72vh;
  overflow-y: auto;
}

.form-section {
  padding: 14px 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:first-of-type {
  padding-top: 0;
}

.form-section:last-of-type {
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #52c41a;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.top-form-grid {
  align-items: end;
}

.form-item {
  margin: 0;
}

.form-item + .form-item {
  margin-top: 0;
}

.form-section > .form-item {
  margin-top: 14px;
}

.mapping-form-item {
  margin-top: 18px;
}

.form-item label {
  display: inline-flex;
  align-items: center;
  margin-bottom: 6px;
  color: #262626;
  font-weight: 500;
}

.ext-fields-editor {
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 7px;
  background: #fff;
}

.ext-fields-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.ext-field-preset {
  height: 26px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 999px;
  background: #fafafa;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;
}

.ext-field-preset:hover {
  border-color: #52c41a;
  color: #389e0d;
  background: #f6ffed;
}

.ext-field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
  margin-bottom: 8px;
}

.ext-field-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.ext-field-tag button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.ext-field-tag--supported {
  border: 1px solid #b7eb8f;
  background: #f6ffed;
  color: #389e0d;
}

.ext-field-tag--unsupported {
  border: 1px solid #ffccc7;
  background: #fff2f0;
  color: #cf1322;
}

.ext-field-empty {
  color: #9ca3af;
  font-size: 12px;
  line-height: 26px;
}

.ext-field-input {
  width: 100%;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.label-row label {
  margin-bottom: 0;
}

.mapping-json-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapping-json-action {
  height: 26px;
  padding: 0 12px;
  font-size: 13px;
}

.status-form-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.status-form-item .toggle-switch {
  margin-top: 0;
  align-self: flex-start;
}

.post-type-item {
  grid-column: 1 / -1;
}

.metadata-fields-card {
  margin: 12px 0 14px;
  padding: 12px;
  border: 1px solid #dfe7f3;
  border-radius: 8px;
  background: #fbfdff;
}

.metadata-fields-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.metadata-fields-card__title {
  color: #1f2937;
  font-weight: 700;
}

.metadata-fields-card__hint {
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
}

.system-field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.system-field-row {
  display: grid;
  grid-template-columns: 18px 92px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  color: #374151;
  font-weight: 500;
}

.fixed-field-table {
  border: 1px solid #edf0f2;
  border-radius: 7px;
  overflow: hidden;
  background: #fff;
}

.fixed-field-table__head,
.fixed-field-table__row {
  display: grid;
  grid-template-columns: 1fr 1fr 68px;
  gap: 8px;
  align-items: center;
}

.fixed-field-table__head {
  padding: 8px 10px;
  background: #fafafa;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.fixed-field-table__row {
  padding: 8px 10px;
  border-top: 1px solid #f0f0f0;
}

.fixed-field-table__row .ant-input {
  height: 32px;
}

.template-system-fields {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid #d9e7d4;
  border-radius: 7px;
  background: #f8fcf6;
}

.template-system-fields__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.template-system-fields__header span,
.ext-field-source-label {
  color: #374151;
  font-size: 12px;
  font-weight: 700;
}

.template-system-fields__header small {
  color: #6b7280;
  font-size: 11px;
  text-align: right;
}

.template-system-fields__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.template-system-field-tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 3px 9px;
  border: 1px solid #b7dfaa;
  border-radius: 6px;
  background: #fff;
  color: #356b2e;
  font-size: 12px;
  font-weight: 600;
}

.template-system-fields__state {
  color: #6b7280;
  font-size: 12px;
}

.template-system-fields__state--error {
  color: #cf1322;
}

.ext-field-source-label {
  margin-bottom: 7px;
}
.filename-parsing-card {
  margin: 12px 0 14px;
  padding: 12px;
  border: 1px solid #d9e7d4;
  border-radius: 8px;
  background: #fcfefb;
}

.filename-parsing-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.filename-parsing-card__title {
  color: #1f2937;
  font-weight: 700;
}

.filename-parsing-card__hint {
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
}

.filename-parsing-switch,
.filename-checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #374151;
  font-weight: 500;
}

.filename-parsing-switch {
  flex: 0 0 auto;
  min-height: 24px;
}

.filename-parsing-card__body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e6efe2;
}

.filename-parser-grid,
.filename-test-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.filename-pattern-input,
.filename-options-input {
  min-height: 76px;
  resize: vertical;
  line-height: 1.5;
}

.filename-pattern-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.filename-pattern-label-row label {
  margin-bottom: 0;
}

.filename-detect-groups-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
}
.filename-checkbox-row {
  margin: 2px 0 10px;
}

.filename-field-table {
  border: 1px solid #edf0f2;
  border-radius: 7px;
  overflow: hidden;
  background: #fff;
}

.filename-field-table__head,
.filename-field-table__row {
  display: grid;
  grid-template-columns: minmax(105px, 1.25fr) minmax(90px, 1.1fr) 76px 92px 42px 58px;
  gap: 7px;
  align-items: center;
}

.filename-field-table__head {
  padding: 8px;
  background: #fafafa;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.filename-field-table__row {
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.filename-field-table__row .ant-input {
  min-width: 0;
  height: 32px;
}

.filename-required-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.filename-test-panel {
  margin-top: 12px;
  padding: 10px;
  border: 1px solid #edf0f2;
  border-radius: 7px;
  background: #fff;
}

.filename-test-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.filename-test-error {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  background: #fff2f0;
  color: #cf1322;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.filename-test-result {
  margin-top: 10px;
  border: 1px solid #d9f7be;
  border-radius: 6px;
  overflow: hidden;
}

.filename-test-result__row {
  display: grid;
  grid-template-columns: minmax(120px, 0.7fr) minmax(0, 1.3fr);
  gap: 10px;
  padding: 7px 9px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
}

.filename-test-result__row:first-child {
  border-top: 0;
}

.filename-test-result__row span {
  color: #4b5563;
  font-weight: 600;
}

.filename-test-result__row code {
  color: #1f2937;
  overflow-wrap: anywhere;
  white-space: normal;
}

.filename-test-empty,
.filename-test-warning {
  padding: 8px 10px;
  font-size: 12px;
}

.filename-test-empty {
  color: #6b7280;
}

.filename-test-warning {
  border-top: 1px solid #ffe58f;
  background: #fffbe6;
  color: #ad6800;
}

.acquisition-mode-card {
  margin: 12px 0 14px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.acquisition-mode-card__header {
  margin-bottom: 10px;
}

.acquisition-mode-card__title {
  color: #1f2937;
  font-weight: 700;
}

.acquisition-mode-card__hint {
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
}

.mode-radio-row,
.reload-condition-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
}

.mode-radio-row label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  color: #374151;
  font-weight: 500;
}

.reload-condition-grid {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.mapping-table {
  border: 1px solid #edf0f2;
  border-radius: 7px;
  overflow: hidden;
  background: #fff;
}

.mapping-table__head,
.mapping-table__row {
  display: grid;
  grid-template-columns: 1fr 1fr 68px;
  gap: 8px;
  align-items: center;
}

.mapping-table__head {
  padding: 8px 10px;
  background: #fafafa;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.mapping-table__row {
  padding: 8px 10px;
  border-top: 1px solid #f0f0f0;
}

.mapping-table__row .ant-input {
  height: 32px;
}

.mapping-remove-btn {
  height: 30px;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  background: #fff2f0;
  color: #f5222d;
  cursor: pointer;
}

.mapping-remove-btn:hover {
  border-color: #ff7875;
}

.mapping-add-btn {
  width: 100%;
  height: 34px;
  border: 0;
  border-top: 1px solid #f0f0f0;
  background: #fbfffa;
  color: #32b313;
  font-weight: 600;
  cursor: pointer;
}

.mapping-add-btn:hover {
  background: #f6ffed;
}

.label-with-help {
  display: inline-flex;
  align-items: center;
}

.config-modal .ant-input,
.config-modal select.ant-input {
  height: 34px;
  border-radius: 7px;
}

.config-modal textarea.ant-input {
  height: 88px;
  border-radius: 7px;
}

.json-preview-mask {
  z-index: 1100;
}

.json-preview-wrap,
.json-import-wrap {
  z-index: 1101;
}

.json-import-mask {
  z-index: 1100;
}

.json-preview-modal,
.json-import-modal {
  border-radius: 10px;
  overflow: hidden;
}

.json-preview-modal .ant-modal-header,
.json-import-modal .ant-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.json-preview-modal .ant-modal-body {
  max-height: 56vh;
  overflow: auto;
}

.json-preview-content {
  min-height: 220px;
  margin: 0;
  padding: 12px;
  border: 1px solid #edf0f2;
  border-radius: 7px;
  background: #fafafa;
  color: #1f2937;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.json-import-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
}

.json-import-textarea {
  width: 100%;
  min-height: 280px;
  resize: vertical;
  font-family: Consolas, 'Courier New', monospace;
  line-height: 1.6;
}

.json-import-modal .json-import-textarea {
  height: 280px;
}

.json-import-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.folder-scan-card {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fbfcfd;
}

.folder-scan-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.folder-scan-card__title {
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
}

.folder-scan-card__hint {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

.folder-scan-card__body {
  display: grid;
  grid-template-columns: minmax(180px, 240px);
  margin-top: 12px;
}

.file-access-card {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #dfe7f3;
  border-radius: 7px;
  background: #fbfdff;
}

.file-access-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.file-access-card__title {
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
}

.file-access-card__hint {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

.file-access-mode {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.file-access-mode__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid #d9f7be;
  border-radius: 999px;
  background: #fbfffa;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease, color .16s ease, box-shadow .16s ease;
}

.file-access-mode__item input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  margin: 0;
  outline: none;
  pointer-events: none;
}

.file-access-mode__dot {
  width: 14px;
  height: 14px;
  border: 1px solid #b7d9a8;
  border-radius: 50%;
  background: #fff;
  box-sizing: border-box;
  transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
}

.file-access-mode__item:has(input:checked) .file-access-mode__dot {
  border: 4px solid #52c41a;
  background: #fff;
}

.file-access-mode__item:has(input:checked) {
  border-color: #52c41a;
  background: #f6ffed;
  color: #237804;
  font-weight: 600;
}

.file-access-mode__item:has(input:focus-visible) {
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, .12);
}

.file-access-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) 120px;
  gap: 12px;
  align-items: end;
}

.file-access-actions {
  display: flex;
  align-items: flex-end;
  min-height: 58px;
}

.file-access-clear-btn {
  width: 100%;
  height: 34px;
  border: 1px solid #ffccc7;
  border-radius: 7px;
  background: #fff2f0;
  color: #f5222d;
  font-size: 13px;
  cursor: pointer;
}

.file-access-clear-btn:hover {
  border-color: #ff7875;
  background: #fff1f0;
}

.password-state {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 720px) {
  .filename-field-table {
    overflow-x: auto;
  }

  .filename-field-table__head,
  .filename-field-table__row {
    min-width: 570px;
  }
  .file-access-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .file-access-actions {
    min-height: 0;
  }
}

@media (max-width: 520px) {
  .template-system-fields__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .template-system-fields__header small {
    text-align: left;
  }

  .filename-parser-grid,
  .filename-test-grid {
    grid-template-columns: 1fr;
  }
  .file-access-grid {
    grid-template-columns: 1fr;
  }
}

.template-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 7px;
  background: #fafafa;
  color: #6b7280;
  font-size: 13px;
}

.template-state--error {
  border-color: #ffd8bf;
  background: #fff7e6;
  color: #ad4e00;
}

.template-retry-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid #52c41a;
  border-radius: 6px;
  background: #fff;
  color: #389e0d;
  cursor: pointer;
}

.template-retry-btn:hover {
  background: #f6ffed;
}

.folder-scan-switch {
  flex: 0 0 auto;
  margin-bottom: 0;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  color: #374151;
  font-size: 14px;
}

.switch-row input {
  width: 16px;
  height: 16px;
  margin: 0;
}

.segmented-control {
  position: relative;
  display: flex;
  background-color: #f2f4f6;
  border-radius: 9999px;
  padding: 4px;
  height: 34px;
  width: 100%;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}
.segment-pill {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  width: calc((100% - 8px) / 3);
  background-color: var(--ant-primary, #52c41a);
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.28);
  transition: transform 0.28s cubic-bezier(0.645, 0.045, 0.355, 1);
  z-index: 1;
}
.segment-options {
  display: flex;
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
}
.segment-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--ant-text-secondary);
  cursor: pointer;
  transition: color 0.3s ease;
  border-radius: 9999px;
  user-select: none;
}
.segment-option.active {
  color: #ffffff;
  font-weight: 600;
}
.auto-filled-input {
  background-color: #f6ffed !important;
  border-color: #b7eb8f !important;
  transition: all 0.3s;
}
.auto-filled-input:focus {
  background-color: #ffffff !important;
  border-color: var(--ant-primary, #1677ff) !important;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2) !important;
}
.template-view-btn {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #52c41a;
  font-size: 13px;
  cursor: pointer;
}

.template-label-row {
  width: 100%;
}

.template-view-btn:hover:not(:disabled) {
  text-decoration: underline;
}

.template-view-btn:disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}
</style>
