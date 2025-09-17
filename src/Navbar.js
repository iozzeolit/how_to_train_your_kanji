import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ background: "#282c34", padding: "10px" }}>
      <Link
        to="/"
        style={{ color: "white", marginRight: "20px", textDecoration: "none" }}
      >
        Trang chủ
      </Link>
      <Link
        to="/kanji-list"
        style={{ color: "white", marginRight: "20px", textDecoration: "none" }}
      >
        Xem các chữ có trong hệ thống
      </Link>
      <Link
        to="/random-kanji"
        style={{ color: "white", marginRight: "20px", textDecoration: "none" }}
      >
        Kiểm tra Kanji
      </Link>
      <Link
        to="/daily-learning"
        style={{ color: "white", textDecoration: "none" }}
      >
        Học Kanji theo ngày
      </Link>
    </nav>
  );
}

export default Navbar;
