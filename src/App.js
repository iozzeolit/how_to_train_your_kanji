import logo from "./logo.svg";
import "./App.css";

import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import KanjiList from "./KanjiList";

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
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const result = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 6) {
            result.push({
              kanji: row[0],
              hanviet: row[1],
              kun: row[2],
              on: row[3],
              example: [row[4], row[5]],
            });
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
      </Routes>
    </Router>
  );
}

export default App;
