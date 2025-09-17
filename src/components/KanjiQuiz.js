import React from "react";

function KanjiQuiz({
  currentKanji,
  userAnswers,
  showResult,
  isCorrect,
  onInputChange,
  onSubmit,
  onNext,
  submitButtonText = "Kiểm tra",
  nextButtonText = "Chữ tiếp theo",
  additionalInfo = null, // For displaying extra info like progress
  skipFields = {}, // Object with hanviet, kun, on boolean flags
  onSkipFieldChange = () => {}, // Callback for skip field changes
  romajiMode = {}, // Object with kun, on boolean flags for romaji mode
  onRomajiModeChange = () => {}, // Callback for romaji mode changes
}) {
  // Hàm chuyển đổi hiragana sang romaji
  const hiraganaToRomaji = (hiragana) => {
    const map = {
      あ: "a",
      い: "i",
      う: "u",
      え: "e",
      お: "o",
      か: "ka",
      き: "ki",
      く: "ku",
      け: "ke",
      こ: "ko",
      が: "ga",
      ぎ: "gi",
      ぐ: "gu",
      げ: "ge",
      ご: "go",
      さ: "sa",
      し: "shi",
      す: "su",
      せ: "se",
      そ: "so",
      ざ: "za",
      じ: "ji",
      ず: "zu",
      ぜ: "ze",
      ぞ: "zo",
      た: "ta",
      ち: "chi",
      つ: "tsu",
      て: "te",
      と: "to",
      だ: "da",
      ぢ: "di",
      づ: "du",
      で: "de",
      ど: "do",
      な: "na",
      に: "ni",
      ぬ: "nu",
      ね: "ne",
      の: "no",
      は: "ha",
      ひ: "hi",
      ふ: "fu",
      へ: "he",
      ほ: "ho",
      ば: "ba",
      び: "bi",
      ぶ: "bu",
      べ: "be",
      ぼ: "bo",
      ぱ: "pa",
      ぴ: "pi",
      ぷ: "pu",
      ぺ: "pe",
      ぽ: "po",
      ま: "ma",
      み: "mi",
      む: "mu",
      め: "me",
      も: "mo",
      や: "ya",
      ゆ: "yu",
      よ: "yo",
      ら: "ra",
      り: "ri",
      る: "ru",
      れ: "re",
      ろ: "ro",
      わ: "wa",
      ゐ: "wi",
      ゑ: "we",
      を: "wo",
      ん: "n",
      ゃ: "ya",
      ゅ: "yu",
      ょ: "yo",
      っ: "tsu",
      ー: "-",
      "・": ".",
    };

    return hiragana
      .split("")
      .map((char) => map[char] || char)
      .join("");
  };

  // Hàm kiểm tra xem input có khớp với correct reading không (hỗ trợ romaji)
  const isReadingMatch = (userInput, correctReading, isRomajiMode) => {
    const normalizedUser = userInput.trim().toLowerCase();
    const normalizedCorrect = correctReading.trim().toLowerCase();

    if (isRomajiMode) {
      // Chuyển đổi correct reading (hiragana) sang romaji để so sánh
      const romajiCorrect = hiraganaToRomaji(normalizedCorrect);
      return normalizedUser === romajiCorrect;
    } else {
      // So sánh trực tiếp (hiragana)
      return normalizedUser === normalizedCorrect;
    }
  };

  // Hàm tạo biểu tượng trạng thái kanji
  const getStatusIcon = (status) => {
    switch (status) {
      case "new":
        return { icon: "🆕", color: "#28a745", text: "Mới" };
      case "updated":
        return { icon: "🔄", color: "#ffc107", text: "Cập nhật" };
      case "existing":
        return { icon: "✅", color: "#6c757d", text: "Cũ" };
      default:
        return { icon: "", color: "#6c757d", text: "" };
    }
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

  if (!currentKanji) {
    return null;
  }

  return (
    <div>
      {/* Additional info section (like progress info) */}
      {additionalInfo}

      {/* Kanji display */}
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
          position: "relative",
        }}
      >
        {currentKanji.kanji}
        {/* Status indicator */}
        {currentKanji.status && currentKanji.status !== "existing" && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              fontSize: "16px",
              padding: "4px 8px",
              borderRadius: "12px",
              backgroundColor: getStatusIcon(currentKanji.status).color + "20",
              color: getStatusIcon(currentKanji.status).color,
              border: `2px solid ${getStatusIcon(currentKanji.status).color}60`,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title={`Kanji ${getStatusIcon(currentKanji.status).text}`}
          >
            {getStatusIcon(currentKanji.status).icon}
            <span style={{ fontSize: "12px" }}>
              {getStatusIcon(currentKanji.status).text}
            </span>
          </div>
        )}
      </div>

      {/* Quiz form */}
      <form onSubmit={onSubmit}>
        {/* Hán Việt input */}
        <div style={{ marginBottom: "15px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "5px",
            }}
          >
            <label style={{ margin: 0 }}>Hán Việt:</label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={skipFields.hanviet || false}
                onChange={(e) => onSkipFieldChange("hanviet", e.target.checked)}
                style={{ marginRight: "5px" }}
                disabled={showResult}
              />
              <span style={{ color: "#6c757d" }}>
                Không kiểm tra trường này
              </span>
            </label>
          </div>
          <input
            type="text"
            value={userAnswers.hanviet}
            onChange={(e) => onInputChange("hanviet", e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box",
              backgroundColor: showResult
                ? skipFields.hanviet || isCorrect.hanviet
                  ? "#d4edda"
                  : "#f8d7da"
                : skipFields.hanviet
                ? "#f0f0f0"
                : "white",
              color: skipFields.hanviet ? "#666" : "black",
            }}
            disabled={showResult || skipFields.hanviet}
            placeholder={skipFields.hanviet ? "Trường này được bỏ qua" : ""}
          />
          {showResult && (
            <div
              style={{
                marginTop: "5px",
                color:
                  skipFields.hanviet || isCorrect.hanviet ? "green" : "red",
              }}
            >
              {skipFields.hanviet
                ? "⏭️ Đã bỏ qua trường này"
                : isCorrect.hanviet
                ? "✓ Đúng!"
                : `✗ Sai! Đáp án: ${
                    Array.isArray(currentKanji.hanviet)
                      ? currentKanji.hanviet.join("、")
                      : currentKanji.hanviet
                  }`}
            </div>
          )}
        </div>

        {/* Kun reading inputs */}
        {hasReading(currentKanji?.kun) && (
          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
                gap: "10px",
                justifyContent: "space-between",
              }}
            >
              <label style={{ margin: 0 }}>
                {createReadingLabel("Âm Kun", currentKanji?.kun)}:
              </label>
              <div
                style={{ display: "flex", gap: "15px", alignItems: "center" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={romajiMode.kun || false}
                    onChange={(e) =>
                      onRomajiModeChange("kun", e.target.checked)
                    }
                    style={{ marginRight: "5px", cursor: "pointer" }}
                    disabled={showResult}
                  />
                  <span style={{ color: "#007bff" }}>Romaji</span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={skipFields.kun || false}
                    onChange={(e) => onSkipFieldChange("kun", e.target.checked)}
                    style={{ marginRight: "5px" }}
                    disabled={showResult}
                  />
                  <span style={{ color: "#6c757d" }}>
                    Không kiểm tra trường này
                  </span>
                </label>
              </div>
            </div>
            {Array.isArray(currentKanji.kun) &&
            currentKanji.kun.filter((r) => r.trim() !== "").length > 1 ? (
              // Multiple inputs for multiple kun readings
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  alignItems: "stretch",
                }}
              >
                {currentKanji.kun
                  .filter((r) => r.trim() !== "")
                  .map((reading, index) => (
                    <input
                      key={index}
                      type="text"
                      value={userAnswers.kun[index] || ""}
                      onChange={(e) =>
                        onInputChange("kun", e.target.value, index)
                      }
                      placeholder={`Âm kun thứ ${index + 1}${
                        romajiMode.kun ? " (Romaji)" : " (Hiragana)"
                      }`}
                      style={{
                        flex: "1 1 0",
                        minWidth: "150px",
                        padding: "8px",
                        fontSize: "16px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        boxSizing: "border-box",
                        backgroundColor: showResult
                          ? skipFields.kun || isCorrect.kun
                            ? "#d4edda"
                            : "#f8d7da"
                          : skipFields.kun
                          ? "#f0f0f0"
                          : "white",
                        color: skipFields.kun ? "#666" : "black",
                      }}
                      disabled={showResult || skipFields.kun}
                    />
                  ))}
              </div>
            ) : (
              // Single input for single kun reading
              <input
                type="text"
                value={userAnswers.kun[0] || ""}
                onChange={(e) => onInputChange("kun", e.target.value, 0)}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "16px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  backgroundColor: showResult
                    ? skipFields.kun || isCorrect.kun
                      ? "#d4edda"
                      : "#f8d7da"
                    : skipFields.kun
                    ? "#f0f0f0"
                    : "white",
                  color: skipFields.kun ? "#666" : "black",
                }}
                placeholder={`Âm kun${
                  romajiMode.kun ? " (Romaji)" : " (Hiragana)"
                }`}
                disabled={showResult || skipFields.kun}
              />
            )}
            {showResult && (
              <div
                style={{
                  marginTop: "5px",
                  color: skipFields.kun || isCorrect.kun ? "green" : "red",
                }}
              >
                {skipFields.kun
                  ? "✓ Skipped (automatically correct)"
                  : isCorrect.kun
                  ? "✓ Đúng!"
                  : `✗ Sai! Đáp án: ${
                      Array.isArray(currentKanji.kun)
                        ? currentKanji.kun
                            .map((reading) =>
                              romajiMode.kun
                                ? hiraganaToRomaji(reading)
                                : reading
                            )
                            .join("、")
                        : romajiMode.kun
                        ? hiraganaToRomaji(currentKanji.kun)
                        : currentKanji.kun
                    }`}
              </div>
            )}
          </div>
        )}

        {/* On reading inputs */}
        {hasReading(currentKanji?.on) && (
          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
                gap: "10px",
                justifyContent: "space-between",
              }}
            >
              <label style={{ margin: 0 }}>
                {createReadingLabel("Âm On", currentKanji?.on)}:
              </label>
              <div
                style={{ display: "flex", gap: "15px", alignItems: "center" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={romajiMode.on || false}
                    onChange={(e) => onRomajiModeChange("on", e.target.checked)}
                    style={{ marginRight: "5px", cursor: "pointer" }}
                    disabled={showResult}
                  />
                  <span style={{ color: "#007bff" }}>Romaji</span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={skipFields.on || false}
                    onChange={(e) => onSkipFieldChange("on", e.target.checked)}
                    style={{ marginRight: "5px" }}
                    disabled={showResult}
                  />
                  <span style={{ color: "#6c757d" }}>
                    Không kiểm tra trường này
                  </span>
                </label>
              </div>
            </div>
            {Array.isArray(currentKanji.on) &&
            currentKanji.on.filter((r) => r.trim() !== "").length > 1 ? (
              // Multiple inputs for multiple on readings
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  alignItems: "stretch",
                }}
              >
                {currentKanji.on
                  .filter((r) => r.trim() !== "")
                  .map((reading, index) => (
                    <input
                      key={index}
                      type="text"
                      value={userAnswers.on[index] || ""}
                      onChange={(e) =>
                        onInputChange("on", e.target.value, index)
                      }
                      placeholder={`Âm on thứ ${index + 1}${
                        romajiMode.on ? " (Romaji)" : " (Hiragana)"
                      }`}
                      style={{
                        flex: "1 1 0",
                        minWidth: "150px",
                        padding: "8px",
                        fontSize: "16px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        boxSizing: "border-box",
                        backgroundColor: showResult
                          ? skipFields.on || isCorrect.on
                            ? "#d4edda"
                            : "#f8d7da"
                          : skipFields.on
                          ? "#f0f0f0"
                          : "white",
                        color: skipFields.on ? "#666" : "black",
                      }}
                      disabled={showResult || skipFields.on}
                    />
                  ))}
              </div>
            ) : (
              // Single input for single on reading
              <input
                type="text"
                value={userAnswers.on[0] || ""}
                onChange={(e) => onInputChange("on", e.target.value, 0)}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "16px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  backgroundColor: showResult
                    ? skipFields.on || isCorrect.on
                      ? "#d4edda"
                      : "#f8d7da"
                    : skipFields.on
                    ? "#f0f0f0"
                    : "white",
                  color: skipFields.on ? "#666" : "black",
                }}
                placeholder={`Âm on${
                  romajiMode.on ? " (Romaji)" : " (Hiragana)"
                }`}
                disabled={showResult || skipFields.on}
              />
            )}
            {showResult && (
              <div
                style={{
                  marginTop: "5px",
                  color: skipFields.on || isCorrect.on ? "green" : "red",
                }}
              >
                {skipFields.on
                  ? "✓ Skipped (automatically correct)"
                  : isCorrect.on
                  ? "✓ Đúng!"
                  : `✗ Sai! Đáp án: ${
                      Array.isArray(currentKanji.on)
                        ? currentKanji.on
                            .map((reading) =>
                              romajiMode.on
                                ? hiraganaToRomaji(reading)
                                : reading
                            )
                            .join("、")
                        : romajiMode.on
                        ? hiraganaToRomaji(currentKanji.on)
                        : currentKanji.on
                    }`}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
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
            {submitButtonText}
          </button>
          <button
            type="button"
            onClick={onNext}
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
            {nextButtonText}
          </button>
        </div>
      </form>
    </div>
  );
}

export default KanjiQuiz;
