# Gas Fee Enhancement Features

## Overview
Aplikasi IrysFlip sekarang mendukung pengaturan gas fee yang lebih tinggi dari yang disarankan wallet untuk mempercepat transaksi.

## Fitur yang Ditambahkan

### 1. Multi-Wallet Detection
- **File**: `src/utils/walletDetector.js`
- Mendeteksi berbagai wallet: MetaMask, OKX Wallet, Coinbase Wallet, Trust Wallet, Binance Wallet, Brave Wallet, Phantom, dan lainnya
- Auto-connect ke wallet yang tersedia
- Fallback ke wallet lain jika wallet utama tidak tersedia

### 2. Enhanced Gas Fee System
- **File**: `src/utils/gasUtils.js`
- Fungsi untuk menghitung gas fee yang lebih tinggi (multiplier 1.0x - 3.0x)
- Estimasi gas limit yang lebih akurat dengan buffer
- Support untuk EIP-1559 (maxFeePerGas, maxPriorityFeePerGas) dan legacy gas price

### 3. Gas Fee UI Components
- **File**: `src/components/GasFeeInfo.jsx`
- Menampilkan informasi gas fee real-time
- Perbandingan antara gas fee original dan enhanced
- Update otomatis saat multiplier berubah

### 4. Gas Fee Settings
- **File**: `src/DashboardOnchain.jsx`
- Slider untuk mengatur gas multiplier (1.0x - 3.0x)
- Preview gas fee sebelum transaksi
- Informasi gas fee di modal result

## Cara Penggunaan

### 1. Connect Wallet
- Klik "Connect Wallet" untuk memilih wallet
- Aplikasi akan mendeteksi semua wallet yang tersedia
- Pilih wallet atau gunakan "Auto Connect"

### 2. Set Gas Fee
- Setelah wallet terhubung, akan muncul pengaturan gas fee
- Geser slider untuk mengatur multiplier (1.0x - 3.0x)
- Lihat preview gas fee yang akan digunakan

### 3. Place Bet
- Pilih Heads atau Tails
- Pilih jumlah taruhan
- Klik "BET" untuk melakukan transaksi dengan gas fee yang ditingkatkan

### 4. View Transaction Info
- Di modal result, akan ditampilkan gas fee yang digunakan
- Perbandingan dengan gas fee original
- Link ke explorer untuk melihat detail transaksi

## Technical Details

### Gas Fee Calculation
```javascript
// Enhanced gas fee = Original gas fee × multiplier
const enhancedMaxFeePerGas = originalMaxFeePerGas * multiplier;
const enhancedMaxPriorityFeePerGas = originalMaxPriorityFeePerGas * multiplier;
const enhancedGasPrice = originalGasPrice * multiplier;
```

### Supported Wallet Types
- MetaMask (🦊)
- OKX Wallet (🟢)
- Coinbase Wallet (🔵)
- Trust Wallet (🟡)
- Binance Wallet (🟠)
- Brave Wallet (🦁)
- Phantom (👻)
- WalletConnect (🔗)
- Ethereum Wallet (💎)

### Network Support
- Irys Testnet (Chain ID: 1270)
- Auto network switching
- Auto network addition jika belum ada

## Benefits

1. **Faster Transactions**: Gas fee yang lebih tinggi mempercepat konfirmasi transaksi
2. **User Control**: User dapat mengatur gas fee sesuai kebutuhan
3. **Multi-Wallet Support**: Mendukung berbagai jenis wallet
4. **Real-time Info**: Informasi gas fee real-time sebelum transaksi
5. **Fallback System**: Sistem fallback jika wallet utama tidak tersedia

## Configuration

### Default Settings
- Gas Multiplier: 1.5x
- Gas Limit Multiplier: 1.2x
- Max Gas Multiplier: 3.0x

### Customization
- Ubah `gasMultiplier` di state untuk mengatur default
- Modifikasi `getEnhancedGasFee` untuk mengubah perhitungan
- Tambahkan wallet detection di `detectAvailableWallets` 