import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Filter,
  Download,
  Upload,
  Tag,
  AlertTriangle,
  FolderPlus,
  Image,
  Camera,
  X
} from 'lucide-react';
import { useNotifications } from '../components/NotificationSystem';
import { ImageManager } from '../utils/imageManager';

const Products = () => {
  const { 
    notifyProductAdded, 
    notifyProductUpdated, 
    notifyProductDeleted, 
    notifyCategoryAdded, 
    notifyCategoryUpdated,
    notifyCategoryDeleted,
    notifyValidationError,
    notifyDuplicateError
  } = useNotifications();
  const [products, setProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'أحذية',
    stock: '',
    minStock: ''
  });
  const [productImages, setProductImages] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // التحقق من صحة اسم المنتج
  const validateProductName = (name) => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: 'اسم المنتج مطلوب' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: 'اسم المنتج يجب أن يكون أكثر من حرفين' };
    }
    if (name.trim().length > 100) {
      return { isValid: false, message: 'اسم المنتج يجب أن يكون أقل من 100 حرف' };
    }
    return { isValid: true, message: '' };
  };

  // التحقق من صحة السعر
  const validatePrice = (price) => {
    if (!price || price === '') {
      return { isValid: false, message: 'السعر مطلوب' };
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      return { isValid: false, message: 'السعر يجب أن يكون رقماً صحيحاً' };
    }
    if (numPrice <= 0) {
      return { isValid: false, message: 'السعر يجب أن يكون أكبر من صفر' };
    }
    if (numPrice > 999999) {
      return { isValid: false, message: 'السعر كبير جداً (أكثر من 999,999)' };
    }
    return { isValid: true, message: '' };
  };

  // التحقق من صحة المخزون
  const validateStock = (stock) => {
    if (!stock || stock === '') {
      return { isValid: false, message: 'المخزون مطلوب' };
    }
    const numStock = parseInt(stock);
    if (isNaN(numStock)) {
      return { isValid: false, message: 'المخزون يجب أن يكون رقماً صحيحاً' };
    }
    if (numStock < 0) {
      return { isValid: false, message: 'المخزون لا يمكن أن يكون سالباً' };
    }
    if (numStock > 99999) {
      return { isValid: false, message: 'المخزون كبير جداً (أكثر من 99,999)' };
    }
    return { isValid: true, message: '' };
  };

  // التحقق من صحة الحد الأدنى للمخزون
  const validateMinStock = (minStock, stock) => {
    if (!minStock || minStock === '') {
      return { isValid: false, message: 'الحد الأدنى للمخزون مطلوب' };
    }
    const numMinStock = parseInt(minStock);
    const numStock = parseInt(stock);
    if (isNaN(numMinStock)) {
      return { isValid: false, message: 'الحد الأدنى للمخزون يجب أن يكون رقماً صحيحاً' };
    }
    if (numMinStock < 0) {
      return { isValid: false, message: 'الحد الأدنى للمخزون لا يمكن أن يكون سالباً' };
    }
    if (numMinStock > numStock) {
      return { isValid: false, message: 'الحد الأدنى للمخزون لا يمكن أن يكون أكبر من المخزون الحالي' };
    }
    return { isValid: true, message: '' };
  };
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  const [categories, setCategories] = useState([]);

  // تحميل البيانات من localStorage عند بدء التطبيق
  useEffect(() => {
    // تحميل البيانات الموجودة بدلاً من حذفها
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const savedCategories = JSON.parse(localStorage.getItem('productCategories') || '[]');
    
    // إذا لم توجد بيانات، إضافة بيانات افتراضية فقط
    if (savedProducts.length === 0) {
      const defaultProducts = [
        { id: 1, name: 'حذاء رسمي أسود جلد طبيعي', price: 450, category: 'أحذية', stock: 15, minStock: 5 },
        { id: 2, name: 'بنطلون رسمي كحلي قطني', price: 180, category: 'بناطيل', stock: 25, minStock: 8 },
        { id: 3, name: 'قميص رسمي أبيض قطني', price: 120, category: 'قمصان', stock: 30, minStock: 10 },
        { id: 4, name: 'جاكيت رسمي رمادي صوف', price: 350, category: 'جواكت', stock: 12, minStock: 4 },
        { id: 5, name: 'حذاء بني جلد طبيعي', price: 380, category: 'أحذية', stock: 18, minStock: 6 },
        { id: 6, name: 'بنطلون أسود رسمي', price: 160, category: 'بناطيل', stock: 22, minStock: 7 },
        { id: 7, name: 'قميص أزرق فاتح', price: 95, category: 'قمصان', stock: 35, minStock: 12 },
        { id: 8, name: 'جاكيت أسود رسمي', price: 320, category: 'جواكت', stock: 2, minStock: 3 },
        { id: 21, name: 'حذاء رسمي أسود', price: 450, category: 'أحذية', stock: 3, minStock: 5 },
        { id: 9, name: 'حذاء رياضي أبيض', price: 280, category: 'أحذية', stock: 20, minStock: 8 },
        { id: 10, name: 'بنطلون جينز أزرق', price: 140, category: 'بناطيل', stock: 28, minStock: 10 },
        { id: 11, name: 'قميص وردي قطني', price: 110, category: 'قمصان', stock: 5, minStock: 8 },
        { id: 12, name: 'جاكيت بني صوف', price: 380, category: 'جواكت', stock: 2, minStock: 3 },
        { id: 13, name: 'حذاء أسود كاجوال', price: 220, category: 'أحذية', stock: 16, minStock: 5 },
        { id: 14, name: 'بنطلون رمادي رسمي', price: 170, category: 'بناطيل', stock: 20, minStock: 6 },
        { id: 15, name: 'قميص أخضر فاتح', price: 100, category: 'قمصان', stock: 32, minStock: 10 },
        { id: 16, name: 'جاكيت أزرق داكن', price: 340, category: 'جواكت', stock: 14, minStock: 4 },
        { id: 17, name: 'حذاء أحمر جلد', price: 420, category: 'أحذية', stock: 12, minStock: 4 },
        { id: 18, name: 'بنطلون بيج كاجوال', price: 150, category: 'بناطيل', stock: 24, minStock: 8 },
        { id: 19, name: 'قميص أصفر قطني', price: 105, category: 'قمصان', stock: 28, minStock: 9 },
        { id: 20, name: 'جاكيت أخضر داكن', price: 360, category: 'جواكت', stock: 1, minStock: 3 }
      ];
      
      setProducts(defaultProducts);
      localStorage.setItem('products', JSON.stringify(defaultProducts));
      console.log('تم إضافة منتجات افتراضية جديدة:', defaultProducts.length, 'منتج');
    } else {
      setProducts(savedProducts);
      console.log('تم تحميل المنتجات الموجودة:', savedProducts.length, 'منتج');
    }
    
    // إذا لم توجد فئات، إضافة فئات افتراضية فقط
    if (savedCategories.length === 0) {
      const defaultCategories = [
        { name: 'أحذية', description: 'جميع أنواع الأحذية الرسمية والرياضية' },
        { name: 'بناطيل', description: 'بناطيل رسمية ورياضية وجينز' },
        { name: 'قمصان', description: 'قمصان رسمية ورياضية بألوان متنوعة' },
        { name: 'جواكت', description: 'جواكت رسمية ورياضية بمواد مختلفة' }
      ];
      
      setCategories(defaultCategories);
      localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
      console.log('تم إضافة فئات افتراضية جديدة:', defaultCategories.length, 'فئة');
    } else {
      setCategories(savedCategories);
      console.log('تم تحميل الفئات الموجودة:', savedCategories.length, 'فئة');
    }
  }, []);

  // تحميل صور المنتجات الموجودة
  useEffect(() => {
    // تحميل صور المنتجات الموجودة بدلاً من حذفها
    const savedImages = JSON.parse(localStorage.getItem('productImages') || '{}');
    setProductImages(savedImages);
    console.log('تم تحميل صور المنتجات الموجودة:', Object.keys(savedImages).length, 'صورة');
  }, []);

  // إدارة صور المنتجات
  const handleImageUpload = async (productId, file) => {
    try {
      const imageData = await ImageManager.saveProductImage(productId, file);
      setProductImages(prev => ({
        ...prev,
        [productId]: imageData
      }));
      return imageData;
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      return null;
    }
  };

  const handleImageDelete = (productId) => {
    ImageManager.deleteProductImage(productId);
    setProductImages(prev => {
      const newImages = { ...prev };
      delete newImages[productId];
      return newImages;
    });
  };

  const openImageModal = (productId) => {
    setSelectedImage(productId);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // إضافة فئة جديدة
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      notifyValidationError('اسم الفئة', 'اسم الفئة مطلوب ولا يمكن أن يكون فارغاً');
      return;
    }

    // التحقق من عدم وجود فئة بنفس الاسم
    const categoryExists = categories.some(cat => cat.name === newCategory.name);
    if (categoryExists) {
      notifyDuplicateError(newCategory.name, 'فئة');
      return;
    }

    const updatedCategories = [...categories, { ...newCategory }];
    setCategories(updatedCategories);
    
    // حفظ الفئات في localStorage
    localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
    
    // إعادة تعيين النموذج
    setNewCategory({ name: '', description: '' });
    setShowAddCategoryModal(false);
    
    // إشعار نجاح إضافة الفئة
    notifyCategoryAdded(newCategory.name);
  };

  // حذف فئة
  const handleDeleteCategory = (categoryName) => {
    if (categoryName === 'الكل') {
      alert('لا يمكن حذف فئة "الكل"');
      return;
    }

    // التحقق من وجود منتجات في هذه الفئة
    const productsInCategory = products.filter(product => product.category === categoryName);
    if (productsInCategory.length > 0) {
      alert(`لا يمكن حذف هذه الفئة لأنها تحتوي على ${productsInCategory.length} منتج. يرجى نقل المنتجات إلى فئة أخرى أولاً.`);
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف فئة "${categoryName}"؟`)) {
      const updatedCategories = categories.filter(cat => cat.name !== categoryName);
      setCategories(updatedCategories);
      
      // حفظ الفئات في localStorage
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      
      // إشعار نجاح حذف الفئة
      notifyCategoryDeleted(categoryName);
    }
  };

  // تحميل الفئات المحفوظة
  useEffect(() => {
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // الحصول على قائمة أسماء الفئات للفلترة
  const categoryNames = ['الكل', ...categories.map(cat => cat.name)];

  const handleAddProduct = () => {
    // التحقق من صحة البيانات
    if (!newProduct.name.trim()) {
      notifyValidationError('اسم المنتج', 'اسم المنتج مطلوب ولا يمكن أن يكون فارغاً');
      return;
    }

    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      notifyValidationError('السعر', 'السعر مطلوب ويجب أن يكون أكبر من صفر');
      return;
    }

    // التحقق من عدم تكرار اسم المنتج
    const existingProduct = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existingProduct) {
      notifyDuplicateError(newProduct.name, 'منتج');
      return;
    }

    // التحقق من صحة الفئة المختارة
    const categoryExists = categories.some(cat => cat.name === newProduct.category);
    if (!categoryExists) {
      notifyValidationError('الفئة', 'يرجى اختيار فئة صحيحة من القائمة');
      return;
    }
      
      const product = {
        id: Date.now(),
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        minStock: parseInt(newProduct.minStock) || 0
      };
    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    
    // حفظ المنتجات في localStorage
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
      setNewProduct({
        name: '',
        price: '',
      category: categories[0]?.name || 'أحذية',
        stock: '',
      minStock: ''
      });
      setShowAddModal(false);
    
    // إشعار نجاح الإضافة
    notifyProductAdded(product.name);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setShowAddModal(true);
  };

  const handleUpdateProduct = () => {
    if (editingProduct && newProduct.name && newProduct.price) {
      const updatedProduct = {
        ...editingProduct,
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        minStock: parseInt(newProduct.minStock) || 0
      };
      const updatedProducts = products.map(p => p.id === editingProduct.id ? updatedProduct : p);
      setProducts(updatedProducts);
      
      // حفظ المنتجات في localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      setEditingProduct(null);
      setNewProduct({
        name: '',
        price: '',
        category: 'أحذية',
        stock: '',
        minStock: ''
      });
      setShowAddModal(false);
      
      // إشعار نجاح التحديث
      notifyProductUpdated(updatedProduct.name);
    }
  };

  const handleDeleteProduct = (id) => {
    const product = products.find(p => p.id === id);
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      
      // حفظ المنتجات في localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // إشعار نجاح الحذف
      notifyProductDeleted(product.name);
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  console.log('=== حساب المنتجات منخفضة المخزون ===');
  console.log('المنتجات:', products.length);
  console.log('المنتجات منخفضة المخزون:', lowStockProducts.length);
  console.log('تفاصيل المنتجات منخفضة المخزون:', lowStockProducts.map(p => `${p.name}: ${p.stock}/${p.minStock}`));
  console.log('جميع المنتجات:', products.map(p => `${p.name}: ${p.stock}/${p.minStock}`));
  console.log('=== نهاية الحساب ===');

  // فحص المخزون المنخفض (بدون إشعارات)
  useEffect(() => {
    console.log('useEffect triggered - products:', products.length, 'lowStock:', lowStockProducts.length);
    if (products.length > 0 && lowStockProducts.length > 0) {
      console.log('منتجات منخفضة المخزون:', lowStockProducts.length);
      // تم إلغاء الإشعارات - فقط تتبع في console
      lowStockProducts.forEach(product => {
        console.log('منتج منخفض المخزون:', product.name, 'المخزون:', product.stock, 'الحد الأدنى:', product.minStock);
      });
    } else {
      console.log('لا توجد منتجات منخفضة المخزون أو المنتجات غير محملة');
    }
  }, [products, lowStockProducts]);

  // useEffect منفصل لتحديث المنتجات منخفضة المخزون
  useEffect(() => {
    console.log('=== useEffect منفصل للمنتجات منخفضة المخزون ===');
    console.log('المنتجات في useEffect:', products.length);
    const calculatedLowStock = products.filter(p => p.stock <= p.minStock);
    console.log('المنتجات منخفضة المخزون المحسوبة:', calculatedLowStock.length);
    console.log('تفاصيل المنتجات منخفضة المخزون المحسوبة:', calculatedLowStock.map(p => `${p.name}: ${p.stock}/${p.minStock}`));
    console.log('=== نهاية useEffect منفصل ===');
  }, [products]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative z-10 p-3 md:p-4 lg:p-6 xl:p-8 space-y-3 md:space-y-4 lg:space-y-6 xl:space-y-8 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="flex-1">
            <h1 className="text-sm md:text-base lg:text-lg xl:text-xl font-bold text-white mb-2 md:mb-3 bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent">
              إدارة المنتجات
            </h1>
            <p className="text-blue-200 text-xs md:text-xs lg:text-sm xl:text-sm font-medium">إدارة مخزون الملابس الرجالية</p>
          </div>
          <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAddModal(true);
            }}
            className="btn-primary flex items-center px-3 md:px-4 py-2 md:py-3 text-xs md:text-xs lg:text-sm font-semibold min-h-[40px] cursor-pointer"
            style={{ 
              pointerEvents: 'auto',
              zIndex: 10,
              position: 'relative'
            }}
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
            إضافة منتج جديد
          </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddCategoryModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-xs lg:text-sm font-semibold transition-all duration-300 flex items-center min-h-[40px] cursor-pointer"
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              <FolderPlus className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
              إضافة فئة جديدة
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 xl:gap-8">
          <div className="glass-card hover-lift group cursor-pointer p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-200 mb-1 uppercase tracking-wide">إجمالي المنتجات</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2">{products.length}</p>
                <div className="flex items-center text-xs">
                  <span className="text-blue-300 font-medium">منتجات متاحة</span>
                </div>
              </div>
              <div className="p-2 md:p-3 lg:p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Package className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="glass-card hover-lift group cursor-pointer p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-200 mb-1 uppercase tracking-wide">قيمة المخزون</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2">
                  ${products.reduce((total, p) => total + (p.price * p.stock), 0).toLocaleString()}
                </p>
                <div className="flex items-center text-xs">
                  <span className="text-green-300 font-medium">قيمة المخزون</span>
                </div>
              </div>
              <div className="p-2 md:p-3 lg:p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Tag className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card hover-lift group cursor-pointer p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-200 mb-1 uppercase tracking-wide">منخفضة المخزون</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2">{lowStockProducts.length}</p>
                {console.log('لوحة التحكم - عدد المنتجات منخفضة المخزون:', lowStockProducts.length)}
                <div className="flex items-center text-xs">
                  <span className="text-orange-300 font-medium">تحتاج إعادة تموين</span>
                </div>
                {lowStockProducts.length > 0 && (
                  <div className="mt-2 text-xs text-orange-200 max-h-20 overflow-y-auto">
                    {lowStockProducts.map(product => (
                      <div key={product.id} className="truncate">
                        {product.name}: {product.stock}/{product.minStock}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 md:p-3 lg:p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5 md:h-6 md:w-6" />
              <input
                type="text"
                placeholder="البحث بالاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern w-full pr-12 md:pr-14 pl-3 md:pl-4 py-3 md:py-4 text-base md:text-lg text-right font-medium"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5 md:h-6 md:w-6" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-modern pr-12 md:pr-14 pl-3 md:pl-4 py-3 md:py-4 text-base md:text-lg text-right font-medium appearance-none bg-gray-800 border-gray-600 text-white"
              >
                
                {categoryNames.map(category => (
                  <option key={category} value={category} className="bg-gray-800 text-white">{category}</option>
                ))}
              </select>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedCategory === 'الكل' || !selectedCategory) { return; }
                const newName = window.prompt('أدخل اسم الفئة الجديد', selectedCategory);
                if (!newName || newName.trim() === '' || newName === selectedCategory) return;
                if (categories.some(c => c.name === newName)) { notifyDuplicateError(newName, 'فئة'); return; }
                const updatedCategories = categories.map(c => c.name === selectedCategory ? { ...c, name: newName } : c);
                setCategories(updatedCategories);
                localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
                const updatedProductsLocal = products.map(p => p.category === selectedCategory ? { ...p, category: newName } : p);
                setProducts(updatedProductsLocal);
                localStorage.setItem('products', JSON.stringify(updatedProductsLocal));
                notifyCategoryUpdated(selectedCategory, newName);
                setSelectedCategory(newName);
              }}
              disabled={selectedCategory === 'الكل' || !selectedCategory}
              className={`btn-primary flex items-center px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-semibold min-h-[50px] cursor-pointer ${selectedCategory === 'الكل' || !selectedCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                pointerEvents: selectedCategory === 'الكل' || !selectedCategory ? 'none' : 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              <Edit className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              تعديل الفئة
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedCategory === 'الكل' || !selectedCategory) { return; }
                const productsInCategory = products.filter(p => p.category === selectedCategory);
                if (!window.confirm(`سيتم حذف الفئة "${selectedCategory}" مع ${productsInCategory.length} منتج تابع لها. هل تريد المتابعة؟`)) return;
                // حذف المنتجات التابعة لهذه الفئة
                const remainingProducts = products.filter(p => p.category !== selectedCategory);
                setProducts(remainingProducts);
                localStorage.setItem('products', JSON.stringify(remainingProducts));

                // حذف الفئة نفسها
                const updatedCategories = categories.filter(c => c.name !== selectedCategory);
                setCategories(updatedCategories);
                localStorage.setItem('productCategories', JSON.stringify(updatedCategories));

                notifyCategoryDeleted(selectedCategory);
                setSelectedCategory('الكل');
              }}
              disabled={selectedCategory === 'الكل' || !selectedCategory}
              className={`bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 flex items-center text-sm md:text-base font-semibold shadow-lg min-h-[50px] cursor-pointer ${selectedCategory === 'الكل' || !selectedCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                pointerEvents: selectedCategory === 'الكل' || !selectedCategory ? 'none' : 'auto',
                zIndex: 10,
                position: 'relative'
              }}
            >
              <Trash2 className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              حذف الفئة
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white bg-opacity-10">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-purple-200 uppercase tracking-wider">الصورة</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-purple-200 uppercase tracking-wider">المنتج</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-purple-200 uppercase tracking-wider">السعر</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-purple-200 uppercase tracking-wider">المخزون</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-purple-200 uppercase tracking-wider">التصنيف</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-purple-200 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white divide-opacity-10">
                {selectedCategory === '' && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-blue-300 text-sm">
                      اختر فئة من الفلترة لعرض المنتجات
                    </td>
                  </tr>
                )}
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-white hover:bg-opacity-5 transition-all duration-300">
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <div className="relative group">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden border-2 border-gray-600 hover:border-blue-500 transition-colors duration-300">
                            {productImages[product.id] ? (
                              <img 
                                src={productImages[product.id]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onClick={() => openImageModal(product.id)}
                              />
                            ) : (
                              <img 
                                src={ImageManager.getDefaultImage(product.category)} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onClick={() => openImageModal(product.id)}
                              />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg md:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  document.getElementById(`image-upload-${product.id}`).click();
                                }}
                                className="p-1 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors duration-300 min-w-[24px] min-h-[24px] cursor-pointer"
                                title="رفع صورة"
                                style={{ 
                                  pointerEvents: 'auto',
                                  zIndex: 10,
                                  position: 'relative'
                                }}
                              >
                                <Camera className="h-3 w-3 text-white" />
                              </button>
                              {productImages[product.id] && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleImageDelete(product.id);
                                  }}
                                  className="p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors duration-300 min-w-[24px] min-h-[24px] cursor-pointer"
                                  title="حذف الصورة"
                                  style={{ 
                                    pointerEvents: 'auto',
                                    zIndex: 10,
                                    position: 'relative'
                                  }}
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              )}
                            </div>
                          </div>
                          <input
                            id={`image-upload-${product.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleImageUpload(product.id, e.target.files[0]);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm md:text-base font-medium text-white">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm md:text-base text-white font-semibold">${product.price}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-semibold rounded-full ${
                        product.stock <= product.minStock 
                          ? 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500 border-opacity-30' 
                          : 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm md:text-base text-blue-300 font-medium">{product.category}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 md:space-x-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          className="p-2 bg-blue-500 bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all duration-300 text-blue-300 hover:text-blue-200 min-w-[40px] min-h-[40px] cursor-pointer"
                          style={{ 
                            pointerEvents: 'auto',
                            zIndex: 10,
                            position: 'relative'
                          }}
                        >
                          <Edit className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          className="p-2 bg-red-500 bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all duration-300 text-red-300 hover:text-red-200 min-w-[40px] min-h-[40px] cursor-pointer"
                          style={{ 
                            pointerEvents: 'auto',
                            zIndex: 10,
                            position: 'relative'
                          }}
                        >
                          <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="glass-card p-6 md:p-8 w-full max-w-md mx-4 animate-fadeInUp">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
            
              <div className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-sm md:text-base font-semibold text-purple-200 mb-2">اسم المنتج</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="input-modern w-full px-3 md:px-4 py-3 md:py-4 text-base md:text-lg text-right font-medium"
                    placeholder="أدخل اسم المنتج"
                  />
                </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-purple-200 mb-2">السعر</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="input-modern w-full px-3 md:px-4 py-3 md:py-4 text-base md:text-lg text-right font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              
                
                
                <div>
                  <label className="block text-sm md:text-base font-semibold text-purple-200 mb-2">التصنيف</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="input-modern w-full px-3 md:px-4 py-3 md:py-4 text-base md:text-lg text-right font-medium appearance-none bg-gray-800 border-gray-600 text-white"
                  >
                    {categories.map(category => (
                      <option key={category.name} value={category.name} className="bg-gray-800 text-white">{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-purple-200 mb-2">المخزون</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      className="input-modern w-full px-3 md:px-4 py-3 md:py-4 text-base md:text-lg text-right font-medium"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-purple-200 mb-2">الحد الأدنى</label>
                    <input
                      type="number"
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                      className="input-modern w-full px-3 md:px-4 py-3 md:py-4 text-base md:text-lg text-right font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>
            </div>
            
              <div className="flex justify-end space-x-3 md:space-x-4 mt-6 md:mt-8">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAddModal(false);
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      price: '',
                      category: 'أحذية',
                      stock: '',
                      minStock: ''
                    });
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 text-blue-300 hover:text-blue-200 font-semibold transition-colors duration-300 min-h-[40px] cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 10,
                    position: 'relative'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editingProduct ? handleUpdateProduct() : handleAddProduct();
                  }}
                  className="btn-primary px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold min-h-[40px] cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 10,
                    position: 'relative'
                  }}
                >
                  {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة فئة جديدة */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">إضافة فئة جديدة</h3>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategory({ name: '', description: '' });
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  اسم الفئة *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="input-modern w-full"
                  placeholder="أدخل اسم الفئة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  وصف الفئة
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="input-modern w-full h-20 resize-none"
                  placeholder="وصف مختصر للفئة"
                />
              </div>

              {/* معاينة الفئة */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">معاينة الفئة:</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">
                    {newCategory.name || 'اسم الفئة'}
                  </span>
                </div>
                {newCategory.description && (
                  <p className="text-sm text-gray-400 mt-1">{newCategory.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddCategoryModal(false);
                  setNewCategory({ name: '', description: '' });
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors min-h-[40px] cursor-pointer"
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddCategory();
                }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg transition-all min-h-[40px] cursor-pointer"
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                إضافة الفئة
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="glass-card p-6 w-full max-w-2xl mx-4 animate-fadeInUp">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">صورة المنتج</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeImageModal();
                  }}
                  className="p-2 bg-gray-600 rounded-full hover:bg-gray-700 transition-colors duration-300 min-w-[40px] min-h-[40px] cursor-pointer"
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 10,
                    position: 'relative'
                  }}
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              
              <div className="text-center">
                {productImages[selectedImage] ? (
                  <img 
                    src={productImages[selectedImage]} 
                    alt="صورة المنتج"
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <img 
                    src={ImageManager.getDefaultImage(products.find(p => p.id === selectedImage)?.category || 'إكسسوارات')} 
                    alt="صورة المنتج الافتراضية"
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                )}
              </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Products;
