// Database Service para Frontend
// Usa IndexedDB para armazenamento local no navegador

interface DBSchema {
  chats: {
    key: string;
    value: {
      id: string;
      title: string;
      messages: any[];
      createdAt: number;
      updatedAt: number;
      generationConfig?: any;
    };
  };
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      chats: any[];
      files: any[];
      libraryItems: any[];
      createdAt: number;
      updatedAt: number;
    };
  };
  library: {
    key: string;
    value: {
      id: string;
      name: string;
      type: string;
      content: any;
      createdAt: number;
      updatedAt: number;
    };
  };
  images: {
    key: string;
    value: {
      id: string;
      prompt: string;
      imageData: string;
      mimeType: string;
      createdAt: number;
      metadata?: any;
    };
  };
  personas: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      systemPrompt: string;
      createdAt: number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  team_members: {
    key: string;
    value: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      department: string;
      permissions: string[];
      commission_rate: number;
      monthly_goal: number;
      status: 'active' | 'inactive' | 'vacation';
      hire_date: string;
      avatar?: string;
      createdAt: number;
      updatedAt: number;
    };
  };
  team_performance: {
    key: string;
    value: {
      id: string;
      member_id: string;
      month: string;
      sales_count: number;
      revenue: number;
      commission: number;
      goal_completion: number;
      rating: number;
      notes?: string;
      createdAt: number;
    };
  };
}

class DatabaseService {
  private dbName = 'GeminiProStudio';
  private version = 2;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar object stores se não existirem
        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          chatStore.createIndex('createdAt', 'createdAt', { unique: false });
          chatStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('createdAt', 'createdAt', { unique: false });
          projectStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('library')) {
          const libraryStore = db.createObjectStore('library', { keyPath: 'id' });
          libraryStore.createIndex('type', 'type', { unique: false });
          libraryStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('createdAt', 'createdAt', { unique: false });
          imageStore.createIndex('prompt', 'prompt', { unique: false });
        }

        if (!db.objectStoreNames.contains('personas')) {
          const personaStore = db.createObjectStore('personas', { keyPath: 'id' });
          personaStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('team_members')) {
          const teamStore = db.createObjectStore('team_members', { keyPath: 'id' });
          teamStore.createIndex('email', 'email', { unique: true });
          teamStore.createIndex('role', 'role', { unique: false });
          teamStore.createIndex('status', 'status', { unique: false });
          teamStore.createIndex('department', 'department', { unique: false });
        }

        if (!db.objectStoreNames.contains('team_performance')) {
          const perfStore = db.createObjectStore('team_performance', { keyPath: 'id' });
          perfStore.createIndex('member_id', 'member_id', { unique: false });
          perfStore.createIndex('month', 'month', { unique: false });
          perfStore.createIndex('member_month', ['member_id', 'month'], { unique: true });
        }
      };
    });
  }

  private getStore(storeName: keyof DBSchema, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // ==================== CHATS ====================

  async saveChat(chat: DBSchema['chats']['value']): Promise<void> {
    const store = this.getStore('chats', 'readwrite');
    chat.updatedAt = Date.now();
    return new Promise((resolve, reject) => {
      const request = store.put(chat);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getChat(id: string): Promise<DBSchema['chats']['value'] | undefined> {
    const store = this.getStore('chats');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllChats(): Promise<DBSchema['chats']['value'][]> {
    const store = this.getStore('chats');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChat(id: string): Promise<void> {
    const store = this.getStore('chats', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== PROJECTS ====================

  async saveProject(project: DBSchema['projects']['value']): Promise<void> {
    const store = this.getStore('projects', 'readwrite');
    project.updatedAt = Date.now();
    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProject(id: string): Promise<DBSchema['projects']['value'] | undefined> {
    const store = this.getStore('projects');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects(): Promise<DBSchema['projects']['value'][]> {
    const store = this.getStore('projects');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const store = this.getStore('projects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== LIBRARY ====================

  async saveLibraryItem(item: DBSchema['library']['value']): Promise<void> {
    const store = this.getStore('library', 'readwrite');
    item.updatedAt = Date.now();
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLibraryItem(id: string): Promise<DBSchema['library']['value'] | undefined> {
    const store = this.getStore('library');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLibraryItems(): Promise<DBSchema['library']['value'][]> {
    const store = this.getStore('library');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteLibraryItem(id: string): Promise<void> {
    const store = this.getStore('library', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== IMAGES ====================

  async saveImage(image: DBSchema['images']['value']): Promise<void> {
    const store = this.getStore('images', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(image);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllImages(): Promise<DBSchema['images']['value'][]> {
    const store = this.getStore('images');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(id: string): Promise<void> {
    const store = this.getStore('images', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== PERSONAS ====================

  async savePersona(persona: DBSchema['personas']['value']): Promise<void> {
    const store = this.getStore('personas', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(persona);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPersonas(): Promise<DBSchema['personas']['value'][]> {
    const store = this.getStore('personas');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePersona(id: string): Promise<void> {
    const store = this.getStore('personas', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== SETTINGS ====================

  async saveSetting(key: string, value: any): Promise<void> {
    const store = this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    const store = this.getStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== TEAM MEMBERS ====================

  async saveTeamMember(member: DBSchema['team_members']['value']): Promise<void> {
    const store = this.getStore('team_members', 'readwrite');
    member.updatedAt = Date.now();
    return new Promise((resolve, reject) => {
      const request = store.put(member);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTeamMember(id: string): Promise<DBSchema['team_members']['value'] | undefined> {
    const store = this.getStore('team_members');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTeamMembers(): Promise<DBSchema['team_members']['value'][]> {
    const store = this.getStore('team_members');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTeamMember(id: string): Promise<void> {
    const store = this.getStore('team_members', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== TEAM PERFORMANCE ====================

  async saveTeamPerformance(performance: DBSchema['team_performance']['value']): Promise<void> {
    const store = this.getStore('team_performance', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(performance);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTeamPerformance(memberId: string, month: string): Promise<DBSchema['team_performance']['value'] | undefined> {
    const store = this.getStore('team_performance');
    const index = store.index('member_month');
    return new Promise((resolve, reject) => {
      const request = index.get([memberId, month]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTeamPerformance(): Promise<DBSchema['team_performance']['value'][]> {
    const store = this.getStore('team_performance');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPerformanceByMember(memberId: string): Promise<DBSchema['team_performance']['value'][]> {
    const store = this.getStore('team_performance');
    const index = store.index('member_id');
    return new Promise((resolve, reject) => {
      const request = index.getAll(memberId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== UTILITIES ====================

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const storeNames: (keyof DBSchema)[] = ['chats', 'projects', 'library', 'images', 'personas', 'settings', 'team_members', 'team_performance'];
    
    for (const storeName of storeNames) {
      const store = this.getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async exportData(): Promise<string> {
    const data = {
      chats: await this.getAllChats(),
      projects: await this.getAllProjects(),
      library: await this.getAllLibraryItems(),
      images: await this.getAllImages(),
      personas: await this.getAllPersonas(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    if (data.chats) {
      for (const chat of data.chats) {
        await this.saveChat(chat);
      }
    }
    
    if (data.projects) {
      for (const project of data.projects) {
        await this.saveProject(project);
      }
    }
    
    if (data.library) {
      for (const item of data.library) {
        await this.saveLibraryItem(item);
      }
    }
    
    if (data.images) {
      for (const image of data.images) {
        await this.saveImage(image);
      }
    }
    
    if (data.personas) {
      for (const persona of data.personas) {
        await this.savePersona(persona);
      }
    }
  }

  async getStorageSize(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

// Singleton instance
export const dbService = new DatabaseService();

// Auto-initialize
dbService.init().catch(console.error);
