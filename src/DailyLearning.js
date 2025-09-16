import React, { useState, useEffect } from "react";

function DailyLearning({ kanjiData }) {
  const [wordsPerDay, setWordsPerDay] = useState(10);
  const [learningPlan, setLearningPlan] = useState([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [dailyProgress, setDailyProgress] = useState({});
  const [currentKanjiIndex, setCurrentKanjiIndex] = useState(0);
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
  const [isPlanSet, setIsPlanSet] = useState(false);

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

  // Load dữ liệu từ localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem("dailyLearningPlan");
    const savedProgress = localStorage.getItem("dailyProgress");
    const savedCurrentDay = localStorage.getItem("currentDay");
    const savedWordsPerDay = localStorage.getItem("wordsPerDay");

    if (savedPlan && savedProgress && savedCurrentDay && savedWordsPerDay) {
      setLearningPlan(JSON.parse(savedPlan));
      setDailyProgress(JSON.parse(savedProgress));
      setCurrentDay(parseInt(savedCurrentDay));
      setWordsPerDay(parseInt(savedWordsPerDay));
      setIsPlanSet(true);
    }
  }, []);

  // Tạo kế hoạch học
  const createLearningPlan = () => {
    if (kanjiData.length === 0) return;

    const totalDays = Math.ceil(kanjiData.length / wordsPerDay);
    const plan = [];

    for (let day = 1; day <= totalDays; day++) {
      const startIndex = (day - 1) * wordsPerDay;
      const endIndex = Math.min(day * wordsPerDay, kanjiData.length);
      plan.push({
        day: day,
        kanji: kanjiData.slice(startIndex, endIndex),
        completed: false,
      });
    }

    setLearningPlan(plan);
    setCurrentDay(1);
    setDailyProgress({});
    setIsPlanSet(true);

    // Lưu vào localStorage
    localStorage.setItem("dailyLearningPlan", JSON.stringify(plan));
    localStorage.setItem("dailyProgress", JSON.stringify({}));
    localStorage.setItem("currentDay", "1");
    localStorage.setItem("wordsPerDay", wordsPerDay.toString());
  };

  // Reset kế hoạch
  const resetPlan = () => {
    setIsPlanSet(false);
    setLearningPlan([]);
    setCurrentDay(1);
    setDailyProgress({});
    setCurrentKanjiIndex(0);
    setShowResult(false);
    localStorage.removeItem("dailyLearningPlan");
    localStorage.removeItem("dailyProgress");
    localStorage.removeItem("currentDay");
    localStorage.removeItem("wordsPerDay");
  };

  // Lấy kanji hiện tại
  const getCurrentKanji = () => {
    if (!learningPlan[currentDay - 1]) return null;
    return learningPlan[currentDay - 1].kanji[currentKanjiIndex];
  };

  // Xử lý submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const currentKanji = getCurrentKanji();
    if (!currentKanji) return;

    // Hàm kiểm tra đáp án với mảng readings
    const checkReadingAnswer = (userAnswer, correctReadings) => {
      if (!correctReadings || correctReadings.length === 0) return false;
      if (Array.isArray(correctReadings)) {
        // Nếu correctReadings là mảng, kiểm tra xem userAnswer có match với bất kỳ phần tử nào không
        return correctReadings.some(
          (reading) => userAnswer.trim().toLowerCase() === reading.toLowerCase()
        );
      } else {
        // Nếu correctReadings là string (backward compatibility)
        return (
          userAnswer.trim().toLowerCase() === correctReadings.toLowerCase()
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
      kun: checkReadingAnswer(userAnswers.kun, currentKanji.kun),
      on: checkReadingAnswer(userAnswers.on, currentKanji.on),
    };

    const allCorrect = results.hanviet && results.kun && results.on;
    setIsCorrect(results);
    setShowResult(true);

    if (allCorrect) {
      // Cập nhật progress
      const newProgress = { ...dailyProgress };
      const dayKey = `day${currentDay}`;
      if (!newProgress[dayKey]) {
        newProgress[dayKey] = [];
      }
      if (!newProgress[dayKey].includes(currentKanjiIndex)) {
        newProgress[dayKey].push(currentKanjiIndex);
      }
      setDailyProgress(newProgress);
      localStorage.setItem("dailyProgress", JSON.stringify(newProgress));

      // Kiểm tra xem đã hoàn thành ngày chưa
      const todayKanji = learningPlan[currentDay - 1].kanji;
      if (newProgress[dayKey].length === todayKanji.length) {
        alert(`Chúc mừng! Bạn đã hoàn thành ngày ${currentDay}!`);
        // Chuyển sang ngày tiếp theo nếu có
        if (currentDay < learningPlan.length) {
          setCurrentDay(currentDay + 1);
          setCurrentKanjiIndex(0);
          localStorage.setItem("currentDay", (currentDay + 1).toString());
        }
      }
    }
  };

  // Chuyển sang kanji tiếp theo
  const nextKanji = () => {
    const todayKanji = learningPlan[currentDay - 1]?.kanji || [];
    if (currentKanjiIndex < todayKanji.length - 1) {
      setCurrentKanjiIndex(currentKanjiIndex + 1);
    } else {
      setCurrentKanjiIndex(0);
    }
    setUserAnswers({ hanviet: "", kun: "", on: "" });
    setShowResult(false);
    setIsCorrect({ hanviet: false, kun: false, on: false });
  };

  // Thay đổi input
  const handleInputChange = (field, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (kanjiData.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Học chữ theo ngày</h2>
        <p>Vui lòng tải file Excel để bắt đầu!</p>
      </div>
    );
  }

  if (!isPlanSet) {
    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h2>Học chữ theo ngày</h2>
        <div style={{ marginBottom: "20px" }}>
          <p>Tổng số chữ kanji: {kanjiData.length}</p>
          <label style={{ display: "block", marginBottom: "10px" }}>
            Số từ học mỗi ngày:
            <input
              type="number"
              value={wordsPerDay}
              onChange={(e) => setWordsPerDay(parseInt(e.target.value) || 1)}
              min="1"
              max={kanjiData.length}
              style={{
                marginLeft: "10px",
                padding: "5px",
                fontSize: "16px",
                width: "80px",
              }}
            />
          </label>
          <p>
            Số ngày cần học: {Math.ceil(kanjiData.length / wordsPerDay)} ngày
          </p>
          <button
            onClick={createLearningPlan}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Bắt đầu kế hoạch học
          </button>
        </div>
      </div>
    );
  }

  const currentKanji = getCurrentKanji();
  const todayKanji = learningPlan[currentDay - 1]?.kanji || [];
  const todayProgress = dailyProgress[`day${currentDay}`] || [];
  const completedToday = todayProgress.length;

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        gap: "20px",
        minHeight: "100vh",
        justifyContent: "space-evenly",
      }}
    >
      {/* Main content area */}
      <div style={{ flex: "1", paddingRight: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2>Học chữ theo ngày</h2>
          <button
            onClick={resetPlan}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Reset kế hoạch
          </button>
        </div>

        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          <h3>
            Ngày {currentDay} / {learningPlan.length}
          </h3>
          <p>
            Tiến độ hôm nay: {completedToday} / {todayKanji.length} từ
          </p>
          <div
            style={{
              width: "100%",
              backgroundColor: "#e9ecef",
              borderRadius: "10px",
              height: "20px",
            }}
          >
            <div
              style={{
                width: `${(completedToday / todayKanji.length) * 100}%`,
                backgroundColor: "#28a745",
                borderRadius: "10px",
                height: "100%",
              }}
            ></div>
          </div>
        </div>

        {currentKanji && (
          <>
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
              {currentKanji.kanji}
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
                  onClick={nextKanji}
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
                  Từ tiếp theo
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
                  {currentKanji.example && currentKanji.example.length > 0 ? (
                    currentKanji.example.filter(Boolean).map((example, idx) => {
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
                    })
                  ) : (
                    <p>Không có từ ví dụ nào.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Sidebar - Progress Grid */}
      <div
        style={{
          flexShrink: 0,
          position: "sticky",
          top: "20px",
          height: "fit-content",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "15px",
            borderRadius: "5px",
            border: "1px solid #dee2e6",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ marginBottom: "15px", marginTop: "0" }}>
            Tiến độ học tập:
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "8px",
            }}
          >
            {learningPlan.map((day, index) => {
              const dayNumber = index + 1;
              const dayProgress = dailyProgress[`day${dayNumber}`] || [];
              const isCompleted = dayProgress.length === day.kanji.length;
              const isCurrent = dayNumber === currentDay;

              return (
                <div
                  key={dayNumber}
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    backgroundColor: isCompleted
                      ? "#28a745"
                      : isCurrent
                      ? "#ffc107"
                      : "#E7E4E4",
                    color: "black",
                    border: isCurrent ? "3px solid #007bff" : "none",
                    transition: "all 0.2s ease",
                  }}
                  title={`Ngày ${dayNumber}: ${dayProgress.length}/${day.kanji.length} từ`}
                >
                  {dayNumber}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "15px", fontSize: "11px", color: "#666" }}>
            <div style={{ marginBottom: "3px" }}>
              <span style={{ color: "#28a745" }}>■</span> Hoàn thành
            </div>
            <div style={{ marginBottom: "3px" }}>
              <span style={{ color: "#ffc107" }}>■</span> Đang học
            </div>
            <div>
              <span style={{ color: "#E7E4E4" }}>■</span> Chưa học
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyLearning;
