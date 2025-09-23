// نظام قاعدة البيانات المحلية باستخدام IndexedDB
class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbName = 'POS_Database';
    this.version = 1;
  }

  // تهيئة قاعدة البيانات
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('خطأ في فتح قاعدة البيانات:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('تم فتح قاعدة البيانات بنجاح');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // إنشاء جداول البيانات
        this.createStores(db);
      };
    });
  }

  // إنشاء جداول البيانات
  createStores(db) {
    // جدول المنتجات
    if (!db.objectStoreNames.contains('products')) {
      const productsStore = db.createObjectStore('products', { keyPath: 'id' });
      productsStore.createIndex('name', 'name', { unique: false });
      productsStore.createIndex('category', 'category', { unique: false });
      productsStore.createIndex('barcode', 'barcode', { unique: true });
    }

    // جدول التصنيفات
    if (!db.objectStoreNames.contains('categories')) {
      const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
      categoriesStore.createIndex('name', 'name', { unique: true });
    }

    // جدول العملاء
    if (!db.objectStoreNames.contains('customers')) {
      const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
      customersStore.createIndex('name', 'name', { unique: false });
      customersStore.createIndex('phone', 'phone', { unique: true });
      customersStore.createIndex('email', 'email', { unique: true });
    }

    // جدول المبيعات
    if (!db.objectStoreNames.contains('sales')) {
      const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
      salesStore.createIndex('date', 'date', { unique: false });
      salesStore.createIndex('customerId', 'customerId', { unique: false });
      salesStore.createIndex('shiftId', 'shiftId', { unique: false });
    }

    // جدول الورديات
    if (!db.objectStoreNames.contains('shifts')) {
      const shiftsStore = db.createObjectStore('shifts', { keyPath: 'id' });
      shiftsStore.createIndex('startTime', 'startTime', { unique: false });
      shiftsStore.createIndex('status', 'status', { unique: false });
    }

    // جدول المرتجعات
    if (!db.objectStoreNames.contains('returns')) {
      const returnsStore = db.createObjectStore('returns', { keyPath: 'id' });
      returnsStore.createIndex('saleId', 'saleId', { unique: false });
      returnsStore.createIndex('date', 'date', { unique: false });
    }

    // جدول المستخدمين
    if (!db.objectStoreNames.contains('users')) {
      const usersStore = db.createObjectStore('users', { keyPath: 'id' });
      usersStore.createIndex('username', 'username', { unique: true });
      usersStore.createIndex('email', 'email', { unique: true });
    }

    // جدول الإعدادات
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'key' });
    }

    // جدول النسخ الاحتياطية
    if (!db.objectStoreNames.contains('backups')) {
      const backupsStore = db.createObjectStore('backups', { keyPath: 'id' });
      backupsStore.createIndex('date', 'date', { unique: false });
      backupsStore.createIndex('type', 'type', { unique: false });
    }
  }

  // إضافة بيانات
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // تحديث بيانات
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // حذف بيانات
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // الحصول على بيانات
  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // الحصول على جميع البيانات
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // البحث في البيانات
  async search(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // الحصول على البيانات بفلترة
  async getByRange(storeName, indexName, range) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // إنشاء نسخة احتياطية
  async createBackup(type = 'full') {
    try {
      const backupData = {
        id: `backup_${Date.now()}`,
        type,
        date: new Date().toISOString(),
        data: {}
      };

      // نسخ جميع الجداول
      const stores = ['products', 'categories', 'customers', 'sales', 'shifts', 'returns', 'users', 'settings'];
      
      for (const store of stores) {
        try {
          backupData.data[store] = await this.getAll(store);
        } catch (error) {
          console.warn(`خطأ في نسخ جدول ${store}:`, error);
          backupData.data[store] = [];
        }
      }

      // حفظ النسخة الاحتياطية
      await this.add('backups', backupData);
      
      return backupData;
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
      throw error;
    }
  }

  // استعادة نسخة احتياطية
  async restoreBackup(backupId) {
    try {
      const backup = await this.get('backups', backupId);
      if (!backup) {
        throw new Error('النسخة الاحتياطية غير موجودة');
      }

      // استعادة البيانات
      for (const [storeName, data] of Object.entries(backup.data)) {
        if (data && data.length > 0) {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          
          // مسح البيانات الموجودة
          await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
          });

          // إضافة البيانات الجديدة
          for (const item of data) {
            await new Promise((resolve, reject) => {
              const addRequest = store.add(item);
              addRequest.onsuccess = () => resolve();
              addRequest.onerror = () => reject(addRequest.error);
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('خطأ في استعادة النسخة الاحتياطية:', error);
      throw error;
    }
  }

  // الحصول على قائمة النسخ الاحتياطية
  async getBackups() {
    return await this.getAll('backups');
  }

  // حذف نسخة احتياطية
  async deleteBackup(backupId) {
    return await this.delete('backups', backupId);
  }

  // تصدير البيانات
  async exportData() {
    const exportData = {};
    const stores = ['products', 'categories', 'customers', 'sales', 'shifts', 'returns', 'users', 'settings'];
    
    for (const store of stores) {
      try {
        exportData[store] = await this.getAll(store);
      } catch (error) {
        console.warn(`خطأ في تصدير جدول ${store}:`, error);
        exportData[store] = [];
      }
    }

    return exportData;
  }

  // استيراد البيانات
  async importData(data) {
    try {
      for (const [storeName, items] of Object.entries(data)) {
        if (items && items.length > 0) {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          
          for (const item of items) {
            await new Promise((resolve, reject) => {
              const request = store.put(item);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            });
          }
        }
      }
      return true;
    } catch (error) {
      console.error('خطأ في استيراد البيانات:', error);
      throw error;
    }
  }

  // إحصائيات قاعدة البيانات
  async getStats() {
    const stats = {};
    const stores = ['products', 'categories', 'customers', 'sales', 'shifts', 'returns', 'users'];
    
    for (const store of stores) {
      try {
        const data = await this.getAll(store);
        stats[store] = data.length;
      } catch (error) {
        stats[store] = 0;
      }
    }

    return stats;
  }

  // تنظيف قاعدة البيانات
  async cleanup() {
    try {
      const stores = ['products', 'categories', 'customers', 'sales', 'shifts', 'returns', 'users', 'settings'];
      
      for (const store of stores) {
        const transaction = this.db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore(store);
        
        await new Promise((resolve, reject) => {
          const request = objectStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      return true;
    } catch (error) {
      console.error('خطأ في تنظيف قاعدة البيانات:', error);
      throw error;
    }
  }
}

// إنشاء مثيل واحد من مدير قاعدة البيانات
const databaseManager = new DatabaseManager();

export default databaseManager;