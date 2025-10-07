import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentDate } from '../utils/dateUtils.js';
import soundManager from '../utils/soundManager.js';
import { useNotifications } from './NotificationSystem.jsx';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const { notifyUserLogin, notifyUserLogout, notifyError } = useNotifications();

  // تشفير البيانات الحساسة - تحسين الأمان
  const encryptData = (data) => {
    try {
      const jsonString = JSON.stringify(data);
      // استخدام تشفير بسيط لكن أفضل من Base64
      const key = 'ElkingStore2024SecretKey!@#';
      let encrypted = '';
      for (let i = 0; i < jsonString.length; i++) {
        encrypted += String.fromCharCode(
          jsonString.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('خطأ في التشفير:', error);
      return null;
    }
  };

  // فك تشفير البيانات
  const decryptData = (encryptedData) => {
    try {
      const encrypted = atob(encryptedData);
      const key = 'ElkingStore2024SecretKey!@#';
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('خطأ في فك التشفير:', error);
      return null;
    }
  };

  // تسجيل العمليات الحساسة
  const logActivity = React.useCallback((action, details = {}) => {
    try {
      const logEntry = {
        timestamp: getCurrentDate(),
        action,
        details,
        user: user?.username || 'unknown'
      };
      
      // حفظ في localStorage مع تشفير
      const existingLogs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
      existingLogs.push(logEntry);
      
      // الاحتفاظ بآخر 1000 سجل فقط
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('activity_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('خطأ في تسجيل النشاط:', error);
    }
  }, [user]);

  // تسجيل الدخول
  const login = async (username, password) => {
    try {
      setLoading(true);
      
      // محاكاة تسجيل الدخول محلياً
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة تأخير الشبكة
      
      // التحقق من بيانات تسجيل الدخول - أولاً من المستخدمين المحفوظين
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = savedUsers.find(u => 
        u.name.toLowerCase() === username.toLowerCase() && 
        u.status === 'active'
      );
      
      let isValidUser = false;
      let userRole = 'cashier';
      let userEmail = '';
      
      if (user) {
        // فك تشفير كلمة المرور (بسيط)
        const decryptedPassword = atob(user.password || '');
        if (decryptedPassword === password) {
          isValidUser = true;
          userRole = user.role;
          userEmail = user.email;
        }
      } else {
        // التحقق من المستخدمين الافتراضيين
        const validCredentials = {
          'HassanElking': '200396',
          'admin': 'admin123',
          'cashier': 'cashier123',
          'manager': 'manager123'
        };
        
        if (validCredentials[username] && validCredentials[username] === password) {
          isValidUser = true;
          if (username === 'HassanElking') {
            userRole = 'admin';
            userEmail = 'hassan@elking.com';
          } else {
            userRole = username === 'admin' ? 'admin' : username === 'manager' ? 'manager' : 'cashier';
            userEmail = `${username}@mensfashion.com`;
          }
        }
      }
      
      if (!isValidUser) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      
      // إنشاء بيانات المستخدم
      const mockUser = {
        id: user ? user.id : Date.now(),
        username: username,
        email: userEmail,
        role: userRole,
        permissions: userRole === 'admin' 
          ? ['read', 'write', 'delete', 'admin', 'pos_access', 'manage_products', 'view_reports', 'customer_access', 'manage_shifts'] 
          : userRole === 'manager'
          ? ['read', 'write', 'delete', 'manage_products', 'view_reports', 'manage_shifts']
          : ['pos_access', 'customer_access', 'manage_shifts'],
        lastLogin: getCurrentDate(),
        avatar: `https://ui-avatars.com/api/?name=${username}&background=random&color=ffffff`
      };

      const mockToken = encryptData(mockUser);
      
      setUser(mockUser);
      setToken(mockToken);
      
      // حفظ في localStorage مع تشفير
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user_data', encryptData(mockUser));
      
      // تحديث آخر دخول في قاعدة بيانات المستخدمين
      if (user) {
        const updatedUsers = savedUsers.map(u => 
          u.id === user.id 
            ? { ...u, lastLogin: getCurrentDate() }
            : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }
      
      // تسجيل عملية تسجيل الدخول + إشعار
      logActivity('LOGIN', { username, success: true });
      try { notifyUserLogin(mockUser.username, mockUser.role); } catch(_) {}
      
      // تشغيل صوت تسجيل الدخول الناجح
      soundManager.play('login');
      
      return { success: true, user: mockUser };
    } catch (error) {
      // تسجيل محاولة تسجيل دخول فاشلة + إشعار
      logActivity('LOGIN_FAILED', { username, error: error.message });
      try { notifyError('فشل تسجيل الدخول', error.message); } catch(_) {}
      
      // تشغيل صوت تسجيل الدخول الفاشل
      soundManager.play('error');
      
      console.error('خطأ في تسجيل الدخول:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الخروج
  const logout = () => {
    // تشغيل صوت تسجيل الخروج
    soundManager.play('logout');
    
    // تسجيل عملية تسجيل الخروج + إشعار
    logActivity('LOGOUT', { username: user?.username });
    try { notifyUserLogout(user?.username || ''); } catch(_) {}
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  // التحقق من الصلاحيات
  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  // التحقق من الدور
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  // تحديث بيانات المستخدم
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user_data', encryptData(updatedUser));
    logActivity('PROFILE_UPDATE', { updates });
  };

  // تغيير كلمة المرور
  const changePassword = async (oldPassword, newPassword) => {
    try {
      // محاكاة تغيير كلمة المرور محلياً
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة تأخير الشبكة
      
      // التحقق من كلمة المرور القديمة
      const validCredentials = {
        'admin': 'Admin@2024!',
        'cashier': 'Cashier@2024!',
        'manager': 'Manager@2024!'
      };
      
      if (!user || !validCredentials[user.username] || validCredentials[user.username] !== oldPassword) {
        throw new Error('كلمة المرور القديمة غير صحيحة');
      }
      
      if (newPassword.length < 6) {
        throw new Error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      }

      logActivity('PASSWORD_CHANGE', { success: true });
      return { success: true };
    } catch (error) {
      logActivity('PASSWORD_CHANGE_FAILED', { error: error.message });
      return { success: false, error: error.message };
    }
  };

  // تحميل بيانات المستخدم من localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUserData = localStorage.getItem('user_data');

        if (savedToken && savedUserData) {
          const decryptedUser = decryptData(savedUserData);
          if (decryptedUser && decryptedUser.username) {
            setUser(decryptedUser);
            setToken(savedToken);
          } else {
            // مسح البيانات التالفة
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
        // مسح البيانات التالفة
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } finally {
        setLoading(false);
      }
    };

    // تأخير صغير لتجنب التحديثات المتكررة
    const timeoutId = setTimeout(loadUserData, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    updateUser,
    changePassword,
    logActivity,
    encryptData,
    decryptData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
