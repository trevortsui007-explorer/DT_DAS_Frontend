/*
Auto line width Excel template migration.

Run this script after 04_excel_import_templates.sql.
It adds the file-level result field to the legacy target table and seeds the
fixed Excel template used by the new template-excel parser.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID('dbo.m_mom_spu_zk_autolinewidth', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.m_mom_spu_zk_autolinewidth', 'Header_RESULT') IS NULL
BEGIN
    ALTER TABLE dbo.m_mom_spu_zk_autolinewidth
    ADD Header_RESULT VARCHAR(50) NULL;
END
GO

IF OBJECT_ID('dbo.DA_ExcelImportTemplate', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM dbo.DA_ExcelImportTemplate
       WHERE TemplateCode = N'autoline-width-no-metadata'
         AND TemplateVersion = 1
   )
BEGIN
    INSERT INTO dbo.DA_ExcelImportTemplate
    (
        TemplateCode,
        TemplateName,
        ParserType,
        TemplateVersion,
        DefinitionJson,
        IsEnabled
    )
    VALUES
    (
        N'autoline-width-no-metadata',
        N'内层自动线宽机-无元数据',
        N'template-excel',
        1,
        N'{
  "targetTable": "m_mom_spu_zk_autolinewidth",
  "identity": {
    "templateCode": "autoline-width-no-metadata",
    "templateName": "内层自动线宽机-无元数据",
    "sheetName": "Work",
    "requiredCells": [
      { "source": "A1", "value": "测量项目" },
      { "source": "B1", "value": "判定结果" },
      { "source": "C1", "value": "测量值" },
      { "source": "K1", "value": "测量模式" }
    ]
  },
  "metadata": [],
  "dataRegion": {
    "startRow": 2,
    "measurementColumns": ["A", "B", "C", "D", "K"],
    "stopRules": [
      { "type": "emptyRows", "count": 2, "columns": ["A", "B", "C", "D", "K"] }
    ],
    "skipRules": [
      { "type": "allEmpty", "columns": ["A", "B", "C", "D", "K"] }
    ]
  },
  "columns": [
    { "field": "Measure_item", "label": "测量项目", "column": "A", "type": "string" },
    { "field": "RESULT", "label": "判定结果", "column": "B", "type": "string" },
    { "field": "measured_value", "label": "测量值", "column": "C", "type": "string" },
    { "field": "Specification", "label": "测量目标值", "column": "D", "type": "string" },
    { "field": "SERIAL_NO", "label": "测量板编号", "column": "E", "type": "int" },
    { "field": "MAX_VALUE", "label": "上限", "column": "G", "type": "string" },
    { "field": "MIN_VALUE", "label": "下限", "column": "H", "type": "string" },
    { "field": "Measure_type", "label": "测量模式", "column": "K", "type": "string" }
  ],
  "fixedFields": {
    "TH": "0",
    "SKYZ": "0"
  },
  "rawFields": {
    "str": "joinDetailRow"
  },
  "systemFields": ["Id(雪花算法)", "fileName", "row", "RowData(str)", "CreateDt", "excelname", "TH", "SKYZ"],
  "filenameFields": {
    "prodno_Layer": "firstDashPart"
  },
  "fieldMappings": {
    "测量项目": "Measure_item",
    "判定结果": "RESULT",
    "测量值": "measured_value",
    "测量目标值": "Specification",
    "测量板编号": "SERIAL_NO",
    "上限": "MAX_VALUE",
    "下限": "MIN_VALUE",
    "测量模式": "Measure_type"
  },
  "configDefaults": {
    "eqName": "内层自动线宽机",
    "filePathPattern": "D:/Desktop/Test/AL-Width-1",
    "fileNamePattern": "*.xlsx",
    "groupName": "内层自动线宽机数据",
    "taskName": "内层自动线宽机数据采集",
    "description": "按无元数据明细模板采集内层自动线宽机 Excel 数据",
    "cronExpression": "0 2 * * *",
    "extFields": "Id(雪花算法),fileName,row,RowData(str),CreateDt,excelname,TH,SKYZ",
    "postProcessingType": 1,
    "procedureName": "pr_m_mom_spu_zk_autolinewidth_sp",
    "flag": "CalculationUpdate",
    "headerRow": 1,
    "startRow": 2
  },
  "previewHeaders": [
    "Id",
    "row",
    "prodno_Layer",
    "Measure_item",
    "Measure_type",
    "SERIAL_NO",
    "Specification",
    "MAX_VALUE",
    "MIN_VALUE",
    "measured_value",
    "RESULT",
    "TH",
    "SKYZ",
    "CreateDt"
  ]
}',
        1
    );
END
GO

IF OBJECT_ID('dbo.DA_ExcelImportTemplate', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM dbo.DA_ExcelImportTemplate
       WHERE TemplateCode = N'autoline-width'
         AND TemplateVersion = 1
   )
BEGIN
    INSERT INTO dbo.DA_ExcelImportTemplate
    (
        TemplateCode,
        TemplateName,
        ParserType,
        TemplateVersion,
        DefinitionJson,
        IsEnabled
    )
    VALUES
    (
        N'autoline-width',
        N'内层自动线宽机',
        N'template-excel',
        1,
        N'{
  "targetTable": "m_mom_spu_zk_autolinewidth",
  "identity": {
    "templateCode": "autoline-width",
    "templateName": "内层自动线宽机",
    "sheetName": "Work",
    "requiredCells": [
      { "source": "A1", "value": "工单号" },
      { "source": "C1", "value": "测量员" },
      { "source": "F1", "value": "料号_层别" },
      { "source": "A3", "value": "项目" },
      { "source": "G3", "value": "实测" }
    ]
  },
  "metadata": [
    { "field": "wono", "label": "工单号", "source": "A2", "parser": "text" },
    { "field": "QR_code", "label": "二维码", "source": "B2", "parser": "text" },
    { "field": "Surveyor", "label": "测量员", "source": "C2", "parser": "text" },
    { "field": "start_time", "label": "开始时间", "source": "D2", "parser": "datetimeText" },
    { "field": "end_time", "label": "测试时间", "source": "E2", "parser": "datetimeText" },
    { "field": "prodno_Layer", "label": "料号_层别", "source": "F2", "parser": "text" },
    { "field": "lot", "label": "批号", "source": "G2", "parser": "text" },
    { "field": "batch", "label": "批量", "source": "H2", "parser": "text" },
    { "field": "Remark", "label": "备注", "source": "I2", "parser": "text" },
    { "field": "Header_RESULT", "label": "判定结果", "source": "J2", "parser": "text" },
    { "field": "product_type", "label": "产品类别", "source": "K2", "parser": "text" }
  ],
  "dataRegion": {
    "startRow": 4,
    "measurementColumns": ["A", "B", "C", "G"],
    "stopRules": [
      { "type": "keyword", "columns": ["A"], "keywords": ["料号层别"] },
      { "type": "emptyRows", "count": 2, "columns": ["A", "B", "C", "G"] }
    ],
    "skipRules": [
      { "type": "allEmpty", "columns": ["A", "B", "C", "G"] }
    ]
  },
  "columns": [
    { "field": "Measure_item", "label": "项目", "column": "A", "type": "string" },
    { "field": "Measure_type", "label": "测量方式", "column": "B", "type": "string" },
    { "field": "SERIAL_NO", "label": "序号", "column": "C", "type": "int" },
    { "field": "Specification", "label": "规格", "column": "D", "type": "string" },
    { "field": "MAX_VALUE", "label": "上限", "column": "E", "type": "string" },
    { "field": "MIN_VALUE", "label": "下限", "column": "F", "type": "string" },
    { "field": "measured_value", "label": "实测", "column": "G", "type": "string" },
    { "field": "RESULT", "label": "判定", "column": "I", "type": "string" }
  ],
  "fixedFields": {
    "TH": "0",
    "SKYZ": "0"
  },
  "rawFields": {
    "str": "joinDetailRow"
  },
  "systemFields": ["Id(雪花算法)", "fileName", "row", "RowData(str)", "CreateDt", "excelname", "TH", "SKYZ"],
  "fieldMappings": {
    "项目": "Measure_item",
    "测量方式": "Measure_type",
    "序号": "SERIAL_NO",
    "规格": "Specification",
    "上限": "MAX_VALUE",
    "下限": "MIN_VALUE",
    "实测": "measured_value",
    "判定": "RESULT"
  },
  "configDefaults": {
    "eqName": "内层自动线宽机",
    "filePathPattern": "D:/Desktop/Test/AL-Width-1",
    "fileNamePattern": "*.xlsx",
    "groupName": "内层自动线宽机数据",
    "taskName": "内层自动线宽机数据采集",
    "description": "按固定模板采集内层自动线宽机 Excel 数据",
    "cronExpression": "0 2 * * *",
    "extFields": "Id(雪花算法),fileName,row,RowData(str),CreateDt,excelname,TH,SKYZ",
    "postProcessingType": 1,
    "procedureName": "pr_m_mom_spu_zk_autolinewidth_sp",
    "flag": "CalculationUpdate",
    "headerRow": 3,
    "startRow": 4
  },
  "previewHeaders": [
    "Id",
    "row",
    "prodno_Layer",
    "product_type",
    "Surveyor",
    "start_time",
    "end_time",
    "Header_RESULT",
    "Measure_item",
    "Measure_type",
    "SERIAL_NO",
    "Specification",
    "MAX_VALUE",
    "MIN_VALUE",
    "measured_value",
    "RESULT",
    "TH",
    "SKYZ",
    "CreateDt"
  ]
}',
        1
    );
END
GO
