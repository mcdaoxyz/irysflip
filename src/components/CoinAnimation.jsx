import React from "react";

export default function CoinAnimation({ size = 92 }) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto"
      }}
    >
      {/* Coin belakang: fade out */}
      <img
        src="/coin_pixel.png"
        alt="coin-shadow"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          zIndex: 1,
          filter: "brightness(0.32) blur(2.5px)",
          opacity: 0.9,
          animation: "fadeCoinShadow 1s linear forwards"
        }}
      />
      {/* Coin depan: spin */}
      <img
        src="/coin_pixel.png"
        alt="coin"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size,
          height: size,
          zIndex: 2,
          animation: "spinCoin 0.6s linear infinite"
        }}
      />
      <style>
        {`
        @keyframes fadeCoinShadow {
          from { opacity: 0.9; }
          to   { opacity: 0; }
        }
        @keyframes spinCoin {
          0% { transform: rotateY(0deg);}
          100% { transform: rotateY(360deg);}
        }
        `}
      </style>
    </div>
  );
}
