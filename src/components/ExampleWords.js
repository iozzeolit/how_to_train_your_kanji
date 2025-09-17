import React from "react";

function ExampleWords({ examples, title = "Từ ví dụ", fontSize = "36px" }) {
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
        // Lấy phonetic cho kanji này
        if (phoneticIndex < phoneticChars.length) {
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
            <rt style={{ fontSize: "24px", color: "#666" }}>{rubyPhonetic}</rt>
          </ruby>
        );
      } else {
        // Nếu không phải kanji, hiển thị bình thường
        result.push(<span key={i}>{char}</span>);
      }
    }

    return result;
  };

  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#e9ecef",
        borderRadius: "5px",
      }}
    >
      <h4 style={{ fontSize: "24px", marginTop: 0, marginBottom: "10px" }}>
        {title}:
      </h4>
      <div>
        {examples.filter(Boolean).map((example, idx) => {
          if (typeof example === "string") {
            return (
              <div
                key={idx}
                style={{ marginBottom: "5px", fontSize: fontSize }}
              >
                {example}
              </div>
            );
          } else if (typeof example === "object" && example.text) {
            return (
              <div
                key={idx}
                style={{ marginBottom: "10px", fontSize: fontSize }}
              >
                {example.phonetic
                  ? createRubyText(example.text, example.phonetic)
                  : example.text}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default ExampleWords;
