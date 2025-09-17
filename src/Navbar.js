import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const navStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px 30px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "40px",
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    fontSize: "18px",
    fontWeight: "600",
    padding: "12px 20px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
  };

  const handleMouseEnter = (e) => {
    e.target.style.background = "rgba(255,255,255,0.25)";
    e.target.style.transform = "translateY(-2px)";
    e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.3)";
  };

  const handleMouseLeave = (e) => {
    e.target.style.background = "rgba(255,255,255,0.1)";
    e.target.style.transform = "translateY(0)";
    e.target.style.boxShadow = "none";
  };

  return (
    <nav style={navStyle}>
      <Link
        to="/"
        style={linkStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        🏠 Trang chủ
      </Link>
      <Link
        to="/kanji-list"
        style={linkStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        📚 Danh sách Kanji
      </Link>
      <Link
        to="/random-kanji"
        style={linkStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        🎯 Kiểm tra Kanji
      </Link>
      <Link
        to="/daily-learning"
        style={linkStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        📅 Học theo ngày
      </Link>
    </nav>
  );
}

export default Navbar;
