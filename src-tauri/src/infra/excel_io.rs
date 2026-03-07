use std::path::Path;

use calamine::{open_workbook, Reader, Xlsx};
use rust_xlsxwriter::Workbook;

use crate::error::AppError;

/// Excelファイルを読み込み、ヘッダーと行データを返す
/// 最初のシートを読み込む
pub fn read_excel(path: &Path) -> Result<(Vec<String>, Vec<Vec<String>>), AppError> {
    let mut workbook: Xlsx<_> =
        open_workbook(path).map_err(|e| AppError::Internal(format!("Excel読み込みエラー: {e}")))?;

    let sheet_names = workbook.sheet_names().clone();
    let first_sheet = sheet_names
        .first()
        .ok_or_else(|| AppError::Internal("シートが見つかりません".to_string()))?;

    read_excel_sheet(&mut workbook, first_sheet)
}

/// 指定シートを読み込み
pub fn read_excel_sheet(
    workbook: &mut Xlsx<std::io::BufReader<std::fs::File>>,
    sheet_name: &str,
) -> Result<(Vec<String>, Vec<Vec<String>>), AppError> {
    let range = workbook
        .worksheet_range(sheet_name)
        .map_err(|e| AppError::Internal(format!("シート読み込みエラー: {e}")))?;

    let mut rows_iter = range.rows();

    let headers: Vec<String> = match rows_iter.next() {
        Some(row) => row.iter().map(std::string::ToString::to_string).collect(),
        None => return Ok((Vec::new(), Vec::new())),
    };

    let rows: Vec<Vec<String>> = rows_iter
        .map(|row| row.iter().map(std::string::ToString::to_string).collect())
        .collect();

    Ok((headers, rows))
}

/// Excelファイルのシート名一覧を取得
pub fn get_sheet_names(path: &Path) -> Result<Vec<String>, AppError> {
    let workbook: Xlsx<_> =
        open_workbook(path).map_err(|e| AppError::Internal(format!("Excel読み込みエラー: {e}")))?;
    Ok(workbook.sheet_names().clone())
}

/// Excelファイルに書き出し
pub fn write_excel(path: &Path, headers: &[String], rows: &[Vec<String>]) -> Result<(), AppError> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    for (col, header) in headers.iter().enumerate() {
        worksheet
            .write_string(0, col.try_into().unwrap_or(0), header)
            .map_err(|e| AppError::Internal(format!("Excel書き込みエラー: {e}")))?;
    }

    for (row_idx, row) in rows.iter().enumerate() {
        for (col_idx, value) in row.iter().enumerate() {
            let excel_row: u32 = (row_idx + 1).try_into().unwrap_or(0);
            let excel_col: u16 = col_idx.try_into().unwrap_or(0);
            worksheet
                .write_string(excel_row, excel_col, value)
                .map_err(|e| AppError::Internal(format!("Excel書き込みエラー: {e}")))?;
        }
    }

    workbook
        .save(path)
        .map_err(|e| AppError::Internal(format!("Excel保存エラー: {e}")))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn write_and_read_excel() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("test.xlsx");
        let headers = vec!["name".to_string(), "age".to_string()];
        let rows = vec![
            vec!["Alice".to_string(), "30".to_string()],
            vec!["Bob".to_string(), "25".to_string()],
        ];

        write_excel(&path, &headers, &rows).unwrap();

        let (h, r) = read_excel(&path).unwrap();
        assert_eq!(h, headers);
        assert_eq!(r.len(), 2);
        assert_eq!(r[0][0], "Alice");
    }

    #[test]
    fn get_sheet_names_works() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("sheets.xlsx");
        let headers = vec!["col".to_string()];
        let rows = vec![vec!["val".to_string()]];
        write_excel(&path, &headers, &rows).unwrap();

        let names = get_sheet_names(&path).unwrap();
        assert!(!names.is_empty());
    }
}
