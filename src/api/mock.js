export const mockTasks = {
  data: [
    {
      id: 1,
      taskName: '每日采集任务',
      description: '从 FTP 拉取生产数据',
      TaskMode: 1,
      cronExpression: '0 0 2 * * ?',
      isEnabled: true
    },
    {
      id: 2,
      taskName: '实时监控任务',
      description: '监听文件变化',
      TaskMode: 0,
      cronExpression: '-',
      isEnabled: false
    }
  ]
}

export const mockGroups = {
  data: [
    {
      id: 101,
      groupName: '电力组',
      groupCategory: '二厂',
      groupType: '默认周期执行组',
      sortOrder: 1,
      isEnabled: true,
      configCount: 3,
      // 新增：关联配置项的简要信息，用于悬停显示
      AssociatedConfigs: [
        { Id: 201, EqName: '温度传感器 A' },
        { Id: 203, EqName: '电压监控仪 01' },
        { Id: 204, EqName: '电流互感器 B' }
      ]
    },
    {
      id: 102,
      groupName: '水务组',
      groupCategory: '三厂',
      groupType: '默认周期执行组',
      sortOrder: 2,
      isEnabled: false,
      configCount: 2,
      AssociatedConfigs: [
        { Id: 202, EqName: '压力传感器 B' },
        { Id: 205, EqName: '流量计 C' }
      ]
    }
  ]
}

export const mockConfigs = {
  data: [
    {
      Id: 201,
      EqName: '温度传感器 A',
      TableName: 'temperature_data',
      FilePathPattern: '/data/temperature/',
      FileNamePattern: 'temp_{yyyyMMdd}.csv',
      FileType: 'csv',
      HeaderRow: 1,
      StartRow: 2,
      PostProcessingType: 1,
      ProcedureName: 'ProcessTemperature',
      IsEnabled: true,
      ExtFields: 'row,file',
      FieldMappings: { "温度": "temp_value" }
    },
    {
      Id: 202,
      EqName: '压力传感器 B',
      TableName: 'pressure_data',
      FilePathPattern: '/data/pressure/',
      FileNamePattern: 'pressure_{yyyyMMdd}.xlsx',
      FileType: 'xlsx',
      HeaderRow: 1,
      StartRow: 2,
      PostProcessingType: 2,
      ProcedureName: 'sp_ProcessPressure',
      IsEnabled: false,
      ExtFields: '',
      FieldMappings: { "压力": "pressure_value" }
    }
  ]
}
