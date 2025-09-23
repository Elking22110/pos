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
    amount: 0,
    percentage: 0,
    type: 'percentage' // 'percentage' or 'fixed'
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
  const addToCart = (product) => {
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
    
    if (downPayment.type === 'percentage') {
      return (afterDiscount * downPayment.percentage) / 100;
    } else {
      return Math.min(downPayment.amount, afterDiscount);
    }
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
    
    const sale = {
      id: Date.now(),
      customer: customerInfo,
      items: cart,
      subtotal: getSubtotal(),
      discountAmount: getDiscountAmount(),
      taxAmount: getTaxAmount(),
      total: getTotal(),
      discounts,
      taxes,
      paymentMethod,
      timestamp: new Date().toLocaleString('ar-SA'),
      date: new Date().toISOString()
    };
    
    console.log('تم البيع:', sale);
    
    // تشفير البيانات الحساسة
    const encryptedSale = encryptionManager.encryptSensitiveData(sale, ['customer']);
    
    // حفظ البيع في قاعدة البيانات
    await databaseManager.add('sales', encryptedSale);
    
    // تسجيل البيع في الوردية النشطة
    if (activeShift) {
      const updatedShift = {
        ...activeShift,
        sales: [...activeShift.sales, sale],
        totalSales: activeShift.totalSales + sale.total,
        totalOrders: activeShift.totalOrders + 1
      };
      setActiveShift(updatedShift);
      await databaseManager.update('shifts', updatedShift);
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

    // إنشاء نسخة احتياطية تلقائية
    try {
      await backupManager.createAutoBackup();
    } catch (backupError) {
      console.warn('خطأ في إنشاء النسخة الاحتياطية:', backupError);
    }

    // طباعة الإيصال بعد إتمام البيع
    try {
      await printReceipt();
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
    
    // إشعار نجاح البيع
    notifySuccess('تم إتمام البيع بنجاح', `المبلغ الإجمالي: ${sale.total.toFixed(2)} جنيه`);
    
    } catch (error) {
      console.error('خطأ في إتمام البيع:', error);
      notifyError('خطأ في النظام', 'حدث خطأ غير متوقع أثناء إتمام البيع');
    }
  };

  // إلغاء البيع
  const cancelSale = () => {
    setShowInvoiceSummary(false);
  };

  // طباعة الإيصال
  const printReceipt = async () => {
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
        paymentMethod: paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة' : 'انستا باي'
      };

      // محاولة الطباعة على الطابعة الحرارية
      try {
        await thermalPrinterManager.printReceipt(receiptData);
        notifySuccess('تم طباعة الإيصال', 'تم إرسال الإيصال للطابعة الحرارية');
        return;
      } catch (thermalError) {
        // المتابعة للطباعة التقليدية بدون إظهار خطأ
      }

      // الطباعة التقليدية كبديل
      const receiptContent = `
${receiptData.storeName}
${receiptData.storeDescription}
${'='.repeat(32)}
      التاريخ: ${receiptData.date}
${receiptData.storeAddress ? `العنوان: ${receiptData.storeAddress}` : ''}
${receiptData.storePhone ? `الهاتف: ${receiptData.storePhone}` : ''}
${receiptData.storeTaxNumber ? `الرقم الضريبي: ${receiptData.storeTaxNumber}` : ''}
${'-'.repeat(32)}
${receiptData.customerName ? `العميل: ${receiptData.customerName}` : ''}
${receiptData.customerPhone ? `الهاتف: ${receiptData.customerPhone}` : ''}
${receiptData.customerName || receiptData.customerPhone ? '-'.repeat(32) : ''}
      المنتجات:
${receiptData.items.map(item => `${item.name.substring(0, 20)} x${item.quantity} = ${item.price * item.quantity} جنيه`).join('\n')}
${'-'.repeat(32)}
المجموع الفرعي: ${receiptData.subtotal.toFixed(2)} جنيه
${receiptData.discount > 0 ? `الخصم: -${receiptData.discount.toFixed(2)} جنيه` : ''}
${taxes.enabled && receiptData.tax > 0 ? `${taxes.name} (${taxes.vat}%): ${receiptData.tax.toFixed(2)} جنيه` : ''}
الإجمالي: ${receiptData.total.toFixed(2)} جنيه
${receiptData.downPayment > 0 ? `العربون: ${receiptData.downPayment.toFixed(2)} جنيه` : ''}
${receiptData.downPayment > 0 ? `المبلغ المتبقي: ${receiptData.remaining.toFixed(2)} جنيه` : ''}
      طريقة الدفع: ${receiptData.paymentMethod}
${'-'.repeat(32)}
شكراً لزيارتكم
Elking Store
    `;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notifyError('خطأ في الطباعة', 'لا يمكن فتح نافذة الطباعة. تحقق من إعدادات المتصفح');
      return;
    }
    
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
            <pre>${receiptContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
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
            
            if (activeShiftData && activeShiftData.status === 'active') {
              setActiveShift(activeShiftData);
              console.log('✅ تم العثور على وردية نشطة في activeShift:', activeShiftData);
            } else {
              console.log('❌ الوردية المحفوظة ليست نشطة:', activeShiftData);
            }
          } else {
            // البحث في مصفوفة shifts كبديل
            const savedShifts = JSON.parse(localStorage.getItem('shifts') || '[]');
            console.log('📋 البحث في مصفوفة الورديات:', savedShifts);
            
            const localActiveShift = savedShifts.find(shift => shift.status === 'active');
            if (localActiveShift) {
              setActiveShift(localActiveShift);
              console.log('✅ تم العثور على وردية نشطة في shifts:', localActiveShift);
            } else {
              console.log('❌ لا توجد وردية نشطة في أي مكان');
            }
          }
        } catch (error) {
          console.error('خطأ عام في تحميل الوردية النشطة:', error);
        }
        
        // تحميل الفئات من قاعدة البيانات
        const dbCategories = await databaseManager.getAll('categories');
        if (dbCategories.length > 0) {
          setCategories(dbCategories);
        } else {
          // الفئات الافتراضية إذا لم تكن موجودة
          const defaultCategories = [
            { id: 1, name: 'أحذية', description: 'جميع أنواع الأحذية' },
            { id: 2, name: 'بناطيل', description: 'بناطيل رسمية ورياضية' },
            { id: 3, name: 'قمصان', description: 'قمصان رسمية ورياضية' },
            { id: 4, name: 'جواكت', description: 'جواكت رسمية ورياضية' },
            { id: 5, name: 'إكسسوارات', description: 'إكسسوارات متنوعة' }
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

  // مراقبة تغييرات الفئات والمنتجات والورديات في localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCategories = JSON.parse(localStorage.getItem('productCategories') || '[]');
      const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const savedShifts = JSON.parse(localStorage.getItem('shifts') || '[]');
      
      setCategories(savedCategories);
      setProducts(savedProducts);
      
      // تحديث الوردية النشطة
      const savedActiveShift = localStorage.getItem('activeShift');
      if (savedActiveShift) {
        const activeShiftData = JSON.parse(savedActiveShift);
        setActiveShift(activeShiftData && activeShiftData.status === 'active' ? activeShiftData : null);
      } else {
        const activeShift = savedShifts.find(shift => shift.status === 'active');
        setActiveShift(activeShift || null);
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
      
      // استخدام مقارنة أكثر كفاءة
      if (savedCategories.length !== categories.length || 
          savedCategories.some((cat, index) => !categories[index] || cat.name !== categories[index].name)) {
        setCategories(savedCategories);
      }
      
      if (savedProducts.length !== products.length || 
          savedProducts.some((prod, index) => !products[index] || prod.id !== products[index].id)) {
        setProducts(savedProducts);
      }

      if (JSON.stringify(savedImages) !== JSON.stringify(productImages)) {
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
    }, 2000); // تقليل التكرار إلى كل ثانيتين

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [categories, products]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="relative z-10 p-2 md:p-4 lg:p-6 xl:p-8 space-y-2 md:space-y-4 lg:space-y-6 xl:space-y-8 max-w-full overflow-x-hidden">
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
                    وردية نشطة - المبيعات: ${activeShift.totalSales?.toFixed(2) || '0.00'} | الطلبات: {activeShift.totalOrders || 0}
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
            onClick={toggleTheme}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
          {/* الجانب الأيسر - المنتجات */}
          <div className="md:col-span-2 relative z-10 min-w-0 flex flex-col">
            
            {/* تنبيه عدم وجود وردية نشطة */}
            {!activeShift && (
              <div className="mb-4 bg-red-500 bg-opacity-20 border-2 border-red-500 border-opacity-50 rounded-xl p-4 md:p-6">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Square className="h-8 w-8 text-red-400" />
        </div>
                    <h3 className="text-lg md:text-xl font-bold text-red-300 mb-2">
                      ⚠️ لا توجد وردية نشطة
                    </h3>
                    <p className="text-red-200 text-sm md:text-base mb-3">
                      يجب بدء وردية جديدة قبل إتمام أي عملية بيع
                    </p>
                    <p className="text-red-300 text-xs md:text-sm">
                      اذهب إلى الإعدادات → إدارة الورديات → بدء وردية جديدة
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* شريط البحث وتصنيف الفئات */}
        <div className="space-y-2 md:space-y-3 mb-2 md:mb-4">
        {/* شريط البحث */}
          <div className="relative bg-gray-800 bg-opacity-50 rounded-lg p-2">
            <Search className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-blue-300 h-4 w-4 md:h-5 md:w-5 z-20" />
          <input
            type="text"
              placeholder="البحث بالاسم أو التصنيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern w-full pr-10 md:pr-12 pl-2 md:pl-3 py-2 md:py-3 text-xs md:text-sm text-right font-medium bg-gray-700 bg-opacity-80 border border-gray-600 rounded-lg"
          />
        </div>

          {/* تصنيف الفئات */}
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-2">
            <div className="flex items-center space-x-2 mb-2">
              <Filter className="h-4 w-4 text-blue-300" />
              <span className="text-xs text-blue-200 font-medium">تصنيف الفئات:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('الكل')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                  selectedCategory === 'الكل'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                الكل
              </button>
              {categories.map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    selectedCategory === category.name
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* قائمة المنتجات داخل كارد واحد */}
        <div className="glass-card hover-lift animate-fadeInUp chart-enhanced flex flex-col min-h-[65vh]" style={{animationDelay: '0.6s'}}>
          <div className="p-4 md:p-6 border-b border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">المنتجات المتاحة</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full border border-blue-500 border-opacity-30">
                  <span className="text-blue-300 text-sm font-medium">
                    {(() => {
                      const filteredProducts = products.filter(product => {
                        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             product.category.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
                        return matchesSearch && matchesCategory;
                      });
                      return filteredProducts.length;
                    })()} منتج
                  </span>
                </div>
              </div>
            </div>
        </div>

          <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
            {!activeShift && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <div className="p-4 bg-red-500 bg-opacity-20 rounded-full mb-4">
                  <Square className="h-16 w-16 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-red-300">لا يمكن عرض المنتجات</h3>
                <p className="text-sm text-red-200">
                  يجب بدء وردية جديدة من الإعدادات أولاً
                </p>
              </div>
            )}
            {activeShift && (
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
          {(() => {
            // فلترة المنتجات حسب البحث والفئة
            const filteredProducts = products.filter(product => {
              const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   product.category.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
              return matchesSearch && matchesCategory;
            });

            return filteredProducts.map((product, index) => (
            <div
              key={product.id}
                  className="glass-card hover-lift cursor-pointer pos-product-card group loading-enhanced h-32 xl:h-36"
              onClick={() => addToCart(product)}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
              <div className="text-center flex flex-col h-full p-2">
                {/* صورة المنتج - حجم مصغر */}
                <div className="w-12 h-12 mx-auto mb-2 rounded-lg overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  {productImages[product.id] ? (
                    <img 
                      src={productImages[product.id]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={ImageManager.getDefaultImage(product.category)} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* محتوى المنتج */}
                <div className="flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-white text-xs leading-tight mb-1 line-clamp-2 group-hover:text-blue-200 transition-colors duration-300">{product.name}</h3>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">{product.price} جنيه</p>
                    <p className="text-xs text-blue-300">مخزون: {product.stock}</p>
              </div>
            </div>
        </div>
      </div>
            ));
          })()}
          
          {/* رسالة عدم وجود منتجات */}
          {(() => {
            const filteredProducts = products.filter(product => {
              const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   product.category.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
              return matchesSearch && matchesCategory;
            });

            if (filteredProducts.length === 0) {
              return (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-center text-gray-400 animate-fadeInUp">
                  <div className="p-4 bg-gray-500 bg-opacity-20 rounded-full mb-4">
                    <Package className="h-16 w-16 opacity-50" />
            </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">لا توجد منتجات</h3>
                  <p className="text-sm text-gray-300">
                    {selectedCategory !== 'الكل' 
                      ? `لا توجد منتجات في فئة "${selectedCategory}"`
                      : 'لا توجد منتجات تطابق البحث'
                    }
                  </p>
            </div>
              );
            }
            return null;
          })()}
            </div>
            )}
          </div>

          {/* الجانب الأيمن - السلة والدفع */}
          {activeShift && (
            <div className="md:col-span-1 w-full flex flex-col relative z-10">
            <div className="glass-card hover-lift animate-fadeInRight p-4 md:p-6 flex flex-col min-h-[65vh]">
              <div className="flex items-center mb-4 md:mb-6" style={{animationDelay: '0.1s'}}>
                <div className="p-3 md:p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl md:rounded-2xl mr-3 md:mr-4">
                  <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
                <h2 className="text-sm md:text-base font-bold text-white">سلة المشتريات</h2>
        </div>


        {/* عناصر السلة */}
            <div className="flex-1 overflow-y-auto mb-4 md:mb-6 custom-scrollbar">
          {!activeShift && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <div className="p-4 bg-red-500 bg-opacity-20 rounded-full mb-4">
                <Square className="h-16 w-16 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-300">لا يمكن استخدام السلة</h3>
              <p className="text-sm text-red-200">
                يجب بدء وردية جديدة من الإعدادات أولاً
              </p>
            </div>
          )}
          {activeShift && cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-blue-300 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-500 bg-opacity-20 rounded-3xl mx-auto mb-6 md:mb-8 flex items-center justify-center">
                    <ShoppingCart className="h-10 w-10 md:h-12 md:w-12 text-blue-300" />
              </div>
                  <p className="text-sm md:text-base font-semibold mb-2">السلة فارغة</p>
                  <p className="text-xs md:text-sm text-blue-400">أضف منتجات للبدء</p>
            </div>
          )}
          {activeShift && cart.length > 0 && (
                <div className="space-y-1 md:space-y-2">
              {cart.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-1.5 md:p-2 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all duration-300 group animate-fadeInUp" style={{animationDelay: `${0.3 + index * 0.1}s`}}>
                  <div className="flex-1">
                        <h4 className="font-bold text-white text-xs group-hover:text-blue-200 transition-colors line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-blue-300 font-medium">${item.price}</p>
                  </div>
                      <div className="flex items-center space-x-1 md:space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 md:p-2 bg-red-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 touch-button"
                    >
                          <Minus className="h-3 w-3 md:h-4 md:w-4 text-red-300" />
                    </button>
                        <span className="w-6 md:w-8 text-center text-xs font-bold text-white bg-white bg-opacity-20 px-1.5 md:px-2 py-1 md:py-1.5 rounded-lg">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 md:p-2 bg-green-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 touch-button"
                    >
                          <Plus className="h-3 w-3 md:h-4 md:w-4 text-green-300" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                          className="p-1.5 md:p-2 bg-red-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 touch-button"
                    >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الإجمالي */}
            <div className="mb-4 md:mb-6">
              <div className="space-y-2 mb-3 md:mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-blue-200">المجموع الفرعي:</span>
                  <span className="text-sm md:text-base text-white">{getSubtotal().toFixed(2)} جنيه</span>
          </div>
                
                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-green-200">الخصم:</span>
                    <span className="text-sm md:text-base text-green-300">-{getDiscountAmount().toFixed(2)} جنيه</span>
                  </div>
                )}
                
                {taxes.enabled && getTaxAmount() > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-orange-200">{taxes.name} ({taxes.vat}%):</span>
                    <span className="text-sm md:text-base text-orange-300">{getTaxAmount().toFixed(2)} جنيه</span>
                  </div>
                )}
                
                {downPayment.enabled && getDownPaymentAmount() > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-yellow-200">العربون:</span>
                    <span className="text-sm md:text-base text-yellow-300">{getDownPaymentAmount().toFixed(2)} جنيه</span>
                  </div>
                )}
                
                <div className="border-t border-white border-opacity-20 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base font-bold text-white">
                      {downPayment.enabled && getDownPaymentAmount() > 0 ? 'المبلغ المتبقي:' : 'الإجمالي:'}
                    </span>
                    <span className="text-lg md:text-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                      {downPayment.enabled && getDownPaymentAmount() > 0 ? getRemainingAmount().toFixed(2) : getTotal().toFixed(2)} جنيه
                    </span>
                  </div>
                </div>
          </div>
        </div>

            {/* الخصومات */}
            <div className="mb-4 md:mb-6">
              <h3 className="font-bold text-white mb-4 md:mb-5 text-sm md:text-base">الخصومات</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs text-blue-200 mb-1">نوع الخصم</label>
                  <select
                    value={discounts.type}
                    onChange={(e) => setDiscounts({...discounts, type: e.target.value})}
                    className="input-modern w-full px-2 py-2 text-xs text-right bg-gray-800 border-gray-600 text-white"
                  >
                    <option value="percentage" className="bg-gray-800 text-white">نسبة مئوية</option>
                    <option value="fixed" className="bg-gray-800 text-white">مبلغ ثابت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-200 mb-1">
                    {discounts.type === 'percentage' ? 'نسبة الخصم (%)' : 'مبلغ الخصم (جنيه)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discounts.type === 'percentage' ? (discounts.percentage === '' ? '' : discounts.percentage) : (discounts.fixed === '' ? '' : discounts.fixed)}
                    onChange={(e) => setDiscounts({
                      ...discounts, 
                      [discounts.type === 'percentage' ? 'percentage' : 'fixed']: e.target.value === '' ? '' : parseFloat(e.target.value)
                    })}
                    className="input-modern w-full px-2 py-2 text-xs text-right"
                    placeholder=""
                  />
                </div>
              </div>
        </div>

        {/* العربون */}
        <div className="mb-4 md:mb-6">
          <h3 className="font-bold text-white mb-4 md:mb-5 text-sm md:text-base">العربون</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs text-blue-200">تفعيل العربون</label>
              <button
                onClick={() => setDownPayment({...downPayment, enabled: !downPayment.enabled})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  downPayment.enabled ? 'bg-green-500' : 'bg-gray-500'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  downPayment.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
            
            {downPayment.enabled && (
              <>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs text-blue-200 mb-1">نوع العربون</label>
                    <select
                      value={downPayment.type}
                      onChange={(e) => setDownPayment({...downPayment, type: e.target.value})}
                      className="input-modern w-full px-2 py-2 text-xs text-right bg-gray-800 border-gray-600 text-white"
                    >
                      <option value="percentage" className="bg-gray-800 text-white">نسبة مئوية</option>
                      <option value="fixed" className="bg-gray-800 text-white">مبلغ ثابت</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-blue-200 mb-1">
                      {downPayment.type === 'percentage' ? 'نسبة العربون (%)' : 'مبلغ العربون ($)'}
                    </label>
                    <input
                      type="number"
                      value={downPayment.type === 'percentage' ? downPayment.percentage : downPayment.amount}
                      onChange={(e) => setDownPayment({
                        ...downPayment, 
                        [downPayment.type === 'percentage' ? 'percentage' : 'amount']: parseFloat(e.target.value) || 0
                      })}
                      className="input-modern w-full px-2 py-2 text-xs text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* معاينة العربون */}
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-300">مبلغ العربون:</span>
                      <span className="text-white font-bold">${getDownPaymentAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">المبلغ المتبقي:</span>
                      <span className="text-white font-bold">${getRemainingAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* معلومات العميل (إجبارية) */}
        <div className="mb-4 md:mb-6">
          <h3 className="font-bold text-white mb-3 md:mb-4 text-sm md:text-base">معلومات العميل *</h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs text-blue-200 mb-1">اسم العميل *</label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className={`input-modern w-full px-2 py-2 text-xs text-right ${
                  customerInfo.name && !validateCustomerName(customerInfo.name).isValid 
                    ? 'border-red-500 bg-red-500 bg-opacity-10' 
                    : ''
                }`}
                placeholder="اسم العميل (مطلوب)"
                required
              />
              {customerInfo.name && !validateCustomerName(customerInfo.name).isValid && (
                <p className="text-red-400 text-xs mt-1">{validateCustomerName(customerInfo.name).message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-blue-200 mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className={`input-modern w-full px-2 py-2 text-xs text-right ${
                  customerInfo.phone && !validatePhoneNumber(customerInfo.phone).isValid 
                    ? 'border-red-500 bg-red-500 bg-opacity-10' 
                    : ''
                }`}
                placeholder="رقم الهاتف (مطلوب)"
                required
              />
              {customerInfo.phone && !validatePhoneNumber(customerInfo.phone).isValid && (
                <p className="text-red-400 text-xs mt-1">{validatePhoneNumber(customerInfo.phone).message}</p>
              )}
            </div>
          </div>
        </div>

        {/* طرق الدفع */}
        <div className="mb-4 md:mb-6 animate-fadeInRight" style={{animationDelay: '0.6s'}}>
          <h3 className="font-bold text-white mb-4 md:mb-5 text-sm md:text-base">طريقة الدفع</h3>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 flex flex-col items-center transition-all duration-300 touch-target ${
                paymentMethod === 'cash' 
                  ? 'border-green-500 bg-green-500 bg-opacity-20 text-green-300 shadow-glow' 
                  : 'border-blue-500 border-opacity-30 bg-white bg-opacity-10 text-blue-200 hover:bg-opacity-20'
              }`}
            >
              <Banknote className="h-6 w-6 md:h-7 md:w-7 mb-3 md:mb-4" />
              <span className="text-sm md:text-base font-semibold">نقدي</span>
            </button>
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 flex flex-col items-center transition-all duration-300 touch-target ${
                paymentMethod === 'wallet' 
                  ? 'border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300 shadow-glow' 
                  : 'border-blue-500 border-opacity-30 bg-white bg-opacity-10 text-blue-200 hover:bg-opacity-20'
              }`}
            >
              <CreditCard className="h-6 w-6 md:h-7 md:w-7 mb-3 md:mb-4" />
              <span className="text-sm md:text-base font-semibold">محفظة</span>
            </button>
            <button
              onClick={() => setPaymentMethod('instapay')}
              className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 flex flex-col items-center transition-all duration-300 touch-target ${
                paymentMethod === 'instapay' 
                  ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-300 shadow-glow' 
                  : 'border-blue-500 border-opacity-30 bg-white bg-opacity-10 text-blue-200 hover:bg-opacity-20'
              }`}
            >
              <CreditCard className="h-6 w-6 md:h-7 md:w-7 mb-3 md:mb-4" />
              <span className="text-sm md:text-base font-semibold">انستا باي</span>
            </button>
          </div>
        </div>

        {/* أزرار العمل */}
        <div className="space-y-3 md:space-y-4 animate-fadeInRight" style={{animationDelay: '0.7s'}}>
          <button
            onClick={showInvoiceSummaryModal}
            disabled={cart.length === 0 || !activeShift}
            className="btn-primary w-full py-4 md:py-5 text-sm md:text-base font-bold payment-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center">
              <DollarSign className="h-6 w-6 md:h-7 md:w-7 mr-3 md:mr-4" />
              {!activeShift ? 'بدء وردية أولاً' : 'إتمام البيع'}
            </div>
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
                      <p className="text-white font-medium">{item.name}</p>
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
                    {paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'wallet' ? 'محفظة إلكترونية' : 'دفع فوري'}
                  </span>
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={cancelSale}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center"
              >
                <X className="h-5 w-5 mr-2" />
                الرجوع
          </button>
          <button
                onClick={confirmSale}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center"
          >
                <DollarSign className="h-5 w-5 mr-2" />
                تأكيد البيع
          </button>
          </div>
        </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default POS;
