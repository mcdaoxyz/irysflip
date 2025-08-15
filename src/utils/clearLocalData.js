// Utility to clear all local storage quest data
export function clearAllLocalQuestData() {
  try {
    // Clear all quest-related localStorage data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('quest') || 
        key.includes('daily') || 
        key.includes('weekly') || 
        key.includes('monthly') || 
        key.includes('streak') || 
        key.includes('flip') || 
        key.includes('login') ||
        key.includes('reward') ||
        key.includes('virtual') ||
        key.includes('balance') ||
        key.includes('earned') ||
        key.includes('claim')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed local storage key: ${key}`);
    });
    
    console.log('All local quest data cleared successfully');
    return { success: true, message: 'All local quest data cleared successfully!' };
  } catch (error) {
    console.error('Error clearing local quest data:', error);
    return { success: false, message: 'Failed to clear local quest data: ' + error.message };
  }
}

// Auto-clear on import - only in browser environment
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    clearAllLocalQuestData();
  } catch (error) {
    console.warn('Auto-clear failed:', error);
  }
} 