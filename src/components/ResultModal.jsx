import React from "react";

export default function ResultModal({ phase, score, winner, onClose, txid }) {
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 200,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.63)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Modal utama */}
      <div
        style={{
          background: "rgba(24,24,24,0.82)",
          borderRadius: 20,
          maxWidth: 420,
          width: '92vw',
          boxShadow: '0 10px 28px #111a',
          padding: '38px 0 32px 0',
          textAlign: 'center',
          position: 'relative',
          color: "#fff",
          backdropFilter: "blur(2px)",
          border: "1.2px solid #222"
        }}
      >
        {/* Close Button */}
        {phase === "result" && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 14,
              top: 14,
              fontSize: 16,
              background: '#222c',
              border: 0,
              borderRadius: 7,
              cursor: 'pointer',
              color: "#fff"
            }}
          >
            ✖
          </button>
        )}

        {/* Koin animasi di atas judul saat submitting */}
        {phase === "submitting" && (
          <div style={{ marginBottom: 12 }}>
            {/* Coin belakang (bayangan, blur, hilang) */}
            <img
              src="/coin_pixel.png"
              alt="coin-shadow"
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                top: 22,
                width: 86,
                height: 86,
                filter: "brightness(0.34) blur(2.2px)",
                opacity: 0.9,
                animation: "fadeCoinShadow 1.15s linear forwards"
              }}
            />
            {/* Coin depan, spinning */}
            <img
              src="/coin_pixel.png"
              alt="coin"
              style={{
                width: 86,
                height: 86,
                animation: "spinCoin 0.68s linear infinite"
              }}
            />
          </div>
        )}

        {/* ICON selain phase submitting */}
        {phase !== "submitting" && phase === "saved" && <div style={{ fontSize: 40, marginBottom: 16 }}>💾</div>}
        {phase !== "submitting" && phase === "result" && winner === true && <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>}
        {phase !== "submitting" && phase === "result" && winner === false && <div style={{ fontSize: 40, marginBottom: 16 }}>😢</div>}
        {phase !== "submitting" && phase === "result" && winner == null && <div style={{ fontSize: 40, marginBottom: 16 }}>❓</div>}

        {/* TITLE */}
        <div
          style={{
            fontWeight: 900,
            fontSize: 22,
            marginBottom: 6,
            color: "#fff",
            fontFamily: "'Press Start 2P', monospace"
          }}
        >
          {phase === "submitting" && <>Submitting to Blockchain</>}
          {phase === "saved" && <>Result Saved!</>}
          {phase === "result" && winner === true && <>You Won!</>}
          {phase === "result" && winner === false && <>You Lost</>}
          {phase === "result" && winner == null && <>Result Unknown</>}
        </div>

        {/* DESC */}
        <div style={{ color: "#e0e0e0", fontSize: 15, marginBottom: 18 }}>
          {phase === "submitting" && <>Please wait....</>}
          {phase === "saved" && <>Your score: <b>{score}</b><br />Waiting for result confirmation...</>}
          {phase === "result" && winner === true && <>Congratulations! You won!</>}
          {phase === "result" && winner === false && <>Better luck next time.</>}
          {phase === "result" && winner == null && (
            <>
              Hasil tidak bisa dideteksi.<br />Silakan cek history di bawah.<br />
            </>
          )}
        </div>

        {/* LOADING BAR */}
        {(phase === "submitting" || phase === "saved") && (
          <div style={{ margin: "28px auto 6px auto" }}>
            <div className="loading-anim" />
          </div>
        )}

        {/* Explorer Link */}
        {phase === "saved" && txid && (
          <div style={{ marginTop: 12 }}>
            <a
              href={`https://explorer.irys.xyz/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#16f06c", fontSize: 13, textDecoration: "underline" }}
            >
              View on Irys Explorer
            </a>
          </div>
        )}

        {/* Action Button */}
        {phase === "result" && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={onClose}
              style={{
                background: "#23272f",
                color: "#fff",
                fontSize: 17,
                padding: "12px 40px",
                borderRadius: 10,
                border: 0,
                cursor: "pointer"
              }}
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
      {/* CSS loading & coin anim */}
      <style>{`
        .loading-anim {
          border: 4px solid #e0e0e0;
          border-top: 4px solid #ffe000;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          animation: spin 0.7s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        @keyframes spinCoin {
          0% { transform: rotateY(0deg);}
          100% { transform: rotateY(360deg);}
        }
        @keyframes fadeCoinShadow {
          from { opacity: 0.9; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
