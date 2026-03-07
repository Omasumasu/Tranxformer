use crate::error::AppError;
use calamine::{open_workbook_auto, Data, Reader};
use std::path::Path;

/// Excelファイルを読み込み、ヘッダーと行データを返す
/// 最初のシートを読み込む
pub fn read_excel(path: &Path) -> Result<(Vec<String>, Vec<Vec<String>>), AppError> {
    let mut workbook = open_workbook_auto(path).map_err(|e| AppError::Internal(e.to_string()))?;

    let sheet_names = workbook.sheet_names().clone();
    let first_sheet = sheet_names
        .first()
        .ok_or_else(|| AppError::Internal("シートが見つかりません".to_string()))?;

    let range = workbook
        .worksheet_range(first_sheet)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let mut row_iter = range.rows();

    let headers: Vec<String> = row_iter
        .next()
        .map(|row| row.iter().map(cell_to_string).collect())
        .unwrap_or_default();

    let rows: Vec<Vec<String>> = row_iter
        .map(|row| row.iter().map(cell_to_string).collect())
        .collect();

    Ok((headers, rows))
}

/// 指定シートを読み込む
pub fn read_excel_sheet(
    path: &Path,
    sheet_name: &str,
) -> Result<(Vec<String>, Vec<Vec<String>>), AppError> {
    let mut workbook = open_workbook_auto(path).map_err(|e| AppError::Internal(e.to_string()))?;

    let range = workbook
        .worksheet_range(sheet_name)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let mut row_iter = range.rows();

    let headers: Vec<String> = row_iter
        .next()
        .map(|row| row.iter().map(cell_to_string).collect())
        .unwrap_or_default();

    let rows: Vec<Vec<String>> = row_iter
        .map(|row| row.iter().map(cell_to_string).collect())
        .collect();

    Ok((headers, rows))
}

/// シート名一覧を取得する
pub fn list_sheets(path: &Path) -> Result<Vec<String>, AppError> {
    let workbook = open_workbook_auto(path).map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(workbook.sheet_names().clone())
}

#[allow(clippy::cast_possible_truncation)]
fn cell_to_string(cell: &Data) -> String {
    match cell {
        Data::Int(i) => i.to_string(),
        Data::Float(f) => {
            if f.fract() == 0.0 {
                format!("{}", *f as i64)
            } else {
                f.to_string()
            }
        }
        Data::String(s) | Data::DateTimeIso(s) | Data::DurationIso(s) => s.clone(),
        Data::Bool(b) => b.to_string(),
        Data::DateTime(dt) => dt.to_string(),
        Data::Error(e) => format!("#ERROR: {e:?}"),
        Data::Empty => String::new(),
    }
}

/// データをExcelファイルとして書き出す
#[allow(clippy::cast_possible_truncation)]
pub fn write_excel(path: &Path, headers: &[String], rows: &[Vec<String>]) -> Result<(), AppError> {
    let mut workbook = rust_xlsxwriter::Workbook::new();
    let worksheet = workbook.add_worksheet();

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_string(0, col as u16, header)
            .map_err(|e| AppError::Internal(e.to_string()))?;
    }

    for (row_idx, row) in rows.iter().enumerate() {
        for (col_idx, cell) in row.iter().enumerate() {
            worksheet
                .write_string((row_idx + 1) as u32, col_idx as u16, cell)
                .map_err(|e| AppError::Internal(e.to_string()))?;
        }
    }

    workbook
        .save(path)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn write_and_read_excel_roundtrip() {
        let tmp = std::env::temp_dir().join("tranxformer_test_excel_roundtrip.xlsx");
        let headers = vec!["name".to_string(), "value".to_string()];
        let rows = vec![
            vec!["Alice".to_string(), "100".to_string()],
            vec!["Bob".to_string(), "200".to_string()],
        ];

        write_excel(&tmp, &headers, &rows).unwrap();
        let (h, r) = read_excel(&tmp).unwrap();
        assert_eq!(h, headers);
        assert_eq!(r, rows);

        let _ = std::fs::remove_file(&tmp);
    }

    #[test]
    fn list_sheets_returns_sheet_names() {
        let tmp = std::env::temp_dir().join("tranxformer_test_excel_sheets.xlsx");
        let headers = vec!["col".to_string()];
        let rows = vec![vec!["val".to_string()]];
        write_excel(&tmp, &headers, &rows).unwrap();

        let sheets = list_sheets(&tmp).unwrap();
        assert!(!sheets.is_empty());

        let _ = std::fs::remove_file(&tmp);
    }

    #[test]
    fn read_excel_sheet_by_name() {
        let tmp = std::env::temp_dir().join("tranxformer_test_excel_sheet_name.xlsx");
        let headers = vec!["x".to_string()];
        let rows = vec![vec!["1".to_string()]];
        write_excel(&tmp, &headers, &rows).unwrap();

        let sheets = list_sheets(&tmp).unwrap();
        let (h, r) = read_excel_sheet(&tmp, &sheets[0]).unwrap();
        assert_eq!(h, vec!["x"]);
        assert_eq!(r, vec![vec!["1"]]);

        let _ = std::fs::remove_file(&tmp);
    }

    #[test]
    fn read_excel_nonexistent_file_returns_error() {
        let result = read_excel(Path::new("/tmp/nonexistent_file.xlsx"));
        assert!(result.is_err());
    }

    #[test]
    fn cell_to_string_handles_all_types() {
        assert_eq!(cell_to_string(&Data::Int(42)), "42");
        assert_eq!(cell_to_string(&Data::Float(3.14)), "3.14");
        assert_eq!(cell_to_string(&Data::Float(5.0)), "5");
        assert_eq!(cell_to_string(&Data::String("hello".into())), "hello");
        assert_eq!(cell_to_string(&Data::Bool(true)), "true");
        assert_eq!(cell_to_string(&Data::Empty), "");
    }

    #[test]
    fn write_excel_empty_data() {
        let tmp = std::env::temp_dir().join("tranxformer_test_excel_empty.xlsx");
        let headers = vec!["a".to_string(), "b".to_string()];
        let rows: Vec<Vec<String>> = vec![];

        write_excel(&tmp, &headers, &rows).unwrap();
        let (h, r) = read_excel(&tmp).unwrap();
        assert_eq!(h, headers);
        assert!(r.is_empty());

        let _ = std::fs::remove_file(&tmp);
    }
}
