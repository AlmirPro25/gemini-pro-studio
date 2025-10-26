// Storage utilities with size limits and error handling

const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB (safe limit for localStorage)

export const safeLocalStorage = {
  setItem: (key: string, value: any): boolean => {
    try {
      const serialized = JSON.stringify(value);
      const size = new Blob([serialized]).size;
      
      if (size > MAX_STORAGE_SIZE) {
        console.warn(`Storage limit exceeded for key "${key}". Size: ${size} bytes`);
        
        // Try to clean up old data
        if (key === 'proxChatHistory') {
          // Keep only last 20 chats
          const chats = Array.isArray(value) ? value.slice(0, 20) : value;
          localStorage.setItem(key, JSON.stringify(chats));
          return true;
        }
        
        return false;
      }
      
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Clearing old data...');
        // Clear oldest chats
        try {
          const oldData = localStorage.getItem(key);
          if (oldData && key === 'proxChatHistory') {
            const chats = JSON.parse(oldData);
            if (Array.isArray(chats)) {
              const reducedChats = chats.slice(0, 10);
              localStorage.setItem(key, JSON.stringify(reducedChats));
              return true;
            }
          }
        } catch (e) {
          console.error('Failed to recover from quota error:', e);
        }
      }
      console.error(`Failed to save to localStorage:`, error);
      return false;
    }
  },

  getItem: <T = any>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to read from localStorage:`, error);
      return defaultValue;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage:`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Failed to clear localStorage:`, error);
    }
  },

  getStorageSize: (): number => {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  },
};
