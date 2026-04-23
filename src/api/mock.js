// ====================== 工具函数 ======================
const delay = (data, time = 300) =>
  new Promise(resolve => setTimeout(() => resolve(data), time))

const getIdFromUrl = (url) => Number(url.split('?')[0].split('/').pop())

const getTaskLogIdFromUrl = (url) => {
  const pathname = url.split('?')[0]
  const parts = pathname.split('/')
  const taskLogId = parts[parts.indexOf('task-log') + 1]
  return taskLogId || ''
}

const createMockTaskLogId = () => {
  return `TL${Date.now()}`
}

// ====================== Mock 数据（扩展版） ======================

// 任务数据 - 共18个
export const mockTasks = {
  data: [
    {
      id: 1,
      taskName: '每日采集任务',
      description: '从 FTP 拉取生产数据',
      taskMode: 1,
      cronExpression: '0 0 2 * * *',
      isEnabled: true,
      groupIds: [101]
    },
    {
      id: 2,
      taskName: '实时监控任务',
      description: '监听文件变化',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: false,
      groupIds: [102]
    },
    {
      id: 3,
      taskName: '每周报告生成',
      description: '汇总上周设备数据生成 PDF 报告',
      taskMode: 1,
      cronExpression: '0 0 9 * * 1',
      isEnabled: true,
      groupIds: [103, 104]
    },
    {
      id: 4,
      taskName: '数据同步任务',
      description: '将本地数据同步至云端数据库',
      taskMode: 1,
      cronExpression: '0 */15 * * * *',
      isEnabled: true,
      groupIds: [101]
    },
    {
      id: 5,
      taskName: '报警推送任务',
      description: '检测阈值异常时推送微信/邮件',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: true,
      groupIds: [105]
    },
    {
      id: 6,
      taskName: '历史数据清理',
      description: '自动删除 90 天前的无用记录',
      taskMode: 1,
      cronExpression: '0 0 3 * * 0',
      isEnabled: false,
      groupIds: [102, 104]
    },
    {
      id: 7,
      taskName: '设备状态巡检',
      description: '每小时检查设备在线状态',
      taskMode: 1,
      cronExpression: '0 0 * * * *',
      isEnabled: true,
      groupIds: [101, 103]
    },
    {
      id: 8,
      taskName: '文件解析任务',
      description: '解析上传的 Excel 并入库',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: true,
      groupIds: [106]
    },
    {
      id: 9,
      taskName: '月度统计任务',
      description: '生成月度能耗统计报表',
      taskMode: 1,
      cronExpression: '0 0 4 1 * *',
      isEnabled: true,
      groupIds: [107]
    },
    {
      id: 10,
      taskName: '实时数据推送',
      description: '通过 WebSocket 推送最新传感器数据',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: false,
      groupIds: [102]
    },
    {
      id: 11,
      taskName: '夜间批量导入',
      description: '每天凌晨导入前一天所有产线日志',
      taskMode: 1,
      cronExpression: '0 30 1 * * *',
      isEnabled: true,
      groupIds: [108, 109]
    },
    {
      id: 12,
      taskName: '能耗峰值预警',
      description: '当用电量超过阈值时立即告警',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: true,
      groupIds: [101, 110]
    },
    {
      id: 13,
      taskName: '季度审计报告',
      description: '每季度生成环保排放合规报告',
      taskMode: 1,
      cronExpression: '0 0 8 1 */3 *',
      isEnabled: true,
      groupIds: [104]
    },
    {
      id: 14,
      taskName: 'PLC 数据采集',
      description: '通过 Modbus 协议实时采集 PLC 数据',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: true,
      groupIds: [111]
    },
    {
      id: 15,
      taskName: '设备保养提醒',
      description: '根据运行时长自动生成保养计划',
      taskMode: 1,
      cronExpression: '0 0 10 * * 6',
      isEnabled: false,
      groupIds: [105, 106]
    },
    {
      id: 16,
      taskName: '数据质量检查',
      description: '每日校验数据完整性和异常值',
      taskMode: 1,
      cronExpression: '0 0 4 * * *',
      isEnabled: true,
      groupIds: [107, 108]
    },
    {
      id: 17,
      taskName: '视频流分析任务',
      description: '分析监控画面中的异常行为',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: true,
      groupIds: [112]
    },
    {
      id: 18,
      taskName: '年度 KPI 计算',
      description: '每年 1 月 1 日计算上一年度各项 KPI',
      taskMode: 1,
      cronExpression: '0 0 0 1 1 *',
      isEnabled: true,
      groupIds: [109, 110]
    }
  ]
}

// 配置组数据 - 共12个
export const mockGroups = {
  data: [
    {
      id: 101,
      groupName: '电力组',
      groupCategory: '二厂',
      groupType: '默认周期执行组',
      sortOrder: 1,
      isEnabled: true,
      configCount: 5,
      AssociatedConfigs: [
        { Id: 201, EqName: '温度传感器 A' },
        { Id: 203, EqName: '电压监控仪 01' },
        { Id: 207, EqName: '电流监控仪 02' },
        { Id: 215, EqName: '有功功率表' },
        { Id: 216, EqName: '变压器温度' }
      ]
    },
    {
      id: 102,
      groupName: '水务组',
      groupCategory: '三厂',
      groupType: '默认周期执行组',
      sortOrder: 2,
      isEnabled: false,
      configCount: 4,
      AssociatedConfigs: [
        { Id: 202, EqName: '压力传感器 B' },
        { Id: 208, EqName: '液位传感器 C' },
        { Id: 217, EqName: '流量计 E' }
      ]
    },
    {
      id: 103,
      groupName: '燃气组',
      groupCategory: '一厂',
      groupType: '默认周期执行组',
      sortOrder: 3,
      isEnabled: true,
      configCount: 4,
      AssociatedConfigs: [
        { Id: 204, EqName: '流量计 D' },
        { Id: 209, EqName: '燃气浓度传感器' },
        { Id: 218, EqName: '压力变送器 F' }
      ]
    },
    {
      id: 104,
      groupName: '环保组',
      groupCategory: '四厂',
      groupType: '事件触发组',
      sortOrder: 4,
      isEnabled: true,
      configCount: 5,
      AssociatedConfigs: [
        { Id: 205, EqName: 'pH 值传感器' },
        { Id: 210, EqName: 'COD 监测仪' },
        { Id: 211, EqName: '氨氮传感器' },
        { Id: 219, EqName: '烟气分析仪' }
      ]
    },
    {
      id: 105,
      groupName: '机械组',
      groupCategory: '二厂',
      groupType: '默认周期执行组',
      sortOrder: 5,
      isEnabled: true,
      configCount: 3,
      AssociatedConfigs: [
        { Id: 206, EqName: '振动传感器 E' },
        { Id: 220, EqName: '电机转速传感器' }
      ]
    },
    {
      id: 106,
      groupName: '智能制造组',
      groupCategory: '五厂',
      groupType: '实时监控组',
      sortOrder: 6,
      isEnabled: false,
      configCount: 4,
      AssociatedConfigs: [
        { Id: 212, EqName: '工业机器人状态' },
        { Id: 213, EqName: 'AGV 小车定位' },
        { Id: 221, EqName: 'MES 系统接口' }
      ]
    },
    {
      id: 107,
      groupName: '质量检测组',
      groupCategory: '一厂',
      groupType: '默认周期执行组',
      sortOrder: 7,
      isEnabled: true,
      configCount: 3,
      AssociatedConfigs: [
        { Id: 214, EqName: '光谱分析仪' },
        { Id: 222, EqName: '厚度测量仪' }
      ]
    },
    {
      id: 108,
      groupName: '蒸汽动力组',
      groupCategory: '三厂',
      groupType: '默认周期执行组',
      sortOrder: 8,
      isEnabled: true,
      configCount: 3,
      AssociatedConfigs: [
        { Id: 223, EqName: '蒸汽流量计' },
        { Id: 224, EqName: '锅炉压力表' }
      ]
    },
    {
      id: 109,
      groupName: '生产调度组',
      groupCategory: '一厂',
      groupType: '事件触发组',
      sortOrder: 9,
      isEnabled: true,
      configCount: 4,
      AssociatedConfigs: [
        { Id: 225, EqName: '订单跟踪器' },
        { Id: 226, EqName: 'AGV 电量监控' }
      ]
    },
    {
      id: 110,
      groupName: '能源管理组',
      groupCategory: '全厂',
      groupType: '默认周期执行组',
      sortOrder: 10,
      isEnabled: true,
      configCount: 3,
      AssociatedConfigs: [{ Id: 227, EqName: '总电表' }]
    },
    {
      id: 111,
      groupName: '自动化控制组',
      groupCategory: '五厂',
      groupType: '实时监控组',
      sortOrder: 11,
      isEnabled: true,
      configCount: 4,
      AssociatedConfigs: [
        { Id: 228, EqName: 'PLC 模拟量输入' },
        { Id: 229, EqName: '伺服驱动器状态' }
      ]
    },
    {
      id: 112,
      groupName: '安防监控组',
      groupCategory: '四厂',
      groupType: '事件触发组',
      sortOrder: 12,
      isEnabled: false,
      configCount: 2,
      AssociatedConfigs: [{ Id: 230, EqName: '红外热成像仪' }]
    }
  ]
}

// 配置项数据 - 共25个
export const mockConfigs = {
  data: [
    {
      Id: 201,
      EqName: '温度传感器 A',
      TableName: 'temperature_data',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "温度": "temp_value", "采集时间": "timestamp" }
    },
    {
      Id: 202,
      EqName: '压力传感器 B',
      TableName: 'pressure_data',
      FileType: 'xlsx',
      IsEnabled: false,
      FieldMappings: { "压力": "pressure_value", "单位": "unit" }
    },
    {
      Id: 203,
      EqName: '电压监控仪 01',
      TableName: 'voltage_data',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "电压": "volt_value", "相序": "phase" }
    },
    {
      Id: 204,
      EqName: '流量计 D',
      TableName: 'flow_data',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "瞬时流量": "flow_rate", "累计流量": "total_flow" }
    },
    {
      Id: 205,
      EqName: 'pH 值传感器',
      TableName: 'ph_data',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "pH值": "ph_value", "温度补偿": "temp_comp" }
    },
    {
      Id: 206,
      EqName: '振动传感器 E',
      TableName: 'vibration_data',
      FileType: 'xlsx',
      IsEnabled: true,
      FieldMappings: { "振动幅度": "vib_amplitude", "频率": "frequency" }
    },
    {
      Id: 207,
      EqName: '电流监控仪 02',
      TableName: 'current_data',
      FileType: 'csv',
      IsEnabled: false,
      FieldMappings: { "电流": "current_value", "功率": "power" }
    },
    {
      Id: 208,
      EqName: '液位传感器 C',
      TableName: 'level_data',
      FileType: 'txt',
      IsEnabled: true,
      FieldMappings: { "液位高度": "level_height", "百分比": "percentage" }
    },
    {
      Id: 209,
      EqName: '燃气浓度传感器',
      TableName: 'gas_concentration',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "CH4浓度": "ch4_ppm", "CO浓度": "co_ppm" }
    },
    {
      Id: 210,
      EqName: 'COD 监测仪',
      TableName: 'cod_data',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "COD值": "cod_value", "溶氧": "do_value" }
    },
    {
      Id: 211,
      EqName: '氨氮传感器',
      TableName: 'ammonia_data',
      FileType: 'csv',
      IsEnabled: false,
      FieldMappings: { "氨氮": "nh3_value", "温度": "temp" }
    },
    {
      Id: 212,
      EqName: '工业机器人状态',
      TableName: 'robot_status',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "关节角度": "joint_angle", "运行状态": "status" }
    },
    {
      Id: 213,
      EqName: 'AGV 小车定位',
      TableName: 'agv_position',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "X坐标": "x_pos", "Y坐标": "y_pos", "速度": "speed" }
    },
    {
      Id: 214,
      EqName: '光谱分析仪',
      TableName: 'spectrum_data',
      FileType: 'xlsx',
      IsEnabled: true,
      FieldMappings: { "波长": "wavelength", "吸光度": "absorbance" }
    },
    {
      Id: 215,
      EqName: '有功功率表',
      TableName: 'power_active',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "有功功率": "active_power", "功率因数": "pf" }
    },
    {
      Id: 216,
      EqName: '变压器温度',
      TableName: 'transformer_temp',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "绕组温度": "winding_temp", "油温": "oil_temp" }
    },
    {
      Id: 217,
      EqName: '流量计 E',
      TableName: 'water_flow',
      FileType: 'csv',
      IsEnabled: false,
      FieldMappings: { "瞬时流量": "instant_flow", "累计流量": "total" }
    },
    {
      Id: 218,
      EqName: '压力变送器 F',
      TableName: 'gas_pressure',
      FileType: 'xlsx',
      IsEnabled: true,
      FieldMappings: { "表压": "gauge_pressure", "绝压": "absolute" }
    },
    {
      Id: 219,
      EqName: '烟气分析仪',
      TableName: 'flue_gas',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "SO2": "so2_ppm", "NOx": "nox_ppm", "O2": "oxygen" }
    },
    {
      Id: 220,
      EqName: '电机转速传感器',
      TableName: 'motor_speed',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "转速": "rpm", "扭矩": "torque" }
    },
    {
      Id: 221,
      EqName: 'MES 系统接口',
      TableName: 'mes_production',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "产量": "output", "良率": "yield_rate" }
    },
    {
      Id: 222,
      EqName: '厚度测量仪',
      TableName: 'thickness_data',
      FileType: 'xlsx',
      IsEnabled: true,
      FieldMappings: { "实测厚度": "actual_mm", "偏差": "deviation" }
    },
    {
      Id: 223,
      EqName: '蒸汽流量计',
      TableName: 'steam_flow',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "蒸汽流量": "steam_tph", "温度": "temp" }
    },
    {
      Id: 224,
      EqName: '锅炉压力表',
      TableName: 'boiler_pressure',
      FileType: 'json',
      IsEnabled: false,
      FieldMappings: { "锅炉压力": "pressure_bar", "水位": "water_level" }
    },
    {
      Id: 225,
      EqName: '订单跟踪器',
      TableName: 'order_tracking',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "订单号": "order_id", "进度": "progress" }
    },
    {
      Id: 226,
      EqName: 'AGV 电量监控',
      TableName: 'agv_battery',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "剩余电量": "soc", "电压": "voltage" }
    },
    {
      Id: 227,
      EqName: '总电表',
      TableName: 'total_energy',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "今日用电": "daily_kwh", "本月用电": "monthly_kwh" }
    },
    {
      Id: 228,
      EqName: 'PLC 模拟量输入',
      TableName: 'plc_analog',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "通道1": "ai1", "通道2": "ai2" }
    },
    {
      Id: 229,
      EqName: '伺服驱动器状态',
      TableName: 'servo_status',
      FileType: 'csv',
      IsEnabled: true,
      FieldMappings: { "报警码": "alarm_code", "位置": "position" }
    },
    {
      Id: 230,
      EqName: '红外热成像仪',
      TableName: 'thermal_image',
      FileType: 'json',
      IsEnabled: true,
      FieldMappings: { "最高温度": "max_temp", "热点坐标": "hotspot" }
    }
  ]
}

// ====================== 总览数据 ======================
export const mockOverviewTrend = {
  data: [
    { time: '08:00', value: 120 },
    { time: '10:00', value: 168 },
    { time: '12:00', value: 150 },
    { time: '14:00', value: 268 },
    { time: '16:00', value: 232 },
  ],
}

export const mockOverviewActivities = {
  data: [
    { time: '16:20', text: '任务 018 完成年度 KPI 计算', level: 'success' },
    { time: '15:45', text: '配置组“能源管理组”完成批量同步', level: 'info' },
    { time: '14:30', text: '配置项“总电表”采集完成并写入 total_energy', level: 'success' },
    { time: '13:15', text: '任务 010 当前处于禁用状态，未参与采集', level: 'warning' },
    { time: '11:40', text: '配置项“锅炉压力表”状态异常，等待人工复核', level: 'error' },
  ],
}

// ====================== 任务日志数据 ======================
export const mockTaskLogs = {
  data: [
    {
      taskLogId: 'TL202604230001',
      status: 'Running',
      startTime: '2026-04-23T09:30:00',
      endTime: '',
      totalConfigs: 6,
      successCount: 2,
      failureCount: 1,
      processedCount: 3,
      progress: 50,
    },
    {
      taskLogId: 'TL202604220003',
      status: 'Success',
      startTime: '2026-04-22T14:10:00',
      endTime: '2026-04-22T14:15:36',
      totalConfigs: 4,
      successCount: 4,
      failureCount: 0,
      processedCount: 4,
      progress: 100,
    },
    {
      taskLogId: 'TL202604220002',
      status: 'PartialSuccess',
      startTime: '2026-04-22T10:20:00',
      endTime: '2026-04-22T10:29:12',
      totalConfigs: 5,
      successCount: 3,
      failureCount: 2,
      processedCount: 5,
      progress: 100,
    },
    {
      taskLogId: 'TL202604210001',
      status: 'Failed',
      startTime: '2026-04-21T08:00:00',
      endTime: '2026-04-21T08:02:10',
      totalConfigs: 3,
      successCount: 0,
      failureCount: 3,
      processedCount: 3,
      progress: 100,
    },
  ],
}

export const mockTaskLogDetailsMap = {
  TL202604230001: [
    {
      id: 'DTL-001',
      taskLogId: 'TL202604230001',
      configId: 201,
      fileName: 'temperature_2026-04-23.csv',
      status: 'Success',
      startRow: 0,
      processedRows: 120,
      startTime: '2026-04-23T09:30:02',
      endTime: '2026-04-23T09:30:18',
      errorMessage: '',
    },
    {
      id: 'DTL-002',
      taskLogId: 'TL202604230001',
      configId: 203,
      fileName: 'voltage_2026-04-23.csv',
      status: 'Success',
      startRow: 0,
      processedRows: 96,
      startTime: '2026-04-23T09:30:04',
      endTime: '2026-04-23T09:30:16',
      errorMessage: '',
    },
    {
      id: 'DTL-003',
      taskLogId: 'TL202604230001',
      configId: 207,
      fileName: 'current_2026-04-23.csv',
      status: 'Failed',
      startRow: 80,
      processedRows: 0,
      startTime: '2026-04-23T09:30:05',
      endTime: '2026-04-23T09:30:08',
      errorMessage: '文件格式校验失败：缺少列“功率”',
    },
    {
      id: 'DTL-004',
      taskLogId: 'TL202604230001',
      configId: 215,
      fileName: 'power_2026-04-23.csv',
      status: 'Running',
      startRow: 0,
      processedRows: 40,
      startTime: '2026-04-23T09:30:10',
      endTime: '',
      errorMessage: '',
    },
  ],

  TL202604220003: [
    {
      id: 'DTL-005',
      taskLogId: 'TL202604220003',
      configId: 223,
      fileName: 'steam_flow_2026-04-22.csv',
      status: 'Success',
      startRow: 0,
      processedRows: 88,
      startTime: '2026-04-22T14:10:02',
      endTime: '2026-04-22T14:10:20',
      errorMessage: '',
    },
    {
      id: 'DTL-006',
      taskLogId: 'TL202604220003',
      configId: 224,
      fileName: 'boiler_pressure_2026-04-22.json',
      status: 'Success',
      startRow: 0,
      processedRows: 60,
      startTime: '2026-04-22T14:10:22',
      endTime: '2026-04-22T14:10:40',
      errorMessage: '',
    },
  ],

  TL202604220002: [
    {
      id: 'DTL-007',
      taskLogId: 'TL202604220002',
      configId: 210,
      fileName: 'cod_2026-04-22.json',
      status: 'Success',
      startRow: 0,
      processedRows: 32,
      startTime: '2026-04-22T10:20:00',
      endTime: '2026-04-22T10:20:12',
      errorMessage: '',
    },
    {
      id: 'DTL-008',
      taskLogId: 'TL202604220002',
      configId: 211,
      fileName: 'ammonia_2026-04-22.csv',
      status: 'Failed',
      startRow: 0,
      processedRows: 0,
      startTime: '2026-04-22T10:20:15',
      endTime: '2026-04-22T10:20:17',
      errorMessage: '远程文件不存在',
    },
  ],

  TL202604210001: [
    {
      id: 'DTL-009',
      taskLogId: 'TL202604210001',
      configId: 228,
      fileName: 'plc_2026-04-21.json',
      status: 'Failed',
      startRow: 0,
      processedRows: 0,
      startTime: '2026-04-21T08:00:00',
      endTime: '2026-04-21T08:00:02',
      errorMessage: 'FTP 连接失败',
    },
  ],
}

// ====================== 执行任务模拟 ======================
const createMockExecutionTask = ({ ids, startDate, endDate }) => {
  const configIds = String(ids || '')
    .split(',')
    .map(item => Number(item.trim()))
    .filter(Boolean)

  const taskLogId = createMockTaskLogId()

  const taskLog = {
    taskLogId,
    status: 'Running',
    startTime: new Date().toISOString(),
    endTime: '',
    totalConfigs: configIds.length || 1,
    successCount: 0,
    failureCount: 0,
    processedCount: 0,
    progress: 0,
    startDate,
    endDate,
  }

  mockTaskLogs.data.unshift(taskLog)

  mockTaskLogDetailsMap[taskLogId] = configIds.map((configId, index) => {
    const config = mockConfigs.data.find(item => item.Id === configId)

    return {
      id: `${taskLogId}-DETAIL-${index + 1}`,
      taskLogId,
      configId,
      fileName: `${config?.TableName || 'unknown'}_${startDate || 'today'}.${config?.FileType || 'csv'}`,
      status: index === 0 ? 'Running' : 'Pending',
      startRow: 0,
      processedRows: 0,
      startTime: index === 0 ? new Date().toISOString() : '',
      endTime: '',
      errorMessage: '',
    }
  })

  setTimeout(() => {
    const target = mockTaskLogs.data.find(item => item.taskLogId === taskLogId)
    const details = mockTaskLogDetailsMap[taskLogId] || []
    if (!target) return

    const runningIndex = details.findIndex(item => item.status === 'Running')
    if (runningIndex !== -1) {
      details[runningIndex].status = 'Success'
      details[runningIndex].processedRows = 80 + runningIndex * 10
      details[runningIndex].endTime = new Date().toISOString()

      if (details[runningIndex + 1]) {
        details[runningIndex + 1].status = 'Running'
        details[runningIndex + 1].startTime = new Date().toISOString()
      }

      target.successCount += 1
      target.processedCount += 1
      target.progress = Math.round((target.processedCount / target.totalConfigs) * 100)
    }
  }, 2500)

  setTimeout(() => {
    const target = mockTaskLogs.data.find(item => item.taskLogId === taskLogId)
    const details = mockTaskLogDetailsMap[taskLogId] || []
    if (!target) return

    details.forEach((item, index) => {
      if (item.status === 'Pending' || item.status === 'Running') {
        item.status = index % 4 === 3 ? 'Failed' : 'Success'
        item.processedRows = item.status === 'Success' ? 100 + index * 5 : 0
        item.startTime = item.startTime || new Date().toISOString()
        item.endTime = new Date().toISOString()
        item.errorMessage = item.status === 'Failed' ? '模拟异常：文件内容缺失' : ''
      }
    })

    const successCount = details.filter(item => item.status === 'Success').length
    const failureCount = details.filter(item => item.status === 'Failed').length
    const processedCount = successCount + failureCount

    target.successCount = successCount
    target.failureCount = failureCount
    target.processedCount = processedCount
    target.progress = 100
    target.endTime = new Date().toISOString()
    target.status =
      failureCount === 0 ? 'Success' :
      successCount === 0 ? 'Failed' :
      'PartialSuccess'
  }, 6500)

  return {
    success: true,
    data: {
      taskLogId,
      status: 'Running',
      startDate,
      endDate,
    },
  }
}

// ====================== Mock 核心请求处理 ======================
export const mockRequest = (config) => {
  const { url, method, data } = config
  const pathname = url.split('?')[0]

  // ====================== GROUP ======================
  if (pathname === '/api/file-configs/group' && method === 'get') {
    return delay({ data: mockGroups.data })
  }

  // ====================== CONFIG ======================
  if (pathname === '/api/file-configs' && method === 'get') {
    return delay({ data: mockConfigs.data })
  }

  if (pathname.startsWith('/api/file-configs/') && method === 'get') {
    const id = getIdFromUrl(url)
    const item = mockConfigs.data.find(i => i.Id === id)
    return delay({ data: item })
  }

  if (pathname === '/api/file-configs' && method === 'post') {
    const newItem = {
      ...JSON.parse(data),
      Id: Date.now()
    }
    mockConfigs.data.push(newItem)
    return delay({ success: true, data: newItem })
  }

  if (url.includes('/api/file-configs') && method === 'put') {
    const id = getIdFromUrl(url)
    const index = mockConfigs.data.findIndex(i => i.Id === id)
    if (index !== -1) {
      mockConfigs.data[index] = { ...mockConfigs.data[index], ...JSON.parse(data) }
    }
    return delay({ success: true })
  }

  if (url.includes('/api/file-configs') && method === 'delete') {
    const id = getIdFromUrl(url)
    mockConfigs.data = mockConfigs.data.filter(i => i.Id !== id)
    return delay({ success: true })
  }

  // ====================== TASK ======================
  if (url === '/api/data-acquisition/tasks' && method === 'get') {
    return delay({ data: mockTasks.data })
  }

  // ====================== DASHBOARD ======================
  if (pathname === '/api/dashboard/trend' && method === 'get') {
    return delay({ data: mockOverviewTrend.data })
  }

  if (pathname === '/api/dashboard/activities' && method === 'get') {
    return delay({ data: mockOverviewActivities.data })
  }

  // ====================== TASK LOG ======================
  if (pathname === '/api/data-acquisition/task-log' && method === 'get') {
    return delay({ data: mockTaskLogs.data }, 400)
  }

  if (
    pathname.startsWith('/api/data-acquisition/task-log/') &&
    pathname.endsWith('/details') &&
    method === 'get'
  ) {
    const taskLogId = getTaskLogIdFromUrl(url)
    return delay({ data: mockTaskLogDetailsMap[taskLogId] || [] }, 350)
  }

  if (
    pathname.startsWith('/api/data-acquisition/task-log/') &&
    !pathname.endsWith('/details') &&
    method === 'get'
  ) {
    const taskLogId = getTaskLogIdFromUrl(url)
    const item = mockTaskLogs.data.find(log => log.taskLogId === taskLogId)
    return delay({ data: item || null }, 300)
  }

  // ====================== EXECUTION ======================
  if (pathname === '/api/data-acquisition/execute-configs-range' && method === 'post') {
    const params = config.params || {}
    return delay(
      createMockExecutionTask({
        ids: params.ids,
        startDate: params.startDate,
        endDate: params.endDate,
      }),
      500
    )
  }

  // 未匹配的请求返回 null
  return null
}
