use std::collections::HashMap;

/// LEFT JOIN を実行する純粋関数
///
/// `base_rows` の全行を保持し、`join_rows` から key が一致する行の列を追加する。
/// マッチしない場合は空文字で埋める。
/// ヘッダーの重複は join 側に接頭辞 "`join_prefix`_" を付けて回避する。
pub fn left_join(
    base_headers: &[String],
    base_rows: &[Vec<String>],
    join_headers: &[String],
    join_rows: &[Vec<String>],
    base_key_fn: impl Fn(&[String], &[String]) -> String,
    join_key_fn: impl Fn(&[String], &[String]) -> String,
    join_prefix: &str,
) -> (Vec<String>, Vec<Vec<String>>) {
    // 1. Build HashMap: join key -> first matching row index
    let mut join_index: HashMap<String, usize> = HashMap::new();
    for (i, row) in join_rows.iter().enumerate() {
        let key = join_key_fn(join_headers, row);
        join_index.entry(key).or_insert(i);
    }

    // 2. Build merged headers: base headers + prefixed join headers
    let prefixed_join_headers: Vec<String> = join_headers
        .iter()
        .map(|h| format!("{join_prefix}_{h}"))
        .collect();
    let mut merged_headers = base_headers.to_vec();
    merged_headers.extend(prefixed_join_headers);

    // 3. For each base row, find matching join row
    let join_col_count = join_headers.len();
    let empty_join: Vec<String> = vec![String::new(); join_col_count];

    let merged_rows: Vec<Vec<String>> = base_rows
        .iter()
        .map(|base_row| {
            let key = base_key_fn(base_headers, base_row);
            let join_values = join_index
                .get(&key)
                .and_then(|&idx| join_rows.get(idx))
                .unwrap_or(&empty_join);

            let mut merged = base_row.clone();
            merged.extend(join_values.iter().cloned());
            // Pad if join row is shorter than expected
            while merged.len() < base_headers.len() + join_col_count {
                merged.push(String::new());
            }
            merged
        })
        .collect();

    (merged_headers, merged_rows)
}

/// インデックスベースの単純キー抽出関数を生成
pub fn index_key_fn(indices: &[usize]) -> impl Fn(&[String], &[String]) -> String + '_ {
    move |_headers: &[String], row: &[String]| {
        indices
            .iter()
            .map(|&i| row.get(i).map_or("", String::as_str))
            .collect::<Vec<_>>()
            .join("\x1F")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_left_join() {
        let base_h = vec!["id".into(), "name".into()];
        let base_r = vec![
            vec!["1".into(), "Alice".into()],
            vec!["2".into(), "Bob".into()],
            vec!["3".into(), "Charlie".into()],
        ];
        let join_h = vec!["id".into(), "score".into()];
        let join_r = vec![
            vec!["1".into(), "90".into()],
            vec!["2".into(), "80".into()],
        ];

        let (headers, rows) = left_join(
            &base_h,
            &base_r,
            &join_h,
            &join_r,
            index_key_fn(&[0]),
            index_key_fn(&[0]),
            "join",
        );

        assert_eq!(rows.len(), 3);
        assert_eq!(headers, vec!["id", "name", "join_id", "join_score"]);
        assert_eq!(rows[0], vec!["1", "Alice", "1", "90"]);
        assert_eq!(rows[1], vec!["2", "Bob", "2", "80"]);
        assert_eq!(rows[2], vec!["3", "Charlie", "", ""]);
    }

    #[test]
    fn left_join_no_matches() {
        let base_h = vec!["id".into(), "name".into()];
        let base_r = vec![vec!["1".into(), "Alice".into()]];
        let join_h = vec!["id".into(), "val".into()];
        let join_r = vec![vec!["99".into(), "X".into()]];

        let (_, rows) = left_join(
            &base_h,
            &base_r,
            &join_h,
            &join_r,
            index_key_fn(&[0]),
            index_key_fn(&[0]),
            "j",
        );

        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0], vec!["1", "Alice", "", ""]);
    }

    #[test]
    fn left_join_composite_key() {
        let base_h = vec!["first".into(), "last".into(), "age".into()];
        let base_r = vec![
            vec!["太郎".into(), "山田".into(), "30".into()],
            vec!["花子".into(), "鈴木".into(), "25".into()],
        ];
        let join_h = vec!["name".into(), "dept".into()];
        let join_r = vec![vec!["山田太郎".into(), "営業".into()]];

        let base_key = |_h: &[String], r: &[String]| {
            format!(
                "{}{}",
                r.get(1).unwrap_or(&String::new()),
                r.get(0).unwrap_or(&String::new())
            )
        };
        let join_key = index_key_fn(&[0]);

        let (_, rows) = left_join(&base_h, &base_r, &join_h, &join_r, base_key, join_key, "j");

        assert_eq!(rows[0][4], "営業");
        assert_eq!(rows[1][4], "");
    }

    #[test]
    fn left_join_empty_join_table() {
        let base_h = vec!["id".into()];
        let base_r = vec![vec!["1".into()]];
        let join_h = vec!["id".into(), "val".into()];
        let join_r: Vec<Vec<String>> = vec![];

        let (headers, rows) = left_join(
            &base_h,
            &base_r,
            &join_h,
            &join_r,
            index_key_fn(&[0]),
            index_key_fn(&[0]),
            "j",
        );

        assert_eq!(rows.len(), 1);
        assert_eq!(headers.len(), 3);
        assert_eq!(rows[0], vec!["1", "", ""]);
    }

    #[test]
    fn left_join_duplicate_keys_takes_first() {
        let base_h = vec!["id".into()];
        let base_r = vec![vec!["1".into()]];
        let join_h = vec!["id".into(), "val".into()];
        let join_r = vec![
            vec!["1".into(), "first".into()],
            vec!["1".into(), "second".into()],
        ];

        let (_, rows) = left_join(
            &base_h,
            &base_r,
            &join_h,
            &join_r,
            index_key_fn(&[0]),
            index_key_fn(&[0]),
            "j",
        );

        assert_eq!(rows[0][2], "first");
    }
}
