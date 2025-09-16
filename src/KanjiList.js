import React from "react";

function KanjiList({ kanjiData }) {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Danh sách các chữ đã đọc</h2>
      {kanjiData.length === 0 ? (
        <p>Chưa có dữ liệu nào.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{ marginTop: "10px", width: "100%" }}
        >
          <thead>
            <tr>
              <th>Kanji</th>
              <th>Hán Việt</th>
              <th>Âm Kun</th>
              <th>Âm On</th>
              <th colSpan={2}>Từ ví dụ</th>{" "}
            </tr>
          </thead>
          <tbody>
            {kanjiData.map((item, idx) => {
              const rows = [];

              // Hàng đầu tiên với kanji và 2 ví dụ đầu
              rows.push(
                <tr key={`${idx}-main`}>
                  <td>{item.kanji}</td>
                  <td>{item.hanviet}</td>
                  <td>{item.kun}</td>
                  <td>{item.on}</td>
                  <td>{item.example[0] || ""}</td>
                  <td>{item.example[1] || ""}</td>
                </tr>
              );

              // Nếu có nhiều hơn 2 ví dụ, thêm các hàng phụ
              if (item.example && item.example.length > 2) {
                for (let i = 2; i < item.example.length; i += 2) {
                  rows.push(
                    <tr key={`${idx}-extra-${i}`}>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>{item.example[i] || ""}</td>
                      <td>{item.example[i + 1] || ""}</td>
                    </tr>
                  );
                }
              }

              return rows;
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default KanjiList;
