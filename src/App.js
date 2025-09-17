import logo from "./logo.svg";
import "./App.css";

import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import KanjiList from "./KanjiList";
import RandomKanji from "./RandomKanji";
import DailyLearning from "./DailyLearning";

function App() {
  const fileInputRef = useRef();
  const [kanjiData, setKanjiData] = useState([]);

  // Lấy dữ liệu từ localStorage khi khởi động app
  useEffect(() => {
    const stored = localStorage.getItem("kanjiData");
    if (stored) {
      setKanjiData(JSON.parse(stored));
    }
  }, []);

  // Helper functions for kanji comparison
  const arraysEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return a === b;

    // Lọc bỏ các phần tử rỗng
    const filterValid = (arr) =>
      arr.filter((item) => item && item.trim() !== "");

    const validA = filterValid(a);
    const validB = filterValid(b);

    if (validA.length !== validB.length) return false;
    return validA.every((val, index) => val === validB[index]);
  };

  const examplesEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;

    // Lọc bỏ các example rỗng hoặc null
    const filterValidExamples = (examples) => {
      return examples.filter(
        (example) => example && example.text && example.text.trim() !== ""
      );
    };

    const validA = filterValidExamples(a);
    const validB = filterValidExamples(b);

    if (validA.length !== validB.length) return false;

    return validA.every((example, index) => {
      const otherExample = validB[index];
      return (
        example.text === otherExample.text &&
        example.phonetic === otherExample.phonetic
      );
    });
  };

  const compareKanji = (oldKanji, newKanji) => {
    if (!oldKanji) return "new";

    // So sánh các thuộc tính
    const hanvietChanged = !arraysEqual(oldKanji.hanviet, newKanji.hanviet);
    const kunChanged = !arraysEqual(oldKanji.kun, newKanji.kun);
    const onChanged = !arraysEqual(oldKanji.on, newKanji.on);
    const exampleChanged = !examplesEqual(oldKanji.example, newKanji.example);

    // Debug logging - chỉ log khi có thay đổi
    if (hanvietChanged || kunChanged || onChanged || exampleChanged) {
      console.log(`Kanji ${newKanji.kanji} có thay đổi:`, {
        hanviet: hanvietChanged
          ? { old: oldKanji.hanviet, new: newKanji.hanviet }
          : "không đổi",
        kun: kunChanged
          ? { old: oldKanji.kun, new: newKanji.kun }
          : "không đổi",
        on: onChanged ? { old: oldKanji.on, new: newKanji.on } : "không đổi",
        example: exampleChanged
          ? {
              oldCount: oldKanji.example?.length,
              newCount: newKanji.example?.length,
              oldValid: oldKanji.example?.filter(
                (e) => e && e.text && e.text.trim() !== ""
              ).length,
              newValid: newKanji.example?.filter(
                (e) => e && e.text && e.text.trim() !== ""
              ).length,
            }
          : "không đổi",
      });
    }

    if (hanvietChanged || kunChanged || onChanged || exampleChanged) {
      return "updated";
    }
    return "existing";
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellStyles: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Lấy dữ liệu cũ từ localStorage để so sánh
        const oldKanjiData = JSON.parse(
          localStorage.getItem("kanjiData") || "[]"
        );
        const oldKanjiMap = {};
        oldKanjiData.forEach((item) => {
          oldKanjiMap[item.kanji] = item;
        });

        // Đọc với raw data để lấy phonetic
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        const result = [];

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const row = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
            const cell = worksheet[cellAddress];
            if (cell) {
              // Lấy phonetic text nếu có và extract chỉ nội dung hiragana
              let phoneticText = null;
              if (cell.r) {
                if (typeof cell.r === "string") {
                  // Extract nội dung trong <rPh><t>...</t></rPh> - hỗ trợ xml:space="preserve"
                  const rPhMatch = cell.r.match(
                    /<rPh[^>]*><t[^>]*>([^<]+)<\/t><\/rPh>/
                  );
                  if (rPhMatch) {
                    // Trim khoảng trắng thừa nhưng giữ khoảng trắng giữa các ký tự
                    phoneticText = rPhMatch[1].trim().replace(/\s+/g, "");
                  }
                } else if (Array.isArray(cell.r)) {
                  // Nếu cell.r là array, tìm trong các phần tử
                  for (let i = 0; i < cell.r.length; i++) {
                    const element = cell.r[i];
                    if (element && element.rPh && element.rPh.t) {
                      phoneticText = element.rPh.t;
                      break;
                    }
                  }
                } else if (typeof cell.r === "object") {
                  // Nếu cell.r là object, kiểm tra cấu trúc
                  if (cell.r.rPh && cell.r.rPh.t) {
                    phoneticText = cell.r.rPh.t;
                  }
                }
              }
              row[C] = {
                text: cell.v || "",
                phonetic: phoneticText,
              };
            } else {
              row[C] = { text: "", phonetic: null };
            }
          }

          if (row.length >= 6) {
            // Kiểm tra nếu có kanji (cột A không trống)
            const kanjiText = row[0].text ? String(row[0].text).trim() : "";
            if (kanjiText !== "") {
              // Nếu có kanji trước đó chưa được kiểm tra status cuối cùng, kiểm tra bây giờ
              if (result.length > 0) {
                const lastKanji = result[result.length - 1];
                if (lastKanji.needsStatusCheck) {
                  const oldKanji = oldKanjiMap[lastKanji.kanji];
                  lastKanji.status = compareKanji(oldKanji, lastKanji);
                  delete lastKanji.needsStatusCheck;
                }
              }

              // Xử lý hanviet reading (cột B) - tách bằng dấu phẩy nếu có
              const hanvietText = row[1].text || "";
              const hanvietReadings =
                hanvietText.includes("、") || hanvietText.includes(",")
                  ? hanvietText
                      .split(/[、,]/)
                      .map((reading) => reading.trim())
                      .filter((reading) => reading !== "")
                  : hanvietText.trim() !== ""
                  ? [hanvietText.trim()]
                  : [];

              // Xử lý kun reading (cột C) - tách bằng dấu phẩy nếu có
              const kunText = row[2].text || "";
              const kunReadings =
                kunText.includes("、") || kunText.includes(",")
                  ? kunText
                      .split(/[、,]/)
                      .map((reading) => reading.trim())
                      .filter((reading) => reading !== "")
                  : kunText.trim() !== ""
                  ? [kunText.trim()]
                  : [];

              // Xử lý on reading (cột D) - tách bằng dấu phẩy nếu có
              const onText = row[3].text || "";
              const onReadings =
                onText.includes("、") || onText.includes(",")
                  ? onText
                      .split(/[、,]/)
                      .map((reading) => reading.trim())
                      .filter((reading) => reading !== "")
                  : onText.trim() !== ""
                  ? [onText.trim()]
                  : [];

              const newKanjiItem = {
                kanji: kanjiText,
                hanviet: hanvietReadings,
                kun: kunReadings,
                on: onReadings,
                example: [
                  {
                    text: row[4].text || "",
                    phonetic: row[4].phonetic,
                  },
                  {
                    text: row[5].text || "",
                    phonetic: row[5].phonetic,
                  },
                ],
                needsStatusCheck: true, // Đánh dấu cần kiểm tra status sau khi thêm tất cả examples
              };

              result.push(newKanjiItem);
            } else {
              // Nếu không có kanji, thêm example vào kanji trước đó
              if (result.length > 0 && (row[4].text || row[5].text)) {
                const lastKanji = result[result.length - 1];
                if (row[4].text) {
                  lastKanji.example.push({
                    text: row[4].text || "",
                    phonetic: row[4].phonetic,
                  });
                }
                if (row[5].text) {
                  lastKanji.example.push({
                    text: row[5].text || "",
                    phonetic: row[5].phonetic,
                  });
                }
              }
            }
          }
        }

        // Kiểm tra status cho kanji cuối cùng
        if (result.length > 0) {
          const lastKanji = result[result.length - 1];
          if (lastKanji.needsStatusCheck) {
            const oldKanji = oldKanjiMap[lastKanji.kanji];
            lastKanji.status = compareKanji(oldKanji, lastKanji);
            delete lastKanji.needsStatusCheck;
          }
        }

        // Thống kê
        const stats = {
          new: result.filter((item) => item.status === "new").length,
          updated: result.filter((item) => item.status === "updated").length,
          existing: result.filter((item) => item.status === "existing").length,
          total: result.length,
        };

        setKanjiData(result);
        localStorage.setItem("kanjiData", JSON.stringify(result));

        // Hiển thị thống kê chi tiết
        alert(
          `Đã đọc ${stats.total} dòng dữ liệu từ file Excel!\n\n` +
            `📊 Thống kê:\n` +
            `🆕 Kanji mới: ${stats.new}\n` +
            `🔄 Kanji cập nhật: ${stats.updated}\n` +
            `✅ Kanji không đổi: ${stats.existing}`
        );
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <div className="App">
              <header className="App-header">
                <div style={{ marginTop: "20px" }}>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <button onClick={() => fileInputRef.current.click()}>
                    Upload Excel
                  </button>
                </div>
              </header>
            </div>
          }
        />
        <Route
          path="/kanji-list"
          element={<KanjiList kanjiData={kanjiData} />}
        />
        <Route
          path="/random-kanji"
          element={<RandomKanji kanjiData={kanjiData} />}
        />
        <Route
          path="/daily-learning"
          element={<DailyLearning kanjiData={kanjiData} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
