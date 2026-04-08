// 模拟任务数据：增加了 groupIds 关联字段（新增 8 个任务，覆盖多种模式、cron 和多组关联）
export const mockTasks = {
  data: [
    {
      id: 1,
      taskName: '每日采集任务',
      description: '从 FTP 拉取生产数据',
      taskMode: 1,
      cronExpression: '0 0 2 * * *',
      isEnabled: true,
      groupIds: [101] // 关联了电力组
    },
    {
      id: 2,
      taskName: '实时监控任务',
      description: '监听文件变化',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: false,
      groupIds: [102] // 关联了水务组
    },
    {
      id: 3,
      taskName: '每周报告生成',
      description: '汇总上周设备数据生成 PDF 报告',
      taskMode: 1,
      cronExpression: '0 0 9 * * 1',
      isEnabled: true,
      groupIds: [103, 104] // 关联燃气组 + 环保组
    },
    {
      id: 4,
      taskName: '数据同步任务',
      description: '将本地数据同步至云端数据库',
      taskMode: 1,
      cronExpression: '0 */15 * * * *',
      isEnabled: true,
      groupIds: [101] // 电力组
    },
    {
      id: 5,
      taskName: '报警推送任务',
      description: '检测阈值异常时推送微信/邮件',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: true,
      groupIds: [105] // 机械组
    },
    {
      id: 6,
      taskName: '历史数据清理',
      description: '自动删除 90 天前的无用记录',
      taskMode: 1,
      cronExpression: '0 0 3 * * 0',
      isEnabled: false,
      groupIds: [102, 104] // 水务组 + 环保组
    },
    {
      id: 7,
      taskName: '设备状态巡检',
      description: '每小时检查设备在线状态',
      taskMode: 1,
      cronExpression: '0 0 * * * *',
      isEnabled: true,
      groupIds: [101, 103] // 电力组 + 燃气组
    },
    {
      id: 8,
      taskName: '文件解析任务',
      description: '解析上传的 Excel 并入库',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: true,
      groupIds: [106] // 智能制造组
    },
    {
      id: 9,
      taskName: '月度统计任务',
      description: '生成月度能耗统计报表',
      taskMode: 1,
      cronExpression: '0 0 4 1 * *',
      isEnabled: true,
      groupIds: [107] // 质量检测组
    },
    {
      id: 10,
      taskName: '实时数据推送',
      description: '通过 WebSocket 推送最新传感器数据',
      taskMode: 0,
      cronExpression: '-',
      isEnabled: false,
      groupIds: [102] // 水务组
    }
  ]
}

// 模拟配置组数据：增加了 configCount 和简要 Config 信息（新增 5 个组，覆盖更多工厂和类型）
export const mockGroups = {
  data: [
    {
      id: 101,
      groupName: '电力组',
      groupCategory: '二厂',
      groupType: '默认周期执行组',
      sortOrder: 1,
      isEnabled: true,
      configCount: 4,
      // 这里的 Id 必须对应 mockConfigs 里的 Id
      AssociatedConfigs: [
        { Id: 201, EqName: '温度传感器 A' },
        { Id: 203, EqName: '电压监控仪 01' },
        { Id: 207, EqName: '电流监控仪 02' }
      ]
    },
    {
      id: 102,
      groupName: '水务组',
      groupCategory: '三厂',
      groupType: '默认周期执行组',
      sortOrder: 2,
      isEnabled: false,
      configCount: 3,
      AssociatedConfigs: [
        { Id: 202, EqName: '压力传感器 B' },
        { Id: 208, EqName: '液位传感器 C' }
      ]
    },
    {
      id: 103,
      groupName: '燃气组',
      groupCategory: '一厂',
      groupType: '默认周期执行组',
      sortOrder: 3,
      isEnabled: true,
      configCount: 3,
      AssociatedConfigs: [
        { Id: 204, EqName: '流量计 D' },
        { Id: 209, EqName: '燃气浓度传感器' }
      ]
    },
    {
      id: 104,
      groupName: '环保组',
      groupCategory: '四厂',
      groupType: '事件触发组',
      sortOrder: 4,
      isEnabled: true,
      configCount: 4,
      AssociatedConfigs: [
        { Id: 205, EqName: 'pH 值传感器' },
        { Id: 210, EqName: 'COD 监测仪' },
        { Id: 211, EqName: '氨氮传感器' }
      ]
    },
    {
      id: 105,
      groupName: '机械组',
      groupCategory: '二厂',
      groupType: '默认周期执行组',
      sortOrder: 5,
      isEnabled: true,
      configCount: 2,
      AssociatedConfigs: [
        { Id: 206, EqName: '振动传感器 E' }
      ]
    },
    {
      id: 106,
      groupName: '智能制造组',
      groupCategory: '五厂',
      groupType: '实时监控组',
      sortOrder: 6,
      isEnabled: false,
      configCount: 3,
      AssociatedConfigs: [
        { Id: 212, EqName: '工业机器人状态' },
        { Id: 213, EqName: 'AGV 小车定位' }
      ]
    },
    {
      id: 107,
      groupName: '质量检测组',
      groupCategory: '一厂',
      groupType: '默认周期执行组',
      sortOrder: 7,
      isEnabled: true,
      configCount: 2,
      AssociatedConfigs: [
        { Id: 214, EqName: '光谱分析仪' }
      ]
    }
  ]
}

// 模拟具体配置项数据（新增 12 个配置项，丰富设备类型、文件格式和映射关系）
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
    }
  ]
}
