import React, { useState } from 'react';
import { 
  User,
  Shield,
  Printer,
  Globe,
  Database,
  Bell,
  Palette,
  Monitor,
  Smartphone,
  Download,
  Upload,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Store,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Mail,
  Phone
} from 'lucide-react';
import DataManager from '../components/DataManager';
import StoreSettings from '../components/StoreSettings';
import ShiftManager from '../components/ShiftManager';
import BackupManager from '../components/BackupManager';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('store');
  const [users, setUsers] = useState(() => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    return savedUsers.length > 0 ? savedUsers : [
      {
        id: 1,
        name: 'admin',
        email: 'admin@elkingstore.com',
        phone: '01234567890',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      {
        id: 2,
        name: 'أحمد محمد',
        email: 'ahmed@store.com',
        phone: '01234567891',
        role: 'manager',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      {
        id: 3,
        name: 'فاطمة علي',
        email: 'fatima@store.com',
        phone: '01234567892',
        role: 'cashier',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    ];
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    password: ''
  });
  const [settings, setSettings] = useState(() => {
    const savedSettings = JSON.parse(localStorage.getItem('pos-settings') || '{}');
    const savedStoreInfo = JSON.parse(localStorage.getItem('storeInfo') || '{}');
    
    return {
    // إعدادات عامة
      companyName: savedStoreInfo.storeName || savedSettings.companyName || 'Elking Store',
      companyAddress: savedStoreInfo.storeAddress || savedSettings.companyAddress || 'شارع التحلية، الرياض، المملكة العربية السعودية',
      companyPhone: savedStoreInfo.storePhone || savedSettings.companyPhone || '+966501234567',
      companyEmail: savedStoreInfo.storeEmail || savedSettings.companyEmail || 'info@elkingstore.com',
      currency: savedSettings.currency || 'EGP',
      language: savedSettings.language || 'ar',
      timezone: savedSettings.timezone || 'Africa/Cairo',
    
      // إعدادات الضرائب
      taxEnabled: savedStoreInfo.taxEnabled !== undefined ? savedStoreInfo.taxEnabled : savedSettings.taxEnabled !== undefined ? savedSettings.taxEnabled : true,
      taxRate: savedStoreInfo.taxRate || savedSettings.taxRate || 15,
      taxName: savedStoreInfo.taxName || savedSettings.taxName || 'ضريبة القيمة المضافة',
    
    // إعدادات المستخدمين
      allowRegistration: savedSettings.allowRegistration !== undefined ? savedSettings.allowRegistration : true,
      requireEmailVerification: savedSettings.requireEmailVerification !== undefined ? savedSettings.requireEmailVerification : true,
      defaultRole: savedSettings.defaultRole || 'cashier',
    
    // إعدادات الطابعة
      printerName: savedSettings.printerName || 'EPSON TM-T20III',
      paperSize: savedSettings.paperSize || '80mm',
      printLogo: savedSettings.printLogo !== undefined ? savedSettings.printLogo : true,
      printFooter: savedSettings.printFooter !== undefined ? savedSettings.printFooter : true,
    
    // إعدادات النسخ الاحتياطي
      autoBackup: savedSettings.autoBackup !== undefined ? savedSettings.autoBackup : true,
      backupFrequency: savedSettings.backupFrequency || 'daily',
      backupLocation: savedSettings.backupLocation || 'local',
    
    // إعدادات الإشعارات
      emailNotifications: savedSettings.emailNotifications !== undefined ? savedSettings.emailNotifications : true,
      smsNotifications: savedSettings.smsNotifications !== undefined ? savedSettings.smsNotifications : false,
      lowStockAlerts: savedSettings.lowStockAlerts !== undefined ? savedSettings.lowStockAlerts : true,
      salesReports: savedSettings.salesReports !== undefined ? savedSettings.salesReports : true,
    
    // إعدادات المظهر
      theme: savedSettings.theme || 'dark',
      primaryColor: savedSettings.primaryColor || '#8B5CF6',
      sidebarCollapsed: savedSettings.sidebarCollapsed !== undefined ? savedSettings.sidebarCollapsed : false,
    
    // إعدادات النظام
      maintenanceMode: savedSettings.maintenanceMode !== undefined ? savedSettings.maintenanceMode : false,
      debugMode: savedSettings.debugMode !== undefined ? savedSettings.debugMode : false,
      analyticsEnabled: savedSettings.analyticsEnabled !== undefined ? savedSettings.analyticsEnabled : true
    };
  });

  const tabs = [
    { id: 'store', name: 'إعدادات المتجر', icon: Store },
    { id: 'shifts', name: 'إدارة الورديات', icon: Clock },
    { id: 'users', name: 'المستخدمين', icon: User },
    { id: 'backup', name: 'النسخ الاحتياطي', icon: Database },
    { id: 'data', name: 'إدارة البيانات', icon: Database },
    { id: 'notifications', name: 'الإشعارات', icon: Bell },
    { id: 'appearance', name: 'المظهر', icon: Palette },
    { id: 'system', name: 'النظام', icon: Monitor }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // دوال إدارة المستخدمين
  const addUser = () => {
    if (!newUser.name || !newUser.email || !newUser.phone || !newUser.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const user = {
      id: Date.now(),
      ...newUser,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    setUsers([...users, user]);
    localStorage.setItem('users', JSON.stringify([...users, user]));
    setNewUser({ name: '', email: '', phone: '', role: 'cashier', password: '' });
    setShowAddUserModal(false);
    alert('تم إضافة المستخدم بنجاح!');
  };

  const editUser = () => {
    if (!editingUser.name || !editingUser.email || !editingUser.phone) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // منع تغيير دور المستخدم admin
    if (editingUser.name === 'admin' && editingUser.role !== 'admin') {
      alert('لا يمكن تغيير دور المستخدم الرئيسي (admin)!');
      return;
    }

    setUsers(users.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    localStorage.setItem('users', JSON.stringify(users.map(user => 
      user.id === editingUser.id ? editingUser : user
    )));
    setShowEditUserModal(false);
    setEditingUser(null);
    alert('تم تحديث المستخدم بنجاح!');
  };

  const deleteUser = (userId) => {
    const userToDelete = users.find(user => user.id === userId);
    
    // منع حذف المستخدم admin
    if (userToDelete && userToDelete.name === 'admin' && userToDelete.role === 'admin') {
      alert('لا يمكن حذف المستخدم الرئيسي (admin)!');
      return;
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      setUsers(users.filter(user => user.id !== userId));
      localStorage.setItem('users', JSON.stringify(users.filter(user => user.id !== userId)));
      alert('تم حذف المستخدم بنجاح!');
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    localStorage.setItem('users', JSON.stringify(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    )));
  };

  const openEditModal = (user) => {
    setEditingUser({ ...user });
    setShowEditUserModal(true);
  };

  // ضمان وجود المستخدم admin دائماً
  const ensureAdminUser = () => {
    const adminExists = users.some(user => user.name === 'admin' && user.role === 'admin');
    if (!adminExists) {
      const adminUser = {
        id: Date.now(),
        name: 'admin',
        email: 'admin@elkingstore.com',
        phone: '01234567890',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      setUsers([adminUser, ...users]);
      localStorage.setItem('users', JSON.stringify([adminUser, ...users]));
    }
  };

  // تشغيل الدالة عند تحميل المكون
  React.useEffect(() => {
    ensureAdminUser();
  }, []);

  const saveSettings = () => {
    try {
      // حفظ الإعدادات العامة
      localStorage.setItem('pos-settings', JSON.stringify(settings));

      // إرسال إشارة لحفظ إعدادات المتجر داخل مكون StoreSettings (الهاتف، العنوان، ...)
      const evt = new Event('save-store-settings');
      window.dispatchEvent(evt);
      
      alert('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      alert('حدث خطأ في حفظ الإعدادات!');
    }
  };

  const resetSettings = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      const defaultSettings = {
        companyName: 'Elking Store',
        companyAddress: 'شارع التحلية، الرياض، المملكة العربية السعودية',
        companyPhone: '+966501234567',
        companyEmail: 'info@elkingstore.com',
        currency: 'EGP',
        language: 'ar',
        timezone: 'Africa/Cairo',
        allowRegistration: true,
        requireEmailVerification: true,
        defaultRole: 'cashier',
        printerName: 'EPSON TM-T20III',
        paperSize: '80mm',
        printLogo: true,
        printFooter: true,
        autoBackup: true,
        backupFrequency: 'daily',
        backupLocation: 'local',
        emailNotifications: true,
        smsNotifications: false,
        lowStockAlerts: true,
        salesReports: true,
        theme: 'light',
        primaryColor: '#8B5CF6',
        sidebarCollapsed: false,
        maintenanceMode: false,
        debugMode: false,
        analyticsEnabled: true
      };
      setSettings(defaultSettings);
      alert('تم إعادة تعيين الإعدادات!');
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'pos-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          alert('تم استيراد الإعدادات بنجاح!');
        } catch (error) {
          alert('خطأ في ملف الإعدادات!');
        }
      };
      reader.readAsText(file);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">اسم الشركة</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => handleSettingChange('companyName', e.target.value)}
            className="input-modern w-full px-3 py-2 text-right"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">هاتف الشركة</label>
          <input
            type="tel"
            value={settings.companyPhone}
            onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
            className="input-modern w-full px-3 py-2 text-right"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">عنوان الشركة</label>
        <textarea
          value={settings.companyAddress}
          onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
          rows={3}
          className="input-modern w-full px-3 py-2 text-right"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">العملة</label>
          <select
            value={settings.currency}
            onChange={(e) => handleSettingChange('currency', e.target.value)}
            className="input-modern w-full px-3 py-2 text-right"
          >
            <option value="EGP">جنيه مصري (EGP)</option>
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="USD">دولار أمريكي (USD)</option>
            <option value="EUR">يورو (EUR)</option>
            <option value="AED">درهم إماراتي (AED)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">اللغة</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="input-modern w-full px-3 py-2 text-right"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">المنطقة الزمنية</label>
          <select
            value={settings.timezone}
            onChange={(e) => handleSettingChange('timezone', e.target.value)}
            className="input-modern w-full px-3 py-2 text-right"
          >
            <option value="Africa/Cairo">القاهرة (GMT+2)</option>
            <option value="Asia/Riyadh">الرياض (GMT+3)</option>
            <option value="Asia/Dubai">دبي (GMT+4)</option>
            <option value="Europe/London">لندن (GMT+0)</option>
            <option value="America/New_York">نيويورك (GMT-5)</option>
          </select>
        </div>
      </div>
    </div>
  );


  const renderPrinterSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">اسم الطابعة</label>
        <input
          type="text"
          value={settings.printerName}
          onChange={(e) => handleSettingChange('printerName', e.target.value)}
          className="input-modern w-full px-3 py-2 text-right"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">حجم الورق</label>
          <select
            value={settings.paperSize}
            onChange={(e) => handleSettingChange('paperSize', e.target.value)}
            className="input-modern w-full px-3 py-2 text-right"
          >
            <option value="80mm">80 مم</option>
            <option value="58mm">58 مم</option>
            <option value="A4">A4</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
          <div>
            <h4 className="font-medium text-white">طباعة الشعار</h4>
            <p className="text-sm text-purple-200">طباعة شعار الشركة على الإيصالات</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.printLogo}
              onChange={(e) => handleSettingChange('printLogo', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
          <div>
            <h4 className="font-medium text-white">طباعة التذييل</h4>
            <p className="text-sm text-purple-200">طباعة معلومات إضافية في أسفل الإيصال</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.printFooter}
              onChange={(e) => handleSettingChange('printFooter', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">إدارة المستخدمين</h2>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="bg-green-600 bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center border border-green-500 border-opacity-30"
        >
          <Plus className="h-4 w-4 mr-2" />
          إضافة مستخدم
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white bg-opacity-10">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الدور</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">آخر دخول</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white divide-opacity-10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white hover:bg-opacity-5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          user.name === 'admin' && user.role === 'admin' 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                            : 'bg-gradient-to-r from-purple-500 to-blue-500'
                        }`}>
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className={`text-sm font-medium ${
                          user.name === 'admin' && user.role === 'admin' 
                            ? 'text-red-300 font-bold' 
                            : 'text-white'
                        }`}>
                          {user.name}
                          {user.name === 'admin' && user.role === 'admin' && (
                            <span className="ml-2 text-xs bg-red-500 bg-opacity-30 px-2 py-1 rounded-full">رئيسي</span>
                          )}
                        </div>
                        <div className="text-sm text-purple-200">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-purple-200 mr-2" />
                      <div className="text-sm text-white">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-purple-200 mr-2" />
                      <div className="text-sm text-white">{user.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : user.role === 'manager'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'مدير عام' : user.role === 'manager' ? 'مدير متجر' : 'كاشير'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status === 'active' ? 'نشط' : 'غير نشط'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {!(user.name === 'admin' && user.role === 'admin') ? (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-400 hover:text-blue-300"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-400 hover:text-red-300"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs">مستخدم محمي</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">إضافة مستخدم جديد</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
        <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">الاسم</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                  placeholder="اسم المستخدم"
                />
        </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">البريد الإلكتروني</label>
          <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                  placeholder="example@store.com"
                />
      </div>
      
        <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">الهاتف</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                  placeholder="01234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">الدور</label>
          <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                >
                  <option value="cashier">كاشير</option>
                  <option value="manager">مدير متجر</option>
                  <option value="admin">مدير عام</option>
          </select>
        </div>
              
        <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                  placeholder="كلمة المرور"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={addUser}
                className="bg-green-600 bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors border border-green-500 border-opacity-30"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">تعديل المستخدم</h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">الاسم</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">الهاتف</label>
                <input
                  type="tel"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">الدور</label>
          <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="input-modern w-full px-3 py-2 text-right"
                >
                  <option value="cashier">كاشير</option>
                  <option value="manager">مدير متجر</option>
                  <option value="admin">مدير عام</option>
          </select>
        </div>
      </div>
      
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditUserModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                إلغاء
        </button>
              <button
                onClick={editUser}
                className="bg-blue-600 bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors border border-blue-500 border-opacity-30"
              >
                حفظ التغييرات
        </button>
      </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBackupSettings = () => (
    <BackupManager />
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">إشعارات البريد الإلكتروني</h4>
          <p className="text-sm text-purple-200">إرسال إشعارات عبر البريد الإلكتروني</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">إشعارات الرسائل النصية</h4>
          <p className="text-sm text-purple-200">إرسال إشعارات عبر الرسائل النصية</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.smsNotifications}
            onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">تنبيهات المخزون المنخفض</h4>
          <p className="text-sm text-purple-200">إشعار عند انخفاض مخزون المنتجات</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.lowStockAlerts}
            onChange={(e) => handleSettingChange('lowStockAlerts', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">تقارير المبيعات</h4>
          <p className="text-sm text-purple-200">إرسال تقارير المبيعات الدورية</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.salesReports}
            onChange={(e) => handleSettingChange('salesReports', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">المظهر</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSettingChange('theme', 'light')}
            className={`p-4 rounded-lg border-2 flex flex-col items-center ${
              settings.theme === 'light' 
                ? 'border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300' 
                : 'border-white border-opacity-20 bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
          >
            <Monitor className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">فاتح</span>
          </button>
          <button
            onClick={() => handleSettingChange('theme', 'dark')}
            className={`p-4 rounded-lg border-2 flex flex-col items-center ${
              settings.theme === 'dark' 
                ? 'border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300' 
                : 'border-white border-opacity-20 bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
          >
            <Monitor className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">داكن</span>
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2">اللون الأساسي</label>
        <div className="flex space-x-3">
          {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map(color => (
            <button
              key={color}
              onClick={() => handleSettingChange('primaryColor', color)}
              className={`w-12 h-12 rounded-lg border-2 ${
                settings.primaryColor === color ? 'border-white' : 'border-white border-opacity-30'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">طي القائمة الجانبية</h4>
          <p className="text-sm text-purple-200">إخفاء القائمة الجانبية افتراضياً</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.sidebarCollapsed}
            onChange={(e) => handleSettingChange('sidebarCollapsed', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">وضع الصيانة</h4>
          <p className="text-sm text-purple-200">إيقاف النظام مؤقتاً للصيانة</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">وضع التطوير</h4>
          <p className="text-sm text-purple-200">عرض معلومات إضافية للمطورين</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
        <div>
          <h4 className="font-medium text-white">التحليلات</h4>
          <p className="text-sm text-purple-200">جمع بيانات الاستخدام لتحسين النظام</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.analyticsEnabled}
            onChange={(e) => handleSettingChange('analyticsEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white bg-opacity-20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>
      
      <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-300 mr-2" />
          <div>
            <h4 className="font-medium text-yellow-200">تنبيه مهم</h4>
            <p className="text-sm text-yellow-300 mt-1">
              تغيير هذه الإعدادات قد يؤثر على أداء النظام. تأكد من فهمك للعواقب قبل التغيير.
            </p>
          </div>
        </div>
      </div>
    </div>
  );


  const renderTabContent = () => {
    switch (activeTab) {
      case 'store': return <StoreSettings />;
      case 'shifts': return <ShiftManager />;
      case 'users': return renderUserSettings();
      case 'backup': return renderBackupSettings();
      case 'data': return <DataManager />;
      case 'notifications': return renderNotificationSettings();
      case 'appearance': return renderAppearanceSettings();
      case 'system': return renderSystemSettings();
      default: return <StoreSettings />;
    }
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
              الإعدادات
            </h1>
            <p className="text-purple-200 text-xs md:text-xs lg:text-sm xl:text-sm font-medium">إدارة إعدادات متجر الأزياء الرجالية</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={saveSettings}
              className="btn-primary flex items-center px-3 md:px-4 py-2 md:py-3 text-xs md:text-xs lg:text-sm font-semibold"
            >
              <Save className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              حفظ الإعدادات
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="glass-card hover-lift animate-fadeInLeft p-4" style={{animationDelay: '0.1s'}}>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-500 bg-opacity-20 text-purple-300 border border-purple-500 border-opacity-30'
                        : 'text-white hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Import/Export */}
          <div className="glass-card hover-lift animate-fadeInLeft p-4 mt-4 md:mt-6" style={{animationDelay: '0.2s'}}>
            <h3 className="font-bold text-white mb-4">إدارة الإعدادات</h3>
            <div className="space-y-3">
              <button
                onClick={exportSettings}
                className="w-full bg-blue-600 bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center justify-center border border-blue-500 border-opacity-30"
              >
                <Download className="h-4 w-4 mr-2" />
                تصدير الإعدادات
              </button>
              <label className="w-full bg-green-600 bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center justify-center cursor-pointer border border-green-500 border-opacity-30">
                <Upload className="h-4 w-4 mr-2" />
                استيراد الإعدادات
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
              </label>
              <button
                onClick={resetSettings}
                className="w-full bg-red-600 bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center justify-center border border-red-500 border-opacity-30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass-card hover-lift animate-fadeInRight p-4 md:p-6" style={{animationDelay: '0.3s'}}>
            {renderTabContent()}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
