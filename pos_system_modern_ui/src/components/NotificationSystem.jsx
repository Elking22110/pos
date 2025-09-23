import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Bell,
  ShoppingCart,
  Package,
  User,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

// أنواع الإشعارات
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// أنواع العمليات
export const OPERATION_TYPES = {
  PRODUCT_ADDED: 'product_added',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  CATEGORY_ADDED: 'category_added',
  CATEGORY_DELETED: 'category_deleted',
  SALE_COMPLETED: 'sale_completed',
  CART_UPDATED: 'cart_updated',
  STOCK_LOW: 'stock_low',
  SHIFT_STARTED: 'shift_started',
  SHIFT_ENDED: 'shift_ended',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  DATA_BACKUP: 'data_backup',
  DATA_RESTORE: 'data_restore'
};

// سياق الإشعارات
const NotificationContext = createContext();

// مكون الإشعار الفردي
const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // تأثير الظهور والاختفاء
  useEffect(() => {
    if (notification.autoRemove) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (notification.duration / 100));
          if (newProgress <= 0) {
            setIsVisible(false);
            setTimeout(() => onRemove(notification.id), 300);
            clearInterval(interval);
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.autoRemove, notification.duration, notification.id, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case NOTIFICATION_TYPES.INFO:
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getOperationIcon = () => {
    switch (notification.operation) {
      case OPERATION_TYPES.PRODUCT_ADDED:
      case OPERATION_TYPES.PRODUCT_UPDATED:
      case OPERATION_TYPES.PRODUCT_DELETED:
        return <Package className="h-4 w-4" />;
      case OPERATION_TYPES.CATEGORY_ADDED:
      case OPERATION_TYPES.CATEGORY_DELETED:
        return <Package className="h-4 w-4" />;
      case OPERATION_TYPES.SALE_COMPLETED:
      case OPERATION_TYPES.CART_UPDATED:
        return <ShoppingCart className="h-4 w-4" />;
      case OPERATION_TYPES.STOCK_LOW:
        return <AlertTriangle className="h-4 w-4" />;
      case OPERATION_TYPES.SHIFT_STARTED:
      case OPERATION_TYPES.SHIFT_ENDED:
        return <Clock className="h-4 w-4" />;
      case OPERATION_TYPES.USER_LOGIN:
      case OPERATION_TYPES.USER_LOGOUT:
        return <User className="h-4 w-4" />;
      case OPERATION_TYPES.DATA_BACKUP:
      case OPERATION_TYPES.DATA_RESTORE:
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-gray-800 border-l-4 border-green-500 shadow-green-500/20';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-gray-800 border-l-4 border-red-500 shadow-red-500/20';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-gray-800 border-l-4 border-yellow-500 shadow-yellow-500/20';
      case NOTIFICATION_TYPES.INFO:
        return 'bg-gray-800 border-l-4 border-blue-500 shadow-blue-500/20';
      default:
        return 'bg-gray-800 border-l-4 border-gray-500 shadow-gray-500/20';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`${getBackgroundColor()} rounded-lg p-4 shadow-xl backdrop-blur-sm transition-all duration-300 notification-enhanced ${isVisible ? 'animate-slideInRight' : 'animate-slideOutRight'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="text-sm font-bold text-white">
                {notification.title}
              </h4>
            </div>
            <p className="text-sm text-gray-200 mb-2 leading-relaxed">
              {notification.message}
            </p>
            {notification.details && (
              <div className="text-xs text-gray-300 bg-gray-700 bg-opacity-50 rounded px-2 py-1">
                {notification.details}
              </div>
            )}
            {notification.autoRemove && (
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-100 ${
                      notification.type === NOTIFICATION_TYPES.SUCCESS ? 'bg-green-500' :
                      notification.type === NOTIFICATION_TYPES.ERROR ? 'bg-red-500' :
                      notification.type === NOTIFICATION_TYPES.WARNING ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(notification.id), 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors hover:bg-gray-700 rounded p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// مكون قائمة الإشعارات - مبسط للإشعارات المؤقتة فقط
const NotificationList = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 w-96 z-50 space-y-3">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// مكون مقدم الإشعارات
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // إضافة إشعار جديد
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: Date.now(),
      duration: notification.duration || 5000,
      autoRemove: notification.autoRemove !== false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // إزالة تلقائية للإشعار
    if (newNotification.autoRemove) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // إزالة إشعار
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // مسح جميع الإشعارات - غير مطلوب للإشعارات المؤقتة
  const clearAllNotifications = useCallback(() => {
    // لا نحتاج هذه الوظيفة للإشعارات المؤقتة
  }, []);

  // إشعارات مخصصة للعمليات المختلفة
  const notifyProductAdded = useCallback((productName) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.PRODUCT_ADDED,
      title: '✅ تم إضافة منتج جديد',
      message: `تم إضافة "${productName}" بنجاح`,
      details: `تم حفظ المنتج في قاعدة البيانات`,
      duration: 3000
    });
  }, [addNotification]);

  const notifyProductUpdated = useCallback((productName) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.PRODUCT_UPDATED,
      title: '🔄 تم تحديث المنتج',
      message: `تم تحديث "${productName}" بنجاح`,
      details: `تم حفظ التغييرات`,
      duration: 3000
    });
  }, [addNotification]);

  const notifyProductDeleted = useCallback((productName) => {
    addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      operation: OPERATION_TYPES.PRODUCT_DELETED,
      title: '🗑️ تم حذف المنتج',
      message: `تم حذف "${productName}"`,
      details: `تم إزالة المنتج نهائياً`,
      duration: 4000
    });
  }, [addNotification]);

  const notifyCategoryAdded = useCallback((categoryName) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.CATEGORY_ADDED,
      title: '📁 تم إضافة فئة جديدة',
      message: `تم إضافة فئة "${categoryName}" بنجاح`,
      details: `يمكن استخدامها الآن`,
      duration: 3000
    });
  }, [addNotification]);

  const notifyCategoryDeleted = useCallback((categoryName) => {
    addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      operation: OPERATION_TYPES.CATEGORY_DELETED,
      title: '🗑️ تم حذف الفئة',
      message: `تم حذف فئة "${categoryName}"`,
      details: `تم إزالة الفئة نهائياً`,
      duration: 4000
    });
  }, [addNotification]);

  const notifySaleCompleted = useCallback((total, itemsCount) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.SALE_COMPLETED,
      title: '💰 تم إتمام البيع بنجاح',
      message: `تم بيع ${itemsCount} منتج بقيمة $${total.toFixed(2)}`,
      details: `تم إضافة البيع إلى سجل المبيعات`,
      duration: 4000
    });
  }, [addNotification]);

  const notifyCartUpdated = useCallback((action, productName) => {
    addNotification({
      type: NOTIFICATION_TYPES.INFO,
      operation: OPERATION_TYPES.CART_UPDATED,
      title: '🛒 تم تحديث السلة',
      message: `${action} "${productName}" من السلة`,
      details: `تم تحديث السلة`,
      duration: 2500
    });
  }, [addNotification]);

  const notifyStockLow = useCallback((productName, currentStock, minStock) => {
    addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      operation: OPERATION_TYPES.STOCK_LOW,
      title: '⚠️ تنبيه مخزون منخفض',
      message: `مخزون "${productName}" منخفض`,
      details: `المخزون: ${currentStock} | الحد الأدنى: ${minStock}`,
      duration: 5000 // إشعار أطول للتنبيهات المهمة
    });
  }, [addNotification]);

  const notifyShiftStarted = useCallback((username) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.SHIFT_STARTED,
      title: 'تم بدء الوردية',
      message: `بدأ ${username} وردية جديدة`,
      details: `تم تسجيل بداية الوردية في النظام`
    });
  }, [addNotification]);

  const notifyShiftEnded = useCallback((username, totalSales) => {
    addNotification({
      type: NOTIFICATION_TYPES.INFO,
      operation: OPERATION_TYPES.SHIFT_ENDED,
      title: 'تم إنهاء الوردية',
      message: `أنهى ${username} الوردية`,
      details: `إجمالي المبيعات: $${totalSales.toFixed(2)}`
    });
  }, [addNotification]);

  const notifyUserLogin = useCallback((username, role) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.USER_LOGIN,
      title: 'تم تسجيل الدخول',
      message: `مرحباً ${username}`,
      details: `الدور: ${role} | الوقت: ${new Date().toLocaleString('ar-SA')}`
    });
  }, [addNotification]);

  const notifyUserLogout = useCallback((username) => {
    addNotification({
      type: NOTIFICATION_TYPES.INFO,
      operation: OPERATION_TYPES.USER_LOGOUT,
      title: 'تم تسجيل الخروج',
      message: `وداعاً ${username}`,
      details: `تم تسجيل الخروج بنجاح`
    });
  }, [addNotification]);

  const notifyDataBackup = useCallback(() => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.DATA_BACKUP,
      title: 'تم إنشاء نسخة احتياطية',
      message: 'تم حفظ جميع البيانات بنجاح',
      details: `تم إنشاء النسخة الاحتياطية في ${new Date().toLocaleString('ar-SA')}`
    });
  }, [addNotification]);

  const notifyDataRestore = useCallback(() => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      operation: OPERATION_TYPES.DATA_RESTORE,
      title: '📥 تم استعادة البيانات',
      message: 'تم استعادة البيانات بنجاح',
      details: `تم استعادة البيانات في ${new Date().toLocaleString('ar-SA')}`,
      duration: 5000
    });
  }, [addNotification]);

  // إشعارات الأخطاء والتحقق
  const notifyError = useCallback((title, message, details) => {
    addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: `❌ ${title}`,
      message: message,
      details: details,
      duration: 4000
    });
  }, [addNotification]);

  const notifyValidationError = useCallback((field, message) => {
    addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: '❌ خطأ في البيانات',
      message: `حقل "${field}" غير صحيح`,
      details: message,
      duration: 4000
    });
  }, [addNotification]);

  const notifyDuplicateError = useCallback((item, type) => {
    addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: '❌ بيانات مكررة',
      message: `${type} "${item}" موجود بالفعل`,
      details: 'استخدم اسم أو رمز مختلف',
      duration: 4000
    });
  }, [addNotification]);

  const notifySuccess = useCallback((title, message) => {
    addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: `✅ ${title}`,
      message: message || '',
      details: '',
      duration: 4000
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    notifyProductAdded,
    notifyProductUpdated,
    notifyProductDeleted,
    notifyCategoryAdded,
    notifyCategoryDeleted,
    notifySaleCompleted,
    notifyCartUpdated,
    notifyStockLow,
    notifyShiftStarted,
    notifyShiftEnded,
    notifyUserLogin,
    notifyUserLogout,
    notifyDataBackup,
    notifyDataRestore,
    notifyError,
    notifyValidationError,
    notifyDuplicateError,
    notifySuccess
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationList
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

// Hook لاستخدام الإشعارات
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
