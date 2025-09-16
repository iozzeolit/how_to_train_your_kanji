import React, { useState, useMemo } from "react";

function KanjiList({ kanjiData }) {
  const [sortBy, setSortBy] = useState(null); // 'kun', 'on', or null
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  // Hàm xử lý sắp xếp
  const handleSort = (column) => {
    if (sortBy === column) {
      // Nếu đang sắp xếp theo cột hiện tại, đổi thứ tự
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nếu sắp xếp theo cột mới, mặc định là tăng dần
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Hàm lấy giá trị để sắp xếp
  const getSortValue = (item, column) => {
    const value = item[column];
    if (!value) return "";

    if (Array.isArray(value)) {
      // Nếu là mảng, lấy phần tử đầu tiên để sắp xếp
      return value.length > 0 ? value[0].toLowerCase() : "";
    }

    return value.toLowerCase();
  };

  // Dữ liệu đã được sắp xếp
  const sortedKanjiData = useMemo(() => {
    if (!sortBy) return kanjiData;

    const sorted = [...kanjiData].sort((a, b) => {
      const valueA = getSortValue(a, sortBy);
      const valueB = getSortValue(b, sortBy);

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [kanjiData, sortBy, sortOrder]);

  // Hàm tạo biểu tượng sắp xếp
  const getSortIcon = (column) => {
    if (sortBy !== column) return " ↕️";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };
  // Hàm kiểm tra xem ký tự có phải kanji không
  const isKanji = (char) => {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x4e00 && code <= 0x9faf) || // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
      (code >= 0x20000 && code <= 0x2a6df)
    ); // CJK Extension B
  };

  // Hàm tạo ruby text cho kanji và phonetic
  const createRubyText = (text, phonetic) => {
    if (!phonetic) return text;

    const textChars = Array.from(text);
    const phoneticChars = Array.from(phonetic);
    const result = [];

    let phoneticIndex = 0;

    for (let i = 0; i < textChars.length; i++) {
      const char = textChars[i];

      if (isKanji(char)) {
        // Nếu là kanji, tạo ruby với phonetic tương ứng
        let rubyPhonetic = "";
        // Lấy phonetic cho kanji này (tạm thời lấy tất cả phonetic còn lại)
        if (phoneticIndex < phoneticChars.length) {
          // Tính toán số phonetic chars cho kanji này
          const remainingKanji = textChars.slice(i + 1).filter(isKanji).length;
          const remainingPhonetic = phoneticChars.slice(phoneticIndex);
          const phoneticPerKanji = Math.ceil(
            remainingPhonetic.length / (remainingKanji + 1)
          );

          rubyPhonetic = remainingPhonetic.slice(0, phoneticPerKanji).join("");
          phoneticIndex += phoneticPerKanji;
        }

        result.push(
          <ruby key={i}>
            {char}
            <rt style={{ fontSize: "10px", color: "#666" }}>{rubyPhonetic}</rt>
          </ruby>
        );
      } else {
        // Nếu không phải kanji (hiragana, katakana, etc.), hiển thị bình thường
        result.push(<span key={i}>{char}</span>);
      }
    }

    return result;
  };

  const renderExample = (example) => {
    if (!example) return "";
    if (typeof example === "string") return example;
    if (typeof example === "object" && example.text) {
      return (
        <div style={{ fontSize: "16px" }}>
          {example.phonetic
            ? createRubyText(example.text, example.phonetic)
            : example.text}
        </div>
      );
    }
    return "";
  };
  return (
    <div style={{ padding: "20px" }}>
      <h2>Danh sách các chữ đã đọc</h2>

      {/* Khu vực điều khiển sắp xếp */}
      {kanjiData.length > 0 && (
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <span style={{ fontWeight: "bold" }}>Sắp xếp:</span>
          <button
            onClick={() => handleSort("kun")}
            style={{
              padding: "5px 10px",
              backgroundColor: sortBy === "kun" ? "#2196F3" : "#e0e0e0",
              color: sortBy === "kun" ? "white" : "black",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Âm Kun {sortBy === "kun" ? getSortIcon("kun") : ""}
          </button>
          <button
            onClick={() => handleSort("on")}
            style={{
              padding: "5px 10px",
              backgroundColor: sortBy === "on" ? "#2196F3" : "#e0e0e0",
              color: sortBy === "on" ? "white" : "black",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Âm On {sortBy === "on" ? getSortIcon("on") : ""}
          </button>
          {sortBy && (
            <button
              onClick={() => {
                setSortBy(null);
                setSortOrder("asc");
              }}
              style={{
                padding: "5px 10px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Xóa sắp xếp
            </button>
          )}
          {sortBy && (
            <span style={{ fontSize: "14px", color: "#666" }}>
              Đang sắp xếp theo{" "}
              <strong>{sortBy === "kun" ? "Âm Kun" : "Âm On"}</strong>(
              {sortOrder === "asc" ? "A-Z" : "Z-A"})
            </span>
          )}
        </div>
      )}

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
              <th
                style={{
                  cursor: "pointer",
                  backgroundColor: sortBy === "kun" ? "#e3f2fd" : "transparent",
                  userSelect: "none",
                }}
                onClick={() => handleSort("kun")}
                title="Nhấp để sắp xếp theo Âm Kun"
              >
                Âm Kun{getSortIcon("kun")}
              </th>
              <th
                style={{
                  cursor: "pointer",
                  backgroundColor: sortBy === "on" ? "#e3f2fd" : "transparent",
                  userSelect: "none",
                }}
                onClick={() => handleSort("on")}
                title="Nhấp để sắp xếp theo Âm On"
              >
                Âm On{getSortIcon("on")}
              </th>
              <th colSpan={2}>Từ ví dụ</th>{" "}
            </tr>
          </thead>
          <tbody>
            {sortedKanjiData.map((item, idx) => {
              const rows = [];

              // Hàng đầu tiên với kanji và 2 ví dụ đầu
              rows.push(
                <tr key={`${idx}-main`}>
                  <td>{item.kanji}</td>
                  <td>
                    {Array.isArray(item.hanviet)
                      ? item.hanviet.join("、")
                      : item.hanviet}
                  </td>
                  <td>
                    {Array.isArray(item.kun) ? item.kun.join("、") : item.kun}
                  </td>
                  <td>
                    {Array.isArray(item.on) ? item.on.join("、") : item.on}
                  </td>
                  <td>{renderExample(item.example[0])}</td>
                  <td>{renderExample(item.example[1])}</td>
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
                      <td>{renderExample(item.example[i])}</td>
                      <td>{renderExample(item.example[i + 1])}</td>
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
