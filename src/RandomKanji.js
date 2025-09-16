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

    const results = {
      hanviet:
        userAnswers.hanviet.trim().toLowerCase() ===
        currentKanji.hanviet?.toLowerCase(),
      kun:
        userAnswers.kun.trim().toLowerCase() ===
        currentKanji.kun?.toLowerCase(),
      on:
        userAnswers.on.trim().toLowerCase() === currentKanji.on?.toLowerCase(),
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
              {isCorrect.kun ? "✓ Đúng!" : `✗ Sai! Đáp án: ${currentKanji.kun}`}
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
              {isCorrect.on ? "✓ Đúng!" : `✗ Sai! Đáp án: ${currentKanji.on}`}
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
                  <div key={idx} style={{ marginBottom: "10px" }}>
                    <div>{example.text}</div>
                    {example.phonetic && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        ({example.phonetic})
                      </div>
                    )}
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
