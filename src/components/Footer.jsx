import { useState } from "react";
import { X } from "lucide-react";

export default function Footer() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <footer className="footer">
        <button className="about-link" onClick={() => setIsAboutOpen(true)}>
          About
        </button>
      </footer>

      {/* About Sheet */}
      <div
        className={`about-sheet-overlay ${isAboutOpen ? "open" : ""}`}
        onClick={() => setIsAboutOpen(false)}
      />

      <div className={`about-sheet ${isAboutOpen ? "open" : ""}`}>
        <div className="about-sheet-header">
          <h2>About</h2>
          <button className="close-btn" onClick={() => setIsAboutOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="about-sheet-content">
          <p>
            Maps by Jordi Domènech via
            <br />
            <a
              href="http://sokoban-jd.blogspot.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              sokoban-jd.blogspot.com
            </a>
            <br />
            For any comments or concerns email the website maintainer:
            ricky.ybarra@yahoo.com
          </p>

          <div style={{ marginTop: "30px" }}>
            <p style={{ marginBottom: "10px" }}>Color Theme:</p>
            <a
              href="https://www.colourlovers.com/palette/1363647/S_entimental?widths=1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://www.colourlovers.com/images/badges/pw/1363/1363647_S_entimental.png"
                style={{ width: "240px", height: "120px", border: "0 none" }}
                alt="S_entimental"
              />
            </a>
            <br />
            <span style={{ fontSize: "10px", color: "#E0AC87" }}>
              <a
                href="//www.colourlovers.com/color"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "10px", color: "#E0AC87" }}
              >
                Color
              </a>{" "}
              by{" "}
              <a
                href="//www.colourlovers.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "10px", color: "#E0AC87" }}
              >
                COLOURlovers
              </a>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
