import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

const ShiftManager = () => {
  const [shifts, setShifts] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // تحميل الورديات المحفوظة
  useEffect(() => {
    const savedShifts = localStorage.getItem('shifts');
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    }
    
    // تحميل الوردية النشطة
    const activeShift = localStorage.getItem('activeShift');
    if (activeShift) {
      setCurrentShift(JSON.parse(activeShift));
    }
  }, []);

  // بدء وردية جديدة
  const startShift = () => {
    const now = new Date();
    const shiftId = `shift_${now.getTime()}`;
    
    const newShift = {
      id: shiftId,
      userId: JSON.parse(localStorage.getItem('user') || '{}').id || 'current_user',
      userName: JSON.parse(localStorage.getItem('user') || '{}').username || 'مستخدم',
      startTime: now.toISOString(),
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
    
    // حفظ الوردية في قاعدة البيانات أيضاً للحماية من فقدان البيانات
    try {
      const { databaseManager } = await import('../utils/databaseManager');
      await databaseManager.add('shifts', newShift);
      console.log('✅ تم حفظ الوردية في قاعدة البيانات');
    } catch (error) {
      console.error('خطأ في حفظ الوردية في قاعدة البيانات:', error);
    }
    
    setMessage('تم بدء الوردية بنجاح!');
    setTimeout(() => setMessage(''), 3000);
  };

  // إنهاء الوردية
  const endShift = () => {
    if (!currentShift) return;

    const now = new Date();
    const updatedShift = {
      ...currentShift,
      endTime: now.toISOString(),
      status: 'completed',
      cashDrawer: {
        ...currentShift.cashDrawer,
        closingAmount: currentShift.cashDrawer.openingAmount + currentShift.totalSales
      }
    };

    const updatedShifts = [...shifts, updatedShift];
    setShifts(updatedShifts);
    setCurrentShift(null);
    
    localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    localStorage.removeItem('activeShift');
    
    setMessage('تم إنهاء الوردية بنجاح!');
    setTimeout(() => setMessage(''), 3000);
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
  };

  // حذف وردية
  const deleteShift = (shiftId) => {
    const updatedShifts = shifts.filter(shift => shift.id !== shiftId);
    setShifts(updatedShifts);
    localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    
    setMessage('تم حذف الوردية بنجاح!');
    setTimeout(() => setMessage(''), 3000);
  };

  // تصدير تقرير الورديات
  const exportShiftsReport = () => {
    const csvContent = [
      ['تاريخ البداية', 'تاريخ النهاية', 'المستخدم', 'إجمالي المبيعات', 'عدد الطلبات', 'مبلغ الصندوق', 'الحالة'],
      ...shifts.map(shift => [
        new Date(shift.startTime).toLocaleString('ar-SA'),
        shift.endTime ? new Date(shift.endTime).toLocaleString('ar-SA') : 'لم تنته',
        shift.userName,
        shift.totalSales.toFixed(2),
        shift.totalOrders,
        shift.cashDrawer.closingAmount.toFixed(2),
        shift.status === 'active' ? 'نشطة' : 'مكتملة'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shifts_report_${new Date().toISOString().split('T')[0]}.csv`);
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
                onClick={endShift}
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
                {new Date(currentShift.startTime).toLocaleString('ar-SA')}
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">إجمالي المبيعات</span>
              </div>
              <p className="text-white font-semibold">${currentShift.totalSales.toFixed(2)}</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-300">عدد الطلبات</span>
              </div>
              <p className="text-white font-semibold">{currentShift.totalOrders}</p>
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
            onClick={startShift}
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
            onClick={exportShiftsReport}
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
                shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-gray-700 hover:bg-white hover:bg-opacity-5">
                    <td className="py-3 px-4 text-sm text-white">
                      {new Date(shift.startTime).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{shift.userName}</td>
                    <td className="py-3 px-4 text-sm text-green-400 font-semibold">
                      ${shift.totalSales.toFixed(2)}
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
                      <button
                        onClick={() => deleteShift(shift.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="حذف الوردية"
                      >
                        حذف
                      </button>
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




