import React, { useState, useEffect } from "react";

function RandomKanji({ kanjiData }) {
  const [currentKanji, setCurrentKanji] = useState(null);
  const [userAnswers, setUserAnswers] = useState({
    hanviet: "",
    kun: [],
    on: [],
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

  // Chọn kanji ngẫu nhiên khi component load hoặc khi data thay đổi
  useEffect(() => {
    if (kanjiData.length > 0) {
      const randomIndex = Math.floor(Math.random() * kanjiData.length);
      const selectedKanji = kanjiData[randomIndex];
      setCurrentKanji(selectedKanji);
      setShowResult(false);
      
      // Khởi tạo userAnswers dựa trên số lượng readings
      const kunCount = Array.isArray(selectedKanji.kun) ? selectedKanji.kun.filter(r => r.trim() !== "").length : (selectedKanji.kun && selectedKanji.kun.trim() !== "" ? 1 : 0);
      const onCount = Array.isArray(selectedKanji.on) ? selectedKanji.on.filter(r => r.trim() !== "").length : (selectedKanji.on && selectedKanji.on.trim() !== "" ? 1 : 0);
      
      setUserAnswers({ 
        hanviet: "", 
        kun: new Array(kunCount).fill(""),
        on: new Array(onCount).fill("")
      });
      setIsCorrect({ hanviet: false, kun: false, on: false });
    }
  }, [kanjiData]);

  const handleInputChange = (field, value, index = null) => {
    setUserAnswers((prev) => {
      if (field === "hanviet") {
        return { ...prev, [field]: value };
      } else {
        // For kun and on arrays
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
      }
    });
  };

  // Hàm kiểm tra xem reading có tồn tại không
  const hasReading = (reading) => {
    if (!reading) return false;
    if (Array.isArray(reading)) {
      return reading.length > 0 && reading.some((r) => r.trim() !== "");
    }
    return reading.trim() !== "";
  };

  // Hàm tạo label với thông tin số lượng âm
  const createReadingLabel = (baseLabel, reading) => {
    if (!hasReading(reading)) return baseLabel;

    if (Array.isArray(reading)) {
      const validReadings = reading.filter((r) => r.trim() !== "");
      if (validReadings.length > 1) {
        return `${baseLabel} (từ này có ${validReadings.length} âm ${baseLabel
          .toLowerCase()
          .replace("âm ", "")})`;
      }
    }
    return baseLabel;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentKanji) return;

    // Hàm kiểm tra đáp án với mảng readings - yêu cầu tất cả readings phải đúng
    const checkAllReadingsAnswer = (userAnswers, correctReadings) => {
      if (!correctReadings || correctReadings.length === 0) return false;
      
      if (Array.isArray(correctReadings)) {
        const validCorrectReadings = correctReadings.filter(r => r.trim() !== "");
        const validUserAnswers = userAnswers.filter(a => a.trim() !== "");
        
        // Kiểm tra số lượng phải bằng nhau
        if (validCorrectReadings.length !== validUserAnswers.length) return false;
        
        // Kiểm tra từng đáp án của user có trong correctReadings không
        return validUserAnswers.every(userAnswer => 
          validCorrectReadings.some(correctReading => 
            userAnswer.trim().toLowerCase() === correctReading.toLowerCase()
          )
        );
      } else {
        // Backward compatibility với string
        return userAnswers.length === 1 && 
               userAnswers[0].trim().toLowerCase() === correctReadings.toLowerCase();
      }
    };

    // Hàm kiểm tra đáp án Hán Việt - chỉ cần 1 từ trong input trùng với bất kỳ từ nào trong mảng
    const checkHanvietAnswer = (userAnswer, correctReadings) => {
      if (!correctReadings || correctReadings.length === 0) return false;

      const userWords = userAnswer
        .trim()
        .toLowerCase()
        .split(/[\s,、]+/)
        .filter((word) => word !== "");

      if (Array.isArray(correctReadings)) {
        // Tách các từ trong correctReadings thành mảng phẳng
        const allCorrectWords = correctReadings.flatMap((reading) =>
          reading
            .toLowerCase()
            .split(/[\s,、]+/)
            .filter((word) => word !== "")
        );

        // Kiểm tra xem có ít nhất 1 từ trong userWords trùng với allCorrectWords không
        return userWords.some((userWord) =>
          allCorrectWords.some((correctWord) => userWord === correctWord)
        );
      } else {
        // Backward compatibility với string
        const correctWords = correctReadings
          .toLowerCase()
          .split(/[\s,、]+/)
          .filter((word) => word !== "");
        return userWords.some((userWord) =>
          correctWords.some((correctWord) => userWord === correctWord)
        );
      }
    };

    const results = {
      hanviet: checkHanvietAnswer(userAnswers.hanviet, currentKanji.hanviet),
      kun: hasReading(currentKanji.kun)
        ? checkAllReadingsAnswer(userAnswers.kun, currentKanji.kun)
        : true,
      on: hasReading(currentKanji.on)
        ? checkAllReadingsAnswer(userAnswers.on, currentKanji.on)
        : true,
    };

    setIsCorrect(results);
    setShowResult(true);
  };

  const getNextKanji = () => {
    if (kanjiData.length > 0) {
      const randomIndex = Math.floor(Math.random() * kanjiData.length);
      const selectedKanji = kanjiData[randomIndex];
      setCurrentKanji(selectedKanji);
      setShowResult(false);
      
      // Khởi tạo userAnswers dựa trên số lượng readings
      const kunCount = Array.isArray(selectedKanji.kun) ? selectedKanji.kun.filter(r => r.trim() !== "").length : (selectedKanji.kun && selectedKanji.kun.trim() !== "" ? 1 : 0);
      const onCount = Array.isArray(selectedKanji.on) ? selectedKanji.on.filter(r => r.trim() !== "").length : (selectedKanji.on && selectedKanji.on.trim() !== "" ? 1 : 0);
      
      setUserAnswers({ 
        hanviet: "", 
        kun: new Array(kunCount).fill(""),
        on: new Array(onCount).fill("")
      });
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
    <div style={{ padding: "20px", margin: "0 auto" }}>
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
                : `✗ Sai! Đáp án: ${
                    Array.isArray(currentKanji.hanviet)
                      ? currentKanji.hanviet.join("、")
                      : currentKanji.hanviet
                  }`}
            </div>
          )}
        </div>

        {hasReading(currentKanji?.kun) && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              {createReadingLabel("Âm Kun", currentKanji?.kun)}:
            </label>
            {Array.isArray(currentKanji.kun) && currentKanji.kun.filter(r => r.trim() !== "").length > 1 ? (
              // Multiple inputs for multiple kun readings
              currentKanji.kun.filter(r => r.trim() !== "").map((reading, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  <input
                    type="text"
                    value={userAnswers.kun[index] || ""}
                    onChange={(e) => handleInputChange("kun", e.target.value, index)}
                    placeholder={`Âm kun thứ ${index + 1}`}
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
                </div>
              ))
            ) : (
              // Single input for single kun reading
              <input
                type="text"
                value={userAnswers.kun[0] || ""}
                onChange={(e) => handleInputChange("kun", e.target.value, 0)}
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
            )}
            {showResult && (
              <div
                style={{
                  marginTop: "5px",
                  color: isCorrect.kun ? "green" : "red",
                }}
              >
                {isCorrect.kun
                  ? "✓ Đúng!"
                  : `✗ Sai! Đáp án: ${
                      Array.isArray(currentKanji.kun)
                        ? currentKanji.kun.join("、")
                        : currentKanji.kun
                    }`}
              </div>
            )}
          </div>
        )}

        {hasReading(currentKanji?.on) && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              {createReadingLabel("Âm On", currentKanji?.on)}:
            </label>
            {Array.isArray(currentKanji.on) && currentKanji.on.filter(r => r.trim() !== "").length > 1 ? (
              // Multiple inputs for multiple on readings
              currentKanji.on.filter(r => r.trim() !== "").map((reading, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  <input
                    type="text"
                    value={userAnswers.on[index] || ""}
                    onChange={(e) => handleInputChange("on", e.target.value, index)}
                    placeholder={`Âm on thứ ${index + 1}`}
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
                </div>
              ))
            ) : (
              // Single input for single on reading
              <input
                type="text"
                value={userAnswers.on[0] || ""}
                onChange={(e) => handleInputChange("on", e.target.value, 0)}
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
            )}
            {showResult && (
              <div
                style={{
                  marginTop: "5px",
                  color: isCorrect.on ? "green" : "red",
                }}
              >
                {isCorrect.on
                  ? "✓ Đúng!"
                  : `✗ Sai! Đáp án: ${
                      Array.isArray(currentKanji.on)
                        ? currentKanji.on.join("、")
                        : currentKanji.on
                    }`}
              </div>
            )}
          </div>
        )}

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
          <h4 style={{ fontSize: "24px" }}>Từ ví dụ:</h4>
          <div>
            {currentKanji.example.filter(Boolean).map((example, idx) => {
              if (typeof example === "string") {
                return (
                  <div
                    key={idx}
                    style={{ marginBottom: "5px", fontSize: "36px" }}
                  >
                    {example}
                  </div>
                );
              } else if (typeof example === "object" && example.text) {
                return (
                  <div
                    key={idx}
                    style={{ marginBottom: "10px", fontSize: "36px" }}
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
