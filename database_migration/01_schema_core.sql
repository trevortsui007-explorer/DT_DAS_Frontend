/*
DT data acquisition core schema migration.

Run this script in the target database.
This script creates empty runtime tables only. It does not migrate historical data.
Hangfire tables are intentionally not created here; Hangfire.SqlServer can initialize
them when the WebApi starts with sufficient database permissions.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID('dbo.DA_AcquisitionConfig', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionConfig
    (
        Id INT IDENTITY(1,1) NOT NULL,
        EqName NVARCHAR(100) NOT NULL,
        TableName NVARCHAR(200) NOT NULL,
        FilePathPattern NVARCHAR(510) NOT NULL,
        FileNamePattern NVARCHAR(510) NOT NULL,
        FileType NVARCHAR(40) NOT NULL,
        HeaderRow INT NOT NULL,
        StartRow INT NOT NULL,
        FieldMappings NVARCHAR(MAX) NOT NULL,
        ExtFields NVARCHAR(MAX) NULL,
        IsEnabled BIT NOT NULL CONSTRAINT DF_DA_AcquisitionConfig_IsEnabled DEFAULT ((1)),
        PostProcessingType TINYINT NOT NULL CONSTRAINT DF_DA_AcquisitionConfig_PostProcessingType DEFAULT ((0)),
        PostTableName NVARCHAR(200) NULL,
        ProcedureName NVARCHAR(200) NULL,
        ServiceName NVARCHAR(200) NULL,
        Flag NVARCHAR(100) NULL,
        FlagName NVARCHAR(200) NULL,
        CreateTime DATETIME NOT NULL CONSTRAINT DF_DA_AcquisitionConfig_CreateTime DEFAULT (GETDATE())
    );
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionGroup', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionGroup
    (
        Id INT IDENTITY(1,1) NOT NULL,
        GroupName NVARCHAR(200) NOT NULL,
        GroupCategory NVARCHAR(100) NULL,
        GroupType NVARCHAR(100) NULL,
        ExportProcedureName NVARCHAR(200) NULL,
        IsEnabled BIT NOT NULL CONSTRAINT DF_DA_AcquisitionGroup_IsEnabled DEFAULT ((1))
    );
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionGroup_Config', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionGroup_Config
    (
        Id INT IDENTITY(1,1) NOT NULL,
        GroupId INT NOT NULL,
        ConfigId INT NOT NULL,
        IsEnabled BIT NOT NULL CONSTRAINT DF_DA_AcquisitionGroup_Config_IsEnabled DEFAULT ((1))
    );
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionTask', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionTask
    (
        Id INT IDENTITY(1,1) NOT NULL,
        TaskName NVARCHAR(200) NOT NULL,
        TaskMode TINYINT NOT NULL,
        CronExpression NVARCHAR(200) NULL,
        IsEnabled BIT NOT NULL CONSTRAINT DF_DA_AcquisitionTask_IsEnabled DEFAULT ((1)),
        Description NVARCHAR(1000) NULL,
        CreateTime DATETIME NOT NULL CONSTRAINT DF_DA_AcquisitionTask_CreateTime DEFAULT (GETDATE()),
        UpdateTime DATETIME NOT NULL CONSTRAINT DF_DA_AcquisitionTask_UpdateTime DEFAULT (GETDATE())
    );
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionTask_Group', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionTask_Group
    (
        Id INT IDENTITY(1,1) NOT NULL,
        TaskId INT NOT NULL,
        GroupId INT NOT NULL
    );
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionTaskLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionTaskLog
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_DA_AcquisitionTaskLog_Id DEFAULT (NEWID()),
        TaskId INT NOT NULL,
        StartTime DATETIME NOT NULL,
        EndTime DATETIME NULL,
        Status NVARCHAR(40) NOT NULL,
        TotalConfigs INT NULL CONSTRAINT DF_DA_AcquisitionTaskLog_TotalConfigs DEFAULT ((0)),
        SuccessCount INT NULL CONSTRAINT DF_DA_AcquisitionTaskLog_SuccessCount DEFAULT ((0)),
        FailureCount INT NOT NULL CONSTRAINT DF_DA_AcquisitionTaskLog_FailureCount DEFAULT ((0)),
        ProcessedCount INT NOT NULL CONSTRAINT DF_DA_AcquisitionTaskLog_ProcessedCount DEFAULT ((0)),
        Progress INT NOT NULL CONSTRAINT DF_DA_AcquisitionTaskLog_Progress DEFAULT ((0)),
        Message NVARCHAR(1000) NULL,
        TaskCode VARCHAR(50) NULL,
        TriggerType VARCHAR(10) NULL
    );
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionLog
    (
        Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_DA_AcquisitionLog_Id DEFAULT (NEWID()),
        TaskLogId UNIQUEIDENTIFIER NULL,
        ConfigId INT NOT NULL,
        FileName NVARCHAR(510) NOT NULL,
        FullFilePath NVARCHAR(MAX) NULL,
        StartRow INT NOT NULL,
        ProcessedRows INT NOT NULL,
        StartTime DATETIME NOT NULL,
        EndTime DATETIME NOT NULL,
        Status NVARCHAR(40) NOT NULL,
        ErrorMessage NVARCHAR(MAX) NULL
    );
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionLog', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.DA_AcquisitionLog', 'FullFilePath') IS NULL
BEGIN
    ALTER TABLE dbo.DA_AcquisitionLog
    ADD FullFilePath NVARCHAR(MAX) NULL;
END
GO

IF OBJECT_ID('dbo.DA_AcquisitionFileState', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_AcquisitionFileState
    (
        Id BIGINT IDENTITY(1,1) NOT NULL,
        ConfigId INT NOT NULL,
        BusinessDate DATE NOT NULL,
        FileName NVARCHAR(1000) NOT NULL,
        FullPath NVARCHAR(2000) NULL,
        DataRowCount INT NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_DataRowCount DEFAULT ((0)),
        LastStartRow INT NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_LastStartRow DEFAULT ((0)),
        LastProcessedRows INT NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_LastProcessedRows DEFAULT ((0)),
        LastTaskLogId NVARCHAR(100) NULL,
        LastStatus NVARCHAR(100) NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_LastStatus DEFAULT ('Unknown'),
        LastUpdateSource NVARCHAR(100) NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_LastUpdateSource DEFAULT ('Unknown'),
        IsSealed BIT NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_IsSealed DEFAULT ((0)),
        SealTime DATETIME NULL,
        LastScanTime DATETIME NULL,
        CreateTime DATETIME NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_CreateTime DEFAULT (GETDATE()),
        UpdateTime DATETIME NOT NULL CONSTRAINT DF_DA_AcquisitionFileState_UpdateTime DEFAULT (GETDATE())
    );
END
GO

IF OBJECT_ID('dbo.DA_ReportExportTask', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_ReportExportTask
    (
        Id NVARCHAR(128) NOT NULL,
        GroupIds NVARCHAR(2000) NOT NULL,
        StartTime DATETIME NOT NULL,
        EndTime DATETIME NOT NULL,
        Status NVARCHAR(64) NOT NULL,
        Progress INT NOT NULL,
        Stage NVARCHAR(200) NULL,
        FilePath NVARCHAR(2000) NULL,
        FileName NVARCHAR(510) NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        CreatedAt DATETIME NOT NULL,
        ExpiredAt DATETIME NOT NULL
    );
END
GO

IF OBJECT_ID('dbo.DA_TaskCodeSeed', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DA_TaskCodeSeed
    (
        SeedDate VARCHAR(8) NOT NULL,
        CurrentValue INT NOT NULL
    );
END
GO
