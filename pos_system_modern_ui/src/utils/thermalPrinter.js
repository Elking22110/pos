// نظام الطابعة الحرارية المحسن
class ThermalPrinterManager {
  constructor() {
    this.port = null;
    this.writer = null;
    this.isConnected = false;
    this.printerSettings = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none'
    };
  }

  // تهيئة الطابعة
  async init() {
    try {
      // التحقق من دعم Web Serial API
      if (!navigator.serial) {
        throw new Error('Web Serial API غير مدعوم في هذا المتصفح');
      }

      // طلب إذن الوصول للطابعة
      this.port = await navigator.serial.requestPort();
      
      // فتح الاتصال
      await this.port.open({
        baudRate: this.printerSettings.baudRate,
        dataBits: this.printerSettings.dataBits,
        stopBits: this.printerSettings.stopBits,
        parity: this.printerSettings.parity,
        flowControl: this.printerSettings.flowControl
      });

      // الحصول على writer
      this.writer = this.port.writable.getWriter();
      this.isConnected = true;

      console.log('تم الاتصال بالطابعة الحرارية بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في الاتصال بالطابعة الحرارية:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // إغلاق الاتصال
  async close() {
    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
      
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      
      this.isConnected = false;
      console.log('تم إغلاق الاتصال بالطابعة');
    } catch (error) {
      console.error('خطأ في إغلاق الاتصال بالطابعة:', error);
    }
  }

  // إرسال أوامر للطابعة
  async sendCommand(command) {
    try {
      if (!this.isConnected || !this.writer) {
        throw new Error('الطابعة غير متصلة');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      await this.writer.write(data);
      
      // انتظار صغير لضمان إرسال البيانات
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('خطأ في إرسال الأمر للطابعة:', error);
      throw error;
    }
  }

  // طباعة نص
  async printText(text) {
    try {
      // إعداد الطابعة
      await this.sendCommand('\x1B\x40'); // ESC @ - إعادة تعيين
      await this.sendCommand('\x1B\x61\x01'); // ESC a 1 - محاذاة وسط
      await this.sendCommand('\x1B\x45\x01'); // ESC E 1 - نص عريض
      
      // إرسال النص
      await this.sendCommand(text);
      await this.sendCommand('\n');
      
    } catch (error) {
      console.error('خطأ في طباعة النص:', error);
      throw error;
    }
  }

  // طباعة خط
  async printLine(char = '-', length = 32) {
    try {
      const line = char.repeat(length);
      await this.sendCommand(line + '\n');
    } catch (error) {
      console.error('خطأ في طباعة الخط:', error);
      throw error;
    }
  }

  // طباعة إيصال
  async printReceipt(receiptData) {
    try {
      if (!this.isConnected) {
        await this.init();
      }

      // بدء الإيصال
      await this.sendCommand('\x1B\x40'); // إعادة تعيين
      await this.sendCommand('\x1B\x61\x01'); // محاذاة وسط
      
      // عنوان المتجر
      if (receiptData.storeName) {
        await this.sendCommand('\x1B\x45\x01'); // نص عريض
        await this.sendCommand(receiptData.storeName + '\n');
        await this.sendCommand('\x1B\x45\x00'); // إلغاء النص العريض
      }

      // وصف المتجر
      if (receiptData.storeDescription) {
        await this.sendCommand(receiptData.storeDescription + '\n');
      }

      // خط فاصل
      await this.printLine('=', 32);

      // التاريخ والوقت
      await this.sendCommand('\x1B\x61\x00'); // محاذاة يسار
      await this.sendCommand(`التاريخ: ${receiptData.date}\n`);
      
      // عنوان المتجر
      if (receiptData.storeAddress) {
        await this.sendCommand(`العنوان: ${receiptData.storeAddress}\n`);
      }
      
      // هاتف المتجر
      if (receiptData.storePhone) {
        await this.sendCommand(`الهاتف: ${receiptData.storePhone}\n`);
      }

      // خط فاصل
      await this.printLine('-', 32);

      // بيانات العميل
      if (receiptData.customerName) {
        await this.sendCommand(`العميل: ${receiptData.customerName}\n`);
      }
      if (receiptData.customerPhone) {
        await this.sendCommand(`الهاتف: ${receiptData.customerPhone}\n`);
      }
      if (receiptData.customerName || receiptData.customerPhone) {
        await this.printLine('-', 32);
      }

      // المنتجات
      await this.sendCommand('المنتجات:\n');
      for (const item of receiptData.items) {
        const name = item.name.substring(0, 20); // تقليل طول الاسم
        const quantity = item.quantity;
        const price = item.price;
        const total = price * quantity;
        
        await this.sendCommand(`${name} x${quantity} = ${total} جنيه\n`);
      }

      // خط فاصل
      await this.printLine('-', 32);

      // المجموع الفرعي
      await this.sendCommand(`المجموع الفرعي: ${receiptData.subtotal.toFixed(2)} جنيه\n`);

      // الخصم
      if (receiptData.discount > 0) {
        await this.sendCommand(`الخصم: -${receiptData.discount.toFixed(2)} جنيه\n`);
      }

      // الضريبة
      if (receiptData.tax > 0) {
        await this.sendCommand(`الضريبة: ${receiptData.tax.toFixed(2)} جنيه\n`);
      }

      // الإجمالي
      await this.sendCommand(`الإجمالي: ${receiptData.total.toFixed(2)} جنيه\n`);

      // العربون
      if (receiptData.downPayment > 0) {
        await this.sendCommand(`العربون: ${receiptData.downPayment.toFixed(2)} جنيه\n`);
        await this.sendCommand(`المبلغ المتبقي: ${receiptData.remaining.toFixed(2)} جنيه\n`);
      }

      // طريقة الدفع
      await this.sendCommand(`طريقة الدفع: ${receiptData.paymentMethod}\n`);

      // خط فاصل
      await this.printLine('-', 32);

      // رسالة شكر
      await this.sendCommand('\x1B\x61\x01'); // محاذاة وسط
      await this.sendCommand('شكراً لزيارتكم\n');
      await this.sendCommand('Elking Store\n');

      // قطع الورق
      await this.sendCommand('\n\n\n');
      await this.sendCommand('\x1D\x56\x00'); // قطع الورق

      console.log('تم طباعة الإيصال بنجاح');
      return true;

    } catch (error) {
      console.error('خطأ في طباعة الإيصال:', error);
      throw error;
    }
  }

  // طباعة تقرير
  async printReport(reportData) {
    try {
      if (!this.isConnected) {
        await this.init();
      }

      // بدء التقرير
      await this.sendCommand('\x1B\x40'); // إعادة تعيين
      await this.sendCommand('\x1B\x61\x01'); // محاذاة وسط
      
      // عنوان التقرير
      await this.sendCommand('\x1B\x45\x01'); // نص عريض
      await this.sendCommand(reportData.title + '\n');
      await this.sendCommand('\x1B\x45\x00'); // إلغاء النص العريض

      // التاريخ
      await this.sendCommand(`التاريخ: ${reportData.date}\n`);
      await this.printLine('=', 32);

      // محتوى التقرير
      for (const line of reportData.content) {
        await this.sendCommand(line + '\n');
      }

      // خط فاصل
      await this.printLine('-', 32);

      // توقيع
      await this.sendCommand('\x1B\x61\x01'); // محاذاة وسط
      await this.sendCommand('تم إنشاء التقرير تلقائياً\n');
      await this.sendCommand('Elking Store\n');

      // قطع الورق
      await this.sendCommand('\n\n\n');
      await this.sendCommand('\x1D\x56\x00'); // قطع الورق

      console.log('تم طباعة التقرير بنجاح');
      return true;

    } catch (error) {
      console.error('خطأ في طباعة التقرير:', error);
      throw error;
    }
  }

  // اختبار الطابعة
  async testPrint() {
    try {
      if (!this.isConnected) {
        await this.init();
      }

      await this.sendCommand('\x1B\x40'); // إعادة تعيين
      await this.sendCommand('\x1B\x61\x01'); // محاذاة وسط
      await this.sendCommand('\x1B\x45\x01'); // نص عريض
      await this.sendCommand('اختبار الطابعة\n');
      await this.sendCommand('\x1B\x45\x00'); // إلغاء النص العريض
      await this.sendCommand('Elking Store\n');
      await this.printLine('=', 32);
      await this.sendCommand('الوقت: ' + new Date().toLocaleString('ar-SA') + '\n');
      await this.sendCommand('الحالة: متصلة بنجاح\n');
      await this.printLine('-', 32);
      await this.sendCommand('تم اختبار الطابعة بنجاح\n');
      await this.sendCommand('\n\n\n');
      await this.sendCommand('\x1D\x56\x00'); // قطع الورق

      console.log('تم اختبار الطابعة بنجاح');
      return true;

    } catch (error) {
      console.error('خطأ في اختبار الطابعة:', error);
      throw error;
    }
  }

  // التحقق من حالة الاتصال
  isPrinterConnected() {
    return this.isConnected && this.port && this.writer;
  }

  // الحصول على إعدادات الطابعة
  getPrinterSettings() {
    return { ...this.printerSettings };
  }

  // تحديث إعدادات الطابعة
  updatePrinterSettings(settings) {
    this.printerSettings = { ...this.printerSettings, ...settings };
  }

  // إعادة الاتصال
  async reconnect() {
    try {
      await this.close();
      await this.init();
      return true;
    } catch (error) {
      console.error('خطأ في إعادة الاتصال:', error);
      throw error;
    }
  }

  // طباعة بدون إذن (محاولة)
  async printWithoutPermission(receiptData) {
    try {
      // محاولة استخدام Web Serial API بدون إذن
      const ports = await navigator.serial.getPorts();
      
      if (ports.length > 0) {
        this.port = ports[0];
        await this.port.open({
          baudRate: this.printerSettings.baudRate,
          dataBits: this.printerSettings.dataBits,
          stopBits: this.printerSettings.stopBits,
          parity: this.printerSettings.parity,
          flowControl: this.printerSettings.flowControl
        });

        this.writer = this.port.writable.getWriter();
        this.isConnected = true;

        // طباعة الإيصال
        await this.printReceipt(receiptData);
        
        return true;
      } else {
        throw new Error('لا توجد طابعة متصلة');
      }
    } catch (error) {
      console.error('خطأ في الطباعة بدون إذن:', error);
      throw error;
    }
  }
}

// إنشاء مثيل واحد من مدير الطابعة الحرارية
const thermalPrinterManager = new ThermalPrinterManager();

export default thermalPrinterManager;


