import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { NotificationProvider } from "./components/NotificationSystem";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Shifts from "./pages/Shifts";
import UserProfile from "./components/UserProfile";
import LoginForm from "./components/LoginForm"; // Added LoginForm
import { observerManager } from "./utils/observerManager"; // إضافة مدير المراقبين
import { DataValidator, StorageMonitor } from "./utils/dataValidation"; // إضافة نظام التحقق
import DataLoader from "./components/DataLoader"; // إضافة محمل البيانات
import databaseManager from "./utils/database"; // إضافة مدير قاعدة البيانات
import { getCurrentDate, cleanExistingData } from './utils/dateUtils.js';
import { subscribe, EVENTS } from "./utils/observerManager";

function App() {
  const navigate = useNavigate();

  // تهيئة نظام التحقق من البيانات
  useEffect(() => {
    // تهيئة قاعدة البيانات أولاً
    const initDatabase = async () => {
      try {
        await databaseManager.init();
        await databaseManager.ensureStoresExist();
        
        // تنظيف البيانات الموجودة من التواريخ الهجرية
        cleanExistingData();
        // تم تهيئة قاعدة البيانات بنجاح
      } catch (error) {
        console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
      }
    };
    
    // إعادة تعيين المستخدمين الافتراضيين
    const resetUsers = () => {
      const defaultUsers = [
        {
          id: 1,
          name: 'admin',
          email: 'admin@elkingstore.com',
          phone: '01234567890',
          role: 'admin',
          status: 'active',
          password: btoa('Admin@2024!'), // كلمة مرور أقوى
          createdAt: getCurrentDate(),
          lastLogin: getCurrentDate()
        },
        {
          id: 2,
          name: 'سارة أحمد',
          email: 'sara@elkingstore.com',
          phone: '01234567891',
          role: 'manager',
          status: 'active',
          password: btoa('Sara@2024!'), // كلمة مرور أقوى
          createdAt: getCurrentDate(),
          lastLogin: getCurrentDate()
        },
        {
          id: 3,
          name: 'محمد علي',
          email: 'mohamed@elkingstore.com',
          phone: '01234567892',
          role: 'cashier',
          status: 'active',
          password: btoa('Mohamed@2024!'), // كلمة مرور أقوى
          createdAt: getCurrentDate(),
          lastLogin: getCurrentDate()
        },
        {
          id: 4,
          name: 'نورا حسن',
          email: 'nora@elkingstore.com',
          phone: '01234567893',
          role: 'cashier',
          status: 'active',
          password: btoa('Nora@2024!'), // كلمة مرور أقوى
          createdAt: getCurrentDate(),
          lastLogin: getCurrentDate()
        },
        {
          id: 5,
          name: 'خالد محمود',
          email: 'khaled@elkingstore.com',
          phone: '01234567894',
          role: 'manager',
          status: 'active',
          password: btoa('Khaled@2024!'), // كلمة مرور أقوى
          createdAt: getCurrentDate(),
          lastLogin: getCurrentDate()
        }
      ];
      
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      // تم إعادة تعيين المستخدمين الافتراضيين
    };
    
    initDatabase();
    // لا تُعدِّ ضبط المستخدمين إذا كانت بياناتهم موجودة بالفعل
    try {
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
        resetUsers();
      } else {
        // تم العثور على مستخدمين محفوظين - لن يتم إعادة تعيينهم
      }
    } catch (e) {
      // في حال كانت البيانات تالفة، نعيد ضبطها مرة واحدة
      console.warn('⚠️ بيانات المستخدمين تالفة - سيتم إعادة تعيينها');
      resetUsers();
    }
    
    // تهيئة مراقب التخزين
    StorageMonitor.init();

    // التحقق من صحة البيانات عند بدء التطبيق
    const validation = DataValidator.validateStoredData();
    if (!validation.isValid) {
      console.warn('تم اكتشاف مشاكل في البيانات:', validation.errors);
      // محاولة إصلاح البيانات تلقائياً
      const repaired = DataValidator.repairData();
      if (repaired) {
        console.log('تم إصلاح البيانات بنجاح');
      } else {
        console.error('فشل في إصلاح البيانات');
      }
    }

    // إنشاء نسخة احتياطية دورية
    const backupInterval = setInterval(() => {
      DataValidator.createBackup();
    }, 60000); // كل دقيقة

    // تنظيف البيانات القديمة يومياً
    const cleanupInterval = setInterval(() => {
      DataValidator.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // كل 24 ساعة

    return () => {
      clearInterval(backupInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (event) => {
      // التحقق من أن المستخدم لا يكتب في حقل نص
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // اختصارات التنقل
      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            navigate('/');
            break;
          case '2':
            event.preventDefault();
            navigate('/pos');
            break;
          case '3':
            event.preventDefault();
            navigate('/products');
            break;
          case '4':
            event.preventDefault();
            navigate('/reports');
            break;
          case '5':
            event.preventDefault();
            navigate('/customers');
            break;
          case '6':
            event.preventDefault();
            navigate('/settings');
            break;
          case '7':
            event.preventDefault();
            navigate('/shifts');
            break;
          default:
            break;
        }
      }

      // اختصارات إضافية
      if (event.key === 'F1') {
        event.preventDefault();
        alert('اختصارات لوحة المفاتيح:\n\nCtrl+1: لوحة التحكم\nCtrl+2: نقطة البيع\nCtrl+3: المنتجات\nCtrl+4: التقارير\nCtrl+5: العملاء\nCtrl+6: الإعدادات\n\nF1: عرض هذه المساعدة');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // تهيئة مدير المراقبين - معطل لتجنب المشاكل
  useEffect(() => {
    // إيقاف جميع المراقبين نهائياً
    observerManager.stopAll();
  }, []);

  // تحديث تلقائي للتنقل/البيانات عند بدء/إنهاء الوردية بدون رفرش يدوي
  useEffect(() => {
    const onShiftStart = () => {
      try {
        // إعادة تحميل بيانات الصفحة الحالية بشكل لطيف
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'shift' } }));
      } catch(_) {}
      // إعادة تحميل كاملة لضمان تطبيق جميع التبعيات عبر الصفحات
      try {
        const key = 'lastShiftAutoReload';
        const now = Date.now();
        const prev = Number(sessionStorage.getItem(key) || 0);
        if (now - prev > 500) {
          sessionStorage.setItem(key, String(now));
          setTimeout(() => { window.location.reload(); }, 150);
        }
      } catch(_) {}
    };
    const onShiftEnd = () => {
      try {
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'shift' } }));
      } catch(_) {}
      // إن كنا على صفحة نقطة البيع، انتقل للوحة التحكم لأن الوردية انتهت
      try {
        const active = JSON.parse(localStorage.getItem('activeShift') || 'null');
        if (!active || active.status !== 'active') {
          navigate('/');
        }
      } catch(_) {}
      // إعادة تحميل كاملة لضمان اختفاء البيانات المرتبطة بالوردية فوراً من كل الصفحات
      try {
        const key = 'lastShiftAutoReload';
        const now = Date.now();
        const prev = Number(sessionStorage.getItem(key) || 0);
        if (now - prev > 500) {
          sessionStorage.setItem(key, String(now));
          setTimeout(() => { window.location.reload(); }, 150);
        }
      } catch(_) {}
    };
    window.addEventListener('shiftStarted', onShiftStart);
    window.addEventListener('shiftEnded', onShiftEnd);
    return () => {
      window.removeEventListener('shiftStarted', onShiftStart);
      window.removeEventListener('shiftEnded', onShiftEnd);
    };
  }, [navigate]);

  // تحديث كامل تلقائي بعد أي تعديل بيانات عام (منتجات/فئات/عملاء/فواتير/إعدادات)
  useEffect(() => {
    const safeReload = () => {
      try {
        // منع إعادة التحميل أثناء عرض ملخص الفاتورة/الطباعة
        const suppressUntil = Number(sessionStorage.getItem('suppressGlobalReloadUntil') || 0);
        const nowTs = Date.now();
        if (nowTs < suppressUntil) {
          return; // لا تُعد التحميل الآن
        }
        // لا تُعد التحميل إلا إذا سُمح بذلك صراحةً
        const allow = sessionStorage.getItem('allowGlobalReload');
        if (allow !== 'true') {
          return;
        }
        const key = 'lastGlobalAutoReload';
        const now = Date.now();
        const prev = Number(sessionStorage.getItem(key) || 0);
        if (now - prev > 300) {
          sessionStorage.setItem(key, String(now));
          setTimeout(() => { window.location.reload(); }, 120);
        }
      } catch(_) {}
    };

    // الاشتراك بقناة الأحداث الموحدة
    const unsubs = [
      subscribe?.(EVENTS.PRODUCTS_CHANGED, safeReload),
      subscribe?.(EVENTS.CATEGORIES_CHANGED, safeReload),
      subscribe?.(EVENTS.CUSTOMERS_CHANGED, safeReload),
      subscribe?.(EVENTS.INVOICES_CHANGED, safeReload),
      subscribe?.(EVENTS.SHIFTS_CHANGED, safeReload),
      subscribe?.(EVENTS.SETTINGS_CHANGED, safeReload),
      subscribe?.(EVENTS.DATA_IMPORTED, safeReload)
    ].filter(Boolean);

    // التخزين المحلي عبر التبويبات
    const onStorage = (e) => {
      if (!e || !e.key) return;
      const keys = ['products', 'productCategories', 'customers', 'sales', 'users', 'pos-settings'];
      if (keys.includes(e.key) || (e.key.startsWith('__evt__:'))) {
        safeReload();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      unsubs.forEach((fn) => { if (typeof fn === 'function') fn(); });
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <DataLoader>
      <NotificationProvider>
        <AuthProvider>
          <div className="flex h-screen overflow-hidden bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full ipad-main-content ipad-pro-main-content">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/pos" element={
                <ProtectedRoute requiredPermission="pos_access">
                  <POS />
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute requiredPermission="manage_products">
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute requiredPermission="view_reports">
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute requiredPermission="customer_access">
                  <Customers />
                </ProtectedRoute>
              } />
              <Route path="/shifts" element={
                <ProtectedRoute requiredPermission="manage_shifts">
                  <Shifts />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
          </div>
        </AuthProvider>
      </NotificationProvider>
    </DataLoader>
  );
}

export default App;