/*
DT data acquisition indexes and constraints migration.

Run this script in the target database after 01_schema_core.sql.
It is safe to re-run.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID('dbo.DA_AcquisitionConfig', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionConfig') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionConfig ADD CONSTRAINT PK_DA_AcquisitionConfig PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionConfig', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DA_AcquisitionConfig') AND name = 'UQ_DA_AcquisitionConfig_EqName')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_DA_AcquisitionConfig_EqName ON dbo.DA_AcquisitionConfig(EqName);
END

IF OBJECT_ID('dbo.DA_AcquisitionGroup', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionGroup') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionGroup ADD CONSTRAINT PK_DA_AcquisitionGroup PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionGroup_Config', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionGroup_Config') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionGroup_Config ADD CONSTRAINT PK_DA_AcquisitionGroup_Config PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionTask', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionTask') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionTask ADD CONSTRAINT PK_DA_AcquisitionTask PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionTask', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DA_AcquisitionTask') AND name = 'UQ_DA_AcquisitionTask_TaskName')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_DA_AcquisitionTask_TaskName ON dbo.DA_AcquisitionTask(TaskName);
END

IF OBJECT_ID('dbo.DA_AcquisitionTask_Group', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionTask_Group') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionTask_Group ADD CONSTRAINT PK_DA_AcquisitionTask_Group PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionTaskLog', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionTaskLog') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionTaskLog ADD CONSTRAINT PK_DA_AcquisitionTaskLog PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionTaskLog', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DA_AcquisitionTaskLog') AND name = 'IX_DA_AcquisitionTaskLog_TaskCode')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX IX_DA_AcquisitionTaskLog_TaskCode
    ON dbo.DA_AcquisitionTaskLog(TaskCode)
    WHERE TaskCode IS NOT NULL;
END

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionLog') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionLog ADD CONSTRAINT PK_DA_AcquisitionLog PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionFileState', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_AcquisitionFileState') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_AcquisitionFileState ADD CONSTRAINT PK_DA_AcquisitionFileState PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_ReportExportTask', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_ReportExportTask') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_ReportExportTask ADD CONSTRAINT PK_DA_ReportExportTask PRIMARY KEY CLUSTERED (Id);
END

IF OBJECT_ID('dbo.DA_TaskCodeSeed', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('dbo.DA_TaskCodeSeed') AND [type] = 'PK')
BEGIN
    ALTER TABLE dbo.DA_TaskCodeSeed ADD CONSTRAINT PK_DA_TaskCodeSeed PRIMARY KEY CLUSTERED (SeedDate);
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionFileState', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DA_AcquisitionFileState') AND name = 'UX_DA_AcquisitionFileState_File')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_DA_AcquisitionFileState_File
    ON dbo.DA_AcquisitionFileState(ConfigId, BusinessDate, FileName);
END

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DA_AcquisitionLog') AND name = 'IX_DA_AcquisitionLog_Resume')
BEGIN
    CREATE NONCLUSTERED INDEX IX_DA_AcquisitionLog_Resume
    ON dbo.DA_AcquisitionLog(ConfigId, FileName, Status, EndTime)
    INCLUDE (Id, StartRow, ProcessedRows);
END

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DA_AcquisitionLog') AND name = 'IX_DA_Log_ConfigId_EndTime')
BEGIN
    CREATE NONCLUSTERED INDEX IX_DA_Log_ConfigId_EndTime
    ON dbo.DA_AcquisitionLog(ConfigId, EndTime);
END

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.DA_AcquisitionLog') AND name = 'IX_DA_Log_TaskLogId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_DA_Log_TaskLogId
    ON dbo.DA_AcquisitionLog(TaskLogId);
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionGroup_Config', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.DA_AcquisitionGroup', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_DA_GC_GroupId' AND parent_object_id = OBJECT_ID('dbo.DA_AcquisitionGroup_Config'))
BEGIN
    ALTER TABLE dbo.DA_AcquisitionGroup_Config WITH CHECK
    ADD CONSTRAINT FK_DA_GC_GroupId FOREIGN KEY (GroupId) REFERENCES dbo.DA_AcquisitionGroup(Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionGroup_Config', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.DA_AcquisitionConfig', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_DA_GC_ConfigId' AND parent_object_id = OBJECT_ID('dbo.DA_AcquisitionGroup_Config'))
BEGIN
    ALTER TABLE dbo.DA_AcquisitionGroup_Config WITH CHECK
    ADD CONSTRAINT FK_DA_GC_ConfigId FOREIGN KEY (ConfigId) REFERENCES dbo.DA_AcquisitionConfig(Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.DA_AcquisitionConfig', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_DA_Log_ConfigId' AND parent_object_id = OBJECT_ID('dbo.DA_AcquisitionLog'))
BEGIN
    ALTER TABLE dbo.DA_AcquisitionLog WITH CHECK
    ADD CONSTRAINT FK_DA_Log_ConfigId FOREIGN KEY (ConfigId) REFERENCES dbo.DA_AcquisitionConfig(Id);
END

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.DA_AcquisitionTaskLog', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_DA_Log_TaskLogId' AND parent_object_id = OBJECT_ID('dbo.DA_AcquisitionLog'))
BEGIN
    ALTER TABLE dbo.DA_AcquisitionLog WITH CHECK
    ADD CONSTRAINT FK_DA_Log_TaskLogId FOREIGN KEY (TaskLogId) REFERENCES dbo.DA_AcquisitionTaskLog(Id);
END
GO
