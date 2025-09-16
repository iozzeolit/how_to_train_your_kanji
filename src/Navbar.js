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
      <Link to="/kanji-list" style={{ color: "white", textDecoration: "none" }}>
        Xem các chữ đã đọc
      </Link>
    </nav>
  );
}

export default Navbar;
