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

function App() {
  const navigate = useNavigate();

  // تهيئة نظام التحقق من البيانات
  useEffect(() => {
    // تهيئة قاعدة البيانات أولاً
    const initDatabase = async () => {
      try {
        await databaseManager.init();
        console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
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
          password: btoa('admin123'),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          id: 2,
          name: 'سارة أحمد',
          email: 'sara@elkingstore.com',
          phone: '01234567891',
          role: 'manager',
          status: 'active',
          password: btoa('sara123'),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          id: 3,
          name: 'محمد علي',
          email: 'mohamed@elkingstore.com',
          phone: '01234567892',
          role: 'cashier',
          status: 'active',
          password: btoa('mohamed123'),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          id: 4,
          name: 'نورا حسن',
          email: 'nora@elkingstore.com',
          phone: '01234567893',
          role: 'cashier',
          status: 'active',
          password: btoa('nora123'),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          id: 5,
          name: 'خالد محمود',
          email: 'khaled@elkingstore.com',
          phone: '01234567894',
          role: 'manager',
          status: 'active',
          password: btoa('khaled123'),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      console.log('✅ تم إعادة تعيين المستخدمين الافتراضيين');
    };
    
    initDatabase();
    resetUsers();
    
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

  return (
    <DataLoader>
      <AuthProvider>
        <NotificationProvider>
          <div className="flex h-screen overflow-hidden bg-gray-900">
            <Sidebar />
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 max-w-full">
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
        </NotificationProvider>
      </AuthProvider>
    </DataLoader>
  );
}

export default App;