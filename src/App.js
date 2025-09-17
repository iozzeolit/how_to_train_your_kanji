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
  const [importMode, setImportMode] = useState("merge"); // 'merge' hoặc 'replace'

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

    if (hanvietChanged || kunChanged || onChanged || exampleChanged) {
      return "updated";
    }
    return "existing";
  };

  const processExcelFile = (data, fileName = "Excel file") => {
    const workbook = XLSX.read(data, { type: "array", cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Lấy dữ liệu cũ từ localStorage để so sánh (chỉ khi merge mode)
    const oldKanjiData =
      importMode === "merge"
        ? JSON.parse(localStorage.getItem("kanjiData") || "[]")
        : [];
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

    // Xử lý dữ liệu theo chế độ import
    let finalData;
    if (importMode === "merge") {
      // Merge mode: Kết hợp dữ liệu cũ và mới
      const newKanjiMap = {};
      result.forEach((item) => {
        newKanjiMap[item.kanji] = item;
      });

      // Giữ lại kanji cũ không có trong file mới
      const mergedData = [...result];
      oldKanjiData.forEach((oldItem) => {
        if (!newKanjiMap[oldItem.kanji]) {
          mergedData.push(oldItem);
        }
      });

      finalData = mergedData;
    } else {
      // Replace mode: Chỉ lấy dữ liệu từ file mới
      finalData = result;
      stats.removed = oldKanjiData.length;
    }

    setKanjiData(finalData);
    localStorage.setItem("kanjiData", JSON.stringify(finalData));

    // Hiển thị thống kê chi tiết
    const alertMessage =
      importMode === "merge"
        ? `Đã đọc ${stats.total} dòng dữ liệu từ ${fileName}!\n\n` +
          `📊 Thống kê (Chế độ: Merge):\n` +
          `🆕 Kanji mới: ${stats.new}\n` +
          `🔄 Kanji cập nhật: ${stats.updated}\n` +
          `✅ Kanji không đổi: ${stats.existing}\n` +
          `📊 Tổng kanji hiện tại: ${finalData.length}`
        : `Đã đọc ${stats.total} dòng dữ liệu từ ${fileName}!\n\n` +
          `📊 Thống kê (Chế độ: Replace):\n` +
          `🆕 Kanji từ file: ${stats.total}\n` +
          `🗑️ Kanji cũ đã xóa: ${stats.removed}\n` +
          `📊 Tổng kanji hiện tại: ${finalData.length}`;

    alert(alertMessage);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        processExcelFile(data, file.name);
      };
      reader.readAsArrayBuffer(file);
    }

    // Reset giá trị input để cho phép chọn lại cùng file
    event.target.value = "";
  };

  const loadDefaultFile = async () => {
    try {
      const response = await fetch("/KANJI_N3.xlsx");
      if (!response.ok) {
        throw new Error("Không thể tải file mặc định");
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      processExcelFile(data, "KANJI_N3.xlsx");
    } catch (error) {
      console.error("Error loading default file:", error);
      alert("Lỗi khi tải file mặc định: " + error.message);
    }
  };

  const downloadDefaultFile = async () => {
    try {
      const response = await fetch("/KANJI_N3.xlsx");
      if (!response.ok) {
        throw new Error("Không thể tải file mặc định");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "KANJI_N3.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading default file:", error);
      alert("Lỗi khi tải file về máy: " + error.message);
    }
  };

  const deleteKanji = (kanjiToDelete) => {
    const updatedKanjiData = kanjiData.filter(
      (item) => item.kanji !== kanjiToDelete
    );
    setKanjiData(updatedKanjiData);
    localStorage.setItem("kanjiData", JSON.stringify(updatedKanjiData));
  };

  return (
    <Router>
      <Navbar />
      
      {/* File Upload Toolbar - Below Navbar */}
      <div style={{
        backgroundColor: "#f8f9fa",
        padding: "15px 20px",
        borderBottom: "1px solid #dee2e6",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <input
          type="file"
          accept=".xlsx,.xls"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap"
        }}>
          {/* Import Mode Selection */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            backgroundColor: "white",
            padding: "10px 15px",
            borderRadius: "8px",
            border: "1px solid #dee2e6"
          }}>
            <span style={{ fontWeight: "600", color: "#495057" }}>🔧 Chế độ:</span>
            <label style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "14px",
              color: "#495057"
            }}>
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === "merge"}
                onChange={(e) => setImportMode(e.target.value)}
                style={{ marginRight: "5px" }}
              />
              🔄 Kết hợp
            </label>
            <label style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              fontSize: "14px",
              color: "#495057"
            }}>
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === "replace"}
                onChange={(e) => setImportMode(e.target.value)}
                style={{ marginRight: "5px" }}
              />
              🗑️ Thay thế
            </label>
          </div>

          {/* Upload Buttons */}
          <div style={{
            display: "flex",
            gap: "10px",
            alignItems: "center"
          }}>
            <button
              onClick={downloadDefaultFile}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: "500"
              }}
              title="Tải file mẫu KANJI_N3.xlsx về máy"
            >
              📥 Tải file mặc định
            </button>
            
            <button
              onClick={loadDefaultFile}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              📂 Upload file mặc định
            </button>
            
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              📄 Upload file Excel
            </button>
          </div>
        </div>
      </div>
      
      <Routes>
        <Route
          path="/"
          element={
            <div className="App">
              <header className="App-header">
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <h1>🎌 How to Train Your Kanji</h1>
                  <p style={{ fontSize: "18px", marginBottom: "40px" }}>
                    Ứng dụng học Kanji thông minh và hiệu quả
                  </p>
                  
                  {kanjiData.length > 0 ? (
                    <div style={{
                      backgroundColor: "#e9f7ef",
                      padding: "30px",
                      borderRadius: "15px",
                      border: "1px solid #c3e6cb",
                      maxWidth: "600px",
                      margin: "0 auto",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                    }}>
                      <h3 style={{ color: "#155724", marginTop: 0, fontSize: "24px" }}>
                        ✅ Đã tải {kanjiData.length} kanji vào hệ thống!
                      </h3>
                      <p style={{ color: "#155724", marginBottom: 0, fontSize: "16px" }}>
                        Bạn có thể bắt đầu học hoặc xem danh sách kanji bằng menu phía trên.
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: "#fff3cd",
                      padding: "30px",
                      borderRadius: "15px",
                      border: "1px solid #ffeaa7",
                      maxWidth: "600px",
                      margin: "0 auto",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                    }}>
                      <h3 style={{ color: "#856404", marginTop: 0, fontSize: "24px" }}>
                        📚 Chưa có dữ liệu Kanji
                      </h3>
                      <p style={{ color: "#856404", marginBottom: 0, fontSize: "16px" }}>
                        Vui lòng tải file Excel chứa dữ liệu Kanji bằng thanh công cụ phía trên.
                      </p>
                    </div>
                  )}
                </div>
              </header>
            </div>
          }
        />
        <Route
          path="/kanji-list"
          element={
            <KanjiList kanjiData={kanjiData} onDeleteKanji={deleteKanji} />
          }
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
