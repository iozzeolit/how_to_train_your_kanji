import React, { useState, useEffect } from "react";
import ExampleWords from "./components/ExampleWords";
import KanjiQuiz from "./components/KanjiQuiz";

function RandomKanji({ kanjiData }) {
  // Configuration states
  const [showConfig, setShowConfig] = useState(true);
  const [displayMode, setDisplayMode] = useState("random"); // 'random' hoặc 'order'
  const [kanjiTypes, setKanjiTypes] = useState({
    existing: true,
    updated: true,
    new: true,
  });
  const [filteredKanjiData, setFilteredKanjiData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Quiz states
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

  // Filter and prepare kanji data based on selected types
  const filterKanjiData = () => {
    return kanjiData.filter((kanji) => {
      const status = kanji.status || "existing";
      return kanjiTypes[status];
    });
  };

  // Start quiz with selected configuration
  const startQuiz = () => {
    const filtered = filterKanjiData();
    if (filtered.length === 0) {
      alert("Không có kanji nào phù hợp với lựa chọn của bạn!");
      return;
    }

    setFilteredKanjiData(filtered);
    setCurrentIndex(0);
    setShowConfig(false);

    // Select first kanji
    selectKanji(filtered, 0);
  };

  // Select kanji based on mode and index
  const selectKanji = (dataArray, index) => {
    if (dataArray.length === 0) return;

    let selectedKanji;
    if (displayMode === "random") {
      const randomIndex = Math.floor(Math.random() * dataArray.length);
      selectedKanji = dataArray[randomIndex];
    } else {
      selectedKanji = dataArray[index % dataArray.length];
    }

    setCurrentKanji(selectedKanji);
    setShowResult(false);

    // Initialize userAnswers based on readings count
    const kunCount = Array.isArray(selectedKanji.kun)
      ? selectedKanji.kun.filter((r) => r.trim() !== "").length
      : selectedKanji.kun && selectedKanji.kun.trim() !== ""
      ? 1
      : 0;
    const onCount = Array.isArray(selectedKanji.on)
      ? selectedKanji.on.filter((r) => r.trim() !== "").length
      : selectedKanji.on && selectedKanji.on.trim() !== ""
      ? 1
      : 0;

    setUserAnswers({
      hanviet: "",
      kun: new Array(kunCount).fill(""),
      on: new Array(onCount).fill(""),
    });
    setIsCorrect({ hanviet: false, kun: false, on: false });
  };

  // Handle checkbox changes
  const handleKanjiTypeChange = (type) => {
    setKanjiTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Chọn kanji ngẫu nhiên khi component load hoặc khi data thay đổi - chỉ nếu đã bắt đầu quiz
  useEffect(() => {
    if (kanjiData.length > 0 && !showConfig && filteredKanjiData.length > 0) {
      selectKanji(filteredKanjiData, currentIndex);
    }
  }, [kanjiData, showConfig]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentKanji) return;

    // Hàm kiểm tra đáp án với mảng readings - yêu cầu tất cả readings phải đúng
    const checkAllReadingsAnswer = (userAnswers, correctReadings) => {
      if (!correctReadings || correctReadings.length === 0) return false;

      if (Array.isArray(correctReadings)) {
        const validCorrectReadings = correctReadings.filter(
          (r) => r.trim() !== ""
        );
        const validUserAnswers = userAnswers.filter((a) => a.trim() !== "");

        // Kiểm tra số lượng phải bằng nhau
        if (validCorrectReadings.length !== validUserAnswers.length)
          return false;

        // Kiểm tra từng đáp án của user có trong correctReadings không
        return validUserAnswers.every((userAnswer) =>
          validCorrectReadings.some(
            (correctReading) =>
              userAnswer.trim().toLowerCase() === correctReading.toLowerCase()
          )
        );
      } else {
        // Backward compatibility với string
        return (
          userAnswers.length === 1 &&
          userAnswers[0].trim().toLowerCase() === correctReadings.toLowerCase()
        );
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
    if (filteredKanjiData.length > 0) {
      const nextIndex =
        displayMode === "order" ? currentIndex + 1 : currentIndex;
      setCurrentIndex(nextIndex);
      selectKanji(filteredKanjiData, nextIndex);
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

  // Configuration screen
  if (showConfig) {
    const stats = {
      existing: kanjiData.filter((k) => !k.status || k.status === "existing")
        .length,
      updated: kanjiData.filter((k) => k.status === "updated").length,
      new: kanjiData.filter((k) => k.status === "new").length,
    };

    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h2>Cấu hình học chữ ngẫu nhiên</h2>

        {/* Display mode selection */}
        <div
          style={{
            marginBottom: "25px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#495057" }}>
            🔄 Cách các chữ xuất hiện:
          </h3>
          <div style={{ display: "flex", gap: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="displayMode"
                value="random"
                checked={displayMode === "random"}
                onChange={(e) => setDisplayMode(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              <span>Ngẫu nhiên</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="displayMode"
                value="order"
                checked={displayMode === "order"}
                onChange={(e) => setDisplayMode(e.target.value)}
                style={{ marginRight: "8px" }}
              />
              <span>Theo thứ tự</span>
            </label>
          </div>
        </div>

        {/* Kanji type selection */}
        <div
          style={{
            marginBottom: "25px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#495057" }}>
            📝 Các chữ kanji kiểm tra:
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={kanjiTypes.existing}
                onChange={() => handleKanjiTypeChange("existing")}
                style={{ marginRight: "10px" }}
              />
              <span>✅ Từ không đổi ({stats.existing} từ)</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={kanjiTypes.updated}
                onChange={() => handleKanjiTypeChange("updated")}
                style={{ marginRight: "10px" }}
              />
              <span>🔄 Từ mới cập nhật ({stats.updated} từ)</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={kanjiTypes.new}
                onChange={() => handleKanjiTypeChange("new")}
                style={{ marginRight: "10px" }}
              />
              <span>🆕 Từ mới ({stats.new} từ)</span>
            </label>
          </div>

          {/* Summary */}
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#e9ecef",
              borderRadius: "5px",
              fontSize: "14px",
            }}
          >
            <strong>Tổng số từ sẽ kiểm tra: </strong>
            {filterKanjiData().length} / {kanjiData.length} từ
          </div>
        </div>

        {/* Start button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={startQuiz}
            disabled={filterKanjiData().length === 0}
            style={{
              padding: "12px 30px",
              fontSize: "18px",
              backgroundColor:
                filterKanjiData().length === 0 ? "#6c757d" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                filterKanjiData().length === 0 ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            🚀 Bắt đầu kiểm tra
          </button>
          {filterKanjiData().length === 0 && (
            <p
              style={{ color: "#dc3545", marginTop: "10px", fontSize: "14px" }}
            >
              Vui lòng chọn ít nhất một loại kanji để kiểm tra
            </p>
          )}
        </div>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Học chữ ngẫu nhiên</h2>
        <button
          onClick={() => setShowConfig(true)}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ⚙️ Cấu hình
        </button>
      </div>

      <KanjiQuiz
        currentKanji={currentKanji}
        userAnswers={userAnswers}
        showResult={showResult}
        isCorrect={isCorrect}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onNext={getNextKanji}
      />

      {showResult && currentKanji.example && (
        <ExampleWords examples={currentKanji.example} />
      )}
    </div>
  );
}

export default RandomKanji;
