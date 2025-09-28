import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Clock,
  Trash2,
  Plus,
  Minus,
  Printer,
  User,
  Phone,
  Mail,
  Package,
  DollarSign,
  Play,
  Square,
  Filter,
  Receipt,
  X,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from '../components/NotificationSystem';
import { ImageManager } from '../utils/imageManager';
import databaseManager from '../utils/database.js';
import encryptionManager from '../utils/encryption.js';
import backupManager from '../utils/backupManager.js';
import thermalPrinterManager from '../utils/thermalPrinter.js';
import soundManager from '../utils/soundManager.js';
import emojiManager from '../utils/emojiManager.js';
import { formatDate, formatTimeOnly } from '../utils/dateUtils.js';

const POS = () => {
  const { notifySuccess, notifyError } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [downPayment, setDownPayment] = useState({
    enabled: false,
    amount: ''
  });
  const [discounts, setDiscounts] = useState({
    percentage: '',
    fixed: '',
    type: 'percentage' // 'percentage' or 'fixed'
  });
  // تحميل إعدادات الضرائب من storeInfo
  const [taxes, setTaxes] = useState(() => {
    const savedStoreInfo = JSON.parse(localStorage.getItem('storeInfo') || '{}');
    return {
      vat: savedStoreInfo.taxRate || 15,
      enabled: savedStoreInfo.taxEnabled !== false,
      name: savedStoreInfo.taxName || 'ضريبة القيمة المضافة'
    };
  });
  const [theme, setTheme] = useState('dark');
  const [activeShift, setActiveShift] = useState(null);
  const [showInvoiceSummary, setShowInvoiceSummary] = useState(false);




  // إضافة منتج للسلة
  // حذف فئة
  const deleteCategory = async (categoryName) => {
    try {
      if (categoryName === 'الكل') return;
      if (!window.confirm(`هل تريد حذف فئة "${categoryName}"؟`)) return;
      const categoryToDelete = categories.find(c => c.name === categoryName);

      // نقل منتجات هذه الفئة إلى "غير مصنف"
      const fallbackName = 'غير مصنف';
      let ensuredCategories = categories;
      if (!categories.some(c => c.name === fallbackName)) {
        ensuredCategories = [...categories, { id: Date.now(), name: fallbackName }];
      }

      const updatedProducts = products.map(p => p.category === categoryName ? { ...p, category: fallbackName } : p);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      try { for (const p of updatedProducts.filter(p=>p.category===fallbackName)) { await databaseManager.update('products', p); } } catch (e) {}

      const updated = ensuredCategories.filter(c => c.name !== categoryName);
      setCategories(updated);
      // تحديث التخزين المحلي للمزامنة مع تبويبات أخرى
      localStorage.setItem('productCategories', JSON.stringify(updated));
      // حذف من قاعدة البيانات إن وُجد معرف
      if (categoryToDelete && categoryToDelete.id !== undefined) {
        try { await databaseManager.delete('categories', categoryToDelete.id); } catch (e) {}
      }
      if (selectedCategory === categoryName) setSelectedCategory('الكل');
      notifySuccess('تم حذف الفئة', `تم حذف فئة ${categoryName} ونقل منتجاتها إلى ${fallbackName}`);
    } catch (err) {
      notifyError('فشل حذف الفئة', 'حدث خطأ أثناء حذف الفئة');
    }
  };

  const editCategory = async (oldName) => {
    try {
      if (oldName === 'الكل') return;
      const newName = window.prompt('أدخل اسم الفئة الجديد', oldName);
      if (!newName || newName.trim() === '' || newName === oldName) return;
      if (categories.some(c => c.name === newName)) {
        notifyError('اسم الفئة موجود', 'اختر اسمًا مختلفًا');
        return;
      }

      const updatedCategories = categories.map(c => c.name === oldName ? { ...c, name: newName } : c);
      setCategories(updatedCategories);
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      try {
        const cat = categories.find(c => c.name === oldName);
        if (cat && cat.id !== undefined) await databaseManager.update('categories', { ...cat, name: newName });
      } catch (e) {}

      // تحديث المنتجات التابعة لهذه الفئة
      const updatedProducts = products.map(p => p.category === oldName ? { ...p, category: newName } : p);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      try { for (const p of updatedProducts.filter(p=>p.category===newName)) { await databaseManager.update('products', p); } } catch (e) {}

      if (selectedCategory === oldName) setSelectedCategory(newName);
      notifySuccess('تم تعديل الفئة', `تم تغيير اسم الفئة إلى ${newName}`);
    } catch (err) {
      notifyError('فشل تعديل الفئة', 'حدث خطأ أثناء تعديل الفئة');
    }
  };

  const addToCart = (product) => {
    soundManager.play('addProduct'); // تشغيل صوت إضافة منتج
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // تحديث كمية المنتج
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // حذف منتج من السلة
  const removeFromCart = (id) => {
    soundManager.play('removeProduct'); // تشغيل صوت حذف منتج
    setCart(cart.filter(item => item.id !== id));
  };

  // حساب الإجمالي
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    if (discounts.type === 'percentage') {
      return discounts.percentage ? (subtotal * discounts.percentage) / 100 : 0;
    } else {
      return discounts.fixed || 0;
    }
  };

  const getTaxAmount = () => {
    if (!taxes.enabled) return 0;
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const taxableAmount = subtotal - discountAmount;
    return (taxableAmount * taxes.vat) / 100;
  };

  // حساب مبلغ العربون
  const getDownPaymentAmount = () => {
    if (!downPayment.enabled) return 0;
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const afterDiscount = subtotal - discountAmount;
    
    const amount = (downPayment.amount === '' || downPayment.amount === null || downPayment.amount === undefined) ? 0 : downPayment.amount;
    return Math.min(amount, afterDiscount);
  };

  // حساب المبلغ المتبقي
  const getRemainingAmount = () => {
    const total = getTotal();
    const downPaymentAmount = getDownPaymentAmount();
    return total - downPaymentAmount;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const taxAmount = getTaxAmount();
    return subtotal - discountAmount + taxAmount;
  };

  // التحقق من صحة اسم العميل
  const validateCustomerName = (name) => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: 'اسم العميل مطلوب' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: 'اسم العميل يجب أن يكون أكثر من حرفين' };
    }
    if (name.trim().length > 50) {
      return { isValid: false, message: 'اسم العميل يجب أن يكون أقل من 50 حرف' };
    }
    // التحقق من أن الاسم يحتوي على أحرف فقط (مع السماح بالمسافات)
    const nameRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\s]+$/;
    if (!nameRegex.test(name.trim())) {
      return { isValid: false, message: 'اسم العميل يجب أن يحتوي على أحرف فقط' };
    }
    return { isValid: true, message: '' };
  };

  // التحقق من صحة رقم الهاتف
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim().length === 0) {
      return { isValid: false, message: 'رقم الهاتف مطلوب' };
    }
    // إزالة جميع المسافات والرموز غير الرقمية
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // التحقق من أن الرقم يحتوي على أرقام فقط
    if (!/^\d+$/.test(cleanPhone)) {
      return { isValid: false, message: 'رقم الهاتف يجب أن يحتوي على أرقام فقط' };
    }
    
    // التحقق من طول الرقم (بين 7 و 15 رقم)
    if (cleanPhone.length < 7) {
      return { isValid: false, message: 'رقم الهاتف قصير جداً (أقل من 7 أرقام)' };
    }
    if (cleanPhone.length > 15) {
      return { isValid: false, message: 'رقم الهاتف طويل جداً (أكثر من 15 رقم)' };
    }
    
    // التحقق من أن الرقم يبدأ بـ 0 أو + (للأرقام السعودية)
    if (!cleanPhone.startsWith('0') && !cleanPhone.startsWith('966')) {
      return { isValid: false, message: 'رقم الهاتف يجب أن يبدأ بـ 0 أو 966' };
    }
    
    return { isValid: true, message: '' };
  };

  // التحقق من صحة جميع بيانات العميل
  const validateCustomerData = () => {
    const nameValidation = validateCustomerName(customerInfo.name);
    const phoneValidation = validatePhoneNumber(customerInfo.phone);
    
    return {
      isValid: nameValidation.isValid && phoneValidation.isValid,
      errors: {
        name: nameValidation.message,
        phone: phoneValidation.message
      }
    };
  };

  // عرض ملخص الفاتورة
  const showInvoiceSummaryModal = () => {
    if (cart.length === 0) {
      notifyError('السلة فارغة', 'يجب إضافة منتجات للسلة قبل إتمام البيع');
      return;
    }

    if (!activeShift) {
      notifyError('لا توجد وردية نشطة', 'يجب بدء وردية جديدة من الإعدادات قبل إتمام البيع');
      return;
    }

    // عرض ملخص الفاتورة
    setShowInvoiceSummary(true);
  };

  // إتمام البيع الفعلي
  const confirmSale = async () => {
    try {
      if (!activeShift) {
        notifyError('لا توجد وردية نشطة', 'يجب بدء وردية جديدة من الإعدادات قبل إتمام البيع');
        return;
      }

      // التحقق من صحة بيانات العميل
      const customerValidation = validateCustomerData();
      if (!customerValidation.isValid) {
        if (customerValidation.errors.name) {
          notifyError('خطأ في البيانات', customerValidation.errors.name);
        }
        if (customerValidation.errors.phone) {
          notifyError('خطأ في البيانات', customerValidation.errors.phone);
        }
        return;
      }

      // التحقق من توفر المخزون
      const insufficientStock = cart.some(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        return !product || product.stock < cartItem.quantity;
      });

      if (insufficientStock) {
        notifyError('مخزون غير كافي', 'بعض المنتجات لا تحتوي على مخزون كافي');
        return;
      }
    
    const invoiceId = `INV-${Date.now()}`;
    const sale = {
      id: invoiceId,
      customer: customerInfo,
      items: cart,
      subtotal: getSubtotal(),
      discountAmount: getDiscountAmount(),
      taxAmount: getTaxAmount(),
      total: getTotal(),
      discounts,
      taxes,
      paymentMethod: downPayment.enabled 
        ? `${paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة إلكترونية' : 'انستا باي'} (دفع جزئي)`
        : paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة إلكترونية' : 'انستا باي',
      timestamp: new Date().toLocaleString('ar-SA'),
      date: new Date().toISOString(),
      downPayment: downPayment.enabled ? {
        enabled: true,
        amount: getDownPaymentAmount(),
        remaining: getRemainingAmount()
      } : null
    };
    
    console.log('تم البيع:', sale);
    
    // تشفير البيانات الحساسة
    const encryptedSale = encryptionManager.encryptSensitiveData(sale, ['customer']);
    
    // حفظ البيع في قاعدة البيانات
    await databaseManager.add('sales', encryptedSale);
    
    // حفظ البيع في localStorage أيضاً للتأكد من ظهوره في التقارير
    const existingSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const updatedSales = [...existingSales, sale];
    localStorage.setItem('sales', JSON.stringify(updatedSales));
    
    // تسجيل البيع في الوردية النشطة
    if (activeShift) {
      const updatedShift = {
        ...activeShift,
        sales: [...activeShift.sales, sale],
        totalSales: activeShift.totalSales + sale.total,
        totalOrders: activeShift.totalOrders + 1,
        status: 'active' // ضمان بقاء الوردية نشطة
      };
      setActiveShift(updatedShift);
      localStorage.setItem('activeShift', JSON.stringify(updatedShift));
      await databaseManager.update('shifts', updatedShift);
      console.log('✅ تم تحديث الوردية النشطة:', updatedShift);
    } else {
      console.log('⚠️ لا توجد وردية نشطة لتسجيل البيع');
    }
    
    // تحديث المخزون في المنتجات
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return {
          ...product,
          stock: Math.max(0, product.stock - cartItem.quantity)
        };
      }
      return product;
    });
    setProducts(updatedProducts);
    
    // حفظ المنتجات المحدثة في قاعدة البيانات
    for (const product of updatedProducts) {
      await databaseManager.update('products', product);
    }
    
    // حفظ المنتجات المحدثة في localStorage أيضاً
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    // فحص المخزون المنخفض (بدون إشعارات)
    updatedProducts.forEach(product => {
      if (product.stock <= product.minStock) {
        console.log('منتج منخفض المخزون بعد البيع:', product.name, 'المخزون:', product.stock, 'الحد الأدنى:', product.minStock);
      }
    });

    // إنشاء نسخة احتياطية تلقائية
    try {
      await backupManager.createAutoBackup();
    } catch (backupError) {
      console.warn('خطأ في إنشاء النسخة الاحتياطية:', backupError);
    }

    // طباعة الإيصال بعد إتمام البيع
    try {
      await printReceipt(invoiceId);
    } catch (printError) {
      // لا نوقف العملية إذا فشلت الطباعة - طباعة صامتة
    }
    
    // إعادة تعيين البيانات
    setCart([]);
    setCustomerInfo({ name: '', phone: '' });
    setPaymentMethod('cash');
    setDiscounts({ percentage: '', fixed: '', type: 'percentage' });

    // إغلاق نافذة ملخص الفاتورة
    setShowInvoiceSummary(false);
    
    // تشغيل صوت النجاح
    soundManager.play('success');
    
    // إشعار نجاح البيع
    notifySuccess('تم إتمام البيع بنجاح', `المبلغ الإجمالي: ${sale.total.toFixed(2)} جنيه`);
    
    } catch (error) {
      console.error('خطأ في إتمام البيع:', error);
      soundManager.play('error'); // تشغيل صوت الخطأ
      notifyError('خطأ في النظام', 'حدث خطأ غير متوقع أثناء إتمام البيع');
    }
  };

  // إلغاء البيع
  const cancelSale = () => {
    soundManager.play('closeWindow'); // تشغيل صوت إغلاق النافذة
    setShowInvoiceSummary(false);
  };

  // طباعة الإيصال
  const printReceipt = async (invoiceId = null) => {
    try {
      // الحصول على بيانات المتجر المحفوظة
      const storeInfo = JSON.parse(localStorage.getItem('storeInfo') || '{}');
      
      const receiptData = {
        storeName: storeInfo.storeName || 'Elking Store',
        storeDescription: storeInfo.storeDescription || 'نظام إدارة المبيعات',
        storeAddress: storeInfo.storeAddress,
        storePhone: storeInfo.storePhone,
        storeTaxNumber: storeInfo.storeTaxNumber,
        date: new Date().toLocaleString('ar-SA'),
        invoiceId: invoiceId || `INV-${Date.now()}`, // استخدام رقم الفاتورة الممرر أو إنشاء جديد
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        tax: getTaxAmount(),
        total: getTotal(),
        downPayment: getDownPaymentAmount(),
        remaining: getRemainingAmount(),
        paymentMethod: downPayment.enabled 
          ? `${paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة' : 'انستا باي'} (دفع جزئي)`
          : paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة' : 'انستا باي'
      };

      // محاولة الطباعة على الطابعة الحرارية
      try {
        const printResult = await thermalPrinterManager.printReceipt(receiptData);
        if (printResult) {
          soundManager.play('print'); // تشغيل صوت الطباعة
          notifySuccess('تم طباعة الإيصال', 'تم إرسال الإيصال للطابعة الحرارية');
          return;
        } else {
          console.log('تم تخطي الطباعة الحرارية - لا توجد طابعة متصلة');
        }
      } catch (thermalError) {
        console.log('خطأ في الطباعة الحرارية:', thermalError.message);
        // المتابعة للطباعة التقليدية بدون إظهار خطأ
      }

      // الطباعة التقليدية كبديل
      const receiptContent = `
╔══════════════════════════════════════╗
║           Elking Store               ║
║        نظام إدارة متطور             ║
╚══════════════════════════════════════╝

${receiptData.storeName}
${receiptData.storeDescription}
${'═'.repeat(40)}

📅 التاريخ: ${receiptData.date}
🆔 رقم الفاتورة: #${receiptData.invoiceId}
${receiptData.storeAddress ? `📍 العنوان: ${receiptData.storeAddress}` : ''}
${receiptData.storePhone ? `📞 الهاتف: ${receiptData.storePhone}` : ''}
${receiptData.storeTaxNumber ? `🏛️ الرقم الضريبي: ${receiptData.storeTaxNumber}` : ''}

${'─'.repeat(40)}

👤 بيانات العميل:
${receiptData.customerName ? `   الاسم: ${receiptData.customerName}` : '   عميل عام'}
${receiptData.customerPhone ? `   الهاتف: ${receiptData.customerPhone}` : ''}

${'─'.repeat(40)}

🛍️ المنتجات:
${receiptData.items.map((item, index) => {
  const itemName = item.name.length > 22 ? item.name.substring(0, 22) + '...' : item.name;
  const itemTotal = (item.price * item.quantity).toFixed(2);
  return `   ${(index + 1).toString().padStart(2, ' ')}. ${itemName.padEnd(25, ' ')} ${item.quantity.toString().padStart(2, ' ')} × ${item.price.toFixed(2).padStart(6, ' ')} = ${itemTotal.padStart(8, ' ')} جنيه`;
}).join('\n')}

${'─'.repeat(40)}

💰 ملخص الفاتورة:
   المجموع الفرعي: ${receiptData.subtotal.toFixed(2).padStart(17, ' ')} جنيه
${receiptData.discount > 0 ? `   الخصم: ${(-receiptData.discount).toFixed(2).padStart(22, ' ')} جنيه` : ''}
${taxes.enabled && receiptData.tax > 0 ? `   ${taxes.name} (${taxes.vat}%): ${receiptData.tax.toFixed(2).padStart(12, ' ')} جنيه` : ''}

${'═'.repeat(40)}

   الإجمالي: ${receiptData.total.toFixed(2).padStart(22, ' ')} جنيه
${receiptData.downPayment > 0 ? `   العربون: ${receiptData.downPayment.toFixed(2).padStart(20, ' ')} جنيه` : ''}
${receiptData.downPayment > 0 ? `   المبلغ المتبقي: ${receiptData.remaining.toFixed(2).padStart(15, ' ')} جنيه` : ''}

${'─'.repeat(40)}

💳 طريقة الدفع: ${receiptData.paymentMethod}

${'═'.repeat(40)}

شكراً لزيارتكم
Elking Store - نظام إدارة متطور
    `;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notifyError('خطأ في الطباعة', 'لا يمكن فتح نافذة الطباعة. تحقق من إعدادات المتصفح');
      return;
    }
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>إيصال البيع - Elking Store</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                font-family: 'Courier New', 'Monaco', monospace; 
                direction: rtl; 
                text-align: right; 
                padding: 20px; 
                font-size: 14px;
                line-height: 1.4;
                background: #f8f9fa;
                color: #333;
              }
              
              .receipt-container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              
              .receipt-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
              }
              
              .receipt-header h1 {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              
              .receipt-header p {
                font-size: 12px;
                opacity: 0.9;
              }
              
              .receipt-content {
                padding: 20px;
                font-size: 13px;
                line-height: 1.5;
              }
              
              .receipt-footer {
                background: #f8f9fa;
                padding: 15px 20px;
                text-align: center;
                border-top: 2px solid #e9ecef;
              }
              
              .receipt-footer p {
                font-size: 12px;
                color: #6c757d;
                margin: 5px 0;
              }
              
              pre { 
                white-space: pre-wrap; 
                font-size: 12px; 
                line-height: 1.3;
                margin: 0;
                font-family: 'Courier New', monospace;
              }
              
              @media print {
                body { 
                  background: white; 
                  padding: 0; 
                  margin: 0;
                }
                .receipt-container {
                  box-shadow: none;
                  border-radius: 0;
                  max-width: none;
                }
                .receipt-header {
                  background: #333 !important;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="receipt-header">
                <h1>🏪 Elking Store</h1>
                <p>نظام إدارة متطور</p>
              </div>
              
              <div class="receipt-content">
                <pre>${receiptContent}</pre>
              </div>
              
              <div class="receipt-footer">
                <p><strong>شكراً لزيارتكم</strong></p>
                <p>Elking Store - نظام إدارة متطور</p>
                <p>📞 للاستفسارات: ${receiptData.storePhone || 'غير محدد'}</p>
                <p>📧 البريد الإلكتروني: info@elkingstore.com</p>
                <p style="margin-top: 10px; font-size: 10px; color: #999;">
                  تم إنشاء هذه الفاتورة في: ${new Date().toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
      soundManager.play('print'); // تشغيل صوت الطباعة
      notifySuccess('تم فتح نافذة الطباعة', 'تحقق من إعدادات الطابعة');
      
    } catch (error) {
      // معالجة صامتة للأخطاء - لا نزعج المستخدم
    }
  };

  // وظيفة الطباعة على الطابعة الحرارية
  const printToThermalPrinter = async (content) => {
    try {
      // طلب إذن الوصول للطابعة
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      
      // إرسال أوامر الطابعة الحرارية
      const commands = [
        '\x1B\x40', // إعادة تعيين الطابعة
        '\x1B\x61\x01', // توسيط النص
        content,
        '\x0A\x0A\x0A', // قطع الورق
        '\x1D\x56\x00' // قطع الورق
      ];
      
      for (const command of commands) {
        await writer.write(encoder.encode(command));
      }
      
      writer.releaseLock();
      await port.close();
      
      alert('تم طباعة الإيصال بنجاح!');
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      alert('خطأ في الطباعة. سيتم فتح نافذة الطباعة التقليدية.');
      
      // استخدام الطباعة التقليدية كبديل
    const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>إيصال البيع</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                direction: rtl; 
                text-align: right; 
                padding: 10px; 
                font-size: 12px;
                line-height: 1.2;
                max-width: 300px;
                margin: 0 auto;
              }
              pre { 
                white-space: pre-wrap; 
                font-size: 12px; 
                line-height: 1.2;
                margin: 0;
              }
              @media print { 
                body { margin: 0; padding: 5px; }
                pre { font-size: 11px; }
              }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
    printWindow.document.close();
    printWindow.print();
    }
  };


  // تبديل الوضع الليلي/النهاري
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // حفظ التفضيل في localStorage
    localStorage.setItem('theme', newTheme);
  };

  // تحميل الوضع المحفوظ والوردية النشطة
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // تهيئة قاعدة البيانات
        await databaseManager.init();
        
        // تهيئة نظام النسخ الاحتياطية
        await backupManager.init();
        
        // تحميل الوضع المحفوظ
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // تحميل الوردية النشطة من localStorage
        try {
          console.log('🔍 بدء البحث عن الوردية النشطة...');
          
          // البحث في activeShift أولاً (المكان الصحيح)
          const savedActiveShift = localStorage.getItem('activeShift');
          console.log('📋 الوردية النشطة المحفوظة:', savedActiveShift);
          
          if (savedActiveShift) {
            const activeShiftData = JSON.parse(savedActiveShift);
            console.log('🔎 بيانات الوردية النشطة:', activeShiftData);
            
            if (activeShiftData && activeShiftData.id && activeShiftData.status === 'active') {
              // فقط إذا كانت الوردية نشطة فعلاً
              setActiveShift(activeShiftData);
              console.log('✅ تم العثور على وردية نشطة في activeShift:', activeShiftData);
            } else {
              console.log('❌ لا توجد وردية نشطة - سيتم حذف الوردية غير النشطة');
              localStorage.removeItem('activeShift');
              setActiveShift(null);
            }
          } else {
            // لا توجد وردية نشطة في activeShift
            console.log('❌ لا توجد وردية نشطة في activeShift');
            setActiveShift(null);
          }
        } catch (error) {
          console.error('خطأ عام في تحميل الوردية النشطة:', error);
        }
        
        // حماية الوردية النشطة
        const protectedActiveShift = localStorage.getItem('activeShift');
        console.log('🛡️ حماية الوردية النشطة في التهيئة:', protectedActiveShift);
        
        // تحميل الفئات من قاعدة البيانات
        const dbCategories = await databaseManager.getAll('categories');
        if (dbCategories.length > 0) {
          setCategories(dbCategories);
        } else {
          // الفئات الافتراضية إذا لم تكن موجودة
          const defaultCategories = [
            { id: 1, name: 'أحذية', description: 'جميع أنواع الأحذية الرسمية والرياضية' },
            { id: 2, name: 'بناطيل', description: 'بناطيل رسمية ورياضية وجينز' },
            { id: 3, name: 'قمصان', description: 'قمصان رسمية ورياضية بألوان متنوعة' },
            { id: 4, name: 'جواكت', description: 'جواكت رسمية ورياضية بمواد مختلفة' }
          ];
          setCategories(defaultCategories);
          
          // حفظ الفئات في قاعدة البيانات
          for (const category of defaultCategories) {
            await databaseManager.add('categories', category);
          }
        }
        
        // تحميل المنتجات من قاعدة البيانات
        const dbProducts = await databaseManager.getAll('products');
        if (dbProducts.length > 0) {
          setProducts(dbProducts);
        } else {
          // المنتجات الافتراضية إذا لم تكن موجودة
          const defaultProducts = [
            { id: 1, name: 'حذاء رسمي أسود جلد طبيعي', price: 450, category: 'أحذية', stock: 15, minStock: 5 },
            { id: 2, name: 'بنطلون رسمي كحلي قطني', price: 180, category: 'بناطيل', stock: 25, minStock: 8 },
            { id: 3, name: 'قميص رسمي أبيض قطني', price: 120, category: 'قمصان', stock: 30, minStock: 10 },
            { id: 4, name: 'جاكيت رسمي رمادي صوف', price: 350, category: 'جواكت', stock: 12, minStock: 4 },
            { id: 5, name: 'حذاء بني جلد طبيعي', price: 380, category: 'أحذية', stock: 18, minStock: 6 },
            { id: 6, name: 'بنطلون أسود رسمي', price: 160, category: 'بناطيل', stock: 22, minStock: 7 },
            { id: 7, name: 'قميص أزرق فاتح', price: 95, category: 'قمصان', stock: 35, minStock: 12 },
            { id: 8, name: 'جاكيت أسود رسمي', price: 320, category: 'جواكت', stock: 8, minStock: 3 },
            { id: 9, name: 'حذاء أسود جلدي ناعم', price: 280, category: 'أحذية', stock: 20, minStock: 7 },
            { id: 10, name: 'بنطلون رمادي رسمي', price: 140, category: 'بناطيل', stock: 28, minStock: 9 },
            { id: 11, name: 'قميص رمادي رسمي', price: 110, category: 'قمصان', stock: 32, minStock: 11 },
            { id: 12, name: 'جاكيت بني صوف', price: 290, category: 'جواكت', stock: 10, minStock: 4 }
          ];
          setProducts(defaultProducts);
          
          // حفظ المنتجات في قاعدة البيانات
          for (const product of defaultProducts) {
            await databaseManager.add('products', product);
          }
        }
        
        // تحديث إعدادات الضرائب عند تغيير storeInfo
        const savedStoreInfo = JSON.parse(localStorage.getItem('storeInfo') || '{}');
        setTaxes({
          vat: savedStoreInfo.taxRate || 15,
          enabled: savedStoreInfo.taxEnabled !== false,
          name: savedStoreInfo.taxName || 'ضريبة القيمة المضافة'
        });
        
        console.log('تم تهيئة النظام بنجاح');
      } catch (error) {
        console.error('خطأ في تهيئة النظام:', error);
        notifyError('خطأ في التهيئة', 'حدث خطأ أثناء تهيئة النظام');
      }
    };
    
    initializeSystem();
  }, []);

  // الاستماع لإشارة إنهاء الوردية وإعادة تعيين البيانات
  useEffect(() => {
    const handleShiftEnded = (event) => {
      console.log('🔄 تم استلام إشارة إنهاء الوردية:', event.detail);
      
      // إعادة تعيين جميع بيانات نقطة البيع
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      setPaymentMethod('cash');
      setDiscounts({ percentage: '', fixed: '', type: 'percentage' });
      setDownPayment({ enabled: false, amount: '' });
      setShowInvoiceSummary(false);
      setActiveShift(null);
      
      // إشعار المستخدم
      notifySuccess('تم إعادة تعيين البيانات', 'تم مسح جميع بيانات نقطة البيع بعد إنهاء الوردية');
      
      console.log('✅ تم إعادة تعيين بيانات نقطة البيع');
    };

    // إضافة مستمع للإشارة
    window.addEventListener('shiftEnded', handleShiftEnded);
    
    // تنظيف المستمع عند إلغاء التحميل
    return () => {
      window.removeEventListener('shiftEnded', handleShiftEnded);
    };
  }, []);

  // مراقبة تغييرات الفئات والمنتجات والورديات في localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      // حماية الوردية النشطة
      const protectedActiveShift = localStorage.getItem('activeShift');
      console.log('🛡️ حماية الوردية النشطة:', protectedActiveShift);
      
      // تحميل الفئات الموجودة بدلاً من حذفها
      const savedCategories = JSON.parse(localStorage.getItem('productCategories') || '[]');
      if (savedCategories.length === 0) {
        // إضافة فئات افتراضية فقط إذا لم توجد فئات
        const defaultCategories = [
          { name: 'أحذية', description: 'جميع أنواع الأحذية الرسمية والرياضية' },
          { name: 'بناطيل', description: 'بناطيل رسمية ورياضية وجينز' },
          { name: 'قمصان', description: 'قمصان رسمية ورياضية بألوان متنوعة' },
          { name: 'جواكت', description: 'جواكت رسمية ورياضية بمواد مختلفة' }
        ];
        localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
        setCategories(defaultCategories);
        console.log('تم إضافة فئات افتراضية جديدة');
      } else {
        setCategories(savedCategories);
        console.log('تم تحميل الفئات الموجودة:', savedCategories.length, 'فئة');
      }
      
      const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const savedShifts = JSON.parse(localStorage.getItem('shifts') || '[]');
      
      setProducts(savedProducts);
      
      // تحديث الوردية النشطة - إصلاح مشكلة الإغلاق التلقائي
      const savedActiveShift = localStorage.getItem('activeShift');
      if (savedActiveShift) {
        const activeShiftData = JSON.parse(savedActiveShift);
        console.log('🔍 فحص الوردية النشطة:', activeShiftData);
        
        // فقط إذا كانت الوردية نشطة فعلاً
        if (activeShiftData && activeShiftData.id && activeShiftData.status === 'active') {
          setActiveShift(activeShiftData);
          console.log('✅ تم الاحتفاظ بالوردية النشطة:', activeShiftData);
        } else {
          console.log('❌ لا توجد وردية نشطة - سيتم حذف الوردية غير النشطة');
          localStorage.removeItem('activeShift');
          setActiveShift(null);
          
          // إعادة تعيين بيانات نقطة البيع إذا لم توجد وردية نشطة
          if (cart.length > 0 || customerInfo.name || customerInfo.phone) {
            console.log('🧹 إعادة تعيين بيانات نقطة البيع - لا توجد وردية نشطة');
            setCart([]);
            setCustomerInfo({ name: '', phone: '' });
            setPaymentMethod('cash');
            setDiscounts({ percentage: '', fixed: '', type: 'percentage' });
            setDownPayment({ enabled: false, amount: '' });
            setShowInvoiceSummary(false);
          }
        }
      } else {
        // لا توجد وردية نشطة في activeShift
        console.log('❌ لا توجد وردية نشطة في activeShift');
        setActiveShift(null);
        
        // إعادة تعيين بيانات نقطة البيع إذا لم توجد وردية نشطة
        if (cart.length > 0 || customerInfo.name || customerInfo.phone) {
          console.log('🧹 إعادة تعيين بيانات نقطة البيع - لا توجد وردية نشطة');
          setCart([]);
          setCustomerInfo({ name: '', phone: '' });
          setPaymentMethod('cash');
          setDiscounts({ percentage: '', fixed: '', type: 'percentage' });
          setDownPayment({ enabled: false, amount: '' });
          setShowInvoiceSummary(false);
        }
      }
    };

    // تحميل صور المنتجات
    const savedImages = JSON.parse(localStorage.getItem('productImages') || '{}');
    setProductImages(savedImages);

    // مراقبة تغييرات localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // مراقبة تغييرات الفئات والمنتجات والورديات في نفس التبويب (محسنة للأداء)
    const interval = setInterval(() => {
      const savedCategories = JSON.parse(localStorage.getItem('productCategories') || '[]');
      const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const savedImages = JSON.parse(localStorage.getItem('productImages') || '{}');
      const savedShifts = JSON.parse(localStorage.getItem('shifts') || '[]');
      
      // استخدام مقارنة أكثر كفاءة للفئات
      if (savedCategories.length !== categories.length || 
          savedCategories.some((cat, index) => !categories[index] || cat.name !== categories[index].name)) {
        console.log('🔄 تحديث الفئات في نقطة البيع:', savedCategories.length, 'فئة');
        setCategories(savedCategories);
      }
      
      // استخدام مقارنة أكثر كفاءة للمنتجات
      if (savedProducts.length !== products.length || 
          savedProducts.some((prod, index) => !products[index] || prod.id !== products[index].id || 
            prod.name !== products[index].name || prod.price !== products[index].price || 
            prod.stock !== products[index].stock || prod.category !== products[index].category)) {
        console.log('🔄 تحديث المنتجات في نقطة البيع:', savedProducts.length, 'منتج');
        setProducts(savedProducts);
      }

      if (JSON.stringify(savedImages) !== JSON.stringify(productImages)) {
        console.log('🔄 تحديث صور المنتجات في نقطة البيع');
        setProductImages(savedImages);
      }
      
      // مراقبة تغييرات الوردية النشطة
      const savedActiveShift = localStorage.getItem('activeShift');
      let currentActiveShift = null;
      
      if (savedActiveShift) {
        const activeShiftData = JSON.parse(savedActiveShift);
        currentActiveShift = activeShiftData && activeShiftData.status === 'active' ? activeShiftData : null;
      } else {
        currentActiveShift = savedShifts.find(shift => shift.status === 'active') || null;
      }
      
      if (JSON.stringify(currentActiveShift) !== JSON.stringify(activeShift)) {
        setActiveShift(currentActiveShift);
        console.log('🔄 تم تحديث الوردية النشطة:', currentActiveShift);
        console.log('📊 حالة activeShift الحالية:', activeShift);
        console.log('📊 حالة currentActiveShift الجديدة:', currentActiveShift);
      }
    }, 1000); // تقليل التكرار إلى كل ثانية واحدة للتحديث الفوري

    // الاستماع لتحديثات المنتجات الفورية
    const handleProductsUpdate = (event) => {
      console.log('🔄 تم استلام تحديث المنتجات:', event.detail);
      const { action, product, products } = event.detail;
      
      // تحديث المنتجات فورياً
      setProducts(products);
      
      // إشعار المستخدم بالتحديث
      if (action === 'added') {
        notifySuccess('تم إضافة منتج جديد', `${product.name} متاح الآن في نقطة البيع`);
      } else if (action === 'updated') {
        notifySuccess('تم تحديث المنتج', `تم تحديث ${product.name} بنجاح`);
      } else if (action === 'deleted') {
        notifySuccess('تم حذف المنتج', `تم حذف ${product.name} من النظام`);
      }
    };

    // الاستماع لتحديثات الفئات الفورية
    const handleCategoriesUpdate = (event) => {
      console.log('🔄 تم استلام تحديث الفئات:', event.detail);
      const { action, category, categories, oldCategory, newCategory } = event.detail;
      
      // تحديث الفئات فورياً
      setCategories(categories);
      
      // تحديث المنتجات إذا تم تحديث الفئة
      if (action === 'updated' && oldCategory && newCategory) {
        const updatedProducts = products.map(p => 
          p.category === oldCategory ? { ...p, category: newCategory } : p
        );
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
      }
      
      // إشعار المستخدم بالتحديث
      if (action === 'added') {
        notifySuccess('تم إضافة فئة جديدة', `${category.name} متاحة الآن في نقطة البيع`);
      } else if (action === 'updated') {
        notifySuccess('تم تحديث الفئة', `تم تغيير اسم الفئة من ${oldCategory} إلى ${newCategory}`);
      }
    };

    // إضافة مستمعي الأحداث
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
      clearInterval(interval);
    };
  }, [categories, products]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="relative z-10 p-2 md:p-4 lg:p-6 xl:p-8 space-y-2 md:space-y-4 lg:space-y-6 xl:space-y-8 max-w-full overflow-x-hidden overflow-y-visible">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 md:mb-3 bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent">
              نقطة البيع - Elking Store
            </h1>
            <p className="text-blue-200 text-xs md:text-sm lg:text-base xl:text-lg font-medium">نظام بيع متطور وسريع</p>
            
            {/* مؤشر الوردية النشطة */}
            <div className="flex items-center space-x-2 mt-2">
              {activeShift ? (
                <div className="flex-1 flex items-center space-x-2 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 rounded-lg px-3 py-2">
                  <Play className="h-4 w-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">
                    وردية نشطة - المبيعات: {activeShift.totalSales?.toFixed(2) || '0.00'} جنيه | الطلبات: {activeShift.totalOrders || 0}
                  </span>
          </div>
              ) : (
                <div className="flex-1 flex items-center space-x-2 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg px-3 py-2">
                  <Square className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">
                    ⚠️ لا توجد وردية نشطة - يجب بدء وردية جديدة أولاً
                  </span>
                </div>
              )}
              
              {/* زر تحديث الوردية */}
              <button
                onClick={() => {
                  soundManager.play('update');
                  console.log('🔄 إعادة تحميل الوردية النشطة...');
                  
                  // البحث في activeShift أولاً
                  const savedActiveShift = localStorage.getItem('activeShift');
                  console.log('📋 activeShift المحفوظ:', savedActiveShift);
                  
                  if (savedActiveShift) {
                    const activeShiftData = JSON.parse(savedActiveShift);
                    console.log('🔎 بيانات activeShift:', activeShiftData);
                    
                    if (activeShiftData && activeShiftData.status === 'active') {
                      setActiveShift(activeShiftData);
                      console.log('✅ تم العثور على وردية نشطة:', activeShiftData);
                      notifySuccess('تم تحديث الوردية', 'تم العثور على الوردية النشطة');
                    } else {
                      setActiveShift(null);
                      notifyError('الوردية غير نشطة', 'الوردية المحفوظة ليست نشطة');
                    }
                  } else {
                    // البحث في مصفوفة shifts
                    const savedShifts = JSON.parse(localStorage.getItem('shifts') || '[]');
                    console.log('📋 البحث في shifts:', savedShifts);
                    const foundActiveShift = savedShifts.find(shift => shift.status === 'active');
                    
                    if (foundActiveShift) {
                      setActiveShift(foundActiveShift);
                      notifySuccess('تم تحديث الوردية', 'تم العثور على الوردية النشطة');
                    } else {
                      setActiveShift(null);
                      notifyError('لا توجد وردية نشطة', 'يجب بدء وردية جديدة من الإعدادات');
                    }
                  }
                }}
                className="p-2 bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg hover:bg-opacity-30 transition-all duration-300"
                title="تحديث حالة الوردية"
              >
                <RefreshCw className="h-4 w-4 text-blue-400" />
              </button>
            </div>
          </div>
          <button
            onClick={() => { soundManager.play('click'); toggleTheme(); }}
            className="p-2 md:p-3 bg-white bg-opacity-10 rounded-xl hover:bg-opacity-20 transition-all duration-300"
            title={theme === 'dark' ? 'التبديل للوضع النهاري' : 'التبديل للوضع الليلي'}
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5 md:h-6 md:w-6 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 md:h-6 md:w-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
        </div>
          
        {/* Main Content */}
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* المنتجات - يسار */}
          <div className="lg:col-span-8 flex flex-col min-w-0">
            {/* تنبيه عدم وجود وردية */}
            {!activeShift && (
              <div className="mb-3 bg-red-500 bg-opacity-20 border-2 border-red-500 border-opacity-50 rounded-xl p-4">
                <div className="text-center">
                  <h3 className="text-red-300 font-bold mb-1">⚠️ لا توجد وردية نشطة</h3>
                  <p className="text-red-200 text-sm">ابدأ وردية جديدة من الإعدادات قبل البيع</p>
                </div>
        </div>
            )}

            {/* أدوات البحث والفلاتر */}
            <div className="space-y-2 mb-3">
              <div className="relative bg-gray-800 bg-opacity-50 rounded-lg p-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 h-4 w-4" />
          <input
            type="text"
                  placeholder="البحث بالاسم أو الفئة..."
            value={searchTerm}
            onChange={(e) => { soundManager.play('click'); setSearchTerm(e.target.value); }}
                  className="input-modern w-full pr-9 pl-2 py-2 text-xs md:text-sm text-right bg-gray-700 bg-opacity-80 border border-gray-600 rounded-lg"
          />
        </div>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Filter className="h-4 w-4 text-blue-300" />
                  <span className="text-xs text-blue-200">تصنيف الفئات:</span>
        </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      soundManager.play('click');
                      setSelectedCategory('الكل');
                    }} 
                    className={`px-3 py-1 rounded-full text-xs min-h-[32px] cursor-pointer ${selectedCategory==='الكل'?'bg-blue-500 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    style={{ 
                      pointerEvents: 'auto',
                      zIndex: 10,
                      position: 'relative'
                    }}
                  >
                    الكل
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.name} 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        soundManager.play('click');
                        setSelectedCategory(cat.name);
                      }} 
                      className={`px-3 py-1 rounded-full text-xs min-h-[32px] cursor-pointer ${selectedCategory===cat.name?'bg-purple-500 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      style={{ 
                        pointerEvents: 'auto',
                        zIndex: 10,
                        position: 'relative'
                      }}
                    >
                      {cat.name}
                    </button>
          ))}
                </div>
              </div>
            </div>


            {/* كارد المنتجات */}
            <div className="glass-card chart-enhanced flex flex-col overflow-visible">
              <div className="p-4 border-b border-white border-opacity-20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg"><Package className="h-5 w-5 text-white" /></div>
                  <h3 className="text-white font-bold">المنتجات المتاحة</h3>
        </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 text-sm bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full border border-blue-500 border-opacity-30">
                    {(() => {
                      const filtered = products.filter(p => (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedCategory==='الكل' || p.category===selectedCategory));
                      return `${filtered.length} منتج`;
                    })()}
                  </span>
      </div>
          </div>
              <div className="p-4 overflow-visible">
                {activeShift ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
                    {(() => {
                      const filtered = products.filter(p => (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedCategory==='الكل' || p.category===selectedCategory));
                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-full flex flex-col items-center justify-center h-40 text-gray-400">
                            <Package className="h-10 w-10 opacity-50" />
                            <p className="mt-2 text-sm">لا توجد منتجات مطابقة</p>
        </div>
                        );
                      }
                      return filtered.map((product, index) => (
                        <div key={product.id} className="glass-card cursor-pointer h-32 xl:h-36" onClick={() => { soundManager.play('addProduct'); addToCart(product); }} style={{animationDelay: `${index*0.05}s`}}>
                          <div className="h-full p-2 flex flex-col">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-lg overflow-hidden shadow-lg">
                              <img src={productImages[product.id] || ImageManager.getDefaultImage(product.category)} alt={product.name} className="w-full h-full object-cover" />
            </div>
                            <div className="flex-1 flex flex-col justify-between text-right">
                              <h4 className="text-white text-[13px] font-semibold leading-snug line-clamp-2">
                                {emojiManager.getProductEmoji(product)} {product.name}
                              </h4>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500 bg-opacity-15 text-emerald-300 font-bold text-xs">
                                  {product.price} جنيه
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-500 bg-opacity-15 text-blue-300 text-[11px]">
                                  مخزون: {product.stock}
                                </span>
            </div>
      </div>
          </div>
        </div>
                      ));
                    })()}
            </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-red-300 text-sm">ابدأ وردية لعرض المنتجات</div>
                )}
            </div>
          </div>
        </div>

          {/* السلة - يمين */}
          {activeShift && (
            <div className="lg:col-span-4 flex flex-col min-w-0">
              <div className="glass-card p-3 md:p-4 flex flex-col">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mr-2"><ShoppingCart className="h-4 w-4 text-white" /></div>
                  <h2 className="text-xs md:text-sm font-bold text-white">سلة المشتريات</h2>
                </div>
                <div>
          {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-blue-300">
                      <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-2xl mb-4 flex items-center justify-center"><ShoppingCart className="h-8 w-8" /></div>
                      <p className="text-sm">السلة فارغة</p>
            </div>
          ) : (
                    <div className="space-y-2">
              {cart.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white bg-opacity-10 rounded-lg">
                  <div className="flex-1">
                            <h4 className="text-white text-xs font-bold line-clamp-1">{emojiManager.getProductEmoji(item)} {item.name}</h4>
                            <p className="text-xs text-blue-300">{item.price} جنيه</p>
                  </div>
                          <div className="flex items-center space-x-2">
                    <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                soundManager.play('click');
                                updateQuantity(item.id, item.quantity - 1);
                              }} 
                              className="p-2 bg-red-500 bg-opacity-20 rounded-lg min-w-[32px] min-h-[32px] cursor-pointer"
                              style={{ 
                                pointerEvents: 'auto',
                                zIndex: 10,
                                position: 'relative'
                              }}
                            >
                              <Minus className="h-3 w-3 text-red-300" />
                    </button>
                            <span className="w-8 text-center text-xs font-bold text-white bg-white bg-opacity-20 px-2 py-1 rounded-lg">{item.quantity}</span>
                    <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                soundManager.play('click');
                                updateQuantity(item.id, item.quantity + 1);
                              }} 
                              className="p-2 bg-green-500 bg-opacity-20 rounded-lg min-w-[32px] min-h-[32px] cursor-pointer"
                              style={{ 
                                pointerEvents: 'auto',
                                zIndex: 10,
                                position: 'relative'
                              }}
                            >
                              <Plus className="h-3 w-3 text-green-300" />
                    </button>
                    <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                soundManager.play('delete');
                                removeFromCart(item.id);
                              }} 
                              className="p-2 bg-red-500 bg-opacity-20 rounded-lg min-w-[32px] min-h-[32px] cursor-pointer"
                              style={{ 
                                pointerEvents: 'auto',
                                zIndex: 10,
                                position: 'relative'
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

                {/* الخصومات */}
                <div className="mt-3">
                  <h4 className="text-xs md:text-sm text-white font-bold mb-2">الخصومات</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-blue-200 mb-1">نوع الخصم</label>
                      <select
                        value={discounts.type}
                        onChange={(e) => { soundManager.play('discount'); setDiscounts({ ...discounts, type: e.target.value }); }}
                        className="input-modern w-full px-2 py-1.5 text-xs text-right bg-gray-800 border-gray-600 text-white"
                      >
                        <option value="percentage" className="bg-gray-800 text-white">نسبة مئوية</option>
                        <option value="fixed" className="bg-gray-800 text-white">مبلغ ثابت</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-200 mb-1">{discounts.type === 'percentage' ? 'نسبة الخصم (%)' : 'مبلغ الخصم (جنيه)'} </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discounts.type === 'percentage' ? (discounts.percentage === '' ? '' : discounts.percentage) : (discounts.fixed === '' ? '' : discounts.fixed)}
                        onChange={(e) => { soundManager.play('discount'); setDiscounts({
                          ...discounts,
                          [discounts.type === 'percentage' ? 'percentage' : 'fixed']: e.target.value === '' ? '' : parseFloat(e.target.value)
                        }); }}
                        className="input-modern w-full px-2 py-1.5 text-xs text-right"
                      />
                    </div>
          </div>
        </div>

                {/* العربون */}
                <div className="mt-3">
                  <h4 className="text-xs md:text-sm text-white font-bold mb-2">العربون</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-blue-200">تفعيل العربون</span>
            <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          soundManager.play('downPayment');
                          setDownPayment({ ...downPayment, enabled: !downPayment.enabled });
                        }}
                        className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${downPayment.enabled ? 'bg-green-500' : 'bg-gray-500'}`}
                        style={{ 
                          pointerEvents: 'auto',
                          zIndex: 10,
                          position: 'relative'
                        }}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${downPayment.enabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
            </button>
                    </div>
                    {downPayment.enabled && (
                      <div>
                        <label className="block text-[11px] text-blue-200 mb-1">مبلغ العربون (جنيه)</label>
                        <input
                          type="number"
                          value={downPayment.amount}
            onChange={(e) => {
              const value = e.target.value;
              soundManager.play('downPayment');
              setDownPayment({
                ...downPayment,
                amount: value === '' ? '' : parseFloat(value) || ''
              });
            }}
                          className="input-modern w-full px-2 py-1.5 text-xs text-right"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          style={{ 
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* معلومات العميل المختصرة */}
                <div className="mt-3">
                  <h4 className="text-xs md:text-sm text-white font-bold mb-2">معلومات العميل</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => { soundManager.play('click'); setCustomerInfo({ ...customerInfo, name: e.target.value }); }}
                      className="input-modern w-full px-2 py-1.5 text-xs text-right"
                      placeholder="اسم العميل"
                    />
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => { soundManager.play('click'); setCustomerInfo({ ...customerInfo, phone: e.target.value }); }}
                      className="input-modern w-full px-2 py-1.5 text-xs text-right"
                      placeholder="رقم الهاتف"
                    />
                  </div>
                </div>

                {/* طريقة الدفع */}
                <div className="mt-3">
                  <h4 className="text-xs md:text-sm text-white font-bold mb-2">طريقة الدفع</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => { soundManager.play('cash'); setPaymentMethod('cash'); }} className={`p-2 rounded-lg border-2 text-xs ${paymentMethod==='cash' ? 'border-green-500 bg-green-500 bg-opacity-20 text-green-300' : 'border-blue-500 border-opacity-30 bg-white bg-opacity-10 text-blue-200'}`}>نقدي</button>
                    <button onClick={() => { soundManager.play('card'); setPaymentMethod('wallet'); }} className={`p-2 rounded-lg border-2 text-xs ${paymentMethod==='wallet' ? 'border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300' : 'border-blue-500 border-opacity-30 bg-white bg-opacity-10 text-blue-200'}`}>محفظة</button>
                    <button onClick={() => { soundManager.play('card'); setPaymentMethod('instapay'); }} className={`p-2 rounded-lg border-2 text-xs ${paymentMethod==='instapay' ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-300' : 'border-blue-500 border-opacity-30 bg-white bg-opacity-10 text-blue-200'}`}>انستا باي</button>
                  </div>
                </div>

                {/* المجموع وأزرار العمل */}
                <div className="mt-3 border-t border-white border-opacity-10 pt-3">
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs"><span className="text-blue-200">المجموع الفرعي</span><span className="text-white">{getSubtotal().toFixed(2)} جنيه</span></div>
                    {getDiscountAmount() > 0 && (<div className="flex justify-between text-xs"><span className="text-green-200">الخصم</span><span className="text-green-300">-{getDiscountAmount().toFixed(2)} جنيه</span></div>)}
                    {taxes.enabled && getTaxAmount() > 0 && (<div className="flex justify-between text-xs"><span className="text-orange-200">{taxes.name} ({taxes.vat}%)</span><span className="text-orange-300">{getTaxAmount().toFixed(2)} جنيه</span></div>)}
                    {downPayment.enabled && getDownPaymentAmount() > 0 && (<div className="flex justify-between text-xs"><span className="text-yellow-200">العربون</span><span className="text-yellow-300">{getDownPaymentAmount().toFixed(2)} جنيه</span></div>)}
                    <div className="flex justify-between items-center pt-1"><span className="text-white font-bold text-sm">{downPayment.enabled && getDownPaymentAmount() > 0 ? 'المتبقي' : 'الإجمالي'}</span><span className="text-white font-bold text-base">{downPayment.enabled && getDownPaymentAmount() > 0 ? getRemainingAmount().toFixed(2) : getTotal().toFixed(2)} جنيه</span></div>
                  </div>
                  <button onClick={() => { soundManager.play('openWindow'); showInvoiceSummaryModal(); }} disabled={cart.length === 0 || !activeShift} className="btn-primary w-full py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                    <div className="flex items-center justify-center"><DollarSign className="h-4 w-4 mr-2" /> {!activeShift ? 'بدء وردية أولاً' : 'إتمام البيع'}</div>
            </button>
                </div>
          </div>
            </div>
          )}
        </div>

      {/* نافذة ملخص الفاتورة */}
      {showInvoiceSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* العنوان */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <Receipt className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">ملخص الفاتورة</h3>
                  <p className="text-gray-400 text-sm">تأكد من صحة البيانات قبل الإتمام</p>
                </div>
              </div>
            <button
                onClick={cancelSale}
                className="text-gray-400 hover:text-white transition-colors"
          >
                <X className="h-6 w-6" />
            </button>
        </div>

            {/* معلومات العميل */}
            <div className="bg-white bg-opacity-5 rounded-xl p-4 mb-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-400" />
                معلومات العميل
              </h4>
              {!validateCustomerData().isValid && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">
                    ⚠️ يجب إدخال اسم العميل ورقم الهاتف قبل إتمام البيع
                  </p>
      </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">الاسم</p>
                  <p className={`font-medium ${customerInfo.name ? 'text-white' : 'text-red-400'}`}>
                    {customerInfo.name || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">رقم الهاتف</p>
                  <p className={`font-medium ${customerInfo.phone ? 'text-white' : 'text-red-400'}`}>
                    {customerInfo.phone || 'غير محدد'}
                  </p>
                </div>
          </div>
        </div>

            {/* المنتجات */}
            <div className="bg-white bg-opacity-5 rounded-xl p-4 mb-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-400" />
                المنتجات ({cart.length})
              </h4>
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white bg-opacity-5 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="text-white font-medium">{emojiManager.getProductEmoji(item)} {item.name}</p>
                      <p className="text-gray-400 text-sm">السعر: {item.price.toFixed(2)} جنيه</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">الكمية: {item.quantity}</p>
                      <p className="text-green-400 font-semibold">المجموع: {(item.price * item.quantity).toFixed(2)} جنيه</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* تفاصيل الدفع */}
            <div className="bg-white bg-opacity-5 rounded-xl p-4 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-emerald-400" />
                تفاصيل الدفع
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">المجموع الفرعي:</span>
                  <span className="text-white font-medium">{getSubtotal().toFixed(2)} جنيه</span>
                </div>
                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">الخصم:</span>
                    <span className="text-red-400 font-medium">-{getDiscountAmount().toFixed(2)} جنيه</span>
                  </div>
                )}
                {taxes.enabled && getTaxAmount() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{taxes.name}:</span>
                    <span className="text-blue-400 font-medium">{getTaxAmount().toFixed(2)} جنيه</span>
                  </div>
                )}
                {getDownPaymentAmount() > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">العربون:</span>
                      <span className="text-orange-400 font-medium">{getDownPaymentAmount().toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">المبلغ المتبقي:</span>
                      <span className="text-cyan-400 font-medium">{getRemainingAmount().toFixed(2)} جنيه</span>
                    </div>
                  </>
                )}
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-bold text-lg">الإجمالي:</span>
                    <span className="text-green-400 font-bold text-lg">{getTotal().toFixed(2)} جنيه</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">طريقة الدفع:</span>
                  <span className="text-white font-medium">
                    {downPayment.enabled 
                      ? `${paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة إلكترونية' : 'انستا باي'} (دفع جزئي)`
                      : paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة إلكترونية' : 'انستا باي'
                    }
                  </span>
                </div>
          </div>
        </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-col sm:flex-row gap-3">
          <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  soundManager.play('closeWindow');
                  cancelSale();
                }}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center min-h-[50px] cursor-pointer"
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                <X className="h-5 w-5 mr-2" />
                الرجوع
          </button>
          <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  soundManager.play('complete');
                  confirmSale();
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center min-h-[50px] cursor-pointer"
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
          >
                <DollarSign className="h-5 w-5 mr-2" />
                تأكيد البيع
          </button>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default POS;
