import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Users, 
  DollarSign, 
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Receipt,
  Trash2
} from 'lucide-react';
import soundManager from '../utils/soundManager.js';
import { publish, subscribe, EVENTS } from '../utils/observerManager';
import { formatDate, formatTimeOnly, formatDateOnly, formatDateTime, getCurrentDate } from '../utils/dateUtils.js';
import { getNextShiftId } from '../utils/sequence.js';

const ShiftManager = () => {
  const [shifts, setShifts] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // تفاصيل الوردية النشطة لحظياً (تشمل المرتجعات)
  const { activeDetails, activeSalesList } = useMemo(() => {
    try {
      if (!currentShift) return { activeDetails: null, activeSalesList: [] };
      const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
      const list = (currentShift.sales && currentShift.sales.length > 0)
        ? currentShift.sales
        : allSales.filter(s => s.shiftId === currentShift.id);
      return { activeDetails: calculateSalesDetails(list || []), activeSalesList: list };
    } catch (_) { return { activeDetails: null, activeSalesList: [] }; }
  }, [currentShift]);

  // تحميل الورديات المحفوظة
  useEffect(() => {
    const savedShifts = localStorage.getItem('shifts');
    if (savedShifts) {
      const shiftsData = JSON.parse(savedShifts);
      
      // إزالة الورديات المكررة بناءً على المعرف
      const uniqueShifts = shiftsData.filter((shift, index, self) => 
        index === self.findIndex(s => s.id === shift.id)
      );
      
      // إذا كان هناك ورديات مكررة، احفظ النسخة المنظفة
      if (uniqueShifts.length !== shiftsData.length) {
        console.log(`🧹 تم إزالة ${shiftsData.length - uniqueShifts.length} وردية مكررة`);
        localStorage.setItem('shifts', JSON.stringify(uniqueShifts));
      }
      
      setShifts(uniqueShifts);
    }
    
    // تحميل الوردية النشطة
    const activeShift = localStorage.getItem('activeShift');
    if (activeShift) {
      try {
        const activeShiftData = JSON.parse(activeShift);
        // فقط إذا كانت الوردية نشطة فعلاً
        if (activeShiftData && activeShiftData.status === 'active') {
          setCurrentShift(activeShiftData);
          console.log('✅ تم تحميل الوردية النشطة في ShiftManager:', activeShiftData.id);
        } else {
          console.log('❌ الوردية المحفوظة ليست نشطة - سيتم حذفها');
          localStorage.removeItem('activeShift');
          setCurrentShift(null);
        }
      } catch (error) {
        console.error('خطأ في تحليل الوردية النشطة:', error);
        localStorage.removeItem('activeShift');
        setCurrentShift(null);
      }
    }
  }, []);

  // التحديث اللحظي عند تغير بيانات الوردية من نقطة البيع
  useEffect(() => {
    const reload = () => {
      try {
        const active = JSON.parse(localStorage.getItem('activeShift') || 'null');
        if (active && active.status === 'active') {
          setCurrentShift(active);
        } else {
          setCurrentShift(null);
        }
        const all = JSON.parse(localStorage.getItem('shifts') || '[]');
        setShifts(all);
      } catch (_) {}
    };

    const onDataUpdated = (e) => {
      if (!e || !e.detail || !e.detail.type) { reload(); return; }
      if (e.detail.type === 'shift' || e.detail.type === 'sales') reload();
    };
    window.addEventListener('dataUpdated', onDataUpdated);
    window.addEventListener('shiftStarted', reload);
    window.addEventListener('shiftEnded', reload);
    // الاشتراك بقناة الوردية الموحدة
    const unsubscribe = typeof subscribe === 'function' ? subscribe(EVENTS.SHIFTS_CHANGED, reload) : null;
    return () => {
      window.removeEventListener('dataUpdated', onDataUpdated);
      window.removeEventListener('shiftStarted', reload);
      window.removeEventListener('shiftEnded', reload);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // بدء وردية جديدة
  const startShift = async () => {
    const now = new Date();
    const shiftId = getNextShiftId();
    
    const newShift = {
      id: shiftId,
      userId: JSON.parse(localStorage.getItem('user') || '{}').id || 'current_user',
      userName: JSON.parse(localStorage.getItem('user') || '{}').username || 'مستخدم',
      startTime: getCurrentDate(),
      endTime: null,
      status: 'active',
      sales: [],
      totalSales: 0,
      totalOrders: 0,
      cashDrawer: {
        openingAmount: 0,
        closingAmount: 0,
        expectedAmount: 0
      },
      notes: ''
    };

    setCurrentShift(newShift);
    localStorage.setItem('activeShift', JSON.stringify(newShift));
    try { publish(EVENTS.SHIFTS_CHANGED, { type: 'start', shift: newShift }); } catch(_) {}
    try { window.dispatchEvent(new CustomEvent('shiftStarted', { detail: { shiftId: newShift.id } })); } catch(_) {}
    
    // حفظ الوردية في قاعدة البيانات أيضاً للحماية من فقدان البيانات
    try {
      const databaseManager = (await import('../utils/database')).default;
      await databaseManager.add('shifts', newShift);
      console.log('✅ تم حفظ الوردية في قاعدة البيانات');
    } catch (error) {
      console.error('خطأ في حفظ الوردية في قاعدة البيانات:', error);
    }
    
    soundManager.play('startShift'); // تشغيل صوت بدء الوردية
    setMessage('تم بدء الوردية بنجاح!');
    setTimeout(() => setMessage(''), 3000);
  };

  // إنهاء الوردية
  const endShift = () => {
    if (!currentShift) return;

    const now = new Date();
    
    // حساب تفاصيل المبيعات
    const salesDetails = calculateSalesDetails(currentShift.sales);
    
    const updatedShift = {
      ...currentShift,
      endTime: now.toISOString(),
      status: 'completed',
      salesDetails: salesDetails,
      cashDrawer: {
        ...currentShift.cashDrawer,
        // المبلغ المتوقع = المبلغ الافتتاحي + المبلغ المستلم - المرتجعات
        expectedAmount: currentShift.cashDrawer.openingAmount + salesDetails.totalReceived - salesDetails.totalRefunds,
        // المبلغ الفعلي في الصندوق (سيتم إدخاله يدوياً)
        closingAmount: currentShift.cashDrawer.openingAmount + salesDetails.totalReceived - salesDetails.totalRefunds
      }
    };

    // التحقق من عدم وجود وردية بنفس المعرف
    const existingShiftIndex = shifts.findIndex(shift => shift.id === updatedShift.id);
    let updatedShifts;
    
    if (existingShiftIndex !== -1) {
      // إذا كانت الوردية موجودة، استبدلها
      updatedShifts = [...shifts];
      updatedShifts[existingShiftIndex] = updatedShift;
      console.log('🔄 تم تحديث وردية موجودة:', updatedShift.id);
    } else {
      // إذا لم تكن موجودة، أضفها
      updatedShifts = [...shifts, updatedShift];
      console.log('➕ تم إضافة وردية جديدة:', updatedShift.id);
    }
    
    setShifts(updatedShifts);
    setCurrentShift(null);
    
    localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    // إزالة فواتير الوردية النشطة من قائمة المبيعات العامة (الاحتفاظ بغير المكتمل فقط)
    try {
      const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
      // بعد إنهاء الوردية: نُبقي فقط الفواتير غير المكتملة (مهما كان shiftId)
      const partialOnly = (allSales || []).filter(inv => {
        const hasDown = inv?.downPayment?.enabled;
        if (!hasDown) return false; // مكتملة تُحذف
        const remaining = (inv.downPayment?.remaining != null)
          ? Number(inv.downPayment.remaining) || 0
          : (Number(inv.total) || 0) - (Number(inv.downPayment?.amount) || 0);
        return remaining > 0; // فقط غير المكتملة
      });
      localStorage.setItem('sales', JSON.stringify(partialOnly));
      try { window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'sales' } })); } catch(_) {}
      try { publish(EVENTS.INVOICES_CHANGED, { type: 'cleanup_after_shift_end_partial_only' }); } catch(_) {}
    } catch (_) {}


    localStorage.removeItem('activeShift');
    try { publish(EVENTS.SHIFTS_CHANGED, { type: 'end', shift: updatedShift }); } catch(_) {}
    try { publish(EVENTS.INVOICES_CHANGED, { type: 'cleanup_after_shift_end' }); } catch(_) {}
    
    // إرسال إشارة لإعادة تعيين بيانات نقطة البيع
    window.dispatchEvent(new CustomEvent('shiftEnded', { 
      detail: { 
        message: 'تم إنهاء الوردية - سيتم إعادة تعيين البيانات',
        shiftId: updatedShift.id 
      } 
    }));
    
    // تشغيل صوت إنهاء الوردية
    soundManager.play('endShift');
    
    // عرض تقرير الوردية (يجب أن يحدث قبل تصفير المرتجعات لضمان ظهورها)
    showShiftReport(updatedShift);
    
    // تصفير تقرير المرتجعات بعد عرض التقرير بقليل
    setTimeout(() => {
      try { localStorage.setItem('returns', JSON.stringify([])); } catch(_) {}
      try { window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'returns' } })); } catch(_) {}
    }, 300);
    
    setMessage('تم إنهاء الوردية بنجاح!');
    setTimeout(() => setMessage(''), 3000);
  };

  // حساب تفاصيل المبيعات
  const calculateSalesDetails = (sales) => {
    let totalSales = 0;
    let totalReceived = 0;
    let totalRemaining = 0;
    let totalRefunds = 0;
    let totalDiscounts = 0;
    let completeInvoices = 0;
    let partialInvoices = 0;
    let refundInvoices = 0;
    let discountInvoices = 0;
    
    // تقسيم المبالغ حسب طرق الدفع
    const paymentMethods = {
      'نقدي': { received: 0, remaining: 0, count: 0 },
      'محفظة إلكترونية': { received: 0, remaining: 0, count: 0 },
      'انستا باي': { received: 0, remaining: 0, count: 0 },
      'مرتجع': { received: 0, remaining: 0, count: 0 }
    };

    // دمج المرتجعات من تقرير returns ضمن الحسابات لهذه الوردية
    let combinedSales = Array.isArray(sales) ? [...sales] : [];
    try {
      const returnsList = JSON.parse(localStorage.getItem('returns') || '[]');
      // استنتاج shiftId من أول عنصر في المبيعات، أو من الوردية النشطة
      let shiftIdRef = combinedSales.find(s => s && s.shiftId)?.shiftId;
      if (!shiftIdRef) {
        try { shiftIdRef = JSON.parse(localStorage.getItem('activeShift') || 'null')?.id; } catch(_) {}
      }
      const relevantReturns = returnsList.filter(r => !shiftIdRef || r.shiftId === shiftIdRef);
      relevantReturns.forEach(r => {
        const amount = Math.abs(Number(r.amount) || 0);
        combinedSales.push({ type: 'refund', total: -amount, paymentMethod: 'مرتجع' });
      });
    } catch(_) {}

    (combinedSales || []).forEach(sale => {
      const saleTotal = Number(sale.total) || 0;

      // تحديد إن كانت العملية مرتجعاً بأي من الدلائل المتاحة
      let refundAmount = 0;
      const explicitRefund = sale.type === 'refund' || sale.isRefund === true;
      if (explicitRefund) {
        refundAmount = Math.abs(saleTotal);
      }
      if (saleTotal < 0) {
        refundAmount = Math.max(refundAmount, Math.abs(saleTotal));
      }
      if (Number(sale.refundAmount) > 0) {
        refundAmount = Math.max(refundAmount, Number(sale.refundAmount));
      }
      if (Array.isArray(sale.items)) {
        const negativeLines = sale.items.reduce((sum, item) => {
          const line = (Number(item.price) || 0) * (Number(item.quantity) || 0);
          return line < 0 ? sum + Math.abs(line) : sum;
        }, 0);
        refundAmount = Math.max(refundAmount, negativeLines);
      }

      if (refundAmount > 0) {
        totalRefunds += refundAmount;
        refundInvoices++;
        if (paymentMethods['مرتجع']) {
          paymentMethods['مرتجع'].received += refundAmount;
          paymentMethods['مرتجع'].count++;
        }
        return; // لا تُحتسب ضمن إجمالي المبيعات
      }

      // فاتورة عادية: أضف لإجمالي المبيعات
      totalSales += saleTotal;

      {
        // فاتورة عادية أو بخصم
        let hasDiscount = sale.discount && sale.discount.amount > 0;
        let hasDownPayment = sale.downPayment && sale.downPayment.enabled;
        const paymentMethod = sale.paymentMethod || 'نقدي';
        
        // التأكد من وجود طريقة الدفع في القائمة
        if (!paymentMethods[paymentMethod]) {
          paymentMethods[paymentMethod] = { received: 0, remaining: 0, count: 0 };
        }
        
        // حساب الخصومات
        if (hasDiscount) {
          totalDiscounts += sale.discount.amount;
          discountInvoices++;
        }
        
        // حساب المبلغ المستلم والمتبقي
        if (hasDownPayment) {
          // فاتورة بعربون
          const receivedAmount = sale.downPayment.amount;
          const remainingAmount = sale.downPayment.remaining || (sale.total - sale.downPayment.amount);
          
          totalReceived += receivedAmount;
          totalRemaining += remainingAmount;
          partialInvoices++;
          
          // تقسيم حسب طريقة الدفع
          paymentMethods[paymentMethod].received += receivedAmount;
          paymentMethods[paymentMethod].remaining += remainingAmount;
          paymentMethods[paymentMethod].count++;
        } else {
          // فاتورة مكتملة
          totalReceived += sale.total;
          completeInvoices++;
          
          // تقسيم حسب طريقة الدفع
          paymentMethods[paymentMethod].received += sale.total;
          paymentMethods[paymentMethod].count++;
        }
      }
    });

    // تنظيف طرق الدفع الفارغة
    const activePaymentMethods = Object.entries(paymentMethods)
      .filter(([method, data]) => data.received > 0 || data.remaining > 0 || data.count > 0)
      .reduce((acc, [method, data]) => {
        acc[method] = data;
        return acc;
      }, {});

    return {
      totalSales,
      totalReceived,
      totalRemaining,
      totalRefunds,
      totalDiscounts,
      completeInvoices,
      partialInvoices,
      refundInvoices,
      discountInvoices,
      totalInvoices: (sales || []).length,
      paymentMethods: activePaymentMethods
    };
  };

  // عرض تقرير الوردية
  const showShiftReport = (shift) => {
    try {
      // التأكد من وجود بيانات الوردية
      if (!shift) {
        setMessage('لا توجد بيانات للوردية');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // تحديد مبيعات الوردية: من داخل الوردية مباشرة أو من جميع المبيعات بحسب shiftId أو نطاق الزمن
      const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
      const salesForShift = (shift.sales && shift.sales.length > 0)
        ? shift.sales
        : allSales.filter(s => {
            const byId = s.shiftId && s.shiftId === shift.id;
            if (byId) return true;
            const ts = new Date(s.timestamp || s.date || 0).getTime();
            const start = new Date(shift.startTime).getTime();
            const end = new Date(shift.endTime || Date.now()).getTime();
            return ts >= start && ts <= end;
          });

      // أعِد حساب تفاصيل المبيعات دائماً بناءً على البيانات الحالية لضمان عدم عرض نتائج قديمة
      const salesDetails = calculateSalesDetails(salesForShift || []);
      
      // التحقق من صحة البيانات
      console.log('🔍 فحص بيانات التقرير:', {
        sales: shift.sales?.length || 0,
        salesDetails,
        cashDrawer: shift.cashDrawer
      });
      
      // التحقق من منطق الحساب
      const calculatedTotal = salesDetails.totalReceived + salesDetails.totalRemaining;
      const expectedTotal = salesDetails.totalSales - salesDetails.totalRefunds;
      const calculationError = Math.abs(calculatedTotal - expectedTotal);
      
      if (calculationError > 0.01) { // خطأ أكبر من قرش واحد
        console.warn('⚠️ خطأ في الحساب:', {
          calculatedTotal,
          expectedTotal,
          error: calculationError
        });
      }
      
      // تجهيز بيانات المرتجعات
      const refundSales = (salesForShift || []).filter(s => s && s.type === 'refund');
      const refundsTotalAmount = refundSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      const refundItemsAgg = (() => {
        const map = new Map();
        refundSales.forEach(sale => {
          (sale.items || []).forEach(item => {
            const key = (item.id || item.sku || item.name || 'منتج غير معروف') + '|' + (item.name || 'منتج غير معروف');
            const prev = map.get(key) || { name: item.name || 'منتج غير معروف', quantity: 0, total: 0 };
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            prev.quantity += qty;
            prev.total += qty * price;
            map.set(key, prev);
          });
        });
        return Array.from(map.values());
      })();

      const reportWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
      
      if (!reportWindow) {
        soundManager.play('error'); // تشغيل صوت الخطأ
        setMessage('يرجى السماح بالنوافذ المنبثقة لعرض التقرير');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
    
        const reportHTML = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير الوردية - ${shift.id}</title>
            <style>
              * {
                box-sizing: border-box;
              }
              body {
                font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: #333;
                direction: rtl;
                line-height: 1.6;
              }
              .report-container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
                overflow: hidden;
                border: 1px solid #e0e6ed;
              }
              .header {
                background: linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #3182ce 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
              }
              .header p {
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
                position: relative;
                z-index: 1;
              }
              .header .shift-info {
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                flex-wrap: wrap;
                gap: 15px;
              }
              .header .info-item {
                background: rgba(255,255,255,0.1);
                padding: 10px 15px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
              }
              .content {
                padding: 40px 30px;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 25px;
                margin-bottom: 40px;
              }
              .summary-card {
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                padding: 25px 20px;
                border-radius: 15px;
                text-align: center;
                border: 2px solid transparent;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
              }
              .summary-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #3182ce, #2b6cb0);
              }
              .summary-card.sales::before { background: linear-gradient(90deg, #38a169, #2f855a); }
              .summary-card.received::before { background: linear-gradient(90deg, #3182ce, #2b6cb0); }
              .summary-card.remaining::before { background: linear-gradient(90deg, #d69e2e, #b7791f); }
              .summary-card.refunds::before { background: linear-gradient(90deg, #e53e3e, #c53030); }
              .summary-card.discounts::before { background: linear-gradient(90deg, #805ad5, #6b46c1); }
              .summary-card.invoices::before { background: linear-gradient(90deg, #319795, #2c7a7b); }
              .summary-card h3 {
                margin: 0 0 15px 0;
                color: #2d3748;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .summary-card .value {
                font-size: 28px;
                font-weight: 700;
                color: #1a202c;
                margin-bottom: 5px;
              }
              .summary-card .currency {
                font-size: 14px;
                color: #4a5568;
                font-weight: 500;
              }
              .summary-card.negative .value {
                color: #e53e3e;
              }
              .details-section {
                margin-bottom: 40px;
                background: #f8fafc;
                border-radius: 15px;
                padding: 25px;
                border: 1px solid #e2e8f0;
              }
              .details-section h2 {
                color: #1a202c;
                border-bottom: 3px solid #3182ce;
                padding-bottom: 12px;
                margin-bottom: 25px;
                font-size: 20px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .details-section h2::before {
                content: '📊';
                font-size: 18px;
              }
              .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              }
              .details-table th,
              .details-table td {
                padding: 15px 12px;
                text-align: right;
                border-bottom: 1px solid #e2e8f0;
              }
              .details-table th {
                background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
                font-weight: 600;
                color: #2d3748;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .details-table tr:hover {
                background: #f7fafc;
                transform: translateY(-1px);
                transition: all 0.2s ease;
              }
              .details-table tr:last-child td {
                border-bottom: none;
              }
              .status-badge {
                padding: 6px 14px;
                border-radius: 25px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: inline-block;
              }
              .status-complete {
                background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
                color: #22543d;
                border: 1px solid #68d391;
              }
              .status-partial {
                background: linear-gradient(135deg, #fef5e7 0%, #fbd38d 100%);
                color: #744210;
                border: 1px solid #f6ad55;
              }
              .status-refund {
                background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
                color: #742a2a;
                border: 1px solid #fc8181;
              }
              .footer {
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                padding: 25px;
                text-align: center;
                color: #4a5568;
                border-top: 2px solid #e2e8f0;
                font-size: 14px;
              }
              .print-btn {
                background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .print-btn:hover {
                background: linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(49, 130, 206, 0.4);
              }
              .highlight {
                background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
              }
              @media print {
                /* ضبط الطباعة على رولة 80mm */
                @page { size: 80mm auto; margin: 1mm; }
                html, body { width: 80mm; margin: 0; padding: 0; background: white; }
                .report-container { width: calc(80mm - 2mm); margin: 0 auto; box-shadow: none; border: 1px solid #ccc; }
                .print-btn { display: none; }
              }
            </style>
          </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>📊 تقرير الوردية</h1>
            <div class="shift-info">
              <div class="info-item">
                <strong>📅 تاريخ البداية:</strong><br>
                ${formatDateTime(shift.startTime)}
              </div>
              <div class="info-item">
                <strong>🕐 تاريخ النهاية:</strong><br>
                ${formatDateTime(shift.endTime)}
              </div>
              <div class="info-item">
                <strong>👤 الكاشير:</strong><br>
                ${shift.userName}
              </div>
            </div>
          </div>
          
          <div class="content">
            <div class="summary-grid">
              <div class="summary-card sales">
                <h3>💰 إجمالي المبيعات</h3>
                <div class="value">${(salesDetails.totalSales || 0).toFixed(2)}</div>
                <div class="currency">جنيه مصري</div>
              </div>
              <div class="summary-card received">
                <h3>💵 المبلغ المستلم</h3>
                <div class="value">${(salesDetails.totalReceived || 0).toFixed(2)}</div>
                <div class="currency">جنيه مصري</div>
              </div>
              <div class="summary-card remaining">
                <h3>⏳ المبلغ المتبقي</h3>
                <div class="value">${(salesDetails.totalRemaining || 0).toFixed(2)}</div>
                <div class="currency">جنيه مصري</div>
              </div>
              <div class="summary-card refunds negative">
                <h3>🔄 إجمالي المرتجعات</h3>
                <div class="value">-${(salesDetails.totalRefunds || 0).toFixed(2)}</div>
                <div class="currency">جنيه مصري</div>
              </div>
              <div class="summary-card discounts negative">
                <h3>🎯 إجمالي الخصومات</h3>
                <div class="value">-${(salesDetails.totalDiscounts || 0).toFixed(2)}</div>
                <div class="currency">جنيه مصري</div>
              </div>
              <div class="summary-card invoices">
                <h3>📄 عدد الفواتير</h3>
                <div class="value">${salesDetails.totalInvoices}</div>
                <div class="currency">فاتورة</div>
              </div>
            </div>

            <div class="details-section">
              <h2>📋 تفاصيل الفواتير</h2>
              <table class="details-table">
                <thead>
                  <tr>
                    <th>🔢 رقم الفاتورة</th>
                    <th>👤 العميل</th>
                    <th>💰 المبلغ الإجمالي</th>
                    <th>💵 المبلغ المستلم</th>
                    <th>⏳ المبلغ المتبقي</th>
                    <th>📊 الحالة</th>
                    <th>🕐 الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  ${(shift.sales || []).map(sale => `
                    <tr>
                      <td><span class="highlight">#${sale.id}</span></td>
                      <td>${sale.customer.name}</td>
                      <td><strong>${(sale.total || 0).toFixed(2)} جنيه</strong></td>
                      <td><strong>${sale.downPayment && sale.downPayment.enabled ? (sale.downPayment.amount || 0).toFixed(2) : (sale.total || 0).toFixed(2)} جنيه</strong></td>
                      <td><strong>${sale.downPayment && sale.downPayment.enabled ? (sale.downPayment.remaining || ((sale.total || 0) - (sale.downPayment.amount || 0))).toFixed(2) : '0.00'} جنيه</strong></td>
                      <td>
                        <span class="status-badge ${
                          sale.type === 'refund' ? 'status-refund' :
                          sale.downPayment && sale.downPayment.enabled ? 'status-partial' : 'status-complete'
                        }">
                          ${sale.type === 'refund' ? '🔄 مرتجع' :
                            sale.downPayment && sale.downPayment.enabled ? '⏳ عربون' : '✅ مكتمل'}
                        </span>
                      </td>
                      <td>${formatDateTime(sale.timestamp)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            ${refundSales.length > 0 ? `
            <div class="details-section">
              <h2>🔄 تفاصيل فواتير المرتجعات</h2>
              <table class="details-table">
                <thead>
                  <tr>
                    <th>🔢 رقم الفاتورة</th>
                    <th>👤 العميل</th>
                    <th>💵 قيمة المرتجع</th>
                    <th>🕐 الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  ${refundSales.map(sale => `
                    <tr>
                      <td><span class="highlight">#${sale.id}</span></td>
                      <td>${(sale.customer && sale.customer.name) || 'غير محدد'}</td>
                      <td style="color:#e53e3e; font-weight:700;">-${(Number(sale.total)||0).toFixed(2)} جنيه</td>
                      <td>${formatDateTime(sale.timestamp)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="text-align:right; font-weight:700;">الإجمالي</td>
                    <td colspan="2" style="color:#e53e3e; font-weight:800;">-${(refundsTotalAmount||0).toFixed(2)} جنيه</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="details-section">
              <h2>📦 تجميع المرتجعات حسب المنتج</h2>
              <table class="details-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية المرتجعة</th>
                    <th>القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  ${refundItemsAgg.map(row => `
                    <tr>
                      <td>${row.name}</td>
                      <td style="font-weight:600;">${row.quantity}</td>
                      <td style="color:#e53e3e; font-weight:700;">-${(row.total||0).toFixed(2)} جنيه</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div class="details-section">
              <h2>🏦 ملخص الصندوق</h2>
              <table class="details-table">
                <tr>
                  <td><strong>💰 المبلغ الافتتاحي</strong></td>
                  <td><span class="highlight">${(shift.cashDrawer?.openingAmount || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>💵 المبلغ المستلم</strong></td>
                  <td><span class="highlight">${(salesDetails.totalReceived || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>🔄 إجمالي المرتجعات</strong></td>
                  <td><span class="highlight" style="color: #e53e3e;">-${(salesDetails.totalRefunds || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>🎯 إجمالي الخصومات</strong></td>
                  <td><span class="highlight" style="color: #e53e3e;">-${(salesDetails.totalDiscounts || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>📊 المبلغ المتوقع في الصندوق</strong></td>
                  <td><span class="highlight" style="color: #38a169;">${(shift.cashDrawer?.expectedAmount || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>⏳ المبلغ المتبقي للعملاء</strong></td>
                  <td><span class="highlight" style="color: #d69e2e;">${(salesDetails.totalRemaining || 0).toFixed(2)} جنيه</span></td>
                </tr>
              </table>
            </div>

            <div class="details-section">
              <h2>📈 إحصائيات الفواتير</h2>
              <table class="details-table">
                <tr>
                  <td><strong>✅ الفواتير المكتملة</strong></td>
                  <td><span class="highlight" style="color: #38a169;">${salesDetails.completeInvoices} فاتورة</span></td>
                </tr>
                <tr>
                  <td><strong>⏳ الفواتير بالعربون</strong></td>
                  <td><span class="highlight" style="color: #d69e2e;">${salesDetails.partialInvoices} فاتورة</span></td>
                </tr>
                <tr>
                  <td><strong>🔄 فواتير المرتجعات</strong></td>
                  <td><span class="highlight" style="color: #e53e3e;">${salesDetails.refundInvoices} فاتورة</span></td>
                </tr>
                <tr>
                  <td><strong>🎯 فواتير الخصومات</strong></td>
                  <td><span class="highlight" style="color: #805ad5;">${salesDetails.discountInvoices} فاتورة</span></td>
                </tr>
                <tr>
                  <td><strong>📊 إجمالي الفواتير</strong></td>
                  <td><span class="highlight" style="color: #3182ce; font-size: 18px; font-weight: 700;">${salesDetails.totalInvoices} فاتورة</span></td>
                </tr>
              </table>
            </div>

            ${Object.keys(salesDetails.paymentMethods || {}).length > 0 ? `
            <div class="details-section">
              <h2>💳 تقسيم المبالغ حسب طرق الدفع</h2>
              <table class="details-table">
                <thead>
                  <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <th style="padding: 15px; text-align: right; font-weight: 600;">طريقة الدفع</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">المبلغ المستلم</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">المبلغ المتبقي</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">عدد الفواتير</th>
                    <th style="padding: 15px; text-align: center; font-weight: 600;">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(salesDetails.paymentMethods || {}).map(([method, data]) => {
                    const total = data.received + data.remaining;
                    const methodIcon = method === 'نقدي' ? '💵' : 
                                     method === 'محفظة إلكترونية' ? '📱' : 
                                     method === 'انستا باي' ? '💳' : 
                                     method === 'مرتجع' ? '🔄' : '💰';
                    const methodColor = method === 'نقدي' ? '#38a169' : 
                                      method === 'محفظة إلكترونية' ? '#3182ce' : 
                                      method === 'انستا باي' ? '#9f7aea' : 
                                      method === 'مرتجع' ? '#e53e3e' : '#666';
                    
                    return `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px; font-weight: 600; color: ${methodColor};">
                          ${methodIcon} ${method}
                        </td>
                        <td style="padding: 12px; text-align: center; font-weight: 600; color: #38a169;">
                          ${(data.received || 0).toFixed(2)} جنيه
                        </td>
                        <td style="padding: 12px; text-align: center; font-weight: 600; color: #d69e2e;">
                          ${(data.remaining || 0).toFixed(2)} جنيه
                        </td>
                        <td style="padding: 12px; text-align: center; font-weight: 600; color: #3182ce;">
                          ${data.count} فاتورة
                        </td>
                        <td style="padding: 12px; text-align: center; font-weight: 700; color: ${methodColor}; background: ${methodColor}15; border-radius: 8px;">
                          ${(total || 0).toFixed(2)} جنيه
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                <tfoot>
                  <tr style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9;">
                    <td style="padding: 15px; font-weight: 700; color: #0ea5e9; font-size: 16px;">
                      📊 المجموع الكلي
                    </td>
                    <td style="padding: 15px; text-align: center; font-weight: 700; color: #38a169; font-size: 16px;">
                      ${(salesDetails.totalReceived || 0).toFixed(2)} جنيه
                    </td>
                    <td style="padding: 15px; text-align: center; font-weight: 700; color: #d69e2e; font-size: 16px;">
                      ${(salesDetails.totalRemaining || 0).toFixed(2)} جنيه
                    </td>
                    <td style="padding: 15px; text-align: center; font-weight: 700; color: #3182ce; font-size: 16px;">
                      ${salesDetails.totalInvoices} فاتورة
                    </td>
                    <td style="padding: 15px; text-align: center; font-weight: 700; color: #0ea5e9; font-size: 18px; background: #0ea5e920; border-radius: 8px;">
                      ${((salesDetails.totalReceived || 0) + (salesDetails.totalRemaining || 0)).toFixed(2)} جنيه
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            ` : ''}

            <div class="details-section">
              <h2>🧮 التحقق من الحسابات</h2>
              <table class="details-table">
                <tr>
                  <td><strong>💰 إجمالي المبيعات</strong></td>
                  <td><span class="highlight">${salesDetails.totalSales.toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>💵 المبلغ المستلم</strong></td>
                  <td><span class="highlight">${(salesDetails.totalReceived || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>⏳ المبلغ المتبقي</strong></td>
                  <td><span class="highlight">${(salesDetails.totalRemaining || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr>
                  <td><strong>🔄 إجمالي المرتجعات</strong></td>
                  <td><span class="highlight" style="color: #e53e3e;">-${(salesDetails.totalRefunds || 0).toFixed(2)} جنيه</span></td>
                </tr>
                <tr style="background: #f0f9ff; border: 2px solid #0ea5e9;">
                  <td><strong>✅ المجموع المحسوب</strong></td>
                  <td><span class="highlight" style="color: #0ea5e9; font-size: 16px; font-weight: 700;">${((salesDetails.totalReceived || 0) + (salesDetails.totalRemaining || 0)).toFixed(2)} جنيه</span></td>
                </tr>
                <tr style="background: #f0fdf4; border: 2px solid #22c55e;">
                  <td><strong>✅ المجموع المتوقع</strong></td>
                  <td><span class="highlight" style="color: #22c55e; font-size: 16px; font-weight: 700;">${((salesDetails.totalSales || 0) - (salesDetails.totalRefunds || 0)).toFixed(2)} جنيه</span></td>
                </tr>
                <tr style="background: ${Math.abs(((salesDetails.totalReceived || 0) + (salesDetails.totalRemaining || 0)) - ((salesDetails.totalSales || 0) - (salesDetails.totalRefunds || 0))) <= 0.01 ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${Math.abs(((salesDetails.totalReceived || 0) + (salesDetails.totalRemaining || 0)) - ((salesDetails.totalSales || 0) - (salesDetails.totalRefunds || 0))) <= 0.01 ? '#22c55e' : '#ef4444'};">
                  <td><strong>${Math.abs(((salesDetails.totalReceived || 0) + (salesDetails.totalRemaining || 0)) - ((salesDetails.totalSales || 0) - (salesDetails.totalRefunds || 0))) <= 0.01 ? '✅' : '❌'} حالة الحساب</strong></td>
                  <td><span class="highlight" style="color: ${Math.abs(((salesDetails.totalReceived || 0) + (salesDetails.totalRemaining || 0)) - ((salesDetails.totalSales || 0) - (salesDetails.totalRefunds || 0))) <= 0.01 ? '#22c55e' : '#ef4444'}; font-size: 16px; font-weight: 700;">${Math.abs(((salesDetails.totalReceived || 0) + (salesDetails.totalRemaining || 0)) - ((salesDetails.totalSales || 0) - (salesDetails.totalRefunds || 0))) <= 0.01 ? 'صحيح' : 'يحتاج مراجعة'}</span></td>
                </tr>
              </table>
            </div>

            ${shift.notes ? `
              <div class="details-section">
                <h2>📝 ملاحظات الوردية</h2>
                <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 10px; border-right: 4px solid #3182ce; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2d3748;">${shift.notes}</p>
                </div>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <button class="print-btn" onclick="window.print()">🖨️ طباعة التقرير</button>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>📅 تم إنشاء التقرير في:</strong> ${formatDateTime(getCurrentDate())}</p>
            <p><strong>🏪 Elking Store</strong> - نظام إدارة متطور</p>
            <p style="margin-top: 10px; font-size: 12px; opacity: 0.7;">جميع المبالغ بالجنيه المصري (EGP)</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
      // كتابة المحتوى في النافذة
      reportWindow.document.open();
      reportWindow.document.write(reportHTML);
      reportWindow.document.close();
      
      // التأكد من تحميل المحتوى
      reportWindow.onload = () => {
        console.log('✅ تم تحميل التقرير بنجاح');
      };
      
      setMessage(`تم فتح تقرير وردية ${shift.userName} بنجاح!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('خطأ في عرض التقرير:', error);
      setMessage(`حدث خطأ أثناء فتح التقرير: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // تحديث مبلغ الصندوق
  const updateCashDrawer = (amount) => {
    if (!currentShift) return;

    const updatedShift = {
      ...currentShift,
      cashDrawer: {
        ...currentShift.cashDrawer,
        openingAmount: parseFloat(amount) || 0
      }
    };

    setCurrentShift(updatedShift);
    localStorage.setItem('activeShift', JSON.stringify(updatedShift));
    try { publish(EVENTS.SHIFTS_CHANGED, { type: 'update', field: 'cashDrawer', shift: updatedShift }); } catch(_) {}
  };

  // إضافة عملية بيع للوردية
  const addSaleToShift = (saleData) => {
    if (!currentShift) return;

    const updatedShift = {
      ...currentShift,
      sales: [...currentShift.sales, saleData],
      totalSales: currentShift.totalSales + saleData.total,
      totalOrders: currentShift.totalOrders + 1
    };

    setCurrentShift(updatedShift);
    localStorage.setItem('activeShift', JSON.stringify(updatedShift));
    try { publish(EVENTS.SHIFTS_CHANGED, { type: 'sale:add', shift: updatedShift }); } catch(_) {}
  };

  // تحديث ملاحظات الوردية
  const updateShiftNotes = (notes) => {
    if (!currentShift) return;

    const updatedShift = {
      ...currentShift,
      notes: notes
    };

    setCurrentShift(updatedShift);
    localStorage.setItem('activeShift', JSON.stringify(updatedShift));
    try { publish(EVENTS.SHIFTS_CHANGED, { type: 'update', field: 'notes', shift: updatedShift }); } catch(_) {}
  };

  // حذف وردية
  const deleteShift = async (shiftId) => {
    try {
      const shiftToDelete = shifts.find(shift => shift.id === shiftId);
      
      // حذف من قاعدة البيانات أيضاً
      try {
        const databaseManager = (await import('../utils/database')).default;
        await databaseManager.delete('shifts', shiftId);
        console.log('✅ تم حذف الوردية من قاعدة البيانات');
      } catch (error) {
        console.error('خطأ في حذف الوردية من قاعدة البيانات:', error);
      }
      
      const updatedShifts = shifts.filter(shift => shift.id !== shiftId);
      setShifts(updatedShifts);
      localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    try { publish(EVENTS.SHIFTS_CHANGED, { type: 'delete', shiftId, shifts: updatedShifts }); } catch(_) {}
      
      soundManager.play('delete'); // تشغيل صوت الحذف
      setMessage(`تم حذف وردية ${shiftToDelete?.userName || 'غير محدد'} بنجاح!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('خطأ في حذف الوردية:', error);
      setMessage('حدث خطأ أثناء حذف الوردية');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // تصدير تقرير الورديات
  const exportShiftsReport = () => {
    const csvContent = [
      ['تاريخ البداية', 'تاريخ النهاية', 'المستخدم', 'إجمالي المبيعات', 'عدد الطلبات', 'مبلغ الصندوق', 'الحالة'],
      ...shifts.map(shift => [
        formatDateTime(shift.startTime),
        shift.endTime ? formatDateTime(shift.endTime) : 'لم تنته',
        shift.userName,
        (shift.totalSales || 0).toFixed(2),
        shift.totalOrders,
        (shift.cashDrawer?.closingAmount || 0).toFixed(2),
        shift.status === 'active' ? 'نشطة' : 'مكتملة'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shifts_report_${getCurrentDate().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">إدارة الورديات</h2>
          <p className="text-gray-300 text-sm">إدارة ورديات العمل والمبيعات</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('نجح') ? 'bg-green-500 bg-opacity-20 text-green-300' : 'bg-red-500 bg-opacity-20 text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* الوردية النشطة */}
      {currentShift ? (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Play className="h-5 w-5 text-green-400 mr-2" />
              وردية نشطة
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => { soundManager.play('endShift'); endShift(); }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Square className="h-4 w-4" />
                <span>إنهاء الوردية</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">وقت البداية</span>
              </div>
              <p className="text-white font-semibold">
                {formatDateTime(currentShift.startTime)}
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">إجمالي المبيعات</span>
              </div>
              <p className="text-white font-semibold">${(((activeDetails?.totalSales || 0) - (activeDetails?.totalRefunds || 0)) || 0).toFixed(2)}</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-300">عدد الطلبات</span>
              </div>
              <p className="text-white font-semibold">{activeSalesList?.length || currentShift.sales?.length || 0}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                مبلغ الصندوق الافتتاحي
              </label>
              <input
                type="number"
                value={currentShift.cashDrawer.openingAmount}
                onChange={(e) => updateCashDrawer(e.target.value)}
                className="input-modern w-full"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ملاحظات الوردية
              </label>
              <textarea
                value={currentShift.notes}
                onChange={(e) => updateShiftNotes(e.target.value)}
                className="input-modern w-full h-20 resize-none"
                placeholder="أضف ملاحظات حول الوردية..."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">لا توجد وردية نشطة</h3>
          <p className="text-gray-300 mb-4">ابدأ وردية جديدة لبدء تتبع المبيعات</p>
          <button
            onClick={() => { soundManager.play('startShift'); startShift(); }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg transition-all mx-auto"
          >
            <Play className="h-5 w-5" />
            <span>بدء وردية جديدة</span>
          </button>
        </div>
      )}

      {/* تاريخ الورديات */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Calendar className="h-5 w-5 text-blue-400 mr-2" />
            تاريخ الورديات
          </h3>
          <button
            onClick={() => { soundManager.play('save'); exportShiftsReport(); }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تصدير التقرير</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">التاريخ</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">المستخدم</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">المبيعات</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الطلبات</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الحالة</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    لا توجد ورديات مسجلة
                  </td>
                </tr>
              ) : (
                shifts
                  .filter((shift, index, self) => 
                    // إزالة الورديات المكررة بناءً على المعرف
                    index === self.findIndex(s => s.id === shift.id)
                  )
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .map((shift) => (
                  <tr key={shift.id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                    <td className="py-3 px-4 text-sm text-white">
                      {formatDateOnly(shift.startTime)}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{shift.userName}</td>
                    <td className="py-3 px-4 text-sm text-green-400 font-semibold">
                      ${(shift.totalSales || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{shift.totalOrders}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shift.status === 'active' 
                          ? 'bg-green-500 bg-opacity-20 text-green-300' 
                          : 'bg-blue-500 bg-opacity-20 text-blue-300'
                      }`}>
                        {shift.status === 'active' ? 'نشطة' : 'مكتملة'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex space-x-2">
                        {shift.status === 'completed' && (
                          <button
                            onClick={() => { soundManager.play('openWindow'); showShiftReport(shift); }}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-blue-300 hover:text-blue-200 rounded-lg border border-blue-500 border-opacity-30 hover:border-opacity-50 transition-all duration-200 text-xs font-medium"
                            title="عرض تقرير الوردية"
                          >
                            <Receipt className="h-3 w-3" />
                            <span>تقرير</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            soundManager.play('warning');
                            if (window.confirm(`هل أنت متأكد من حذف وردية ${shift.userName} بتاريخ ${formatDateOnly(shift.startTime)}؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
                              deleteShift(shift.id);
                            }
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-red-300 hover:text-red-200 rounded-lg border border-red-500 border-opacity-30 hover:border-opacity-50 transition-all duration-200 text-xs font-medium"
                          title="حذف الوردية"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShiftManager;




