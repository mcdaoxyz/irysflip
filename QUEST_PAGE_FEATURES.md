# Quest Page Features

## Overview
Halaman quest terpisah telah dibuat untuk memberikan pengalaman yang lebih fokus dan dedicated untuk sistem quest. User dapat mengakses quest page melalui tombol "🎯 QUEST" di dashboard.

## Fitur Baru

### 🎯 Quest Page Navigation
- **Tombol Quest**: Tombol "🎯 QUEST" di sebelah tombol "Disconnect" ketika wallet terhubung
- **Wallet Required**: Quest hanya bisa diakses ketika wallet terhubung
- **Dedicated Page**: Halaman quest terpisah dengan UI yang lebih lengkap
- **Back Navigation**: Tombol "BACK" untuk kembali ke dashboard
- **Wallet Persistence**: Wallet connection tetap terjaga saat kembali dari quest page
- **Responsive Design**: UI yang responsif untuk berbagai ukuran layar

### 📊 Quest Statistics Dashboard
- **Login Streak**: Menampilkan streak login harian
- **Flip Streak**: Menampilkan streak flip harian  
- **Weekly Progress**: Progress flips mingguan (0/7)
- **Monthly Progress**: Progress streak bulanan (0/30)

### 🎨 Enhanced Quest Cards
- **Larger Cards**: Quest cards yang lebih besar dan mudah dibaca
- **Detailed Info**: Informasi lengkap untuk setiap quest
- **Progress Bars**: Visual progress bars untuk weekly dan monthly quests
- **Color Coding**: 
  - 🟢 Hijau = Completed
  - 🟡 Kuning = Can Claim
  - ⚫ Abu-abu = Unavailable

### 💰 Reward System
- **Available Rewards**: Menampilkan total rewards yang tersedia
- **Individual Rewards**: Reward per quest ditampilkan dengan jelas
- **Popup Notifications**: Notifikasi animasi saat quest selesai
- **Real-time Updates**: Update otomatis saat quest status berubah

## Technical Implementation

### Files Created/Modified
- `src/QuestPage.jsx` - Dedicated quest page component
- `src/App.jsx` - Navigation logic, state management, dan wallet persistence
- `src/DashboardOnchain.jsx` - Added quest button, wallet state management, dan removed old quest panel

### Navigation Flow
```javascript
// App.jsx - State management dengan wallet persistence
const [currentPage, setCurrentPage] = useState('dashboard');
const [walletAddress, setWalletAddress] = useState(null);
const [walletProvider, setWalletProvider] = useState(null);
const [walletSigner, setWalletSigner] = useState(null);
const [irysUploader, setIrysUploader] = useState(null);

// Navigation handlers
const handleGoToQuest = () => setCurrentPage('quest');
const handleBackToDashboard = () => setCurrentPage('dashboard');

// Wallet management
const handleWalletConnected = (address, provider, signer, irys) => {
  setWalletAddress(address);
  setWalletProvider(provider);
  setWalletSigner(signer);
  setIrysUploader(irys);
};
```

### Quest Page Features
```javascript
// QuestPage.jsx - Main features
- Quest statistics dashboard
- Individual quest cards
- Claim functionality
- Progress tracking
- Reward notifications
- Wallet access validation
```

## UI Components

### Header Section
- **Title**: "🎯 QUEST CENTER"
- **Back Button**: Navigasi kembali ke dashboard (dengan wallet persistence)
- **Wallet Info**: Informasi wallet yang terhubung
- **Available Rewards**: Total rewards yang bisa di-claim

### Statistics Grid
- **4 Stats Cards**: Login streak, flip streak, weekly progress, monthly progress
- **Visual Icons**: Emoji icons untuk setiap statistik
- **Real-time Data**: Data yang update secara real-time

### Quest Cards
- **Daily Login**: Manual claim dengan tombol "CLAIM"
- **Daily Flip**: Manual claim dengan tombol "CLAIM"
- **Weekly Flips**: Progress bar dengan status "IN PROGRESS"
- **Monthly Streak**: Progress bar dengan status "IN PROGRESS"

## User Experience

### Navigation
1. **Dashboard**: User harus connect wallet terlebih dahulu
2. **Wallet Connected**: Tombol "🎯 QUEST" muncul di sebelah tombol "Disconnect"
3. **Click Quest**: User klik tombol quest untuk masuk ke quest page
4. **Quest Page**: User melihat semua quest dengan detail lengkap
5. **Claim Rewards**: User bisa claim rewards yang tersedia
6. **Back to Dashboard**: User klik "BACK" untuk kembali (wallet tetap terhubung)

### Quest Management
- **Manual Claims**: User harus manual claim quest rewards
- **Progress Tracking**: Visual progress untuk quest yang membutuhkan progress
- **Streak Display**: Menampilkan streak untuk setiap quest
- **Reward Notifications**: Popup animasi saat quest selesai

### Wallet Persistence
- **State Management**: Wallet state dikelola di level App.jsx
- **Props Passing**: Wallet state diteruskan ke DashboardOnchain sebagai props
- **Connection Maintained**: Wallet connection tetap terjaga saat navigasi antar halaman
- **Auto Reconnection**: Tidak perlu connect ulang saat kembali dari quest page

## Benefits

1. **Focused Experience**: Halaman dedicated untuk quest management
2. **Better Organization**: Quest terpisah dari game interface
3. **Enhanced UI**: UI yang lebih besar dan mudah dibaca
4. **Clear Navigation**: Navigasi yang jelas antara dashboard dan quest
5. **Statistics Overview**: Overview lengkap untuk semua quest progress
6. **Seamless Experience**: Wallet connection tidak terputus saat navigasi

## Future Enhancements

1. **Quest History**: Riwayat quest yang sudah selesai
2. **Achievement Badges**: Badge untuk milestone tertentu
3. **Social Features**: Share achievements ke social media
4. **Leaderboard**: Global leaderboard untuk quest completion
5. **Special Events**: Limited time quests dengan rewards lebih besar
6. **Quest Categories**: Kategorisasi quest berdasarkan difficulty

## Configuration

### Quest Button Styling
```javascript
// Dashboard quest button (sebelah Disconnect, hanya muncul ketika wallet terhubung)
style={{
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 11,
  background: "#222",
  color: "#16f06c",
  border: "2px solid #16f06c",
  borderRadius: 6,
  padding: "5px 12px",
  cursor: "pointer",
  boxShadow: "0 2px 0 #111",
  transition: "0.2s"
}}
```

### Quest Page Layout
```javascript
// Quest page structure
- Header with title and back button
- Wallet info and available rewards
- Statistics grid (4 cards)
- Quest cards (4 quests)
- Reward notification popup
```

### Wallet State Management
```javascript
// App.jsx - Centralized wallet state
const [walletAddress, setWalletAddress] = useState(null);
const [walletProvider, setWalletProvider] = useState(null);
const [walletSigner, setWalletSigner] = useState(null);
const [irysUploader, setIrysUploader] = useState(null);

// Props passed to DashboardOnchain
<DashboardOnchain 
  onGoToQuest={handleGoToQuest}
  onWalletConnected={handleWalletConnected}
  onWalletDisconnected={handleWalletDisconnected}
  walletAddress={walletAddress}
  walletProvider={walletProvider}
  walletSigner={walletSigner}
  irysUploader={irysUploader}
/>
```

## Testing Checklist

- [ ] Tombol quest muncul di dashboard
- [ ] Klik tombol quest membuka quest page
- [ ] Quest page menampilkan semua quest dengan benar
- [ ] Claim buttons berfungsi untuk quest yang available
- [ ] Progress bars update real-time
- [ ] Statistics grid menampilkan data yang benar
- [ ] Back button kembali ke dashboard
- [ ] Wallet connection tetap terjaga saat kembali dari quest page
- [ ] Reward notifications muncul saat quest selesai
- [ ] Wallet info ditampilkan dengan benar
- [ ] Responsive design bekerja di berbagai ukuran layar 