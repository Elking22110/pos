# 📋 دليل التثبيت والإعداد

## 🎯 نظرة عامة

هذا الدليل سيساعدك في تثبيت وإعداد نظام إدارة متجر الأزياء الرجالية بنجاح.

## 📋 المتطلبات

### النظام الأساسي
- **Node.js**: الإصدار 16.0.0 أو أحدث
- **npm**: الإصدار 8.0.0 أو أحدث
- **Git**: لإدارة الإصدارات

### المتصفحات المدعومة
- **Chrome**: الإصدار 90+
- **Firefox**: الإصدار 88+
- **Safari**: الإصدار 14+
- **Edge**: الإصدار 90+

### الأجهزة المدعومة
- **سطح المكتب**: Windows, macOS, Linux
- **التابلت**: iPad, Android tablets
- **الهاتف المحمول**: iOS, Android

## 🚀 خطوات التثبيت

### 1. تحضير البيئة

#### تثبيت Node.js
```bash
# تحقق من إصدار Node.js
node --version

# إذا لم يكن مثبتاً، قم بتحميله من:
# https://nodejs.org/
```

#### تثبيت Git
```bash
# تحقق من إصدار Git
git --version

# إذا لم يكن مثبتاً، قم بتحميله من:
# https://git-scm.com/
```

### 2. استنساخ المشروع

```bash
# استنساخ المشروع
git clone https://github.com/your-username/pos-system-modern-ui.git

# الانتقال إلى مجلد المشروع
cd pos-system-modern-ui
```

### 3. تثبيت التبعيات

```bash
# تثبيت جميع التبعيات
npm install

# أو باستخدام yarn
yarn install
```

### 4. إعداد المتغيرات البيئية

إنشاء ملف `.env` في مجلد المشروع:

```env
# إعدادات التطبيق
VITE_APP_NAME=نظام إدارة متجر الأزياء الرجالية
VITE_APP_VERSION=2.0.0

# إعدادات قاعدة البيانات (للمستقبل)
VITE_DB_URL=http://localhost:3000/api
VITE_DB_TOKEN=your-database-token

# إعدادات الأمان
VITE_JWT_SECRET=your-jwt-secret-key
VITE_ENCRYPTION_KEY=your-encryption-key

# إعدادات التطوير
VITE_DEV_MODE=true
VITE_DEBUG_MODE=false
```

### 5. تشغيل المشروع

#### وضع التطوير
```bash
# تشغيل خادم التطوير
npm run dev

# أو باستخدام yarn
yarn dev
```

#### وضع الإنتاج
```bash
# بناء المشروع للإنتاج
npm run build

# معاينة الإنتاج
npm run preview
```

### 6. الوصول للتطبيق

افتح المتصفح وانتقل إلى:
```
http://localhost:5173
```

## 🔧 الإعدادات المتقدمة

### إعدادات Vite

إنشاء ملف `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
```

### إعدادات Tailwind CSS

إنشاء ملف `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        'display': ['Poppins', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      }
    },
  },
  plugins: [],
}
```

## 🗄️ إعداد قاعدة البيانات

### قاعدة البيانات المحلية (الحالية)

النظام يستخدم حالياً localStorage مع إمكانية الترقية:

```javascript
// إعدادات قاعدة البيانات المحلية
const dbConfig = {
  name: 'pos_system_db',
  version: 1,
  stores: ['users', 'products', 'customers', 'sales', 'settings']
}
```

### قاعدة البيانات الخارجية (مستقبلاً)

```javascript
// إعدادات قاعدة البيانات الخارجية
const externalDbConfig = {
  url: process.env.VITE_DB_URL,
  token: process.env.VITE_DB_TOKEN,
  timeout: 30000,
  retries: 3
}
```

## 🔐 إعدادات الأمان

### مفاتيح التشفير

```javascript
// إنشاء مفاتيح التشفير
const generateKeys = () => {
  const jwtSecret = crypto.randomBytes(64).toString('hex')
  const encryptionKey = crypto.randomBytes(32).toString('hex')
  
  console.log('JWT Secret:', jwtSecret)
  console.log('Encryption Key:', encryptionKey)
}
```

### إعدادات CORS

```javascript
// إعدادات CORS للخادم
const corsConfig = {
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

## 📱 إعدادات الاستجابة

### إعدادات الشاشات

```css
/* إعدادات الاستجابة */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .container {
    padding: 1.5rem;
  }
}

@media (min-width: 1025px) {
  .container {
    padding: 2rem;
  }
}
```

## 🚀 تحسينات الأداء

### إعدادات التحميل الكسول

```javascript
// إعدادات التحميل الكسول
const lazyConfig = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
  delay: 100
}
```

### إعدادات الكاش

```javascript
// إعدادات الكاش
const cacheConfig = {
  maxSize: 100,
  ttl: 300000, // 5 دقائق
  strategy: 'lru'
}
```

## 🔧 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. خطأ في تثبيت التبعيات
```bash
# حل مشكلة npm
npm cache clean --force
npm install

# أو استخدام yarn
yarn cache clean
yarn install
```

#### 2. خطأ في البورت
```bash
# تغيير البورت
npm run dev -- --port 3000

# أو في ملف vite.config.js
server: {
  port: 3000
}
```

#### 3. مشاكل في الذاكرة
```bash
# زيادة حد الذاكرة
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 4. مشاكل في الخطوط
```css
/* إضافة الخطوط يدوياً */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
```

### سجلات الأخطاء

```javascript
// إعدادات السجلات
const loggerConfig = {
  level: 'info',
  format: 'json',
  destination: 'logs/app.log'
}
```

## 📊 مراقبة الأداء

### إعدادات المراقبة

```javascript
// إعدادات مراقبة الأداء
const monitoringConfig = {
  enabled: true,
  interval: 5000,
  metrics: ['memory', 'cpu', 'network']
}
```

### إعدادات التحليلات

```javascript
// إعدادات التحليلات
const analyticsConfig = {
  enabled: true,
  trackingId: 'GA-XXXXXXXXX',
  events: ['page_view', 'user_action', 'error']
}
```

## 🔄 التحديثات

### تحديث المشروع

```bash
# جلب التحديثات
git pull origin main

# تثبيت التبعيات الجديدة
npm install

# إعادة بناء المشروع
npm run build
```

### نسخ احتياطية

```bash
# إنشاء نسخة احتياطية
cp -r pos-system-modern-ui pos-system-backup-$(date +%Y%m%d)

# نسخ احتياطية للبيانات
cp -r src/data backups/data-$(date +%Y%m%d)
```

## 📞 الدعم الفني

### الحصول على المساعدة

- **البريد الإلكتروني**: support@mensfashion.com
- **الهاتف**: +966501234567
- **الدردشة المباشرة**: متاحة 24/7
- **المنتدى**: community.mensfashion.com

### الإبلاغ عن المشاكل

```bash
# جمع معلومات النظام
npm run system-info

# إنشاء تقرير خطأ
npm run bug-report
```

---

**تم إعداد هذا الدليل بعناية لضمان تثبيت ناجح وسلس للنظام** 🎉
