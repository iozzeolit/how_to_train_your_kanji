import React, { useState, useEffect } from "react";
import ExampleWords from "./components/ExampleWords";
import KanjiQuiz from "./components/KanjiQuiz";

function DailyLearning({ kanjiData }) {
  const [wordsPerDay, setWordsPerDay] = useState(10);
  const [learningPlan, setLearningPlan] = useState([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [dailyProgress, setDailyProgress] = useState({});
  const [currentKanjiIndex, setCurrentKanjiIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({
    hanviet: "",
    kun: [],
    on: [],
  });
  const [skipFields, setSkipFields] = useState(() => {
    const saved = localStorage.getItem("kanjiQuiz_skipFields");
    return saved
      ? JSON.parse(saved)
      : {
          hanviet: false,
          kun: false,
          on: false,
        };
  });
  const [romajiMode, setRomajiMode] = useState(() => {
    const saved = localStorage.getItem("kanjiQuiz_romajiMode");
    return saved
      ? JSON.parse(saved)
      : {
          kun: false,
          on: false,
        };
  });
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState({
    hanviet: false,
    kun: false,
    on: false,
  });
  const [isPlanSet, setIsPlanSet] = useState(false);
  const [showStudyMode, setShowStudyMode] = useState(false);
  const [hideCompletedWords, setHideCompletedWords] = useState(() => {
    const saved = localStorage.getItem("dailyLearning_hideCompleted");
    return saved ? JSON.parse(saved) : false;
  });
  const [recentlyUpdatedDays, setRecentlyUpdatedDays] = useState(new Set());

  // Save skipFields and romajiMode to localStorage when they change
  useEffect(() => {
    localStorage.setItem("kanjiQuiz_skipFields", JSON.stringify(skipFields));
  }, [skipFields]);

  useEffect(() => {
    localStorage.setItem("kanjiQuiz_romajiMode", JSON.stringify(romajiMode));
  }, [romajiMode]);

  useEffect(() => {
    localStorage.setItem(
      "dailyLearning_hideCompleted",
      JSON.stringify(hideCompletedWords)
    );
    // Reset currentKanjiIndex when toggling filter to avoid index out of bounds
    setCurrentKanjiIndex(0);
    setShowResult(false);
  }, [hideCompletedWords]);

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

  // Theo dõi thay đổi trong kanjiData và cập nhật kế hoạch học
  useEffect(() => {
    if (kanjiData.length === 0 || !isPlanSet) return;

    const savedPlan = localStorage.getItem("dailyLearningPlan");
    if (!savedPlan) return;

    const currentPlan = JSON.parse(savedPlan);
    const allExistingKanji = currentPlan.flatMap((day) => day.kanji);

    // Tìm các từ mới (không có trong kế hoạch hiện tại)
    const newKanji = kanjiData.filter(
      (newKanji) =>
        !allExistingKanji.some(
          (existingKanji) => existingKanji.kanji === newKanji.kanji
        )
    );

    // Tìm các từ đã được cập nhật
    const updatedDays = new Set();
    currentPlan.forEach((day, dayIndex) => {
      day.kanji.forEach((existingKanji, kanjiIndex) => {
        const updatedKanji = kanjiData.find(
          (k) => k.kanji === existingKanji.kanji
        );
        if (
          updatedKanji &&
          JSON.stringify(updatedKanji) !== JSON.stringify(existingKanji)
        ) {
          // Cập nhật từ kanji trong kế hoạch
          currentPlan[dayIndex].kanji[kanjiIndex] = updatedKanji;
          updatedDays.add(dayIndex + 1);
        }
      });
    });

    // Xử lý từ mới
    if (newKanji.length > 0) {
      let updatedPlan = [...currentPlan];
      let remainingNewKanji = [...newKanji];

      while (remainingNewKanji.length > 0) {
        const lastDay = updatedPlan[updatedPlan.length - 1];
        const availableSlots = wordsPerDay - lastDay.kanji.length;

        if (availableSlots > 0) {
          // Thêm từ mới vào ngày cuối cùng
          const kanjiToAdd = remainingNewKanji.splice(0, availableSlots);
          lastDay.kanji.push(...kanjiToAdd);
          updatedDays.add(updatedPlan.length);
        } else {
          // Tạo ngày mới
          const kanjiToAdd = remainingNewKanji.splice(0, wordsPerDay);
          updatedPlan.push({
            day: updatedPlan.length + 1,
            kanji: kanjiToAdd,
            completed: false,
          });
          updatedDays.add(updatedPlan.length);
        }
      }

      setLearningPlan(updatedPlan);
      localStorage.setItem("dailyLearningPlan", JSON.stringify(updatedPlan));
    } else if (updatedDays.size > 0) {
      // Chỉ cập nhật nếu có thay đổi
      setLearningPlan(currentPlan);
      localStorage.setItem("dailyLearningPlan", JSON.stringify(currentPlan));
    }

    // Hiển thị thông báo về các ngày được cập nhật
    if (updatedDays.size > 0) {
      const daysList = Array.from(updatedDays)
        .sort((a, b) => a - b)
        .join(", ");
      const message =
        newKanji.length > 0
          ? `Đã thêm ${newKanji.length} từ mới và cập nhật các ngày: ${daysList}`
          : `Đã cập nhật các từ kanji trong các ngày: ${daysList}`;

      // Đánh dấu các ngày được cập nhật
      setRecentlyUpdatedDays(new Set(updatedDays));

      // Xóa đánh dấu sau 5 giây
      setTimeout(() => {
        setRecentlyUpdatedDays(new Set());
      }, 5000);
    }
  }, [kanjiData, isPlanSet, wordsPerDay]);

  // Initialize userAnswers when current kanji changes
  useEffect(() => {
    const currentKanji = getCurrentKanji();
    if (currentKanji) {
      const kunCount = Array.isArray(currentKanji.kun)
        ? currentKanji.kun.filter((r) => r.trim() !== "").length
        : currentKanji.kun && currentKanji.kun.trim() !== ""
        ? 1
        : 0;
      const onCount = Array.isArray(currentKanji.on)
        ? currentKanji.on.filter((r) => r.trim() !== "").length
        : currentKanji.on && currentKanji.on.trim() !== ""
        ? 1
        : 0;

      setUserAnswers({
        hanviet: "",
        kun: new Array(kunCount).fill(""),
        on: new Array(onCount).fill(""),
      });
      setShowResult(false);
      setIsCorrect({ hanviet: false, kun: false, on: false });
    }
  }, [currentKanjiIndex, currentDay, learningPlan]);

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
    const filteredKanji = getFilteredTodayKanji();
    const current = filteredKanji[currentKanjiIndex];
    return current ? current.kanji : null;
  };

  // Lấy danh sách kanji đã lọc theo checkbox
  const getFilteredTodayKanji = () => {
    if (!learningPlan[currentDay - 1]) return [];
    const todayKanji = learningPlan[currentDay - 1].kanji;
    const todayProgress = dailyProgress[`day${currentDay}`] || [];

    if (!hideCompletedWords) {
      return todayKanji.map((kanji, index) => ({
        kanji,
        originalIndex: index,
      }));
    }

    return todayKanji
      .map((kanji, index) => ({ kanji, originalIndex: index }))
      .filter(({ originalIndex }) => !todayProgress.includes(originalIndex));
  };

  // Lấy original index của kanji hiện tại
  const getCurrentOriginalIndex = () => {
    const filteredKanji = getFilteredTodayKanji();
    const current = filteredKanji[currentKanjiIndex];
    return current ? current.originalIndex : currentKanjiIndex;
  };

  // Xử lý submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const currentKanji = getCurrentKanji();
    if (!currentKanji) return;

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

    const allCorrect = results.hanviet && results.kun && results.on;
    setIsCorrect(results);
    setShowResult(true);

    if (allCorrect) {
      // Cập nhật progress với original index
      const originalIndex = getCurrentOriginalIndex();
      const newProgress = { ...dailyProgress };
      const dayKey = `day${currentDay}`;
      if (!newProgress[dayKey]) {
        newProgress[dayKey] = [];
      }
      if (!newProgress[dayKey].includes(originalIndex)) {
        newProgress[dayKey].push(originalIndex);
      }
      setDailyProgress(newProgress);
      localStorage.setItem("dailyProgress", JSON.stringify(newProgress));

      // Kiểm tra xem đã hoàn thành ngày chưa
      const todayKanji = learningPlan[currentDay - 1].kanji;
      if (newProgress[dayKey].length === todayKanji.length) {
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
    const filteredKanji = getFilteredTodayKanji();
    if (filteredKanji.length === 0) return;

    if (currentKanjiIndex < filteredKanji.length - 1) {
      setCurrentKanjiIndex(currentKanjiIndex + 1);
    } else {
      setCurrentKanjiIndex(0);
    }

    // Khởi tạo userAnswers dựa trên kanji hiện tại
    const nextIndex =
      currentKanjiIndex < filteredKanji.length - 1 ? currentKanjiIndex + 1 : 0;
    const currentKanji = filteredKanji[nextIndex]?.kanji;
    if (currentKanji) {
      const kunCount = Array.isArray(currentKanji.kun)
        ? currentKanji.kun.filter((r) => r.trim() !== "").length
        : currentKanji.kun && currentKanji.kun.trim() !== ""
        ? 1
        : 0;
      const onCount = Array.isArray(currentKanji.on)
        ? currentKanji.on.filter((r) => r.trim() !== "").length
        : currentKanji.on && currentKanji.on.trim() !== ""
        ? 1
        : 0;

      setUserAnswers({
        hanviet: "",
        kun: new Array(kunCount).fill(""),
        on: new Array(onCount).fill(""),
      });
    } else {
      setUserAnswers({ hanviet: "", kun: [], on: [] });
    }

    // Keep skipFields and romajiMode unchanged to preserve user preferences
    setShowResult(false);
    setIsCorrect({ hanviet: false, kun: false, on: false });
  };

  // Quay lại kanji trước đó
  const handlePreviousKanji = () => {
    const filteredKanji = getFilteredTodayKanji();
    if (filteredKanji.length === 0) return;

    let newIndex;
    if (currentKanjiIndex > 0) {
      newIndex = currentKanjiIndex - 1;
    } else {
      newIndex = filteredKanji.length - 1; // Quay về kanji cuối cùng
    }

    setCurrentKanjiIndex(newIndex);

    // Khởi tạo userAnswers dựa trên kanji trước đó
    const previousKanji = filteredKanji[newIndex]?.kanji;
    if (previousKanji) {
      const kunCount = Array.isArray(previousKanji.kun)
        ? previousKanji.kun.filter((r) => r.trim() !== "").length
        : previousKanji.kun && previousKanji.kun.trim() !== ""
        ? 1
        : 0;
      const onCount = Array.isArray(previousKanji.on)
        ? previousKanji.on.filter((r) => r.trim() !== "").length
        : previousKanji.on && previousKanji.on.trim() !== ""
        ? 1
        : 0;

      setUserAnswers({
        hanviet: "",
        kun: new Array(kunCount).fill(""),
        on: new Array(onCount).fill(""),
      });
    }

    // Keep skipFields and romajiMode unchanged to preserve user preferences
    setShowResult(false);
    setIsCorrect({ hanviet: false, kun: false, on: false });
  };

  // Chuyển đến ngày cụ thể
  const goToDay = (dayNumber) => {
    if (dayNumber >= 1 && dayNumber <= learningPlan.length) {
      setCurrentDay(dayNumber);
      setCurrentKanjiIndex(0);
      setShowResult(false);
      setShowStudyMode(false); // Default to quiz mode when switching days

      // Reset user answers for the first kanji of the new day
      const newDayKanji = learningPlan[dayNumber - 1]?.kanji || [];
      if (newDayKanji.length > 0) {
        const firstKanji = newDayKanji[0];
        const kunCount = Array.isArray(firstKanji.kun)
          ? firstKanji.kun.filter((r) => r.trim() !== "").length
          : firstKanji.kun && firstKanji.kun.trim() !== ""
          ? 1
          : 0;
        const onCount = Array.isArray(firstKanji.on)
          ? firstKanji.on.filter((r) => r.trim() !== "").length
          : firstKanji.on && firstKanji.on.trim() !== ""
          ? 1
          : 0;

        setUserAnswers({
          hanviet: "",
          kun: new Array(kunCount).fill(""),
          on: new Array(onCount).fill(""),
        });
      }

      setIsCorrect({ hanviet: false, kun: false, on: false });

      // Save to localStorage
      localStorage.setItem("currentDay", dayNumber.toString());
    }
  };

  // Thay đổi input
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h3 style={{ margin: 0 }}>
              Ngày {currentDay} / {learningPlan.length}
            </h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowStudyMode(true)}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: showStudyMode ? "#007bff" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Học
              </button>
              <button
                onClick={() => setShowStudyMode(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: !showStudyMode ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Bắt đầu kiểm tra
              </button>
            </div>
          </div>
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

          {/* Checkbox Ẩn từ đã hoàn thành */}
          <div style={{ marginTop: "15px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "14px",
                cursor: "pointer",
                color: "#6c757d",
              }}
            >
              <input
                type="checkbox"
                checked={hideCompletedWords}
                onChange={(e) => setHideCompletedWords(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Ẩn từ đã hoàn thành
            </label>
          </div>
        </div>

        {/* Chi tiết học tập cho ngày hiện tại */}
        {showStudyMode && (
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "5px",
              marginBottom: "20px",
              border: "1px solid #dee2e6",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: 0, color: "#495057" }}>
                Chi tiết học tập - Ngày {currentDay} (
                {hideCompletedWords
                  ? todayKanji.filter(
                      (_, index) => !todayProgress.includes(index)
                    ).length
                  : todayKanji.length}{" "}
                / {todayKanji.length} từ)
              </h4>
            </div>
            <div style={{ display: "grid", gap: "15px" }}>
              {todayKanji
                .map((kanji, index) => ({ kanji, index }))
                .filter(({ index }) => {
                  const isCompleted = todayProgress.includes(index);
                  return hideCompletedWords ? !isCompleted : true;
                })
                .map(({ kanji, index }) => {
                  const isCompleted = todayProgress.includes(index);
                  return (
                    <div
                      key={index}
                      style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        padding: "15px",
                        backgroundColor: isCompleted ? "#e8f5e8" : "#f9f9f9",
                        borderLeft: `4px solid ${
                          isCompleted ? "#28a745" : "#6c757d"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "70px",
                            fontWeight: "bold",
                            minWidth: "50px",
                            textAlign: "center",
                            margin: "0px 5px",
                            position: "relative",
                          }}
                        >
                          {kanji.kanji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ marginBottom: "5px", fontSize: "24px" }}
                          >
                            <strong>Hán Việt:</strong>{" "}
                            {Array.isArray(kanji.hanviet)
                              ? kanji.hanviet.join("、")
                              : kanji.hanviet}
                          </div>
                          {hasReading(kanji.kun) && (
                            <div
                              style={{ marginBottom: "5px", fontSize: "24px" }}
                            >
                              <strong>Âm Kun:</strong>{" "}
                              {Array.isArray(kanji.kun)
                                ? kanji.kun.join("、")
                                : kanji.kun}
                            </div>
                          )}
                          {hasReading(kanji.on) && (
                            <div
                              style={{ marginBottom: "5px", fontSize: "24px" }}
                            >
                              <strong>Âm On:</strong>{" "}
                              {Array.isArray(kanji.on)
                                ? kanji.on.join("、")
                                : kanji.on}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "center", minWidth: "80px" }}>
                          {isCompleted ? (
                            <span
                              style={{ color: "#28a745", fontSize: "18px" }}
                            >
                              ✓ Hoàn thành
                            </span>
                          ) : (
                            <span
                              style={{ color: "#6c757d", fontSize: "14px" }}
                            >
                              Chưa học
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Từ ví dụ */}
                      {kanji.example && kanji.example.length > 0 && (
                        <div
                          style={{
                            borderTop: "1px solid #e0e0e0",
                            paddingTop: "0px",
                            marginTop: "10px",
                          }}
                        >
                          <ExampleWords
                            examples={kanji.example}
                            title="Từ ví dụ"
                            fontSize="36px"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Thông báo khi đang ở chế độ học */}
        {showStudyMode && (
          <div
            style={{
              backgroundColor: "#e7f3ff",
              padding: "15px",
              borderRadius: "5px",
              marginBottom: "20px",
              border: "1px solid #b3d9ff",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "#0066cc", fontWeight: "500" }}>
              📚 Bạn đang ở chế độ học. Hãy ôn tập thông tin các từ kanji ở
              trên, sau đó nhấn <strong>"Bắt đầu kiểm tra"</strong> để bắt đầu
              làm bài.
            </p>
          </div>
        )}

        {currentKanji && !showStudyMode && (
          <>
            {/* Thông báo khi đang ở chế độ kiểm tra */}
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "10px 15px",
                borderRadius: "5px",
                marginBottom: "15px",
                border: "1px solid #ffeaa7",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#856404", fontSize: "14px" }}>
                ✏️ <strong>Chế độ kiểm tra</strong> - Từ {currentKanjiIndex + 1}
                /{getFilteredTodayKanji().length}
                {hideCompletedWords && " (Chỉ từ chưa hoàn thành)"}
                {!hideCompletedWords &&
                  todayProgress.includes(getCurrentOriginalIndex()) &&
                  " (Đã hoàn thành)"}
              </p>
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
              onNext={nextKanji}
              onPrevious={handlePreviousKanji}
              nextButtonText="Từ tiếp theo"
              additionalInfo={null}
            />

            {showResult && currentKanji.example && (
              <ExampleWords examples={currentKanji.example} fontSize="36px" />
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
              const isRecentlyUpdated = recentlyUpdatedDays.has(dayNumber);

              return (
                <div
                  key={dayNumber}
                  onClick={() => goToDay(dayNumber)}
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
                    position: "relative",
                  }}
                  title={`Ngày ${dayNumber}: ${dayProgress.length}/${
                    day.kanji.length
                  } từ${
                    isRecentlyUpdated ? " - Vừa được cập nhật!" : ""
                  } - Click để chuyển đến ngày này`}
                >
                  {dayNumber}
                  {isRecentlyUpdated && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-2px",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#ff6b6b",
                        borderRadius: "50%",
                        zIndex: 10,
                      }}
                    />
                  )}
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
            <div style={{ marginBottom: "3px" }}>
              <span style={{ color: "#E7E4E4" }}>■</span> Chưa học
            </div>
            <div>
              <span style={{ color: "#ff6b6b" }}>●</span> Vừa cập nhật
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyLearning;
