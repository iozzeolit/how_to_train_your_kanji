import React, { useState, useEffect } from "react";

function RandomKanji({ kanjiData }) {
  const [currentKanji, setCurrentKanji] = useState(null);
  const [userAnswers, setUserAnswers] = useState({
    hanviet: "",
    kun: "",
    on: "",
  });
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState({
    hanviet: false,
    kun: false,
    on: false,
  });

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
            <rt style={{ fontSize: "12px", color: "#666" }}>{rubyPhonetic}</rt>
          </ruby>
        );
      } else {
        // Nếu không phải kanji, hiển thị bình thường
        result.push(<span key={i}>{char}</span>);
      }
    }

    return result;
  };

  // Chọn kanji ngẫu nhiên khi component load hoặc khi data thay đổi
  useEffect(() => {
    console.log("KanjiData length:", kanjiData.length);
    console.log("KanjiData:", kanjiData);
    if (kanjiData.length > 0) {
      const randomIndex = Math.floor(Math.random() * kanjiData.length);
      console.log("Random index:", randomIndex);
      console.log("Selected kanji:", kanjiData[randomIndex]);
      setCurrentKanji(kanjiData[randomIndex]);
      setShowResult(false);
      setUserAnswers({ hanviet: "", kun: "", on: "" });
      setIsCorrect({ hanviet: false, kun: false, on: false });
    }
  }, [kanjiData]);

  const handleInputChange = (field, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentKanji) return;

    // Hàm kiểm tra đáp án với mảng readings
    const checkReadingAnswer = (userAnswer, correctReadings) => {
      if (!correctReadings || correctReadings.length === 0) return false;
      if (Array.isArray(correctReadings)) {
        // Nếu correctReadings là mảng, kiểm tra xem userAnswer có match với bất kỳ phần tử nào không
        return correctReadings.some(reading => 
          userAnswer.trim().toLowerCase() === reading.toLowerCase()
        );
      } else {
        // Nếu correctReadings là string (backward compatibility)
        return userAnswer.trim().toLowerCase() === correctReadings.toLowerCase();
      }
    };

    const results = {
      hanviet:
        userAnswers.hanviet.trim().toLowerCase() ===
        currentKanji.hanviet?.toLowerCase(),
      kun: checkReadingAnswer(userAnswers.kun, currentKanji.kun),
      on: checkReadingAnswer(userAnswers.on, currentKanji.on),
    };

    setIsCorrect(results);
    setShowResult(true);
  };

  const getNextKanji = () => {
    if (kanjiData.length > 0) {
      const randomIndex = Math.floor(Math.random() * kanjiData.length);
      setCurrentKanji(kanjiData[randomIndex]);
      setShowResult(false);
      setUserAnswers({ hanviet: "", kun: "", on: "" });
      setIsCorrect({ hanviet: false, kun: false, on: false });
    }
  };

  if (kanjiData.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Học chữ ngẫu nhiên</h2>
        <p>Vui lòng tải file Excel để bắt đầu học!</p>
      </div>
    );
  }

  if (!currentKanji) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Đang tải...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Học chữ ngẫu nhiên</h2>

      <div
        style={{
          fontSize: "72px",
          textAlign: "center",
          margin: "20px 0",
          border: "2px solid #ccc",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          minHeight: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {currentKanji?.kanji || "Không có dữ liệu"}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Hán Việt:
          </label>
          <input
            type="text"
            value={userAnswers.hanviet}
            onChange={(e) => handleInputChange("hanviet", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "16px",
              backgroundColor: showResult
                ? isCorrect.hanviet
                  ? "#d4edda"
                  : "#f8d7da"
                : "white",
            }}
            disabled={showResult}
          />
          {showResult && (
            <div
              style={{
                marginTop: "5px",
                color: isCorrect.hanviet ? "green" : "red",
              }}
            >
              {isCorrect.hanviet
                ? "✓ Đúng!"
                : `✗ Sai! Đáp án: ${currentKanji.hanviet}`}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Âm Kun:
          </label>
          <input
            type="text"
            value={userAnswers.kun}
            onChange={(e) => handleInputChange("kun", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "16px",
              backgroundColor: showResult
                ? isCorrect.kun
                  ? "#d4edda"
                  : "#f8d7da"
                : "white",
            }}
            disabled={showResult}
          />
          {showResult && (
            <div
              style={{
                marginTop: "5px",
                color: isCorrect.kun ? "green" : "red",
              }}
            >
              {isCorrect.kun ? "✓ Đúng!" : `✗ Sai! Đáp án: ${Array.isArray(currentKanji.kun) 
                  ? currentKanji.kun.join("、") 
                  : currentKanji.kun}`}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Âm On:
          </label>
          <input
            type="text"
            value={userAnswers.on}
            onChange={(e) => handleInputChange("on", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "16px",
              backgroundColor: showResult
                ? isCorrect.on
                  ? "#d4edda"
                  : "#f8d7da"
                : "white",
            }}
            disabled={showResult}
          />
          {showResult && (
            <div
              style={{
                marginTop: "5px",
                color: isCorrect.on ? "green" : "red",
              }}
            >
              {isCorrect.on ? "✓ Đúng!" : `✗ Sai! Đáp án: ${Array.isArray(currentKanji.on) 
                  ? currentKanji.on.join("、") 
                  : currentKanji.on}`}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px",
            }}
            disabled={showResult}
          >
            Kiểm tra
          </button>
          <button
            type="button"
            onClick={getNextKanji}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Chữ tiếp theo
          </button>
        </div>
      </form>

      {showResult && currentKanji.example && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#e9ecef",
            borderRadius: "5px",
          }}
        >
          <h4>Từ ví dụ:</h4>
          <div>
            {currentKanji.example.filter(Boolean).map((example, idx) => {
              if (typeof example === "string") {
                return (
                  <div key={idx} style={{ marginBottom: "5px" }}>
                    {example}
                  </div>
                );
              } else if (typeof example === "object" && example.text) {
                return (
                  <div
                    key={idx}
                    style={{ marginBottom: "10px", fontSize: "18px" }}
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
      )}
    </div>
  );
}

export default RandomKanji;
