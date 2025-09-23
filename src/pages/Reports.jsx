import React, { useState, useEffect } from 'react';
import { useNotifications } from '../components/NotificationSystem';
import { 
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  PieChart,
  FileText,
  Edit,
  Trash2,
  Printer,
  RotateCcw,
  Eye,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Reports = () => {
  const { notifySuccess, notifyError } = useNotifications();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedReport, setSelectedReport] = useState('sales');
  const [salesData, setSalesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [activeShiftSales, setActiveShiftSales] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [realTimeData, setRealTimeData] = useState({
    dailySales: [],
    monthlySales: [],
    topProducts: [],
    categorySales: [],
    customerData: []
  });

  // تحليل البيانات الحقيقية من localStorage
  useEffect(() => {
    const analyzeData = () => {
      try {
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const activeShift = JSON.parse(localStorage.getItem('activeShift') || 'null');
        
        // تحليل المبيعات اليومية
        const dailySales = analyzeDailySales(sales);
        
        // تحليل المبيعات الشهرية
        const monthlySales = analyzeMonthlySales(sales);
        
        // تحليل المنتجات الأكثر مبيعاً
        const topProducts = analyzeTopProducts(sales, products);
        
        // تحليل توزيع المبيعات حسب الفئة
        const categorySales = analyzeCategorySales(sales);
        
        // تحليل بيانات العملاء
        const customerData = analyzeCustomerData(sales);
        
        // تحليل مبيعات الوردية النشطة - التحقق من وجود وردية نشطة
        const shiftSales = activeShift && activeShift.status === 'active' ? activeShift.sales || [] : [];
        
        setRealTimeData({
          dailySales,
          monthlySales,
          topProducts,
          categorySales,
          customerData
        });
        
        setActiveShiftSales(shiftSales);
      } catch (error) {
        console.error('خطأ في تحليل البيانات:', error);
        notifyError('خطأ في تحميل البيانات', 'حدث خطأ في تحليل البيانات');
      }
    };

    analyzeData();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(analyzeData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // تحليل المبيعات اليومية
  const analyzeDailySales = (sales) => {
    const last7Days = [];
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.toDateString() === date.toDateString();
      });
      
      const totalSales = daySales.reduce((sum, sale) => sum + sale.total, 0);
      const totalOrders = daySales.length;
      const uniqueCustomers = new Set(daySales.map(sale => sale.customer.name)).size;
      
      last7Days.push({
        day: days[date.getDay()],
        sales: totalSales,
        orders: totalOrders,
        customers: uniqueCustomers
      });
    }
    
    return last7Days;
  };

  // تحليل المبيعات الشهرية
  const analyzeMonthlySales = (sales) => {
    const monthlyData = [];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
      });
      
      const totalSales = monthSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalOrders = monthSales.length;
      const uniqueCustomers = new Set(monthSales.map(sale => sale.customer.name)).size;
      
      monthlyData.push({
        month: months[date.getMonth()],
        sales: totalSales,
        orders: totalOrders,
        customers: uniqueCustomers
      });
    }
    
    return monthlyData;
  };

  // تحليل المنتجات الأكثر مبيعاً
  const analyzeTopProducts = (sales, products) => {
    const productSales = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            name: item.name,
            sales: 0,
            revenue: 0,
            profit: 0
          };
        }
        productSales[item.id].sales += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
        // حساب الربح (افتراضي 30%)
        productSales[item.id].profit += (item.price * item.quantity) * 0.3;
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  };

  // تحليل توزيع المبيعات حسب الفئة
  const analyzeCategorySales = (sales) => {
    const categorySales = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!categorySales[item.category]) {
          categorySales[item.category] = 0;
        }
        categorySales[item.category] += item.price * item.quantity;
      });
    });
    
    const totalSales = Object.values(categorySales).reduce((sum, value) => sum + value, 0);
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return Object.entries(categorySales).map(([name, value], index) => ({
      name,
      value: Math.round((value / totalSales) * 100),
      color: colors[index % colors.length]
    }));
  };

  // تحليل بيانات العملاء
  const analyzeCustomerData = (sales) => {
    const customerData = {};
    
    sales.forEach(sale => {
      const customerName = sale.customer.name;
      if (!customerData[customerName]) {
        customerData[customerName] = {
          name: customerName,
          totalSpent: 0,
          orders: 0,
          lastVisit: sale.date
        };
      }
      customerData[customerName].totalSpent += sale.total;
      customerData[customerName].orders += 1;
      if (new Date(sale.date) > new Date(customerData[customerName].lastVisit)) {
        customerData[customerName].lastVisit = sale.date;
      }
    });
    
    return Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  };

  // بيانات المبيعات اليومية
  const dailySalesData = [
    { day: 'السبت', sales: 1200, orders: 15, customers: 12 },
    { day: 'الأحد', sales: 1900, orders: 22, customers: 18 },
    { day: 'الاثنين', sales: 3000, orders: 35, customers: 28 },
    { day: 'الثلاثاء', sales: 2800, orders: 32, customers: 25 },
    { day: 'الأربعاء', sales: 1890, orders: 21, customers: 17 },
    { day: 'الخميس', sales: 2390, orders: 28, customers: 22 },
    { day: 'الجمعة', sales: 3490, orders: 42, customers: 35 }
  ];

  // بيانات المبيعات الشهرية
  const monthlySalesData = [
    { month: 'يناير', sales: 45000, orders: 520, customers: 420 },
    { month: 'فبراير', sales: 38000, orders: 450, customers: 380 },
    { month: 'مارس', sales: 52000, orders: 620, customers: 520 },
    { month: 'أبريل', sales: 48000, orders: 580, customers: 480 },
    { month: 'مايو', sales: 61000, orders: 720, customers: 620 },
    { month: 'يونيو', sales: 55000, orders: 650, customers: 550 }
  ];

  // بيانات المنتجات الأكثر مبيعاً
  const topProductsData = [
    { name: 'حذاء رسمي أسود جلد طبيعي', sales: 45, revenue: 20250, profit: 6750 },
    { name: 'قميص رسمي أبيض قطني', sales: 72, revenue: 8640, profit: 2880 },
    { name: 'بنطلون رسمي كحلي قطني', sales: 38, revenue: 6840, profit: 2280 },
    { name: 'جاكيت رسمي رمادي صوف', sales: 28, revenue: 9800, profit: 2800 },
    { name: 'حذاء بني جلد طبيعي', sales: 22, revenue: 8360, profit: 2200 }
  ];

  // بيانات توزيع المبيعات حسب التصنيف
  const categorySalesData = [
    { name: 'أحذية', value: 35, color: '#8B5CF6' },
    { name: 'قمصان', value: 25, color: '#06B6D4' },
    { name: 'بناطيل', value: 20, color: '#10B981' },
    { name: 'جواكت', value: 20, color: '#F59E0B' }
  ];

  // بيانات العملاء
  const customerData = [
    { name: 'أحمد محمد', totalSpent: 2500, orders: 8, lastVisit: '2024-01-15' },
    { name: 'فاطمة علي', totalSpent: 1800, orders: 5, lastVisit: '2024-01-14' },
    { name: 'محمد حسن', totalSpent: 3200, orders: 12, lastVisit: '2024-01-13' },
    { name: 'سارة أحمد', totalSpent: 950, orders: 3, lastVisit: '2024-01-12' },
    { name: 'علي محمود', totalSpent: 4500, orders: 15, lastVisit: '2024-01-11' }
  ];

  // دوال إدارة الفواتير
  const openInvoiceModal = (invoice) => {
    try {
      if (!invoice) {
        notifyError('خطأ في عرض التفاصيل', 'الفاتورة غير موجودة');
        return;
      }
      
      setSelectedInvoice(invoice);
      setShowInvoiceModal(true);
      
      // إشعار المستخدم
      notifySuccess('تم فتح تفاصيل الفاتورة', `فاتورة رقم #${invoice.id}`);
    } catch (error) {
      console.error('خطأ في فتح نافذة التفاصيل:', error);
      notifyError('خطأ في عرض التفاصيل', 'حدث خطأ غير متوقع');
    }
  };

  const closeInvoiceModal = () => {
    try {
      setShowInvoiceModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('خطأ في إغلاق نافذة التفاصيل:', error);
    }
  };

  // إضافة مستمع لمفتاح Escape لإغلاق النافذة
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showInvoiceModal) {
        closeInvoiceModal();
      }
    };

    if (showInvoiceModal) {
      document.addEventListener('keydown', handleEscapeKey);
      // منع التمرير في الخلفية
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showInvoiceModal]);

  const editInvoice = (invoiceId) => {
    try {
      const invoice = activeShiftSales.find(sale => sale.id === invoiceId);
      if (invoice) {
        // حفظ الفاتورة للتعديل في localStorage
        localStorage.setItem('editInvoice', JSON.stringify(invoice));
        localStorage.setItem('editInvoiceId', invoiceId.toString());
        
        // إشعار المستخدم
        notifySuccess('تم تحضير الفاتورة للتعديل', 'سيتم توجيهك إلى نقطة البيع');
        
        // تأخير صغير قبل التوجيه
        setTimeout(() => {
          window.location.href = '/pos?edit=true';
        }, 1000);
      } else {
        notifyError('خطأ في العثور على الفاتورة', 'الفاتورة غير موجودة');
      }
    } catch (error) {
      console.error('خطأ في تحضير الفاتورة للتعديل:', error);
      notifyError('خطأ في تحضير الفاتورة', 'حدث خطأ غير متوقع');
    }
  };

  const deleteInvoice = (invoiceId) => {
    const invoice = activeShiftSales.find(sale => sale.id === invoiceId);
    if (invoice) {
      const confirmDelete = () => {
        try {
          // إزالة الفاتورة من مبيعات الوردية النشطة
          const activeShift = JSON.parse(localStorage.getItem('activeShift') || 'null');
          if (activeShift) {
            activeShift.sales = activeShift.sales.filter(sale => sale.id !== invoiceId);
            activeShift.totalSales -= invoice.total;
            activeShift.totalOrders -= 1;
            localStorage.setItem('activeShift', JSON.stringify(activeShift));
          }
          
          // تحديث البيانات المحلية
          setActiveShiftSales(prev => prev.filter(sale => sale.id !== invoiceId));
          
          // إغلاق نافذة التفاصيل إذا كانت مفتوحة
          if (selectedInvoice && selectedInvoice.id === invoiceId) {
            closeInvoiceModal();
          }
          
          notifySuccess('تم حذف الفاتورة بنجاح', `فاتورة رقم #${invoiceId}`);
        } catch (error) {
          console.error('خطأ في حذف الفاتورة:', error);
          notifyError('خطأ في حذف الفاتورة', 'حدث خطأ غير متوقع');
        }
      };

      // عرض نافذة تأكيد الحذف
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm';
      confirmDialog.innerHTML = `
        <div class="glass-card p-6 w-full max-w-md mx-4 animate-fadeInUp">
          <div class="text-center">
            <div class="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Trash2 class="h-8 w-8 text-red-400" />
            </div>
            <h3 class="text-xl font-bold text-white mb-4">تأكيد الحذف</h3>
            <div class="text-purple-200 mb-4">
              <p>رقم الفاتورة: <span class="text-white font-mono">#${invoice.id}</span></p>
              <p>المبلغ: <span class="text-white font-bold">${invoice.total} جنيه</span></p>
              <p>العميل: <span class="text-white">${invoice.customer.name}</span></p>
            </div>
            <p class="text-red-300 mb-6">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
            <div class="flex space-x-3">
              <button id="confirmDelete" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors">
                تأكيد الحذف
              </button>
              <button id="cancelDelete" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmDialog);
      
      // إضافة مستمعي الأحداث
      document.getElementById('confirmDelete').onclick = () => {
        document.body.removeChild(confirmDialog);
        confirmDelete();
      };
      
      document.getElementById('cancelDelete').onclick = () => {
        document.body.removeChild(confirmDialog);
      };
    }
  };

  const processReturn = (invoiceId) => {
    const invoice = activeShiftSales.find(sale => sale.id === invoiceId);
    if (invoice) {
      // إنشاء نافذة تأكيد مخصصة
      const confirmReturn = () => {
        try {
          // إضافة الفاتورة إلى المرتجعات
          const returns = JSON.parse(localStorage.getItem('returns') || '[]');
          const returnData = {
            ...invoice,
            returnDate: new Date().toISOString(),
            returnReason: 'مرتجعات العميل',
            originalInvoiceId: invoiceId,
            returnAmount: invoice.total,
            returnItems: invoice.items.length
          };
          returns.push(returnData);
          localStorage.setItem('returns', JSON.stringify(returns));
          
          // إزالة الفاتورة من مبيعات الوردية النشطة
          const activeShift = JSON.parse(localStorage.getItem('activeShift') || 'null');
          if (activeShift) {
            activeShift.sales = activeShift.sales.filter(sale => sale.id !== invoiceId);
            activeShift.totalSales -= invoice.total;
            activeShift.totalOrders -= 1;
            localStorage.setItem('activeShift', JSON.stringify(activeShift));
          }
          
          // تحديث البيانات المحلية
          setActiveShiftSales(prev => prev.filter(sale => sale.id !== invoiceId));
          
          // إغلاق نافذة التفاصيل إذا كانت مفتوحة
          if (selectedInvoice && selectedInvoice.id === invoiceId) {
            closeInvoiceModal();
          }
          
          notifySuccess('تم إجراء المرتجعات بنجاح', `تم إرجاع مبلغ ${invoice.total} جنيه`);
        } catch (error) {
          console.error('خطأ في إجراء المرتجعات:', error);
          notifyError('خطأ في إجراء المرتجعات', 'حدث خطأ غير متوقع');
        }
      };

      // عرض نافذة تأكيد مخصصة
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm';
      confirmDialog.innerHTML = `
        <div class="glass-card p-6 w-full max-w-md mx-4 animate-fadeInUp">
          <div class="text-center">
            <div class="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <RotateCcw class="h-8 w-8 text-red-400" />
            </div>
            <h3 class="text-xl font-bold text-white mb-4">تأكيد المرتجعات</h3>
            <div class="text-purple-200 mb-4">
              <p>رقم الفاتورة: <span class="text-white font-mono">#${invoice.id}</span></p>
              <p>المبلغ: <span class="text-white font-bold">${invoice.total} جنيه</span></p>
              <p>العميل: <span class="text-white">${invoice.customer.name}</span></p>
            </div>
            <p class="text-purple-300 mb-6">هل أنت متأكد من إجراء مرتجعات لهذه الفاتورة؟</p>
            <div class="flex space-x-3">
              <button id="confirmReturn" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors">
                تأكيد المرتجعات
              </button>
              <button id="cancelReturn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmDialog);
      
      // إضافة مستمعي الأحداث
      document.getElementById('confirmReturn').onclick = () => {
        document.body.removeChild(confirmDialog);
        confirmReturn();
      };
      
      document.getElementById('cancelReturn').onclick = () => {
        document.body.removeChild(confirmDialog);
      };
    }
  };

  // مرتجعات جزئية للمنتجات الفردية
  const processPartialReturn = (invoiceId, item, itemIndex) => {
    const invoice = activeShiftSales.find(sale => sale.id === invoiceId);
    if (invoice && item) {
      const confirmPartialReturn = () => {
        try {
          // إنشاء مرتجعات جزئية
          const partialReturns = JSON.parse(localStorage.getItem('partialReturns') || '[]');
          const partialReturnData = {
            invoiceId: invoiceId,
            itemId: item.id,
            itemName: item.name,
            itemCategory: item.category,
            originalQuantity: item.quantity,
            returnedQuantity: item.quantity, // يمكن تعديل هذا لاحقاً
            itemPrice: item.price,
            returnAmount: item.price * item.quantity,
            returnDate: new Date().toISOString(),
            returnReason: 'مرتجعات جزئية للعميل',
            originalInvoiceId: invoiceId,
            customerName: invoice.customer.name,
            customerPhone: invoice.customer.phone
          };
          partialReturns.push(partialReturnData);
          localStorage.setItem('partialReturns', JSON.stringify(partialReturns));

          // إزالة المنتج من الفاتورة الأصلية
          const updatedInvoice = { ...invoice };
          updatedInvoice.items = updatedInvoice.items.filter((_, index) => index !== itemIndex);
          
          // إعادة حساب المبالغ
          updatedInvoice.subtotal = updatedInvoice.items.reduce((total, item) => total + (item.price * item.quantity), 0);
          updatedInvoice.total = updatedInvoice.subtotal - updatedInvoice.discountAmount + updatedInvoice.taxAmount;

          // تحديث الفاتورة في الوردية النشطة
          const activeShift = JSON.parse(localStorage.getItem('activeShift') || 'null');
          if (activeShift) {
            activeShift.sales = activeShift.sales.map(sale => 
              sale.id === invoiceId ? updatedInvoice : sale
            );
            // إعادة حساب إجمالي المبيعات
            activeShift.totalSales = activeShift.sales.reduce((total, sale) => total + sale.total, 0);
            localStorage.setItem('activeShift', JSON.stringify(activeShift));
          }

          // تحديث البيانات المحلية
          setActiveShiftSales(prev => prev.map(sale => 
            sale.id === invoiceId ? updatedInvoice : sale
          ));

          // تحديث الفاتورة المحددة إذا كانت مفتوحة
          if (selectedInvoice && selectedInvoice.id === invoiceId) {
            setSelectedInvoice(updatedInvoice);
          }

          notifySuccess('تم إجراء المرتجعات الجزئية بنجاح', `تم إرجاع ${item.name} بقيمة ${item.price * item.quantity} جنيه`);
        } catch (error) {
          console.error('خطأ في إجراء المرتجعات الجزئية:', error);
          notifyError('خطأ في إجراء المرتجعات الجزئية', 'حدث خطأ غير متوقع');
        }
      };

      // عرض نافذة تأكيد المرتجعات الجزئية
      const confirmDialog = document.createElement('div');
      confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm';
      confirmDialog.innerHTML = `
        <div class="glass-card p-6 w-full max-w-md mx-4 animate-fadeInUp">
          <div class="text-center">
            <div class="w-16 h-16 bg-orange-500 bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <RotateCcw class="h-8 w-8 text-orange-400" />
            </div>
            <h3 class="text-xl font-bold text-white mb-4">تأكيد المرتجعات الجزئية</h3>
            <div class="text-purple-200 mb-4">
              <p>الفاتورة: <span class="text-white font-mono">#${invoice.id}</span></p>
              <p>المنتج: <span class="text-white font-bold">${item.name}</span></p>
              <p>الكمية: <span class="text-white">${item.quantity}</span></p>
              <p>السعر: <span class="text-white font-bold">${item.price} جنيه</span></p>
              <p>المجموع: <span class="text-white font-bold">${item.price * item.quantity} جنيه</span></p>
              <p>العميل: <span class="text-white">${invoice.customer.name}</span></p>
            </div>
            <p class="text-orange-300 mb-6">هل أنت متأكد من إرجاع هذا المنتج؟</p>
            <div class="flex space-x-3">
              <button id="confirmPartialReturn" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl transition-colors">
                تأكيد المرتجعات
              </button>
              <button id="cancelPartialReturn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmDialog);
      
      // إضافة مستمعي الأحداث
      document.getElementById('confirmPartialReturn').onclick = () => {
        document.body.removeChild(confirmDialog);
        confirmPartialReturn();
      };
      
      document.getElementById('cancelPartialReturn').onclick = () => {
        document.body.removeChild(confirmDialog);
      };
    }
  };

  const reprintInvoice = (invoice) => {
    try {
      if (!invoice) {
        notifyError('خطأ في الطباعة', 'الفاتورة غير موجودة');
        return;
      }

      // طباعة الفاتورة مرة أخرى
      const printContent = generateInvoiceContent(invoice);
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        notifyError('خطأ في الطباعة', 'تم منع النافذة المنبثقة');
        return;
      }

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // انتظار تحميل المحتوى قبل الطباعة
      printWindow.onload = () => {
        printWindow.print();
        notifySuccess('تم فتح نافذة الطباعة', 'تحقق من إعدادات الطابعة');
      };
      
    } catch (error) {
      console.error('خطأ في طباعة الفاتورة:', error);
      notifyError('خطأ في الطباعة', 'حدث خطأ غير متوقع');
    }
  };

  const generateInvoiceContent = (invoice) => {
    const storeInfo = JSON.parse(localStorage.getItem('storeInfo') || '{}');
    
    // حساب المبلغ المتبقي
    const remainingAmount = invoice.downPayment && invoice.downPayment.enabled 
      ? invoice.total - invoice.downPayment.amount 
      : 0;
    
    return `
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>فاتورة مبيعات</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              direction: rtl; 
              text-align: right; 
              padding: 20px; 
              background: white;
              color: black;
              max-width: 400px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .store-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-info {
              font-size: 12px;
              color: #666;
            }
            .invoice-info {
              margin: 15px 0;
              font-size: 14px;
            }
            .items {
              margin: 15px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 12px;
              border-bottom: 1px dotted #ccc;
              padding-bottom: 3px;
            }
            .total {
              border-top: 2px solid #333;
              padding-top: 10px;
              margin-top: 15px;
              font-weight: bold;
            }
            .payment-details {
              margin: 15px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            .payment-method {
              margin: 10px 0;
              font-size: 12px;
              font-weight: bold;
            }
            .down-payment {
              background: #e3f2fd;
              padding: 8px;
              border-radius: 5px;
              margin: 10px 0;
            }
            .remaining-amount {
              background: #fff3e0;
              padding: 8px;
              border-radius: 5px;
              margin: 10px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
              color: #666;
            }
            .divider {
              border-top: 1px dashed #333;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${storeInfo.storeName || 'Elking Store'}</div>
            <div class="store-info">
              ${storeInfo.storeAddress || 'شارع التحلية، الرياض'}<br>
              ${storeInfo.storePhone || '+966501234567'}
            </div>
          </div>
          
          <div class="invoice-info">
            <div><strong>رقم الفاتورة:</strong> ${invoice.id}</div>
            <div><strong>التاريخ:</strong> ${invoice.timestamp}</div>
            <div><strong>العميل:</strong> ${invoice.customer.name}</div>
            <div><strong>الهاتف:</strong> ${invoice.customer.phone}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="items">
            <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
              المنتجات والخدمات
            </div>
            ${invoice.items.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>${item.price * item.quantity} جنيه</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            <div>المجموع الفرعي: ${invoice.subtotal} جنيه</div>
            ${invoice.discountAmount > 0 ? `<div>الخصم: -${invoice.discountAmount} جنيه</div>` : ''}
            ${invoice.taxAmount > 0 ? `<div>الضريبة: ${invoice.taxAmount} جنيه</div>` : ''}
            <div style="border-top: 1px solid #333; padding-top: 5px; margin-top: 5px;">
              <strong>الإجمالي: ${invoice.total} جنيه</strong>
            </div>
          </div>
          
          <div class="payment-details">
            <div class="payment-method">
              طريقة الدفع: ${getPaymentMethodText(invoice.paymentMethod)}
            </div>
            
            ${invoice.downPayment && invoice.downPayment.enabled ? `
              <div class="down-payment">
                <div><strong>العربون المدفوع:</strong> ${invoice.downPayment.amount} جنيه</div>
                <div><strong>نوع العربون:</strong> ${invoice.downPayment.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}</div>
              </div>
              
              <div class="remaining-amount">
                <div><strong>المبلغ المتبقي:</strong> ${remainingAmount} جنيه</div>
                <div style="font-size: 11px; color: #666;">يتم دفعه عند استلام الطلب</div>
              </div>
            ` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div>شكراً لزيارتكم</div>
            <div>${new Date().toLocaleString('ar-SA')}</div>
            <div style="margin-top: 10px; font-size: 9px;">
              هذه فاتورة مطبوعة من نظام إدارة المبيعات
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      'cash': 'نقداً',
      'wallet': 'محفظة إلكترونية',
      'instapay': 'دفع فوري'
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-500" />;
      case 'wallet':
        return <Smartphone className="h-4 w-4 text-blue-500" />;
      case 'instapay':
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-500" />;
    }
  };

  const reports = [
    { id: 'sales', name: 'تقرير المبيعات', icon: DollarSign },
    { id: 'products', name: 'المنتجات الأكثر مبيعاً', icon: Package },
    { id: 'customers', name: 'تقرير العملاء', icon: Users },
    { id: 'inventory', name: 'تقرير المخزون', icon: BarChart3 },
    { id: 'invoices', name: 'فواتير الوردية النشطة', icon: Receipt },
    { id: 'partialReturns', name: 'المرتجعات الجزئية', icon: RotateCcw }
  ];

  const periods = [
    { id: 'day', name: 'اليوم' },
    { id: 'week', name: 'هذا الأسبوع' },
    { id: 'month', name: 'هذا الشهر' },
    { id: 'year', name: 'هذا العام' }
  ];

  const getFilteredInvoices = () => {
    let filtered = activeShiftSales;

    // فلترة حسب نوع الدفع
    if (invoiceFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.paymentMethod === invoiceFilter);
    }

    // فلترة حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer.phone.includes(searchTerm) ||
        invoice.id.toString().includes(searchTerm)
      );
    }

    return filtered;
  };

  const getCurrentData = () => {
    switch (selectedReport) {
      case 'sales':
        return selectedPeriod === 'week' ? realTimeData.dailySales : realTimeData.monthlySales;
      case 'products':
        return realTimeData.topProducts;
      case 'customers':
        return realTimeData.customerData;
      case 'inventory':
        return realTimeData.categorySales;
      case 'invoices':
        return getFilteredInvoices();
      case 'partialReturns':
        return JSON.parse(localStorage.getItem('partialReturns') || '[]');
      default:
        return realTimeData.dailySales;
    }
  };

  const exportReport = () => {
    const data = getCurrentData();
    
    // تحسين تصدير CSV للتعامل مع الأحرف الخاصة
    const escapeCSV = (field) => {
      if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).map(escapeCSV).join(",") + "\n" +
      data.map(row => Object.values(row).map(escapeCSV).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${selectedReport}_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // تنبيه نجاح التصدير
    notifySuccess('تم تصدير التقرير بنجاح', 'تم حفظ الملف في مجلد التحميلات');
  };

  const exportToPDF = () => {
    const data = getCurrentData();
    const reportTitle = reports.find(r => r.id === selectedReport)?.name || 'تقرير';
    const periodTitle = periods.find(p => p.id === selectedPeriod)?.name || 'فترة';
    
    // إنشاء محتوى PDF
    const pdfContent = `
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>${reportTitle} - ${periodTitle}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              direction: rtl; 
              text-align: right; 
              padding: 20px; 
              background: white;
              color: black;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: right;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${reportTitle}</div>
            <div class="subtitle">${periodTitle} - ${new Date().toLocaleDateString('ar-SA')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => 
                `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('ar-SA')}</p>
            <p>نظام إدارة متجر الأزياء الرجالية</p>
          </div>
        </body>
      </html>
    `;
    
    // فتح نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.print();
    
    // تنبيه نجاح التصدير
    notifySuccess('تم إنشاء تقرير PDF للطباعة', 'تم فتح نافذة الطباعة');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-3 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-3 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-3 animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-fadeInDown space-y-4 md:space-y-0">
          <div className="flex-1">
            <h1 className="text-sm md:text-base lg:text-lg xl:text-xl font-bold text-white mb-2 md:mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">
              التقارير والإحصائيات
            </h1>
            <p className="text-purple-200 text-xs md:text-xs lg:text-sm xl:text-sm font-medium">تحليل شامل لأداء مبيعات الملابس الرجالية</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={exportReport}
              className="btn-primary flex items-center px-3 md:px-4 py-2 md:py-3 text-xs md:text-xs lg:text-sm font-semibold"
            >
              <Download className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              تصدير CSV
            </button>
            <button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 flex items-center text-xs md:text-xs lg:text-sm font-semibold shadow-lg"
            >
              <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              تصدير PDF
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center text-xs md:text-xs lg:text-sm font-semibold shadow-lg"
              title="تحديث البيانات"
            >
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              تحديث
            </button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="glass-card p-4 md:p-6 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6">نوع التقرير</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-3 md:p-4 rounded-xl md:rounded-lg border-2 flex flex-col items-center transition-all duration-300 ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-300 shadow-glow'
                    : 'border-white border-opacity-20 hover:border-opacity-30 hover:bg-white hover:bg-opacity-5'
                }`}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6 mb-2 text-white" />
                <span className="text-xs md:text-sm font-medium text-white">{report.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Period Selection */}
      <div className="glass-card p-4 md:p-6 animate-fadeInUp mb-4 md:mb-6" style={{animationDelay: '0.2s'}}>
        <h3 className="text-lg font-bold text-white mb-4">الفترة الزمنية</h3>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-3 md:px-4 py-2 rounded-lg border transition-colors ${
                selectedPeriod === period.id
                  ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-300 shadow-glow'
                  : 'border-white border-opacity-20 bg-white bg-opacity-10 text-white hover:bg-opacity-20'
              }`}
            >
              {period.name}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="glass-card hover-lift animate-fadeInUp group cursor-pointer p-4 md:p-6" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-200 mb-1 uppercase tracking-wide">إجمالي المبيعات</p>
              <p className="text-lg md:text-xl font-bold text-white mb-2">$45,670</p>
              <div className="flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 font-semibold">+12.5%</span>
                <span className="text-purple-300 mr-1 font-medium">من الفترة الماضية</span>
            </div>
          </div>
            <div className="p-2 md:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card hover-lift animate-fadeInUp group cursor-pointer p-4 md:p-6" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-200 mb-1 uppercase tracking-wide">عدد الطلبات</p>
              <p className="text-lg md:text-xl font-bold text-white mb-2">342</p>
              <div className="flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 font-semibold">+8.2%</span>
                <span className="text-purple-300 mr-1 font-medium">من الفترة الماضية</span>
            </div>
          </div>
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card hover-lift animate-fadeInUp group cursor-pointer p-4 md:p-6" style={{animationDelay: '0.5s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-200 mb-1 uppercase tracking-wide">متوسط قيمة الطلب</p>
              <p className="text-lg md:text-xl font-bold text-white mb-2">$133.5</p>
              <div className="flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 font-semibold">+5.7%</span>
                <span className="text-purple-300 mr-1 font-medium">من الفترة الماضية</span>
            </div>
          </div>
            <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card hover-lift animate-fadeInUp group cursor-pointer p-4 md:p-6" style={{animationDelay: '0.6s'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-200 mb-1 uppercase tracking-wide">عدد العملاء</p>
              <p className="text-lg md:text-xl font-bold text-white mb-2">287</p>
              <div className="flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-green-400 font-semibold">+15.3%</span>
                <span className="text-purple-300 mr-1 font-medium">من الفترة الماضية</span>
            </div>
          </div>
            <div className="p-2 md:p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Sales Chart */}
        <div className="glass-card hover-lift animate-fadeInLeft" style={{animationDelay: '0.7s'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">مخطط المبيعات</h3>
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getCurrentData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey={selectedPeriod === 'week' ? 'day' : 'month'} stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.6} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="glass-card hover-lift animate-fadeInRight chart-enhanced" style={{animationDelay: '0.8s'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">توزيع المبيعات حسب التصنيف</h3>
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <PieChart className="h-6 w-6 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={categorySalesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categorySalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categorySalesData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-white">{item.name}</span>
                </div>
                <span className="font-medium text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card hover-lift animate-fadeInUp overflow-hidden" style={{animationDelay: '0.9s'}}>
        <div className="p-4 md:p-6 border-b border-white border-opacity-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h3 className="text-lg font-bold text-white">
            {selectedReport === 'sales' && 'تفاصيل المبيعات'}
            {selectedReport === 'products' && 'المنتجات الأكثر مبيعاً'}
            {selectedReport === 'customers' && 'أفضل العملاء'}
            {selectedReport === 'inventory' && 'حالة المخزون'}
              {selectedReport === 'invoices' && 'فواتير الوردية النشطة'}
          </h3>
            
            {/* فلترة وبحث الفواتير */}
            {selectedReport === 'invoices' && (
              <div className="w-full">
                {/* إحصائيات سريعة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-green-500 bg-opacity-20 px-4 py-3 rounded-lg border border-green-500 border-opacity-30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-300 text-sm">إجمالي الفواتير</p>
                        <p className="text-white font-bold text-xl">{activeShiftSales.length}</p>
        </div>
                      <Receipt className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-blue-500 bg-opacity-20 px-4 py-3 rounded-lg border border-blue-500 border-opacity-30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-300 text-sm">المبلغ الإجمالي</p>
                        <p className="text-white font-bold text-xl">
                          {activeShiftSales.reduce((sum, invoice) => sum + invoice.total, 0)} جنيه
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-500 bg-opacity-20 px-4 py-3 rounded-lg border border-purple-500 border-opacity-30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-300 text-sm">مع العربون</p>
                        <p className="text-white font-bold text-xl">
                          {activeShiftSales.filter(invoice => invoice.downPayment && invoice.downPayment.enabled).length}
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-500 bg-opacity-20 px-4 py-3 rounded-lg border border-orange-500 border-opacity-30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-300 text-sm">مكتملة الدفع</p>
                        <p className="text-white font-bold text-xl">
                          {activeShiftSales.filter(invoice => !invoice.downPayment || !invoice.downPayment.enabled).length}
                        </p>
                      </div>
                      <Banknote className="h-8 w-8 text-orange-400" />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {/* البحث */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="البحث في الفواتير..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-enhanced bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-2 text-white placeholder-purple-200 focus:outline-none focus:border-blue-500 w-full sm:w-64"
                    />
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-200" />
                  </div>
                  
                  {/* فلترة طريقة الدفع */}
                  <select
                    value={invoiceFilter}
                    onChange={(e) => setInvoiceFilter(e.target.value)}
                    className="input-enhanced bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">جميع طرق الدفع</option>
                    <option value="cash">نقداً</option>
                    <option value="wallet">محفظة إلكترونية</option>
                    <option value="instapay">دفع فوري</option>
                  </select>
                </div>
              </div>
            )}
        </div>
        <div className="overflow-x-auto table-enhanced">
          <table className="w-full">
            <thead className="bg-white bg-opacity-10">
              <tr>
                {selectedReport === 'sales' && (
                  <>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">التاريخ</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">المبيعات</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الطلبات</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">العملاء</th>
                  </>
                )}
                {selectedReport === 'products' && (
                  <>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">المنتج</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الكمية المباعة</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الإيرادات</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الربح</th>
                  </>
                )}
                {selectedReport === 'customers' && (
                  <>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">اسم العميل</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">إجمالي المشتريات</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">عدد الطلبات</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">آخر زيارة</th>
                  </>
                )}
                {selectedReport === 'invoices' && (
                  <>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">رقم الفاتورة</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">العميل</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">المبلغ</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">طريقة الدفع</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">التاريخ</th>
                    <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الإجراءات</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white divide-opacity-20">
              {getCurrentData().length === 0 && selectedReport === 'invoices' ? (
                <tr>
                  <td colSpan="6" className="px-4 md:px-6 py-12 text-center text-purple-200">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                        <Receipt className="h-10 w-10 text-red-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">لا توجد وردية نشطة</h3>
                      <p className="text-lg font-medium text-purple-200 mb-2">لا يمكن عرض فواتير الوردية النشطة</p>
                      <p className="text-sm text-purple-300 mb-4">يجب بدء وردية جديدة في الإعدادات أولاً</p>
                      <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg p-4 max-w-md">
                        <p className="text-yellow-200 text-sm">
                          💡 <strong>نصيحة:</strong> اذهب إلى الإعدادات وابدأ وردية جديدة لعرض الفواتير
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                getCurrentData().map((item, index) => (
                <tr key={index} className="hover:bg-white hover:bg-opacity-10 transition-colors">
                  {selectedReport === 'sales' && (
                    <>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.day || item.month}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">${item.sales}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.orders}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.customers}</td>
                    </>
                  )}
                  {selectedReport === 'products' && (
                    <>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.name}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.sales}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">${item.revenue}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">${item.profit}</td>
                    </>
                  )}
                  {selectedReport === 'customers' && (
                    <>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.name}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">${item.totalSpent}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.orders}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.lastVisit}</td>
                    </>
                  )}
                  {selectedReport === 'invoices' && (
                    <>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">#{item.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.downPayment && item.downPayment.enabled 
                              ? 'bg-blue-500 bg-opacity-20 text-blue-300' 
                              : 'bg-green-500 bg-opacity-20 text-green-300'
                          }`}>
                            {item.downPayment && item.downPayment.enabled ? 'عربون' : 'مكتمل'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div className="font-medium">{item.customer.name}</div>
                          <div className="text-purple-200 text-xs">{item.customer.phone}</div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="text-right">
                          <div className="font-bold text-lg">{item.total} جنيه</div>
                          {item.downPayment && item.downPayment.enabled && (
                            <div className="text-xs text-blue-300">
                              مدفوع: {item.downPayment.amount} جنيه
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(item.paymentMethod)}
                          <span className="mr-2">{getPaymentMethodText(item.paymentMethod)}</span>
                        </div>
                        {item.downPayment && item.downPayment.enabled && (
                          <div className="text-xs text-blue-300 mt-1">
                            <div>عربون: {item.downPayment.amount} جنيه</div>
                            <div>متبقي: {item.total - item.downPayment.amount} جنيه</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">{item.timestamp}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => openInvoiceModal(item)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => editInvoice(item.id)}
                            className="text-green-400 hover:text-green-300 transition-colors p-1 hover:bg-green-500 hover:bg-opacity-20 rounded"
                            title="تعديل الفاتورة"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => reprintInvoice(item)}
                            className="text-purple-400 hover:text-purple-300 transition-colors p-1 hover:bg-purple-500 hover:bg-opacity-20 rounded"
                            title="طباعة مرة أخرى"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => processReturn(item.id)}
                            className="text-orange-400 hover:text-orange-300 transition-colors p-1 hover:bg-orange-500 hover:bg-opacity-20 rounded"
                            title="إجراء مرتجعات"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteInvoice(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500 hover:bg-opacity-20 rounded"
                            title="حذف الفاتورة"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeInvoiceModal();
            }
          }}
        >
          <div className="glass-card p-6 w-full max-w-5xl mx-4 animate-fadeInUp max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white border-opacity-20">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">فاتورة مبيعات</h3>
                  <p className="text-purple-200 text-sm">
                    رقم الفاتورة: <span className="text-white font-mono bg-purple-500 bg-opacity-20 px-2 py-1 rounded">#{selectedInvoice.id}</span>
                  </p>
                  <p className="text-purple-200 text-xs mt-1">
                    تاريخ الإنشاء: {selectedInvoice.timestamp}
                  </p>
                </div>
              </div>
              <button
                onClick={closeInvoiceModal}
                className="text-gray-400 hover:text-white transition-colors p-3 hover:bg-white hover:bg-opacity-10 rounded-xl"
                title="إغلاق"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div className="glass-card p-4">
                <h4 className="text-lg font-semibold text-white mb-4">معلومات العميل</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-200">الاسم:</span>
                    <span className="text-white font-medium">{selectedInvoice.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">الهاتف:</span>
                    <span className="text-white font-medium">{selectedInvoice.customer.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">عدد المنتجات:</span>
                    <span className="text-white font-medium">{selectedInvoice.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">إجمالي الكمية:</span>
                    <span className="text-white font-medium">
                      {selectedInvoice.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              </div>

            {/* Payment Info */}
            <div className="glass-card p-4">
              <h4 className="text-lg font-semibold text-white mb-4">معلومات الدفع</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-200">طريقة الدفع:</span>
                  <div className="flex items-center">
                    {getPaymentMethodIcon(selectedInvoice.paymentMethod)}
                    <span className="text-white font-medium mr-2">{getPaymentMethodText(selectedInvoice.paymentMethod)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">التاريخ:</span>
                  <span className="text-white font-medium">{selectedInvoice.timestamp}</span>
                </div>
                
                {/* تفاصيل العربون */}
                {selectedInvoice.downPayment && selectedInvoice.downPayment.enabled && (
                  <div className="mt-4 p-3 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-500 border-opacity-30">
                    <h5 className="text-blue-300 font-semibold mb-2">تفاصيل العربون</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-200">المبلغ المدفوع:</span>
                        <span className="text-blue-100 font-bold">{selectedInvoice.downPayment.amount} جنيه</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">نوع العربون:</span>
                        <span className="text-blue-100">
                          {selectedInvoice.downPayment.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">المبلغ المتبقي:</span>
                        <span className="text-orange-300 font-bold">
                          {selectedInvoice.total - selectedInvoice.downPayment.amount} جنيه
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* Items */}
            <div className="glass-card p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">المنتجات</h4>
                <div className="text-purple-200 text-sm">
                  إجمالي المنتجات: {selectedInvoice.items.length}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white border-opacity-20">
                      <th className="text-right py-3 px-2 text-purple-200 font-semibold">المنتج</th>
                      <th className="text-right py-3 px-2 text-purple-200 font-semibold">الفئة</th>
                      <th className="text-right py-3 px-2 text-purple-200 font-semibold">الكمية</th>
                      <th className="text-right py-3 px-2 text-purple-200 font-semibold">السعر</th>
                      <th className="text-right py-3 px-2 text-purple-200 font-semibold">المجموع</th>
                      <th className="text-right py-3 px-2 text-purple-200 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors">
                        <td className="py-3 px-2 text-white font-medium">{item.name}</td>
                        <td className="py-3 px-2 text-purple-200 text-sm">{item.category || 'غير محدد'}</td>
                        <td className="py-3 px-2 text-white text-center">
                          <span className="bg-blue-500 bg-opacity-20 px-2 py-1 rounded-full text-sm">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-white">{item.price} جنيه</td>
                        <td className="py-3 px-2 text-white font-bold text-green-400">
                          {item.price * item.quantity} جنيه
                        </td>
                        <td className="py-3 px-2 text-white">
                          <div className="flex gap-1">
                            <button
                              onClick={() => processPartialReturn(selectedInvoice.id, item, index)}
                              className="text-orange-400 hover:text-orange-300 transition-colors p-1 hover:bg-orange-500 hover:bg-opacity-20 rounded"
                              title="مرتجعات جزئية"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

            {/* Totals */}
            <div className="glass-card p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">تفاصيل المبلغ</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-purple-200">المجموع الفرعي:</span>
                  <span className="text-white font-medium">{selectedInvoice.subtotal} جنيه</span>
                </div>
                
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center py-2 bg-red-500 bg-opacity-10 rounded-lg px-3">
                    <span className="text-red-200">الخصم:</span>
                    <span className="text-red-400 font-bold">-{selectedInvoice.discountAmount} جنيه</span>
                  </div>
                )}
                
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between items-center py-2 bg-blue-500 bg-opacity-10 rounded-lg px-3">
                    <span className="text-blue-200">الضريبة:</span>
                    <span className="text-blue-400 font-bold">{selectedInvoice.taxAmount} جنيه</span>
                  </div>
                )}
                
                {selectedInvoice.downPayment && selectedInvoice.downPayment.enabled && (
                  <div className="bg-blue-500 bg-opacity-10 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">العربون المدفوع:</span>
                      <span className="text-blue-400 font-bold">{selectedInvoice.downPayment.amount} جنيه</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-200">المبلغ المتبقي:</span>
                      <span className="text-orange-400 font-bold">{selectedInvoice.total - selectedInvoice.downPayment.amount} جنيه</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t-2 border-white border-opacity-30 pt-3 mt-3">
                  <span className="text-white font-bold text-xl">الإجمالي النهائي:</span>
                  <span className="text-white font-bold text-2xl bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    {selectedInvoice.total} جنيه
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">الإجراءات المتاحة</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => editInvoice(selectedInvoice.id)}
                  className="btn-primary flex items-center justify-center px-4 py-3 hover:scale-105 transition-transform"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  تعديل الفاتورة
                </button>
                <button
                  onClick={() => reprintInvoice(selectedInvoice)}
                  className="btn-primary bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center hover:scale-105"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  طباعة مرة أخرى
                </button>
                <button
                  onClick={() => processReturn(selectedInvoice.id)}
                  className="btn-primary bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 flex items-center justify-center hover:scale-105"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  مرتجعات كاملة
                </button>
                <button
                  onClick={() => deleteInvoice(selectedInvoice.id)}
                  className="btn-primary bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center hover:scale-105"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  حذف الفاتورة
                </button>
              </div>
              
              {/* زر إغلاق إضافي */}
              <div className="flex justify-center mt-6 pt-4 border-t border-white border-opacity-20">
                <button
                  onClick={closeInvoiceModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition-colors flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default Reports;
