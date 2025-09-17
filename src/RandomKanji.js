import React, { useState, useEffect } from "react";
import ExampleWords from "./components/ExampleWords";
import KanjiQuiz from "./components/KanjiQuiz";

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

  // Chọn kanji ngẫu nhiên khi component load hoặc khi data thay đổi
  useEffect(() => {
    if (kanjiData.length > 0) {
      const randomIndex = Math.floor(Math.random() * kanjiData.length);
      const selectedKanji = kanjiData[randomIndex];
      setCurrentKanji(selectedKanji);
      setShowResult(false);

      // Khởi tạo userAnswers dựa trên số lượng readings
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
    if (kanjiData.length > 0) {
      const randomIndex = Math.floor(Math.random() * kanjiData.length);
      const selectedKanji = kanjiData[randomIndex];
      setCurrentKanji(selectedKanji);
      setShowResult(false);

      // Khởi tạo userAnswers dựa trên số lượng readings
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
