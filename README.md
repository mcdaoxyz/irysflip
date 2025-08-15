# IrysFlip Smart Contract

Smart contract untuk game coinflip dengan sistem quest yang terintegrasi dengan Irys blockchain.

## 🎯 Fitur Utama

### Quest System
- **Daily Login**: Auto-detect dan auto-complete setiap hari
- **Daily Flip**: 10x flip per hari, reset otomatis setiap 12:00 AM (zona waktu user)
- **Weekly Flips**: 50x flip per minggu, reset otomatis setiap Senin 12:00 AM
- **Monthly Streak**: 30 hari login berturut-turut, reset otomatis setiap bulan

### Reset Otomatis
- **Daily**: Reset setiap hari jam 12:00 AM zona waktu user
- **Weekly**: Reset setiap Senin jam 12:00 AM zona waktu user  
- **Monthly**: Reset setiap tanggal 1 jam 12:00 AM zona waktu user

### Quest Rewards
- **Daily Login**: 0.01 IRYS
- **Daily Flip**: 0.02 IRYS
- **Weekly Flips**: 0.05 IRYS
- **Monthly Streak**: 0.1 IRYS

## 🚀 Deployment

### Prerequisites
- Node.js 16+ 
- npm atau yarn
- Wallet dengan IRYS untuk gas fee

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PRIVATE_KEY=your_wallet_private_key_here
IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
```

3. **Compile contracts**
```bash
npm run compile
```

4. **Deploy to Irys Testnet**
```bash
npm run deploy:irys
```

### Deployment Output

Setelah deployment berhasil, Anda akan mendapatkan:
- Contract address
- Quest requirements verification
- Quest rewards verification
- Bet limits verification
- File `deployment-info.json` dengan semua informasi

## 📋 Smart Contract Functions

### Quest Functions
- `completeDailyLogin()` - Complete daily login quest
- `claimQuestReward(uint8 questType)` - Claim quest reward
- `canClaimQuestReward(address player, uint8 questType)` - Check if can claim
- `getQuestRewardAmount(address player, uint8 questType)` - Get reward amount
- `getPlayerQuestStatus(address player)` - Get quest status

### Game Functions
- `flip(bool guess)` - Place bet and flip coin
- `getPlayerData(address player)` - Get player statistics

### Owner Functions
- `setQuestRewardAmount(uint8 questType, uint256 amount)` - Set quest reward
- `setBetLimits(uint256 newMinBet, uint256 newMaxBet)` - Set bet limits
- `setHouseEdge(uint256 newHouseEdge)` - Set house edge
- `pause() / unpause()` - Pause/unpause contract
- `withdrawFunds(uint256 amount)` - Withdraw contract funds

## 🔧 Configuration

### Quest Requirements (Hardcoded)
```solidity
DAILY_FLIP_REQUIREMENT = 10;    // 10 flips per day
WEEKLY_FLIP_REQUIREMENT = 50;   // 50 flips per week
MONTHLY_STREAK_REQUIREMENT = 30; // 30 days login streak
```

### Quest Rewards (Configurable)
```solidity
questRewardAmounts[DAILY_LOGIN] = 0.01 ether;
questRewardAmounts[DAILY_FLIP] = 0.02 ether;
questRewardAmounts[WEEKLY_FLIPS] = 0.05 ether;
questRewardAmounts[MONTHLY_STREAK] = 0.1 ether;
```

### Bet Limits (Configurable)
```solidity
minBetAmount = 0.001 ether;  // 0.001 IRYS
maxBetAmount = 0.1 ether;    // 0.1 IRYS
houseEdge = 500;             // 5% (500 basis points)
```

## 🌍 Zona Waktu

Sistem reset menggunakan zona waktu user secara otomatis:
- Deteksi zona waktu browser
- Convert ke 12:00 AM UTC untuk konsistensi
- Reset otomatis tanpa refresh halaman

## 🔄 Auto-Complete System

### Daily Login Auto-Complete
- Deteksi otomatis setiap 2 menit
- Auto-complete jika belum dilakukan
- Notifikasi "🤖 AUTO-COMPLETED DAILY LOGIN!"

### Reset Otomatis
- Daily reset: Setiap hari jam 12:00 AM
- Weekly reset: Setiap Senin jam 12:00 AM
- Monthly reset: Setiap tanggal 1 jam 12:00 AM

## 📊 Monitoring

### Console Logs
```javascript
// Auto-detect logs
🔍 Auto-detecting daily login status...
✅ Daily login already completed today

// Auto-complete logs
🚀 Attempting auto-complete daily login...
🎉 Auto-complete daily login successful!

// Reset logs
🕛 Daily reset detected - resetting daily quests
🔄 Daily reset completed - daily quests refreshed
```

### Status Tracking
- Real-time quest progress
- Auto-refresh setiap 30 detik
- Status claimable otomatis update

## 🛡️ Security Features

- **ReentrancyGuard**: Mencegah reentrancy attacks
- **Pausable**: Contract dapat di-pause jika diperlukan
- **Ownable**: Hanya owner yang bisa mengubah konfigurasi
- **Input Validation**: Validasi semua input user
- **Safe Math**: Menggunakan Solidity 0.8+ built-in overflow protection

## 🧪 Testing

```bash
# Run tests
npm run test

# Run specific test
npx hardhat test test/OnchainCoinflip.test.js
```

## 📝 License

MIT License - lihat file LICENSE untuk detail.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📞 Support

Jika ada pertanyaan atau masalah:
- Buat issue di GitHub
- Hubungi developer di Twitter: @mcdaoxyz

---

**Made with ❤️ for Irys Community**

- **Daily Flip**: 0.02 IRYS
- **Weekly Flips**: 0.05 IRYS
- **Monthly Streak**: 0.1 IRYS

## 🚀 Deployment

### Prerequisites
- Node.js 16+ 
- npm atau yarn
- Wallet dengan IRYS untuk gas fee

### Setup

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
PRIVATE_KEY=your_wallet_private_key_here
IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
```

3. **Compile contracts**
```bash
npm run compile
```

4. **Deploy to Irys Testnet**
```bash
npm run deploy:irys
```

### Deployment Output

Setelah deployment berhasil, Anda akan mendapatkan:
- Contract address
- Quest requirements verification
- Quest rewards verification
- Bet limits verification
- File `deployment-info.json` dengan semua informasi

## 📋 Smart Contract Functions

### Quest Functions
- `completeDailyLogin()` - Complete daily login quest
- `claimQuestReward(uint8 questType)` - Claim quest reward
- `canClaimQuestReward(address player, uint8 questType)` - Check if can claim
- `getQuestRewardAmount(address player, uint8 questType)` - Get reward amount
- `getPlayerQuestStatus(address player)` - Get quest status

### Game Functions
- `flip(bool guess)` - Place bet and flip coin
- `getPlayerData(address player)` - Get player statistics

### Owner Functions
- `setQuestRewardAmount(uint8 questType, uint256 amount)` - Set quest reward
- `setBetLimits(uint256 newMinBet, uint256 newMaxBet)` - Set bet limits
- `setHouseEdge(uint256 newHouseEdge)` - Set house edge
- `pause() / unpause()` - Pause/unpause contract
- `withdrawFunds(uint256 amount)` - Withdraw contract funds

## 🔧 Configuration

### Quest Requirements (Hardcoded)
```solidity
DAILY_FLIP_REQUIREMENT = 10;    // 10 flips per day
WEEKLY_FLIP_REQUIREMENT = 50;   // 50 flips per week
MONTHLY_STREAK_REQUIREMENT = 30; // 30 days login streak
```

### Quest Rewards (Configurable)
```solidity
questRewardAmounts[DAILY_LOGIN] = 0.01 ether;
questRewardAmounts[DAILY_FLIP] = 0.02 ether;
questRewardAmounts[WEEKLY_FLIPS] = 0.05 ether;
questRewardAmounts[MONTHLY_STREAK] = 0.1 ether;
```

### Bet Limits (Configurable)
```solidity
minBetAmount = 0.001 ether;  // 0.001 IRYS
maxBetAmount = 0.1 ether;    // 0.1 IRYS
houseEdge = 500;             // 5% (500 basis points)
```

## 🌍 Zona Waktu

Sistem reset menggunakan zona waktu user secara otomatis:
- Deteksi zona waktu browser
- Convert ke 12:00 AM UTC untuk konsistensi
- Reset otomatis tanpa refresh halaman

## 🔄 Auto-Complete System

### Daily Login Auto-Complete
- Deteksi otomatis setiap 2 menit
- Auto-complete jika belum dilakukan
- Notifikasi "🤖 AUTO-COMPLETED DAILY LOGIN!"

### Reset Otomatis
- Daily reset: Setiap hari jam 12:00 AM
- Weekly reset: Setiap Senin jam 12:00 AM
- Monthly reset: Setiap tanggal 1 jam 12:00 AM

## 📊 Monitoring

### Console Logs
```javascript
// Auto-detect logs
🔍 Auto-detecting daily login status...
✅ Daily login already completed today

// Auto-complete logs
🚀 Attempting auto-complete daily login...
🎉 Auto-complete daily login successful!

// Reset logs
🕛 Daily reset detected - resetting daily quests
🔄 Daily reset completed - daily quests refreshed
```

### Status Tracking
- Real-time quest progress
- Auto-refresh setiap 30 detik
- Status claimable otomatis update

## 🛡️ Security Features

- **ReentrancyGuard**: Mencegah reentrancy attacks
- **Pausable**: Contract dapat di-pause jika diperlukan
- **Ownable**: Hanya owner yang bisa mengubah konfigurasi
- **Input Validation**: Validasi semua input user
- **Safe Math**: Menggunakan Solidity 0.8+ built-in overflow protection

## 🧪 Testing

```bash
# Run tests
npm run test

# Run specific test
npx hardhat test test/OnchainCoinflip.test.js
```

## 📝 License

MIT License - lihat file LICENSE untuk detail.

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📞 Support

Jika ada pertanyaan atau masalah:
- Buat issue di GitHub
- Hubungi developer di Twitter: @mcdaoxyz

---

**Made with ❤️ for Irys Community**
