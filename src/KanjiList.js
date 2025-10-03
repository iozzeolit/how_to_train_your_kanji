import React, { useState, useMemo } from "react";

function KanjiList({ kanjiData, onDeleteKanji }) {
  const [sortBy, setSortBy] = useState(null); // 'hanviet', 'kun', 'on', or null
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyFirstTwoExamples, setShowOnlyFirstTwoExamples] =
    useState(false);
  const [searchKeyword, setSearchKeyword] = useState(""); // Từ khóa trong input
  const [activeSearchKeyword, setActiveSearchKeyword] = useState(""); // Từ khóa thực tế để tìm kiếm
  const [showMarkedList, setShowMarkedList] = useState(false);
  const [markedWords, setMarkedWords] = useState(() => {
    const saved = localStorage.getItem("markedWords");
    return saved ? JSON.parse(saved) : [];
  });
  const itemsPerPage = 100;

  // Hàm xử lý sắp xếp
  const handleSort = (column) => {
    if (sortBy === column) {
      // Nếu đang sắp xếp theo cột hiện tại, đổi thứ tự
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nếu sắp xếp theo cột mới, mặc định là tăng dần
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Hàm xử lý xóa kanji
  const handleDeleteKanji = (kanjiToDelete) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa chữ kanji "${kanjiToDelete.kanji}"?\n\n` +
        `Hán Việt: ${
          Array.isArray(kanjiToDelete.hanviet)
            ? kanjiToDelete.hanviet.join(", ")
            : kanjiToDelete.hanviet
        }\n` +
        `Âm Kun: ${
          Array.isArray(kanjiToDelete.kun)
            ? kanjiToDelete.kun.join(", ")
            : kanjiToDelete.kun
        }\n` +
        `Âm On: ${
          Array.isArray(kanjiToDelete.on)
            ? kanjiToDelete.on.join(", ")
            : kanjiToDelete.on
        }`
    );

    if (confirmDelete && onDeleteKanji) {
      onDeleteKanji(kanjiToDelete.kanji);
    }
  };

  // Hàm xử lý tìm kiếm
  const handleSearch = () => {
    setActiveSearchKeyword(searchKeyword);
  };

  // Hàm xóa tìm kiếm
  const handleClearSearch = () => {
    setSearchKeyword("");
    setActiveSearchKeyword("");
  };

  // Hàm toggle đánh dấu kanji
  const handleToggleMark = (kanjiChar) => {
    setMarkedWords((prev) => {
      const newMarkedWords = prev.includes(kanjiChar)
        ? prev.filter((k) => k !== kanjiChar)
        : [...prev, kanjiChar];
      localStorage.setItem("markedWords", JSON.stringify(newMarkedWords));
      return newMarkedWords;
    });
  };

  // Hàm xóa tất cả đánh dấu
  const handleClearAllMarks = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả các từ đã đánh dấu?")) {
      setMarkedWords([]);
      localStorage.setItem("markedWords", JSON.stringify([]));
    }
  };

  // Hàm chuẩn hóa tiếng Việt (bỏ dấu) để sắp xếp
  const normalizeVietnamese = (str) => {
    return str
      .normalize("NFD") // Tách các ký tự có dấu thành ký tự gốc + dấu
      .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Hàm lấy giá trị để sắp xếp
  const getSortValue = (item, column) => {
    const value = item[column];
    if (!value) return "";

    let sortValue;
    if (Array.isArray(value)) {
      // Nếu là mảng, lấy phần tử đầu tiên để sắp xếp
      sortValue = value.length > 0 ? value[0] : "";
    } else {
      sortValue = value;
    }

    // Nếu sắp xếp theo Hán Việt, chuẩn hóa tiếng Việt
    if (column === "hanviet") {
      return normalizeVietnamese(sortValue);
    }

    return sortValue.toLowerCase();
  };

  // Hàm tìm kiếm qua tất cả trường
  const searchInAllFields = (item, keyword) => {
    if (!keyword) return true;

    const searchTerm = normalizeVietnamese(keyword.toLowerCase());

    // Tìm trong kanji
    if (item.kanji && item.kanji.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Tìm trong hanviet
    if (item.hanviet) {
      const hanvietText = Array.isArray(item.hanviet)
        ? item.hanviet.join(" ")
        : item.hanviet;
      if (normalizeVietnamese(hanvietText.toLowerCase()).includes(searchTerm)) {
        return true;
      }
    }

    // Tìm trong kun
    if (item.kun) {
      const kunText = Array.isArray(item.kun) ? item.kun.join(" ") : item.kun;
      if (kunText.toLowerCase().includes(searchTerm)) {
        return true;
      }
    }

    // Tìm trong on
    if (item.on) {
      const onText = Array.isArray(item.on) ? item.on.join(" ") : item.on;
      if (onText.toLowerCase().includes(searchTerm)) {
        return true;
      }
    }

    // Tìm trong example
    if (item.example && Array.isArray(item.example)) {
      for (const example of item.example) {
        if (example) {
          let exampleText = "";
          if (typeof example === "string") {
            exampleText = example;
          } else if (typeof example === "object" && example.text) {
            exampleText = example.text;
          }
          if (exampleText && exampleText.toLowerCase().includes(searchTerm)) {
            return true;
          }
        }
      }
    }

    return false;
  };

  // Dữ liệu đã được lọc và sắp xếp
  const filteredAndSortedKanjiData = useMemo(() => {
    // Trước tiên lọc theo từ khóa tìm kiếm
    let filtered = kanjiData.filter((item) =>
      searchInAllFields(item, activeSearchKeyword)
    );

    // Sau đó sắp xếp nếu có
    if (!sortBy) return filtered;

    const sorted = [...filtered].sort((a, b) => {
      const valueA = getSortValue(a, sortBy);
      const valueB = getSortValue(b, sortBy);

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [kanjiData, sortBy, sortOrder, activeSearchKeyword]);

  // Tính toán phân trang
  const totalPages = Math.ceil(
    filteredAndSortedKanjiData.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredAndSortedKanjiData.slice(
    startIndex,
    endIndex
  );

  // Reset về trang 1 khi thay đổi sắp xếp hoặc tìm kiếm
  useMemo(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder, activeSearchKeyword]);

  // Hàm chuyển trang
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // Hàm tạo số trang hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 10;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 6) {
        for (let i = 1; i <= 8; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 5) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 7; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

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

  // Hàm tạo biểu tượng sắp xếp
  const getSortIcon = (column) => {
    if (sortBy !== column) return " ↕️";
    return sortOrder === "asc" ? " ↑" : " ↓";
  };
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
        // Lấy phonetic cho kanji này (tạm thời lấy tất cả phonetic còn lại)
        if (phoneticIndex < phoneticChars.length) {
          // Tính toán số phonetic chars cho kanji này
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
            <rt style={{ fontSize: "10px", color: "#666" }}>{rubyPhonetic}</rt>
          </ruby>
        );
      } else {
        // Nếu không phải kanji (hiragana, katakana, etc.), hiển thị bình thường
        result.push(<span key={i}>{char}</span>);
      }
    }

    return result;
  };

  const renderExample = (example) => {
    if (!example) return "";
    if (typeof example === "string") return example;
    if (typeof example === "object" && example.text) {
      return (
        <div style={{ fontSize: "16px" }}>
          {example.phonetic
            ? createRubyText(example.text, example.phonetic)
            : example.text}
        </div>
      );
    }
    return "";
  };
  return (
    <div style={{ padding: "20px" }}>
      <h2>Danh sách các chữ có trong hệ thống</h2>

      {/* Khu vực điều khiển sắp xếp và thống kê */}
      {kanjiData.length > 0 && (
        <>
          {/* Thống kê trạng thái kanji */}
          <div
            style={{
              marginBottom: "10px",
              padding: "10px",
              backgroundColor: "#e9f7ef",
              borderRadius: "5px",
              border: "1px solid #c3e6cb",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <strong>📊 Thống kê:</strong>
              <span style={{ color: "#28a745" }}>
                🆕 Mới:{" "}
                {
                  filteredAndSortedKanjiData.filter((k) => k.status === "new")
                    .length
                }
                {activeSearchKeyword &&
                  ` / ${kanjiData.filter((k) => k.status === "new").length}`}
              </span>
              <span style={{ color: "#ffc107" }}>
                🔄 Cập nhật:{" "}
                {
                  filteredAndSortedKanjiData.filter(
                    (k) => k.status === "updated"
                  ).length
                }
                {activeSearchKeyword &&
                  ` / ${
                    kanjiData.filter((k) => k.status === "updated").length
                  }`}
              </span>
              <span style={{ color: "#6c757d" }}>
                ✅ Không đổi:{" "}
                {
                  filteredAndSortedKanjiData.filter(
                    (k) => k.status === "existing"
                  ).length
                }
                {activeSearchKeyword &&
                  ` / ${
                    kanjiData.filter((k) => k.status === "existing").length
                  }`}
              </span>
              <span style={{ color: "#17a2b8" }}>
                📝 {activeSearchKeyword ? "Hiển thị" : "Tổng"}:{" "}
                {filteredAndSortedKanjiData.length}
                {activeSearchKeyword && ` / ${kanjiData.length}`}
              </span>
              <span style={{ color: "#e83e8c" }}>
                ⭐ Đã đánh dấu: {markedWords.length}
              </span>
            </div>
          </div>

          <div
            style={{
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#f5f5f5",
              borderRadius: "5px",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                flex: "1",
              }}
            >
              <span style={{ fontWeight: "bold" }}>Sắp xếp:</span>
              <button
                onClick={() => handleSort("hanviet")}
                style={{
                  padding: "5px 10px",
                  backgroundColor: sortBy === "hanviet" ? "#2196F3" : "#e0e0e0",
                  color: sortBy === "hanviet" ? "white" : "black",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                Hán Việt {sortBy === "hanviet" ? getSortIcon("hanviet") : ""}
              </button>
              <button
                onClick={() => handleSort("kun")}
                style={{
                  padding: "5px 10px",
                  backgroundColor: sortBy === "kun" ? "#2196F3" : "#e0e0e0",
                  color: sortBy === "kun" ? "white" : "black",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                Âm Kun {sortBy === "kun" ? getSortIcon("kun") : ""}
              </button>
              <button
                onClick={() => handleSort("on")}
                style={{
                  padding: "5px 10px",
                  backgroundColor: sortBy === "on" ? "#2196F3" : "#e0e0e0",
                  color: sortBy === "on" ? "white" : "black",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                Âm On {sortBy === "on" ? getSortIcon("on") : ""}
              </button>
              {sortBy && (
                <button
                  onClick={() => {
                    setSortBy(null);
                    setSortOrder("asc");
                  }}
                  style={{
                    padding: "5px 10px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  Xóa sắp xếp
                </button>
              )}
              {sortBy && (
                <span style={{ fontSize: "14px", color: "#666" }}>
                  Đang sắp xếp theo{" "}
                  <strong>
                    {sortBy === "hanviet"
                      ? "Hán Việt"
                      : sortBy === "kun"
                      ? "Âm Kun"
                      : "Âm On"}
                  </strong>{" "}
                  ({sortOrder === "asc" ? "A-Z" : "Z-A"})
                </span>
              )}
            </div>

            {/* Thanh tìm kiếm */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                minWidth: "350px",
              }}
            >
              <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                🔍 Tìm kiếm:
              </span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm..."
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  flex: "1",
                  outline: "none",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2196F3")}
                onBlur={(e) => (e.target.style.borderColor = "#ccc")}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  fontWeight: "bold",
                }}
                title="Thực hiện tìm kiếm"
              >
                Tìm
              </button>
              {activeSearchKeyword && (
                <button
                  onClick={handleClearSearch}
                  style={{
                    padding: "6px 10px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕ Xóa
                </button>
              )}
            </div>
          </div>

          {/* Checkbox hiển thị ví dụ */}
          <div
            style={{
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "5px",
              border: "1px solid #dee2e6",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <input
                type="checkbox"
                checked={showOnlyFirstTwoExamples}
                onChange={(e) => setShowOnlyFirstTwoExamples(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              📝 Chỉ hiển thị 2 từ ví dụ đầu tiên (ẩn các ví dụ bổ sung)
            </label>
          </div>

          {/* Quản lý từ đã đánh dấu */}
          {markedWords.length > 0 && (
            <div
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#fff3cd",
                borderRadius: "5px",
                border: "1px solid #ffeaa7",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <strong style={{ color: "#856404" }}>⭐ Các từ đã đánh dấu ({markedWords.length}):</strong>
                <button
                  onClick={() => setShowMarkedList(!showMarkedList)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#ffc107",
                    color: "#212529",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {showMarkedList ? "Ẩn danh sách" : "Hiển thị danh sách"}
                </button>
                <button
                  onClick={handleClearAllMarks}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Xóa tất cả
                </button>
              </div>
              {showMarkedList && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    backgroundColor: "#fff",
                    padding: "10px",
                    borderRadius: "3px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  {markedWords.map((kanji) => {
                    const kanjiData = filteredAndSortedKanjiData.find((k) => k.kanji === kanji);
                    return (
                      <div
                        key={kanji}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "4px 8px",
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #dee2e6",
                          borderRadius: "3px",
                          fontSize: "14px",
                        }}
                      >
                        <span style={{ fontSize: "18px", fontWeight: "bold", marginRight: "6px" }}>{kanji}</span>
                        {kanjiData && (
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            ({Array.isArray(kanjiData.hanviet) ? kanjiData.hanviet.join(", ") : kanjiData.hanviet})
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleMark(kanji)}
                          style={{
                            marginLeft: "6px",
                            padding: "2px 4px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "2px",
                            cursor: "pointer",
                            fontSize: "10px",
                          }}
                          title="Xóa khỏi danh sách đánh dấu"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Thông tin phân trang */}
      {kanjiData.length > 0 && (
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>Tổng cộng:</strong> {filteredAndSortedKanjiData.length}{" "}
            kanji | <strong>Trang:</strong> {currentPage}/{totalPages} |{" "}
            <strong>Hiển thị:</strong> {startIndex + 1}-
            {Math.min(endIndex, filteredAndSortedKanjiData.length)}
          </div>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: "5px 10px",
                backgroundColor: currentPage === 1 ? "#e0e0e0" : "#007bff",
                color: currentPage === 1 ? "#666" : "white",
                border: "none",
                borderRadius: "3px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ‹ Trước
            </button>

            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && goToPage(page)}
                disabled={page === "..."}
                style={{
                  padding: "5px 10px",
                  backgroundColor:
                    page === currentPage
                      ? "#007bff"
                      : page === "..."
                      ? "transparent"
                      : "#e0e0e0",
                  color:
                    page === currentPage
                      ? "white"
                      : page === "..."
                      ? "#666"
                      : "black",
                  border: page === "..." ? "none" : "1px solid #ccc",
                  borderRadius: "3px",
                  cursor: page === "..." ? "default" : "pointer",
                  minWidth: "35px",
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: "5px 10px",
                backgroundColor:
                  currentPage === totalPages ? "#e0e0e0" : "#007bff",
                color: currentPage === totalPages ? "#666" : "white",
                border: "none",
                borderRadius: "3px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Sau ›
            </button>
          </div>
        </div>
      )}

      {kanjiData.length === 0 ? (
        <p>Chưa có dữ liệu nào.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{ marginTop: "10px", width: "100%" }}
        >
          <thead>
            <tr>
              <th style={{ width: "50px" }}>⭐</th>
              <th>Kanji</th>
              <th
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    sortBy === "hanviet" ? "#e3f2fd" : "transparent",
                  userSelect: "none",
                }}
                onClick={() => handleSort("hanviet")}
                title="Nhấp để sắp xếp theo Hán Việt"
              >
                Hán Việt{getSortIcon("hanviet")}
              </th>
              <th
                style={{
                  cursor: "pointer",
                  backgroundColor: sortBy === "kun" ? "#e3f2fd" : "transparent",
                  userSelect: "none",
                }}
                onClick={() => handleSort("kun")}
                title="Nhấp để sắp xếp theo Âm Kun"
              >
                Âm Kun{getSortIcon("kun")}
              </th>
              <th
                style={{
                  cursor: "pointer",
                  backgroundColor: sortBy === "on" ? "#e3f2fd" : "transparent",
                  userSelect: "none",
                }}
                onClick={() => handleSort("on")}
                title="Nhấp để sắp xếp theo Âm On"
              >
                Âm On{getSortIcon("on")}
              </th>
              <th colSpan={2}>Từ ví dụ</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentPageData.map((item, idx) => {
              const rows = [];

              // Hàng đầu tiên với kanji và 2 ví dụ đầu
              rows.push(
                <tr key={`${idx}-main`}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={markedWords.includes(item.kanji)}
                      onChange={() => handleToggleMark(item.kanji)}
                      title="Đánh dấu từ này"
                    />
                  </td>
                  <td
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      backgroundColor:
                        item.status === "new"
                          ? "#e8f5e8"
                          : item.status === "updated"
                          ? "#fff8e1"
                          : "transparent",
                    }}
                  >
                    {item.kanji}
                  </td>
                  <td>
                    {Array.isArray(item.hanviet)
                      ? item.hanviet.join("、")
                      : item.hanviet}
                  </td>
                  <td>
                    {Array.isArray(item.kun) ? item.kun.join("、") : item.kun}
                  </td>
                  <td>
                    {Array.isArray(item.on) ? item.on.join("、") : item.on}
                  </td>
                  <td>{renderExample(item.example[0])}</td>
                  <td>{renderExample(item.example[1])}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleDeleteKanji(item)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                      title={`Xóa kanji "${item.kanji}"`}
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              );

              // Nếu có nhiều hơn 2 ví dụ và không tick checkbox "chỉ hiển thị 2 ví dụ đầu", thêm các hàng phụ
              if (
                item.example &&
                item.example.length > 2 &&
                !showOnlyFirstTwoExamples
              ) {
                for (let i = 2; i < item.example.length; i += 2) {
                  rows.push(
                    <tr key={`${idx}-extra-${i}`}>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>{renderExample(item.example[i])}</td>
                      <td>{renderExample(item.example[i + 1])}</td>
                      <td></td>
                    </tr>
                  );
                }
              }

              return rows;
            })}
          </tbody>
        </table>
      )}

      {/* Phân trang dưới bảng */}
      {kanjiData.length > 0 && totalPages > 1 && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            style={{
              padding: "8px 12px",
              backgroundColor: currentPage === 1 ? "#e0e0e0" : "#007bff",
              color: currentPage === 1 ? "#666" : "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            ‹‹ Đầu
          </button>

          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: "8px 12px",
              backgroundColor: currentPage === 1 ? "#e0e0e0" : "#007bff",
              color: currentPage === 1 ? "#666" : "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            ‹ Trước
          </button>

          <span
            style={{
              padding: "8px 16px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "5px",
              fontWeight: "bold",
            }}
          >
            Trang {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 12px",
              backgroundColor:
                currentPage === totalPages ? "#e0e0e0" : "#007bff",
              color: currentPage === totalPages ? "#666" : "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Sau ›
          </button>

          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 12px",
              backgroundColor:
                currentPage === totalPages ? "#e0e0e0" : "#007bff",
              color: currentPage === totalPages ? "#666" : "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Cuối ››
          </button>
        </div>
      )}
    </div>
  );
}

export default KanjiList;
