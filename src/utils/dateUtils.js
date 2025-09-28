// مساعد التواريخ - تحويل إلى النظام الميلادي مع 12 ساعة
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // التحقق من صحة التاريخ
    if (isNaN(date.getTime())) {
      return dateString; // إرجاع النص الأصلي إذا كان التاريخ غير صحيح
    }
    
    // تنسيق التاريخ الميلادي
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true // استخدام نظام 12 ساعة
    };
    
    return date.toLocaleDateString('ar-SA', options);
  } catch (error) {
    console.warn('خطأ في تنسيق التاريخ:', error);
    return dateString;
  }
};

// تنسيق التاريخ فقط (بدون وقت)
export const formatDateOnly = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('ar-SA', options);
  } catch (error) {
    console.warn('خطأ في تنسيق التاريخ:', error);
    return dateString;
  }
};

// تنسيق الوقت فقط (12 ساعة)
export const formatTimeOnly = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleTimeString('ar-SA', options);
  } catch (error) {
    console.warn('خطأ في تنسيق الوقت:', error);
    return dateString;
  }
};

// تنسيق التاريخ والوقت معاً
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleDateString('ar-SA', options);
  } catch (error) {
    console.warn('خطأ في تنسيق التاريخ والوقت:', error);
    return dateString;
  }
};

// تنسيق التاريخ القصير (يوم/شهر/سنة)
export const formatShortDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    return date.toLocaleDateString('ar-SA', options);
  } catch (error) {
    console.warn('خطأ في تنسيق التاريخ القصير:', error);
    return dateString;
  }
};

// الحصول على التاريخ الحالي
export const getCurrentDate = () => {
  return new Date().toISOString();
};

// الحصول على التاريخ الحالي بتنسيق عربي
export const getCurrentDateFormatted = () => {
  return formatDate(getCurrentDate());
};

// التحقق من صحة التاريخ
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

// مقارنة التواريخ
export const compareDates = (date1, date2) => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return 0;
    }
    
    return d1.getTime() - d2.getTime();
  } catch (error) {
    return 0;
  }
};

// إضافة أيام للتاريخ
export const addDays = (dateString, days) => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    date.setDate(date.getDate() + days);
    return date.toISOString();
  } catch (error) {
    return dateString;
  }
};

// الحصول على بداية اليوم
export const getStartOfDay = (dateString) => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  } catch (error) {
    return dateString;
  }
};

// الحصول على نهاية اليوم
export const getEndOfDay = (dateString) => {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  } catch (error) {
    return dateString;
  }
};

export default {
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  formatDateTime,
  formatShortDate,
  getCurrentDate,
  getCurrentDateFormatted,
  isValidDate,
  compareDates,
  addDays,
  getStartOfDay,
  getEndOfDay
};

