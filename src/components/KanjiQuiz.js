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
}) {
  // Hàm tạo biểu tượng trạng thái kanji
  const getStatusIcon = (status) => {
    switch (status) {
      case "new":
        return { icon: "🆕", color: "#28a745", text: "Mới" };
      case "updated":
        return { icon: "🔄", color: "#ffc107", text: "Cập nhật" };
      case "existing":
        return { icon: "✅", color: "#6c757d", text: "Không đổi" };
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
                fontSize: "14px",
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
              backgroundColor: showResult
                ? skipFields.hanviet || isCorrect.hanviet
                  ? "#d4edda"
                  : "#f8d7da"
                : skipFields.hanviet
                ? "#f8f9fa"
                : "white",
              opacity: skipFields.hanviet ? 0.7 : 1,
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
              }}
            >
              <label style={{ margin: 0 }}>
                {createReadingLabel("Âm Kun", currentKanji?.kun)}:
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={skipFields.kun || false}
                  onChange={(e) => onSkipFieldChange("kun", e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Skip field
              </label>
            </div>
            {Array.isArray(currentKanji.kun) &&
            currentKanji.kun.filter((r) => r.trim() !== "").length > 1 ? (
              // Multiple inputs for multiple kun readings
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                      placeholder={`Âm kun thứ ${index + 1}`}
                      style={{
                        flex: "1",
                        minWidth: "150px",
                        padding: "8px",
                        fontSize: "16px",
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
                        ? currentKanji.kun.join("、")
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
              }}
            >
              <label style={{ margin: 0 }}>
                {createReadingLabel("Âm On", currentKanji?.on)}:
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={skipFields.on || false}
                  onChange={(e) => onSkipFieldChange("on", e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Skip field
              </label>
            </div>
            {Array.isArray(currentKanji.on) &&
            currentKanji.on.filter((r) => r.trim() !== "").length > 1 ? (
              // Multiple inputs for multiple on readings
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                      placeholder={`Âm on thứ ${index + 1}`}
                      style={{
                        flex: "1",
                        minWidth: "150px",
                        padding: "8px",
                        fontSize: "16px",
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
                        ? currentKanji.on.join("、")
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
