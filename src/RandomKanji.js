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
    learned: true,
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
  const [skipFields, setSkipFields] = useState({
    hanviet: false,
    kun: false,
    on: false,
  });
  const [romajiMode, setRomajiMode] = useState({
    kun: false,
    on: false,
  });
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState({
    hanviet: false,
    kun: false,
    on: false,
  });

  // Filter and prepare kanji data based on selected types
  const filterKanjiData = () => {
    const learnedKanjiList = getLearnedKanji();

    return kanjiData.filter((kanji) => {
      // Kiểm tra nếu kanji này thuộc loại "learned"
      const isLearned = learnedKanjiList.includes(kanji.kanji);

      // Nếu tick "learned" và kanji này đã học
      if (kanjiTypes.learned && isLearned) {
        return true;
      }

      // Kiểm tra các loại kanji thông thường (existing, updated, new)
      const status = kanji.status || "existing";
      if (kanjiTypes[status]) {
        // Chỉ include nếu kanji này KHÔNG thuộc "learned" (tránh trùng lặp)
        return !isLearned;
      }

      return false;
    });
  };

  // Lấy danh sách kanji đã học từ Daily Learning
  const getLearnedKanji = () => {
    const dailyProgress = JSON.parse(
      localStorage.getItem("dailyProgress") || "{}"
    );
    const learningPlan = JSON.parse(
      localStorage.getItem("dailyLearningPlan") || "[]"
    );
    const learnedKanji = [];

    // Duyệt qua tất cả các ngày đã hoàn thành
    Object.keys(dailyProgress).forEach((dayKey) => {
      const dayNumber = parseInt(dayKey.replace("day", ""));
      const dayPlan = learningPlan[dayNumber - 1];

      if (dayPlan && dayPlan.kanji) {
        const completedIndices = dailyProgress[dayKey] || [];
        // Nếu hoàn thành tất cả kanji trong ngày đó
        if (completedIndices.length === dayPlan.kanji.length) {
          dayPlan.kanji.forEach((kanji) => {
            if (!learnedKanji.includes(kanji.kanji)) {
              learnedKanji.push(kanji.kanji);
            }
          });
        }
      }
    });

    return learnedKanji;
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
    setSkipFields({ hanviet: false, kun: false, on: false });
    setRomajiMode({ kun: false, on: false });
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

  const handleSkipFieldChange = (field, isSkipped) => {
    setSkipFields((prev) => ({
      ...prev,
      [field]: isSkipped,
    }));
  };

  const handleRomajiModeChange = (field, isRomaji) => {
    setRomajiMode((prev) => ({
      ...prev,
      [field]: isRomaji,
    }));
  };

  // Hàm kiểm tra xem reading có tồn tại không
  const hasReading = (reading) => {
    if (!reading) return false;
    if (Array.isArray(reading)) {
      return reading.length > 0 && reading.some((r) => r.trim() !== "");
    }
    return reading.trim() !== "";
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentKanji) return;

    // Hàm kiểm tra đáp án với mảng readings - yêu cầu tất cả readings phải đúng
    const checkAllReadingsAnswer = (
      userAnswers,
      correctReadings,
      fieldType
    ) => {
      if (!correctReadings || correctReadings.length === 0) return false;

      const isRomajiMode = romajiMode[fieldType] || false;

      if (Array.isArray(correctReadings)) {
        const validCorrectReadings = correctReadings.filter(
          (r) => r.trim() !== ""
        );
        const validUserAnswers = userAnswers.filter((a) => a.trim() !== "");

        // Kiểm tra số lượng phải bằng nhau
        if (validCorrectReadings.length !== validUserAnswers.length)
          return false;

        // Kiểm tra từng đáp án của user có trong correctReadings không (hỗ trợ romaji)
        return validUserAnswers.every((userAnswer) =>
          validCorrectReadings.some((correctReading) =>
            isReadingMatch(userAnswer, correctReading, isRomajiMode)
          )
        );
      } else {
        // Backward compatibility với string (hỗ trợ romaji)
        return (
          userAnswers.length === 1 &&
          isReadingMatch(userAnswers[0], correctReadings, isRomajiMode)
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
      hanviet:
        skipFields.hanviet ||
        checkHanvietAnswer(userAnswers.hanviet, currentKanji.hanviet),
      kun:
        skipFields.kun ||
        (hasReading(currentKanji.kun)
          ? checkAllReadingsAnswer(userAnswers.kun, currentKanji.kun, "kun")
          : true),
      on:
        skipFields.on ||
        (hasReading(currentKanji.on)
          ? checkAllReadingsAnswer(userAnswers.on, currentKanji.on, "on")
          : true),
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
      learned: getLearnedKanji().length,
    };

    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h2>Bạn muốn kiểm tra theo cách nào</h2>

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
              <span>✅ Từ cũ ({stats.existing} từ)</span>
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

            {/* Divider */}
            <div
              style={{
                height: "1px",
                backgroundColor: "#dee2e6",
                margin: "8px 0",
              }}
            ></div>

            {/* Learned Kanji Filter */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={kanjiTypes.learned}
                onChange={() => handleKanjiTypeChange("learned")}
                style={{ marginRight: "10px" }}
              />
              <span>
                📚 Các từ đã học ({stats.learned} từ)-Nếu ko tick ô này thì đề
                sẽ gồm các chữ chưa học
              </span>
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
        skipFields={skipFields}
        romajiMode={romajiMode}
        showResult={showResult}
        isCorrect={isCorrect}
        onInputChange={handleInputChange}
        onSkipFieldChange={handleSkipFieldChange}
        onRomajiModeChange={handleRomajiModeChange}
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
