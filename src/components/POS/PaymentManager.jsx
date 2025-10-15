import React, { useState, useCallback, useMemo } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotifications } from '../NotificationSystem';
import soundManager from '../../utils/soundManager.js';
import errorHandler from '../../utils/errorHandler.js';
import { getLocalDateString, getLocalDateFormatted, formatDateToDDMMYYYY } from '../../utils/dateUtils.js';

const PaymentManager = ({ 
  downPayment, 
  setDownPayment, 
  getTotal, 
  getRemainingAmount,
  onConfirmSale 
}) => {
  const { notifySuccess, notifyError } = useNotifications();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // التحقق من صحة العربون
  const isDownPaymentValid = useMemo(() => {
    if (!downPayment.enabled) return true;
    
    const amount = parseFloat(downPayment.amount) || 0;
    const total = getTotal || 0;
    
    return amount > 0 && amount < total && downPayment.deliveryDate;
  }, [downPayment, getTotal]);

  // تحديث مبلغ العربون
  const updateDownPaymentAmount = useCallback((value) => {
    soundManager.play('downPayment');
    setDownPayment({
      ...downPayment,
      amount: value === '' ? '' : parseFloat(value) || ''
    });
  }, [downPayment, setDownPayment]);

  // تحديث تاريخ الاستلام
  const updateDeliveryDate = useCallback((field, value) => {
    if (value === '') return;
    
    const currentDate = downPayment.deliveryDate || getLocalDateString();
    const [year, month, day] = currentDate.split('-');
    
    let newDate;
    if (field === 'day') {
      const dayPadded = value.padStart(2, '0');
      newDate = `${year}-${month}-${dayPadded}`;
    } else if (field === 'month') {
      const monthPadded = value.padStart(2, '0');
      newDate = `${year}-${monthPadded}-${day}`;
    } else if (field === 'year') {
      newDate = `${value}-${month}-${day}`;
    }
    
    setDownPayment({ ...downPayment, deliveryDate: newDate });
  }, [downPayment, setDownPayment]);

  // تطبيق نسبة سريعة للعربون
  const applyQuickPercentage = useCallback((percentage) => {
    const total = getTotal || 0;
    const amount = (total * percentage / 100).toFixed(2);
    setDownPayment({ ...downPayment, amount });
  }, [getTotal, downPayment, setDownPayment]);

  // تعيين تاريخ اليوم
  const setToday = useCallback(() => {
    const today = getLocalDateString();
    setDownPayment({ ...downPayment, deliveryDate: today });
  }, [downPayment, setDownPayment]);

  // تعيين تاريخ الغد
  const setTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.getFullYear() + '-' + 
                       String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(tomorrow.getDate()).padStart(2, '0');
    setDownPayment({ ...downPayment, deliveryDate: tomorrowStr });
  }, [downPayment, setDownPayment]);

  // إغلاق التقويم عند النقر خارجه
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // إنشاء التقويم
  const renderCalendar = useCallback(() => {
    if (!downPayment.deliveryDate) return null;

    const currentDate = new Date(downPayment.deliveryDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // أيام فارغة في البداية
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1"></div>);
    }
    
    // أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === currentDate.getDate();
      const isToday = new Date().getDate() === day && 
                    new Date().getMonth() === month && 
                    new Date().getFullYear() === year;
      
      days.push(
        <button
          key={day}
          onClick={() => {
            const newDate = new Date(year, month, day);
            // استخدام التاريخ المحلي بدلاً من UTC لتجنب مشكلة فرق اليوم
            const localDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            setDownPayment({ 
              ...downPayment, 
              deliveryDate: localDateString 
            });
            setShowDatePicker(false);
          }}
          className={`p-1 text-xs rounded hover:bg-blue-500 hover:text-white transition-colors ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : isToday 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  }, [downPayment, setDownPayment]);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-blue-400" />
        إدارة الدفع
      </h2>

      {/* طريقة الدفع */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-3">طريقة الدفع:</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'cash', label: 'نقدي', icon: '💵' },
            { value: 'wallet', label: 'محفظة إلكترونية', icon: '📱' },
            { value: 'instapay', label: 'انستا باي', icon: '💳' },
            { value: 'bank', label: 'تحويل بنكي', icon: '🏦' }
          ].map((method) => (
            <button
              key={method.value}
              onClick={() => setPaymentMethod(method.value)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                paymentMethod === method.value
                  ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-1">{method.icon}</div>
              <div className="text-sm font-medium">{method.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* العربون */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-gray-300">العربون:</label>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundManager.play('downPayment');
              const newEnabled = !downPayment.enabled;
              
              if (newEnabled && (!downPayment.amount || parseFloat(downPayment.amount) <= 0)) {
                notifyError('تحذير', 'يرجى إدخال مبلغ العربون بعد التفعيل');
              }
              
              setDownPayment({ 
                ...downPayment, 
                enabled: newEnabled,
                deliveryDate: newEnabled ? getLocalDateString() : downPayment.deliveryDate
              });
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              downPayment.enabled
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
          >
            {downPayment.enabled ? 'مفعل' : 'تفعيل العربون'}
          </button>
        </div>

        {downPayment.enabled && (
          <div className="space-y-4">
            {/* مبلغ العربون */}
            <div>
              <label className="block text-[11px] text-blue-200 mb-1">
                مبلغ العربون (جنيه)
                {(!downPayment.amount || parseFloat(downPayment.amount) <= 0) && (
                  <span className="text-red-400 text-xs block">⚠️ يرجى إدخال مبلغ العربون</span>
                )}
              </label>
              <input
                type="number"
                value={downPayment.amount}
                onChange={(e) => updateDownPaymentAmount(e.target.value)}
                className={`input-modern w-full px-2 py-1.5 text-xs text-right ${
                  (!downPayment.amount || parseFloat(downPayment.amount) <= 0) 
                    ? 'border-red-500 bg-red-900 bg-opacity-20' 
                    : ''
                }`}
                placeholder="0"
                min="0"
                step="0.01"
                style={{ 
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
              />
              
              {/* أزرار النسب السريعة */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => applyQuickPercentage(25)}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPercentage(50)}
                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickPercentage(75)}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                >
                  75%
                </button>
              </div>
            </div>

            {/* تاريخ الاستلام */}
            <div>
              <label className="block text-[11px] text-blue-200 mb-1">
                تاريخ الاستلام
                <span className="text-gray-500 text-xs block">
                  اليوم: {getLocalDateFormatted()} (ميلادي)
                </span>
              </label>
              
              <div className="relative">
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="يوم"
                    min="1"
                    max="31"
                    value={downPayment.deliveryDate ? parseInt(downPayment.deliveryDate.split('-')[2]) : ''}
                    onChange={(e) => updateDeliveryDate('day', e.target.value)}
                    className="input-modern w-1/3 px-2 py-1.5 text-xs text-center"
                  />
                  <span className="text-white text-xs flex items-center">/</span>
                  <input
                    type="number"
                    placeholder="شهر"
                    min="1"
                    max="12"
                    value={downPayment.deliveryDate ? parseInt(downPayment.deliveryDate.split('-')[1]) : ''}
                    onChange={(e) => updateDeliveryDate('month', e.target.value)}
                    className="input-modern w-1/3 px-2 py-1.5 text-xs text-center"
                  />
                  <span className="text-white text-xs flex items-center">/</span>
                  <input
                    type="number"
                    placeholder="سنة"
                    min="2025"
                    max="2030"
                    value={downPayment.deliveryDate ? downPayment.deliveryDate.split('-')[0] : ''}
                    onChange={(e) => updateDeliveryDate('year', e.target.value)}
                    className="input-modern w-1/3 px-2 py-1.5 text-xs text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded text-xs"
                    title="اختيار من التقويم"
                  >
                    📅
                  </button>
                </div>

                {/* التقويم */}
                {showDatePicker && (
                  <div 
                    className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 mt-1 shadow-lg date-picker-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <button
                          onClick={() => {
                            const currentDate = new Date(downPayment.deliveryDate);
                            currentDate.setMonth(currentDate.getMonth() - 1);
                            setDownPayment({ 
                              ...downPayment, 
                              deliveryDate: currentDate.toISOString().split('T')[0] 
                            });
                          }}
                          className="text-white hover:text-blue-300"
                        >
                          ‹
                        </button>
                        <span className="text-white text-sm font-medium">
                          {new Date(downPayment.deliveryDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </span>
                        <button
                          onClick={() => {
                            const currentDate = new Date(downPayment.deliveryDate);
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            setDownPayment({ 
                              ...downPayment, 
                              deliveryDate: currentDate.toISOString().split('T')[0] 
                            });
                          }}
                          className="text-white hover:text-blue-300"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    
                    {/* أيام الأسبوع */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-xs text-gray-400 text-center p-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* أيام الشهر */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-gray-500 text-center mb-2">
                        التقويم الميلادي
                      </div>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="w-full text-xs text-gray-400 hover:text-white"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* أزرار سريعة للتاريخ */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={setToday}
                    className="text-xs text-blue-300 hover:text-blue-200 underline"
                  >
                    اليوم
                  </button>
                  <button
                    type="button"
                    onClick={setTomorrow}
                    className="text-xs text-green-300 hover:text-green-200 underline"
                  >
                    غداً
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  تنسيق: يوم/شهر/سنة (ميلادي)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ملخص الدفع */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">ملخص الدفع</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-300">إجمالي الفاتورة:</span>
            <span className="text-white font-semibold">
              {(getTotal || 0).toLocaleString('en-US')} جنيه
            </span>
          </div>
          
          {downPayment.enabled && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-300">العربون:</span>
                <span className="text-blue-400 font-semibold">
                  {(downPayment.amount || 0).toLocaleString('en-US')} جنيه
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">المتبقي:</span>
                <span className="text-yellow-300 font-semibold">
                  {(getRemainingAmount || 0).toLocaleString('en-US')} جنيه
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">تاريخ الاستلام:</span>
                <span className="text-green-400 font-semibold">
                  {formatDateToDDMMYYYY(downPayment.deliveryDate)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* زر إتمام البيع */}
      <button
        onClick={() => onConfirmSale(paymentMethod)}
        disabled={!isDownPaymentValid}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
          isDownPaymentValid
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:scale-105 shadow-lg'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isDownPaymentValid ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6" />
            إتمام البيع
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6" />
            يرجى إكمال بيانات العربون
          </div>
        )}
      </button>
    </div>
  );
};

export default PaymentManager;
