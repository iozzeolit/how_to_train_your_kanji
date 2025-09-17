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
          <label style={{ display: "block", marginBottom: "5px" }}>
            Hán Việt:
          </label>
          <input
            type="text"
            value={userAnswers.hanviet}
            onChange={(e) => onInputChange("hanviet", e.target.value)}
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

        {/* Kun reading inputs */}
        {hasReading(currentKanji?.kun) && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              {createReadingLabel("Âm Kun", currentKanji?.kun)}:
            </label>
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
                          ? isCorrect.kun
                            ? "#d4edda"
                            : "#f8d7da"
                          : "white",
                      }}
                      disabled={showResult}
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

        {/* On reading inputs */}
        {hasReading(currentKanji?.on) && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              {createReadingLabel("Âm On", currentKanji?.on)}:
            </label>
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
                          ? isCorrect.on
                            ? "#d4edda"
                            : "#f8d7da"
                          : "white",
                      }}
                      disabled={showResult}
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
