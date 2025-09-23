// نظام مركزي لإدارة جميع المراقبين لتجنب التداخل والتحديثات المتكررة
class ObserverManager {
  constructor() {
    this.observers = new Map();
    this.intervals = new Map();
    this.timeouts = new Map();
    this.isInitialized = false;
    this.isEnabled = true;
  }

  // تهيئة النظام
  init() {
    if (this.isInitialized) return;
    
    console.log('🔧 تهيئة مدير المراقبين...');
    
    // إيقاف جميع المراقبين نهائياً لتجنب المشاكل
    this.stopAll();
    this.isInitialized = true;
    console.log('✅ تم إيقاف جميع المراقبين بنجاح');
  }

  // إعداد مراقب واحد فقط لجميع العمليات
  setupSingleObserver() {
    if (!this.isEnabled) return;

    // مراقب واحد للعناصر المرئية
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.handleElementVisible(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // مراقب واحد للتغييرات
    const mutationObserver = new MutationObserver((mutations) => {
      // تجميع جميع العقد الجديدة
      const newNodes = new Set();
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            newNodes.add(node);
          }
        });
      });

      // معالجة العقد الجديدة مرة واحدة فقط
      if (newNodes.size > 0) {
        this.handleNewElements(Array.from(newNodes), intersectionObserver);
      }
    });

    // حفظ المراقبين
    this.observers.set('intersection', intersectionObserver);
    this.observers.set('mutation', mutationObserver);

    // بدء المراقبة
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // مراقبة العناصر الموجودة
    this.observeExistingElements(intersectionObserver);
  }

  // معالجة ظهور العنصر
  handleElementVisible(element) {
    // تجنب المعالجة المتكررة
    if (element.dataset.observerProcessed) return;
    element.dataset.observerProcessed = 'true';

    // معالجة الأنيميشن
    if (element.dataset.animation && !element.classList.contains('animation-applied')) {
      element.classList.add(`animate-${element.dataset.animation}`);
      element.classList.add('animation-applied');
    }

    // معالجة الصور الكسولة
    if (element.tagName === 'IMG' && element.dataset.src && !element.dataset.lazyLoaded) {
      element.src = element.dataset.src;
      element.classList.remove('lazy');
      element.dataset.lazyLoaded = 'true';
    }

    // إلغاء مراقبة العنصر
    const intersectionObserver = this.observers.get('intersection');
    if (intersectionObserver) {
      intersectionObserver.unobserve(element);
    }
  }

  // معالجة العناصر الجديدة
  handleNewElements(nodes, intersectionObserver) {
    nodes.forEach(node => {
      // تجنب المعالجة المتكررة
      if (node.dataset.observerProcessed) return;

      // العناصر التي تحتاج أنيميشن
      const animatedElements = node.querySelectorAll ? 
        node.querySelectorAll('[data-animation]:not(.animation-applied)') : [];
      
      // الصور الكسولة
      const lazyImages = node.querySelectorAll ? 
        node.querySelectorAll('img[data-src]:not([data-lazy-loaded])') : [];

      // العناصر التي تحتاج مراقبة
      const elementsToObserve = [...animatedElements, ...lazyImages];

      if (elementsToObserve.length > 0) {
        elementsToObserve.forEach(element => {
          intersectionObserver.observe(element);
        });
      }
    });
  }

  // مراقبة العناصر الموجودة
  observeExistingElements(intersectionObserver) {
    const existingElements = document.querySelectorAll('[data-animation]:not(.animation-applied), img[data-src]:not([data-lazy-loaded])');
    existingElements.forEach(element => {
      intersectionObserver.observe(element);
    });
  }

  // إيقاف جميع المراقبين
  stopAll() {
    console.log('🛑 إيقاف جميع المراقبين...');
    
    this.isEnabled = false;
    
    // إيقاف المراقبين
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    // إيقاف المؤقتات
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    this.intervals.clear();

    this.timeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.timeouts.clear();

    console.log('✅ تم إيقاف جميع المراقبين');
  }

  // إعادة تشغيل المراقبين
  restart() {
    console.log('🔄 إعادة تشغيل المراقبين...');
    
    this.stopAll();
    this.isEnabled = true;
    this.isInitialized = false;
    
    setTimeout(() => {
      this.init();
    }, 1000);
  }

  // الحصول على حالة المراقبين
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isEnabled: this.isEnabled,
      observersCount: this.observers.size,
      intervalsCount: this.intervals.size,
      timeoutsCount: this.timeouts.size
    };
  }
}

// إنشاء instance واحد فقط
export const observerManager = new ObserverManager();

// إيقاف جميع المراقبين القدامى وبدء المدير الجديد
window.addEventListener('DOMContentLoaded', () => {
  // إيقاف جميع المراقبين القدامى
  if (window.designManager) {
    window.designManager.cleanup?.();
  }
  if (window.performanceManager) {
    window.performanceManager.cleanup?.();
  }
  
  // بدء المدير الجديد
  observerManager.init();
});

// تصدير دوال مساعدة
export const observerUtils = {
  stop: () => observerManager.stopAll(),
  restart: () => observerManager.restart(),
  status: () => observerManager.getStatus()
};
