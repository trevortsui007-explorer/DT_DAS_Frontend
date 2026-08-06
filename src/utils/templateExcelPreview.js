const columnToIndex = (column) => {
  const text = String(column || '').trim().toUpperCase()
  let index = 0

  for (let i = 0; i < text.length; i += 1) {
    index = index * 26 + (text.charCodeAt(i) - 64)
  }

  return index - 1
}

const getCell = (rows, rowNumber, column) => {
  const row = rows[rowNumber - 1] || []
  const value = row[columnToIndex(column)]
  return value === undefined || value === null ? '' : value
}

const splitCellAddress = (source) => {
  const match = String(source || '').trim().match(/^([A-Za-z]+)(\d+)$/)
  if (!match) return null
  return {
    column: match[1],
    rowNumber: Number(match[2]),
  }
}

const normalizeText = (value) => String(value ?? '').trim()
const hasValue = (value) => normalizeText(value) !== ''

const CHECK_MARKERS = ['\u221a', '\u2713', '\u2714', '\u25a0', '\u2588', '\u25cf', '\u2611']

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isChecked = (value) => {
  const text = normalizeText(value)
  return CHECK_MARKERS.some((marker) => text.includes(marker))
}

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value

  const normalized = String(value).trim().replace(/,/g, '')
  if (!normalized) return null

  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

const parseIntValue = (value) => {
  const num = parseNumber(value)
  return num === null ? null : Math.trunc(num)
}

const parseChineseDate = (value) => {
  const match = normalizeText(value).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
  if (!match) return ''

  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const parseDateTimeText = (value) => normalizeText(value).replace('_', ' ')

const parseCheckedOption = (value, options = []) => {
  const text = normalizeText(value)
  const cleanOptions = options.filter((option) => normalizeText(option))

  const checkedOption = cleanOptions.find((option) => {
    const escaped = escapeRegExp(option)
    return CHECK_MARKERS.some((marker) => new RegExp(`${escapeRegExp(marker)}\\s*${escaped}`).test(text))
  })

  if (checkedOption) return checkedOption

  const markerIndexes = CHECK_MARKERS.map((marker) => text.indexOf(marker)).filter((index) => index >= 0)
  if (!markerIndexes.length) return ''

  const checkedPart = text.slice(Math.min(...markerIndexes))
  return cleanOptions.find((option) => checkedPart.includes(option)) || ''
}

const getCheckedOptionText = (rows, item) => {
  const address = splitCellAddress(item.source)
  if (!address) return ''

  const row = rows[address.rowNumber - 1] || []
  const startIndex = columnToIndex(address.column)
  const scanSpan = Math.max(((item.options || []).length + 1) * 4, 12)
  const endIndex = Math.min(row.length - 1, startIndex + scanSpan)
  const values = []

  for (let index = startIndex; index <= endIndex; index += 1) {
    const text = normalizeText(row[index])
    if (text) values.push(text)
  }

  return values.join(' ')
}

export const LAMINATION_THICKNESS_TEMPLATE = {
  id: 1,
  templateCode: 'lamination-thickness-daily',
  templateName: '层压工序板厚检验日报表',
  parserType: 'template-excel',
  version: 1,
  targetTable: 'DA_LaminationBoardThicknessDaily',
  configDefaults: {
    eqName: '层压板厚测量仪',
    filePathPattern: '',
    fileNamePattern: '*.xlsx',
    groupName: '层压板厚测量数据',
    taskName: '层压板厚测量数据采集',
    description: '按固定模板采集层压工序板厚检验日报表',
    cronExpression: '0 2 * * *',
    extFields: 'SourceRow, FileName, FullFilePath, CreateDt',
    postProcessingType: 0,
    procedureName: '',
    headerRow: 4,
    startRow: 6,
  },
  identity: {
    titleCell: 'B2',
    titleContains: '层压工序板厚检验日报表',
  },
  metadata: [
    { field: 'BusinessDate', label: '业务日期', source: 'B3', parser: 'dateFromChineseText' },
    { field: 'ShiftName', label: '班别', source: 'F3', parser: 'checkedOption', options: ['日班', '夜班'] },
    { field: 'ProductCategory', label: '产品类别', source: 'K3', parser: 'checkedOption', options: ['汽车', '医疗', '常规'] },
    { field: 'Workshop', label: '车间', source: 'S3', parser: 'checkedOption', options: ['一车间', '二车间'] },
  ],
  dataRegion: {
    startRow: 6,
    measurementColumns: ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
    stopRules: [
      {
        type: 'keyword',
        columns: ['B', 'C', 'D', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
        keywords: ['总计', '异常记录'],
      },
      {
        type: 'emptyRows',
        count: 2,
        columns: ['B', 'C', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
      },
    ],
    skipRules: [
      { type: 'allEmpty', columns: ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'] },
    ],
  },
  columns: [
    { field: 'ModelNo', label: '型号', column: 'B', type: 'string', carryForward: true },
    { field: 'BatchNo', label: '批号', column: 'C', type: 'string', carryForward: true },
    { field: 'Quantity', label: '数量', column: 'D', type: 'int', carryForward: true },
    { field: 'IsSample', label: '样品', column: 'E', type: 'booleanCheck', carryForward: true },
    { field: 'IsMassProduction', label: '量产', column: 'F', type: 'booleanCheck', carryForward: true },
    { field: 'StandardThickness', label: '理论板厚', column: 'G', type: 'decimal', carryForward: true },
    { field: 'UpperLimit', label: '上限', column: 'H', type: 'decimal', carryForward: true },
    { field: 'LowerLimit', label: '下限', column: 'I', type: 'decimal', carryForward: true },
    { field: 'Measure01', label: '测量值1', column: 'J', type: 'decimal' },
    { field: 'Measure02', label: '测量值2', column: 'K', type: 'decimal' },
    { field: 'Measure03', label: '测量值3', column: 'L', type: 'decimal' },
    { field: 'Measure04', label: '测量值4', column: 'M', type: 'decimal' },
    { field: 'Measure05', label: '测量值5', column: 'N', type: 'decimal' },
    { field: 'Measure06', label: '测量值6', column: 'O', type: 'decimal' },
    { field: 'Measure07', label: '测量值7', column: 'P', type: 'decimal' },
    { field: 'Measure08', label: '测量值8', column: 'Q', type: 'decimal' },
    { field: 'Measure09', label: '测量值9', column: 'R', type: 'decimal' },
    { field: 'RangeValue', label: '极差', column: 'S', type: 'decimal' },
    { field: 'AverageValue', label: '平均值', column: 'T', type: 'decimal' },
    { field: 'Judgment', label: '判定', type: 'judgmentFromColumns', accColumn: 'U', rejColumn: 'V' },
    { field: 'Remark', label: '备注', column: 'W', type: 'string' },
  ],
  previewHeaders: [
    'SourceRow',
    'BusinessDate',
    'ShiftName',
    'ProductCategory',
    'Workshop',
    'ModelNo',
    'BatchNo',
    'Quantity',
    'Measure01',
    'Measure09',
    'RangeValue',
    'AverageValue',
    'Judgment',
  ],
}

export const AUTOLINE_WIDTH_TEMPLATE = {
  id: 'autoline-width',
  templateCode: 'autoline-width',
  templateName: '内层自动线宽机',
  parserType: 'template-excel',
  version: 1,
  targetTable: 'm_mom_spu_zk_autolinewidth',
  configDefaults: {
    eqName: '内层自动线宽机',
    filePathPattern: 'D:/Desktop/Test/AL-Width-1',
    fileNamePattern: '*.xlsx',
    groupName: '内层自动线宽机数据',
    taskName: '内层自动线宽机数据采集',
    description: '按固定模板采集内层自动线宽机 Excel 数据',
    cronExpression: '0 2 * * *',
    extFields: 'Id(雪花算法),fileName,row,RowData(str),CreateDt,excelname,TH,SKYZ',
    postProcessingType: 1,
    procedureName: 'pr_m_mom_spu_zk_autolinewidth_sp',
    flag: 'CalculationUpdate',
  },
  identity: {
    sheetName: 'Work',
    requiredCells: [
      { source: 'A1', value: '工单号' },
      { source: 'C1', value: '测量员' },
      { source: 'F1', value: '料号_层别' },
      { source: 'A3', value: '项目' },
      { source: 'G3', value: '实测' },
    ],
  },
  metadata: [
    { field: 'wono', label: '工单号', source: 'A2', parser: 'text' },
    { field: 'QR_code', label: '二维码', source: 'B2', parser: 'text' },
    { field: 'Surveyor', label: '测量员', source: 'C2', parser: 'text' },
    { field: 'start_time', label: '开始时间', source: 'D2', parser: 'datetimeText' },
    { field: 'end_time', label: '测试时间', source: 'E2', parser: 'datetimeText' },
    { field: 'prodno_Layer', label: '料号_层别', source: 'F2', parser: 'text' },
    { field: 'lot', label: '批号', source: 'G2', parser: 'text' },
    { field: 'batch', label: '批量', source: 'H2', parser: 'text' },
    { field: 'Remark', label: '备注', source: 'I2', parser: 'text' },
    { field: 'Header_RESULT', label: '判定结果', source: 'J2', parser: 'text' },
    { field: 'product_type', label: '产品类别', source: 'K2', parser: 'text' },
  ],
  dataRegion: {
    startRow: 4,
    measurementColumns: ['A', 'B', 'C', 'G'],
    stopRules: [
      { type: 'keyword', columns: ['A'], keywords: ['料号层别'] },
      { type: 'emptyRows', count: 2, columns: ['A', 'B', 'C', 'G'] },
    ],
    skipRules: [
      { type: 'allEmpty', columns: ['A', 'B', 'C', 'G'] },
    ],
  },
  columns: [
    { field: 'Measure_item', label: '项目', column: 'A', type: 'string' },
    { field: 'Measure_type', label: '测量方式', column: 'B', type: 'string' },
    { field: 'SERIAL_NO', label: '序号', column: 'C', type: 'int' },
    { field: 'Specification', label: '规格', column: 'D', type: 'string' },
    { field: 'MAX_VALUE', label: '上限', column: 'E', type: 'string' },
    { field: 'MIN_VALUE', label: '下限', column: 'F', type: 'string' },
    { field: 'measured_value', label: '实测', column: 'G', type: 'string' },
    { field: 'RESULT', label: '判定', column: 'I', type: 'string' },
  ],
  fixedFields: {
    TH: '0',
    SKYZ: '0',
  },
  rawFields: {
    str: 'joinDetailRow',
  },
  systemFields: ['Id(雪花算法)', 'fileName', 'row', 'RowData(str)', 'CreateDt', 'excelname'],
  fieldMappings: {
    项目: 'Measure_item',
    测量方式: 'Measure_type',
    序号: 'SERIAL_NO',
    规格: 'Specification',
    上限: 'MAX_VALUE',
    下限: 'MIN_VALUE',
    实测: 'measured_value',
    判定: 'RESULT',
  },
  previewHeaders: [
    'Id',
    'row',
    'prodno_Layer',
    'product_type',
    'Surveyor',
    'start_time',
    'end_time',
    'Header_RESULT',
    'Measure_item',
    'Measure_type',
    'SERIAL_NO',
    'Specification',
    'MAX_VALUE',
    'MIN_VALUE',
    'measured_value',
    'RESULT',
    'TH',
    'SKYZ',
    'CreateDt',
  ],
}

export const AUTOLINE_WIDTH_NO_METADATA_TEMPLATE = {
  id: 'autoline-width-no-metadata',
  templateCode: 'autoline-width-no-metadata',
  templateName: '内层自动线宽机-无元数据',
  parserType: 'template-excel',
  version: 1,
  targetTable: 'm_mom_spu_zk_autolinewidth',
  configDefaults: {
    eqName: '内层自动线宽机',
    filePathPattern: 'D:/Desktop/Test/AL-Width-1',
    fileNamePattern: '*.xlsx',
    groupName: '内层自动线宽机数据',
    taskName: '内层自动线宽机数据采集',
    description: '按无元数据明细模板采集内层自动线宽机 Excel 数据',
    cronExpression: '0 2 * * *',
    extFields: 'Id(雪花算法),fileName,row,RowData(str),CreateDt,excelname,TH,SKYZ',
    postProcessingType: 1,
    procedureName: 'pr_m_mom_spu_zk_autolinewidth_sp',
    flag: 'CalculationUpdate',
    headerRow: 1,
    startRow: 2,
  },
  identity: {
    sheetName: 'Work',
    requiredCells: [
      { source: 'A1', value: '测量项目' },
      { source: 'B1', value: '判定结果' },
      { source: 'C1', value: '测量值' },
      { source: 'K1', value: '测量模式' },
    ],
  },
  metadata: [],
  dataRegion: {
    startRow: 2,
    measurementColumns: ['A', 'B', 'C', 'D', 'K'],
    stopRules: [
      { type: 'emptyRows', count: 2, columns: ['A', 'B', 'C', 'D', 'K'] },
    ],
    skipRules: [
      { type: 'allEmpty', columns: ['A', 'B', 'C', 'D', 'K'] },
    ],
  },
  columns: [
    { field: 'Measure_item', label: '测量项目', column: 'A', type: 'string' },
    { field: 'RESULT', label: '判定结果', column: 'B', type: 'string' },
    { field: 'measured_value', label: '测量值', column: 'C', type: 'string' },
    { field: 'Specification', label: '测量目标值', column: 'D', type: 'string' },
    { field: 'SERIAL_NO', label: '测量板编号', column: 'E', type: 'int' },
    { field: 'MAX_VALUE', label: '上限', column: 'G', type: 'string' },
    { field: 'MIN_VALUE', label: '下限', column: 'H', type: 'string' },
    { field: 'Measure_type', label: '测量模式', column: 'K', type: 'string' },
  ],
  fixedFields: {
    TH: '0',
    SKYZ: '0',
  },
  rawFields: {
    str: 'joinDetailRow',
  },
  systemFields: ['Id(雪花算法)', 'fileName', 'row', 'RowData(str)', 'CreateDt', 'excelname', 'TH', 'SKYZ'],
  filenameFields: {
    prodno_Layer: 'firstDashPart',
  },
  fieldMappings: {
    测量项目: 'Measure_item',
    判定结果: 'RESULT',
    测量值: 'measured_value',
    测量目标值: 'Specification',
    测量板编号: 'SERIAL_NO',
    上限: 'MAX_VALUE',
    下限: 'MIN_VALUE',
    测量模式: 'Measure_type',
  },
  previewHeaders: [
    'Id',
    'row',
    'prodno_Layer',
    'Measure_item',
    'Measure_type',
    'SERIAL_NO',
    'Specification',
    'MAX_VALUE',
    'MIN_VALUE',
    'measured_value',
    'RESULT',
    'TH',
    'SKYZ',
    'CreateDt',
  ],
}

export const BUILTIN_EXCEL_TEMPLATES = [
  LAMINATION_THICKNESS_TEMPLATE,
  AUTOLINE_WIDTH_TEMPLATE,
  AUTOLINE_WIDTH_NO_METADATA_TEMPLATE,
]

const parseDefinitionJson = (template) => {
  const raw = template?.definitionJson ?? template?.DefinitionJson
  if (!raw) return {}
  if (typeof raw === 'object') return raw

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export const getTemplateId = (template) => template?.id ?? template?.Id ?? template?.templateCode ?? template?.TemplateCode

export const getTemplateCode = (template) => template?.templateCode ?? template?.TemplateCode ?? template?.identity?.templateCode ?? ''

export const getTemplateName = (template) => template?.templateName ?? template?.TemplateName ?? template?.identity?.templateName ?? ''

const checkRequiredCells = (rows, requiredCells = []) =>
  requiredCells.every((item) => normalizeText(getCell(
    rows,
    splitCellAddress(item.source)?.rowNumber || 0,
    splitCellAddress(item.source)?.column || '',
  )) === normalizeText(item.value))

export const normalizeExcelTemplate = (template) => {
  const definition = parseDefinitionJson(template)
  const identity = {
    ...(definition.identity || {}),
    ...(template.identity || {}),
  }
  const templateCode = getTemplateCode(template) || identity.templateCode
  const templateName = getTemplateName(template) || identity.templateName

  return {
    ...definition,
    ...template,
    ...definition,
    id: getTemplateId(template),
    templateCode,
    templateName,
    parserType: template?.parserType ?? template?.ParserType ?? definition.parserType ?? 'template-excel',
    version: template?.version ?? template?.TemplateVersion ?? template?.templateVersion ?? definition.version ?? 1,
    targetTable: definition.targetTable ?? template?.targetTable ?? template?.TargetTable ?? '',
    identity: {
      ...identity,
      templateCode,
      templateName,
    },
    metadata: Array.isArray(definition.metadata) ? definition.metadata : (template?.metadata || []),
    dataRegion: {
      ...(template?.dataRegion || {}),
      ...(definition.dataRegion || {}),
    },
    columns: Array.isArray(definition.columns) ? definition.columns : (template?.columns || []),
    systemFields: Array.isArray(definition.systemFields) ? definition.systemFields : (template?.systemFields || []),
    fixedFields: definition.fixedFields ?? template?.fixedFields ?? {},
    rawFields: definition.rawFields ?? template?.rawFields ?? {},

    fieldMappings: definition.fieldMappings ?? template?.fieldMappings,
    configDefaults: {
      ...(template?.configDefaults || {}),
      ...(definition.configDefaults || {}),
    },
    previewHeaders: definition.previewHeaders ?? template?.previewHeaders,
  }
}

export const mergeImportTemplates = (templates = []) => {
  const merged = new Map()

  BUILTIN_EXCEL_TEMPLATES.forEach((template) => {
    merged.set(getTemplateCode(template), template)
  })

  templates.forEach((template) => {
    const normalized = normalizeExcelTemplate(template)
    merged.set(normalized.templateCode || String(normalized.id), normalized)
  })

  return Array.from(merged.values())
}

export const findTemplateById = (templates, templateId) =>
  templates.find((template) => String(getTemplateId(template)) === String(templateId))

const parseMetadataValue = (rows, item) => {
  const address = splitCellAddress(item.source)
  const value =
    item.parser === 'checkedOption'
      ? getCheckedOptionText(rows, item)
      : getCell(rows, address?.rowNumber || 0, address?.column || '')

  if (item.parser === 'dateFromChineseText') return parseChineseDate(value)
  if (item.parser === 'datetimeText') return parseDateTimeText(value)
  if (item.parser === 'checkedOption') return parseCheckedOption(value, item.options)

  return normalizeText(value)
}

const rowIsEmpty = (rows, rowNumber, columns) =>
  columns.every((column) => !hasValue(getCell(rows, rowNumber, column)))

const rowHasKeyword = (rows, rowNumber, rule) =>
  (rule.columns || []).some((column) => {
    const text = normalizeText(getCell(rows, rowNumber, column))
    return (rule.keywords || []).some((keyword) => text.includes(keyword))
  })

const rowMatchesStopRule = (rows, rowNumber, rule, emptyState) => {
  if (rule.type === 'keyword') {
    return rowHasKeyword(rows, rowNumber, rule)
  }

  if (rule.type === 'emptyRows') {
    if (rowIsEmpty(rows, rowNumber, rule.columns || [])) {
      emptyState.count += 1
      return emptyState.count >= (Number(rule.count) || 1)
    }
    emptyState.count = 0
  }

  return false
}

const rowMatchesSkipRule = (rows, rowNumber, rule) => {
  if (rule.type === 'allEmpty') {
    return rowIsEmpty(rows, rowNumber, rule.columns || [])
  }

  return false
}

const rowHasMeasurements = (rows, rowNumber, template) => {
  const measurementColumns = template.dataRegion.measurementColumns || template.columns.map((column) => column.column).filter(Boolean)
  return measurementColumns.some((column) => hasValue(getCell(rows, rowNumber, column)))
}

const parseColumnValue = (rows, rowNumber, column) => {
  if (column.type === 'judgmentFromColumns') {
    if (isChecked(getCell(rows, rowNumber, column.accColumn))) return 'ACC'
    if (isChecked(getCell(rows, rowNumber, column.rejColumn))) return 'REJ'
    return ''
  }

  const raw = getCell(rows, rowNumber, column.column)
  if (column.type === 'decimal') return parseNumber(raw)
  if (column.type === 'int') return parseIntValue(raw)
  if (column.type === 'booleanCheck') return isChecked(raw)

  return normalizeText(raw)
}

const getFileNameWithoutExtension = (fileName = '') =>
  String(fileName || '').replace(/\.[^.\\/]+$/, '')

const applyFilenameFields = (rowData, template, fileName) => {
  Object.entries(template.filenameFields || {}).forEach(([field, action]) => {
    if (!field) return

    if (action === 'firstDashPart') {
      rowData[field] = getFileNameWithoutExtension(fileName).split('-')[0] || ''
    }
  })
}

const columnHasRawValue = (rows, rowNumber, column) => {
  if (!column.column) return true
  return hasValue(getCell(rows, rowNumber, column.column))
}

const buildFieldMappings = (template) => {
  if (template.fieldMappings && typeof template.fieldMappings === 'object') {
    return template.fieldMappings
  }

  return template.columns.reduce((acc, column) => {
    acc[column.label || column.field] = column.field
    return acc
  }, {})
}

const buildRawFieldValue = (rows, rowNumber, action) => {
  if (action !== 'joinDetailRow') return ''

  const row = rows[rowNumber - 1] || []
  const lastValueIndex = row.reduce((lastIndex, value, index) => (hasValue(value) ? index : lastIndex), -1)
  if (lastValueIndex < 0) return ''

  return row.slice(0, lastValueIndex + 1).map((value) => normalizeText(value)).join(',')
}

const splitExtFields = (value) => {
  const result = []
  let current = ''
  let depth = 0

  String(value || '').split('').forEach((char) => {
    if (char === '(') depth += 1
    if (char === ')') depth = Math.max(depth - 1, 0)

    if (char === ',' && depth === 0) {
      if (current.trim()) result.push(current.trim())
      current = ''
      return
    }

    current += char
  })

  if (current.trim()) result.push(current.trim())
  return result
}

const normalizeExtFieldKey = (value) =>
  String(value || '')
    .trim()
    .replace(/[_-]/g, '')
    .toLowerCase()

const getExtFieldSpecs = (template) => {
  const seen = new Set()
  return [
    ...splitExtFields(template.configDefaults?.extFields || ''),
    ...(Array.isArray(template.systemFields) ? template.systemFields : []),
  ].filter((fieldSpec) => {
    const key = String(fieldSpec || '').trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const createGuid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

const createSnowflakePreviewId = (rowNumber) => {
  const timestamp = Date.now().toString()
  return `${timestamp}${String(rowNumber).padStart(5, '0')}`
}

const applySystemFields = (record, template, rowNumber, fileName, rows) => {
  const excelName = String(fileName || '').replace(/\.[^.]+$/, '')
  const createDt = new Date().toISOString().slice(0, 19).replace('T', ' ')

  getExtFieldSpecs(template).forEach((fieldSpec) => {
    const text = String(fieldSpec || '').trim()
    const normalized = normalizeExtFieldKey(text)
    const rowDataMatch = text.match(/^RowData\(([^)]+)\)$/i)

    if (rowDataMatch?.[1]) {
      record[rowDataMatch[1].trim()] = buildRawFieldValue(rows, rowNumber, 'joinDetailRow')
      return
    }

    if (/^Id\(Guid\)$/i.test(text)) {
      record.Id = createGuid()
      return
    }

    if (/^Id\((Snowflake|雪花算法)\)$/i.test(text)) {
      record.Id = createSnowflakePreviewId(rowNumber)
      return
    }

    if (normalized === 'sourcerow') record.SourceRow = rowNumber
    if (normalized === 'row') record.row = rowNumber
    if (normalized === 'filename') record.fileName = fileName
    if (text === 'FileName') record.FileName = fileName
    if (normalized === 'fullfilepath') record.FullFilePath = ''
    if (normalized === 'excelname') record.excelname = excelName
    if (normalized === 'createdt') record.CreateDt = createDt
  })
}

const getPreviewHeaders = (template, records) => {
  if (Array.isArray(template.previewHeaders) && template.previewHeaders.length) return template.previewHeaders
  if (!records.length) return []

  return Object.keys(records[0])
}

export const createTemplateExcelPreview = (rows, fileName = '', rawTemplate = LAMINATION_THICKNESS_TEMPLATE) => {
  const template = normalizeExcelTemplate(rawTemplate)
  const titleAddress = splitCellAddress(template.identity?.titleCell)

  const title = titleAddress ? normalizeText(getCell(rows, titleAddress.rowNumber, titleAddress.column)) : ''
  const titleContains = normalizeText(template.identity?.titleContains)
  const requiredCells = template.identity?.requiredCells || []
  const matched = titleContains
    ? title.includes(titleContains)
    : (!requiredCells.length || checkRequiredCells(rows, requiredCells))
  const metadata = {}

  template.metadata.forEach((item) => {
    metadata[item.field] = parseMetadataValue(rows, item)
  })

  const records = []
  const carryValues = {}
  const emptyStates = new Map()
  let stopReason = ''

  for (let rowNumber = Number(template.dataRegion.startRow) || 1; rowNumber <= rows.length; rowNumber += 1) {
    const stopRule = (template.dataRegion.stopRules || []).find((rule, index) => {
      const state = emptyStates.get(index) || { count: 0 }
      const matchedRule = rowMatchesStopRule(rows, rowNumber, rule, state)
      emptyStates.set(index, state)
      return matchedRule
    })

    if (stopRule) {
      stopReason = `第 ${rowNumber} 行命中停止规则`
      break
    }

    if ((template.dataRegion.skipRules || []).some((rule) => rowMatchesSkipRule(rows, rowNumber, rule))) {
      continue
    }

    if (!rowHasMeasurements(rows, rowNumber, template)) continue

    const rowData = { ...metadata }
    applySystemFields(rowData, template, rowNumber, fileName, rows)
    applyFilenameFields(rowData, template, fileName)

    template.columns.forEach((column) => {
      const value = parseColumnValue(rows, rowNumber, column)
      const hasCurrentValue = columnHasRawValue(rows, rowNumber, column)

      if (column.carryForward) {
        if (hasCurrentValue) carryValues[column.field] = value
        rowData[column.field] = hasCurrentValue
          ? value
          : carryValues[column.field] ?? (column.type === 'booleanCheck' ? false : null)
        return
      }

      rowData[column.field] = value
    })

    Object.entries(template.fixedFields || {}).forEach(([field, value]) => {
      rowData[field] = value
    })

    Object.entries(template.rawFields || {}).forEach(([field, action]) => {
      rowData[field] = buildRawFieldValue(rows, rowNumber, action)

    })


    records.push(rowData)
  }

  if (!stopReason) {
    stopReason = `扫描到工作表末尾，共 ${rows.length} 行`
  }

  const previewHeaders = getPreviewHeaders(template, records)

  return {
    matched,
    template,
    metadata,
    records,
    stopReason,
    previewRows: records.slice(0, 5),
    previewHeaders,
    fieldMappings: buildFieldMappings(template),
  }
}

export const createLaminationThicknessPreview = (rows, fileName = '') =>
  createTemplateExcelPreview(rows, fileName, LAMINATION_THICKNESS_TEMPLATE)

export const buildTemplateImportPayload = (preview, options = {}) => {
  const template = preview.template
  const defaults = template.configDefaults || {}

  return {
    templateId: template.id,
    templateCode: template.templateCode,
    parserType: template.parserType,
    config: {
      EqName: options.eqName || defaults.eqName || template.templateName,
      TableName: template.targetTable,
      FilePathPattern: options.filePathPattern ?? defaults.filePathPattern ?? '',
      FileNamePattern: options.fileNamePattern ?? defaults.fileNamePattern ?? '*.xlsx',
      FileType: '.xlsx',
      HeaderRow: Number(defaults.headerRow) || 3,
      StartRow: Number(defaults.startRow) || Number(template.dataRegion.startRow) || 1,
      ParserType: template.parserType,
      TemplateId: template.id,
      ParserOptions: JSON.stringify({
        templateCode: template.templateCode,
        folderScan: {
          recursive: options.folderRecursive ?? true,
          maxDepth: options.folderMaxDepth ?? 5,
          includeCurrentFolder: true,
        },
      }),
      FieldMappings: JSON.stringify(preview.fieldMappings, null, 2),
      ExtFields: defaults.extFields || '',
      IsEnabled: true,
      PostProcessingType: Number(defaults.postProcessingType) || 0,
      ProcedureName: defaults.procedureName || '',
      Flag: defaults.flag || '',
    },
    group: {
      GroupName: options.groupName || defaults.groupName || template.templateName,
      GroupCategory: options.groupCategory || '',
      GroupType: options.groupType || '默认周期执行组',
      IsEnabled: true,
    },
    task: {
      TaskName: options.taskName || defaults.taskName || `${template.templateName}采集`,
      Description: options.description || defaults.description || `按固定模板采集${template.templateName}`,
      TaskMode: 1,
      CronExpression: options.cronExpression || defaults.cronExpression || '0 2 * * *',
      IsEnabled: true,
    },
    preview: {
      metadata: preview.metadata,
      rowCount: preview.records.length,
      stopReason: preview.stopReason,
    },
  }
}

export const buildLaminationTemplateImportPayload = (preview, options = {}) =>
  buildTemplateImportPayload(preview, options)
