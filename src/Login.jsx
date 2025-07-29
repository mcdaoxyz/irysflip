import React from "react";

export default function Login({ onLogin }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center"
      style={{
        backgroundImage: "url('/pixel-landscape.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh",
        width: "100vw",
        fontFamily: "'Press Start 2P', monospace",
        position: "relative",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(16,16,32,0.55)",
          backdropFilter: "blur(0.5px)",
          zIndex: 0,
        }}
      ></div>
      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "#111d",
          border: "3px solid #444",
          borderRadius: 14,
          padding: "34px 36px",
          minWidth: 340,
          maxWidth: "95vw",
          textAlign: "center",
          boxShadow: "0 4px 0 #222",
        }}
      >
        <h1 style={{
          color: "#fff",
          fontSize: "2rem",
          letterSpacing: "0.14em",
          marginBottom: 10,
          textShadow: "2px 2px 0 #111, 0 0 14px #39ff14"
        }}>
          IRYSFLIP
        </h1>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 19,
          marginBottom: 14,
          color: "#fff",
          textShadow: "0 0 14px #111"
        }}>
          Flip your luck, win on datachain!
        </div>

        {/* Tombol PLAY langsung ke dashboard */}
        <button
          onClick={() => onLogin()}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            background: "#14ff94",
            color: "#111",
            border: "3px solid #fff",
            borderRadius: 7,
            fontSize: "1.3rem",
            padding: "16px 52px",
            margin: "20px 0 18px",
            cursor: "pointer",
            boxShadow: "0 2px 0 #111",
            transition: "0.2s"
          }}
        >
          PLAY
        </button>

        <div style={{
          margin: "18px 0 0",
          fontSize: 16,
          color: "#fff"
        }}>
          Made with 💚 by{" "}
          <a
            href="https://twitter.com/mcdaoxyz"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#fff",
              textDecoration: "underline",
              fontWeight: 700
            }}
          >
            @mcdaoxyz
          </a>
        </div>
      </div>
    </div>
  );
}
