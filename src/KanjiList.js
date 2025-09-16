import React from "react";

function KanjiList({ kanjiData }) {
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
