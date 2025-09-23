import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import databaseManager from '../utils/database';
import { design } from '../utils/design';
import { perf } from '../utils/performance';
import { 
  Download, 
  Upload, 
  Database, 
  Shield, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  HardDrive,
  Cloud,
  Settings,
  BarChart3,
  Users,
  Package,
  ShoppingCart
} from 'lucide-react';

const DataManager = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('backup');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);
  const [backups, setBackups] = useState([]);

  // دالة تحويل البيانات إلى CSV
  const convertToCSV = (data) => {
    let csv = '';
    
    for (const [tableName, records] of Object.entries(data)) {
      if (records && records.length > 0) {
        csv += `\n=== ${tableName.toUpperCase()} ===\n`;
        
        // الحصول على العناوين من أول سجل
        const headers = Object.keys(records[0]);
        csv += headers.join(',') + '\n';
        
        // إضافة البيانات
        records.forEach(record => {
          const values = headers.map(header => {
            const value = record[header];
            // تنظيف القيم للـ CSV
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          });
          csv += values.join(',') + '\n';
        });
      }
    }
    
    return csv;
  };

  useEffect(() => {
    loadStats();
    loadBackups();
  }, []);

  const loadStats = async () => {
    try {
      const databaseStats = await databaseManager.getStats();
      const performanceStats = perf.stats();
      const designStats = design.stats();
      
      setStats({
        database: databaseStats,
        performance: performanceStats,
        design: designStats
      });
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const backups = await databaseManager.getBackups();
      setBackups(backups.map((backup, index) => ({
        id: backup.id,
        index,
        timestamp: backup.date,
        size: JSON.stringify(backup.data).length,
        type: backup.type
      })));
    } catch (error) {
      console.error('خطأ في تحميل النسخ الاحتياطية:', error);
      setBackups([]);
    }
  };

  const handleExport = async (format = 'json') => {
    if (!hasPermission('read')) {
      setMessage({ type: 'error', text: 'ليس لديك صلاحية التصدير' });
      return;
    }

    setLoading(true);
    try {
      const data = await databaseManager.exportData();
      const dataString = format === 'json' ? JSON.stringify(data, null, 2) : convertToCSV(data);
      
      if (format === 'json') {
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos_system_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const blob = new Blob([dataString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos_system_backup_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setMessage({ type: 'success', text: 'تم تصدير البيانات بنجاح' });
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل في تصدير البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event) => {
    if (!hasPermission('write')) {
      setMessage({ type: 'error', text: 'ليس لديك صلاحية الاستيراد' });
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      let data;
      
      if (file.name.endsWith('.csv')) {
        // تحويل CSV إلى JSON (مبسط)
        setMessage({ type: 'error', text: 'استيراد CSV غير مدعوم حالياً. يرجى استخدام ملف JSON' });
        return;
      } else {
        data = JSON.parse(text);
      }
      
      await databaseManager.importData(data);
      setMessage({ type: 'success', text: 'تم استيراد البيانات بنجاح' });
      loadStats();
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل في استيراد البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!hasPermission('write')) {
      setMessage({ type: 'error', text: 'ليس لديك صلاحية إنشاء نسخة احتياطية' });
      return;
    }

    setLoading(true);
    try {
      const backup = await databaseManager.createBackup('full');
      if (backup) {
        setMessage({ type: 'success', text: 'تم إنشاء نسخة احتياطية بنجاح' });
        loadBackups();
        loadStats();
      } else {
        setMessage({ type: 'error', text: 'فشل في إنشاء النسخة الاحتياطية' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل في إنشاء النسخة الاحتياطية' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupId) => {
    if (!hasPermission('write')) {
      setMessage({ type: 'error', text: 'ليس لديك صلاحية استعادة النسخة الاحتياطية' });
      return;
    }

    if (!confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
      return;
    }

    setLoading(true);
    try {
      const success = await databaseManager.restoreBackup(backupId);
      if (success) {
        setMessage({ type: 'success', text: 'تم استعادة النسخة الاحتياطية بنجاح' });
        loadStats();
        loadBackups();
      } else {
        setMessage({ type: 'error', text: 'فشل في استعادة النسخة الاحتياطية' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل في استعادة النسخة الاحتياطية' });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!hasPermission('write')) {
      setMessage({ type: 'error', text: 'ليس لديك صلاحية تنظيف البيانات' });
      return;
    }

    if (!confirm('هل أنت متأكد من تنظيف البيانات؟ سيتم حذف جميع البيانات نهائياً.')) {
      return;
    }

    setLoading(true);
    try {
      await databaseManager.cleanup();
      setMessage({ type: 'success', text: 'تم تنظيف البيانات بنجاح' });
      loadStats();
      loadBackups();
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل في تنظيف البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  return (
    <div className="glass-card hover-lift animate-fadeInUp p-6">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
          <Database className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">إدارة البيانات</h2>
          <p className="text-purple-200 text-sm">نسخ احتياطي، استيراد، تصدير، وإحصائيات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'backup' 
              ? 'bg-purple-500 bg-opacity-20 text-purple-300 border border-purple-500 border-opacity-30' 
              : 'text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          <HardDrive className="h-4 w-4 inline mr-2" />
          النسخ الاحتياطية
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'import' 
              ? 'bg-purple-500 bg-opacity-20 text-purple-300 border border-purple-500 border-opacity-30' 
              : 'text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          الاستيراد/التصدير
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'stats' 
              ? 'bg-purple-500 bg-opacity-20 text-purple-300 border border-purple-500 border-opacity-30' 
              : 'text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          الإحصائيات
        </button>
        <button
          onClick={() => setActiveTab('cleanup')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'cleanup' 
              ? 'bg-purple-500 bg-opacity-20 text-purple-300 border border-purple-500 border-opacity-30' 
              : 'text-white hover:bg-white hover:bg-opacity-10'
          }`}
        >
          <Trash2 className="h-4 w-4 inline mr-2" />
          التنظيف
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30' 
            : 'bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-300 mr-2" />
            )}
            <span className={`text-sm ${
              message.type === 'success' ? 'text-green-300' : 'text-red-300'
            }`}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">النسخ الاحتياطية</h3>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              إنشاء نسخة احتياطية
            </button>
          </div>

          <div className="space-y-3">
            {backups.length === 0 ? (
              <div className="text-center py-8 text-purple-200">
                <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد نسخ احتياطية</p>
              </div>
            ) : (
              backups.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-purple-300 mr-3" />
                    <div>
                      <div className="text-white font-medium">نسخة احتياطية #{backup.index + 1}</div>
                      <div className="text-purple-200 text-sm">
                        {formatDate(backup.timestamp)} • {formatBytes(backup.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(backup.id)}
                    disabled={loading}
                    className="bg-green-500 bg-opacity-20 text-green-300 px-3 py-1 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50"
                  >
                    استعادة
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">التصدير</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleExport('json')}
                disabled={loading}
                className="btn-primary p-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-2" />
                تصدير JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={loading}
                className="btn-primary p-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FileText className="h-5 w-5 mr-2" />
                تصدير CSV
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">الاستيراد</h3>
            <div className="relative">
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                disabled={loading}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="btn-primary p-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Upload className="h-5 w-5 mr-2" />
                استيراد ملف
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">إحصائيات النظام</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Database Stats */}
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Database className="h-5 w-5 text-blue-300 mr-2" />
                <h4 className="text-white font-semibold">قاعدة البيانات</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-200">إجمالي السجلات:</span>
                  <span className="text-white">{Object.values(stats.database).reduce((sum, count) => sum + count, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">المنتجات:</span>
                  <span className="text-white">{stats.database.products || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">العملاء:</span>
                  <span className="text-white">{stats.database.customers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">المبيعات:</span>
                  <span className="text-white">{stats.database.sales || 0}</span>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <BarChart3 className="h-5 w-5 text-green-300 mr-2" />
                <h4 className="text-white font-semibold">الأداء</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-200">الكاش:</span>
                  <span className="text-white">{stats.performance.cache.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">كاش الصور:</span>
                  <span className="text-white">{stats.performance.cache.imageCache}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">المؤقتات:</span>
                  <span className="text-white">{stats.performance.timers.debounce + stats.performance.timers.throttle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">الذاكرة:</span>
                  <span className="text-white">
                    {stats.performance.performance.memory ? 
                      formatBytes(stats.performance.performance.memory.used) : 'غير متاح'}
                  </span>
                </div>
              </div>
            </div>

            {/* Design Stats */}
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Settings className="h-5 w-5 text-purple-300 mr-2" />
                <h4 className="text-white font-semibold">التصميم</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-200">الثيم الحالي:</span>
                  <span className="text-white">{stats.design.currentTheme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">الثيمات المتاحة:</span>
                  <span className="text-white">{stats.design.availableThemes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">الأنيميشن:</span>
                  <span className="text-white">{stats.design.animations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">الألوان:</span>
                  <span className="text-white">{Object.keys(stats.design.colorPalette).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Tab */}
      {activeTab === 'cleanup' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">تنظيف البيانات</h3>
          
          <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-300 mr-2" />
              <span className="text-yellow-300 font-semibold">تحذير</span>
            </div>
            <p className="text-yellow-200 text-sm">
              تنظيف البيانات سيحذف الكاش القديم والبيانات المؤقتة. هذا لا يؤثر على البيانات الأساسية.
            </p>
          </div>

          <button
            onClick={handleCleanup}
            disabled={loading}
            className="bg-red-500 bg-opacity-20 text-red-300 px-6 py-3 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            تنظيف البيانات
          </button>
        </div>
      )}
    </div>
  );
};

export default DataManager;
