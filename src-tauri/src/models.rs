use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    pub columns: Vec<ColumnDef>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnDef {
    pub name: String,
    pub label: String,
    pub data_type: ColumnType,
    pub required: bool,
    pub description: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ColumnType {
    Text,
    Number,
    Date,
    Boolean,
}

/// 1レコード = カラム名→値のマップ
pub type Record = serde_json::Map<String, serde_json::Value>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataPreview {
    pub headers: Vec<String>,
    pub rows: Vec<Record>,
    pub total_rows: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransformResult {
    pub code: String,
    pub output: Vec<Record>,
    pub row_count: usize,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafetyReport {
    pub is_safe: bool,
    pub violations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InferredColumn {
    pub name: String,
    pub label: String,
    pub data_type: ColumnType,
    pub sample_values: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaInferenceResult {
    pub columns: Vec<InferredColumn>,
    pub sample_rows: Vec<Vec<String>>,
    pub total_rows: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub files: Vec<FileSlot>,
    pub join_type: JoinType,
    pub join_expression: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSlot {
    pub role: FileRole,
    pub label: String,
    pub expected_headers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JoinType {
    Left,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileRole {
    Base,
    Join,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinPreview {
    pub headers: Vec<String>,
    pub rows: Vec<Record>,
    pub base_row_count: usize,
    pub joined_row_count: usize,
}
