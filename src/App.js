import logo from "./logo.svg";
import "./App.css";

import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import KanjiList from "./KanjiList";
import RandomKanji from "./RandomKanji";

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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellStyles: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

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
              if (cell.r && typeof cell.r === "string") {
                // Extract nội dung trong <rPh><t>...</t></rPh>
                const rPhMatch = cell.r.match(
                  /<rPh[^>]*><t>([^<]+)<\/t><\/rPh>/
                );
                if (rPhMatch) {
                  phoneticText = rPhMatch[1];
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
              result.push({
                kanji: kanjiText,
                hanviet: row[1].text || "",
                kun: row[2].text || "",
                on: row[3].text || "",
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
              });
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
        setKanjiData(result);
        localStorage.setItem("kanjiData", JSON.stringify(result));
        alert(`Đã đọc ${result.length} dòng dữ liệu từ file Excel!`);
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
      </Routes>
    </Router>
  );
}

export default App;
