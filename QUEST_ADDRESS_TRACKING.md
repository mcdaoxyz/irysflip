# Quest Address Tracking System

## Overview
The IrysFlip quest system now includes address-based quest completion tracking that allows quest completion status to be detected across different browsers for the same wallet address.

## How It Works

### Quest Completion Tracking
When a quest is completed, the system stores the completion status in localStorage using a unique key that includes:
- The wallet address
- The quest type
- The completion date (UTC)

### Storage Format
Quest completion data is stored in localStorage with keys like:
```
quest_completion_0x1234...5678_0_2024-01-15
quest_completion_0x1234...5678_1_2024-01-15
quest_completion_0x1234...5678_2_2024-01-15
quest_completion_0x1234...5678_3_2024-01-15
```

Where:
- `0x1234...5678` = Wallet address
- `0` = Daily Login quest
- `1` = Daily Flip quest  
- `2` = Weekly Flips quest
- `3` = Monthly Streak quest
- `2024-01-15` = Completion date (UTC)

## Key Functions

### Quest Completion Tracking
- `markQuestCompleted(address, questType, date)` - Marks a quest as completed for an address
- `isQuestCompletedForAddress(address, questType, date)` - Checks if a quest is completed for an address
- `markDailyQuestsCompleted(address, questData)` - Marks all daily quests as completed for an address

### Data Synchronization
- `syncQuestDataWithCompletionTracking(data, address)` - Syncs local quest data with completion tracking
- `getQuestCompletionsForAddress(address)` - Gets all quest completions for an address

### Maintenance
- `cleanupOldQuestCompletions()` - Removes quest completion data older than 30 days

## Integration Points

### Automatic Tracking
Quest completion is automatically tracked when:
1. **Daily Login Quest**: Completed via `completeDailyLogin()` function
2. **Daily Flip Quest**: Completed via `recordFlip()` function when 10 flips are reached
3. **Weekly Flips Quest**: Completed via `recordFlip()` function when 7 flips are reached
4. **Monthly Streak Quest**: Completed when streak reaches 30 days

### Cross-Browser Detection
When a user connects their wallet in a different browser:
1. The system checks for existing quest completions for that address
2. If quests are found as completed, they are marked as completed in the local quest data
3. The user sees the correct quest completion status immediately

## Benefits

1. **Cross-Browser Consistency**: Quest completion status is preserved across different browsers
2. **Automatic Detection**: No manual intervention needed when switching browsers
3. **Data Persistence**: Quest completion data persists in localStorage
4. **Automatic Cleanup**: Old completion data is automatically cleaned up after 30 days

## Testing

### Debug Function
Use the "DEBUG" button in the QuestPage header to:
- View current quest completion status for the connected address
- See which quests are marked as completed for today
- Verify that the tracking system is working correctly

### Manual Testing
1. Complete a quest in one browser
2. Open the same wallet in a different browser
3. Navigate to the QuestPage
4. The quest should show as completed automatically

## Technical Details

### UTC Date Handling
All completion dates use UTC format (`YYYY-MM-DD`) to ensure consistency across timezones.

### Storage Limits
- Quest completion data is stored in localStorage
- Data older than 30 days is automatically cleaned up
- Each completion entry is approximately 50-100 bytes

### Error Handling
- Functions gracefully handle missing wallet addresses
- Console logging provides debugging information
- Failed operations don't break the main quest system

## Example Usage

```javascript
// Mark a quest as completed
markQuestCompleted('0x1234...5678', QUEST_TYPES.DAILY_LOGIN);

// Check if quest is completed
const isCompleted = isQuestCompletedForAddress('0x1234...5678', QUEST_TYPES.DAILY_LOGIN);

// Sync quest data with completion tracking
const syncedData = syncQuestDataWithCompletionTracking(questData, walletAddress);
``` 