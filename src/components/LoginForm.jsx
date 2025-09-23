import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Key
} from 'lucide-react';

const LoginForm = () => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.password) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      setSuccess('تم تسجيل الدخول بنجاح!');
      // سيتم إعادة التوجيه تلقائياً
    } else {
      setError(result.error || 'فشل في تسجيل الدخول');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // مسح الأخطاء عند البدء في الكتابة
    if (error) setError('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-3 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-3 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-40 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-3 animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card hover-lift animate-fadeInUp p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-custom">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-blue-300 bg-clip-text text-transparent">
              تسجيل الدخول
            </h1>
            <p className="text-purple-200 text-sm">
              نظام إدارة متجر الأزياء الرجالية
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg animate-fadeInDown">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-300 mr-2" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30 rounded-lg animate-fadeInDown">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                <span className="text-green-300 text-sm">{success}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="relative">
              <User className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="input-modern w-full pr-12 pl-4 py-4 text-right font-medium"
                placeholder="اسم المستخدم"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-modern w-full pr-12 pl-12 py-4 text-right font-medium"
                placeholder="كلمة المرور"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <Key className="h-5 w-5 mr-2" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-lg">
            <h3 className="text-white font-semibold mb-3 text-center">حسابات تجريبية</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-200">مدير عام:</span>
                <span className="text-white font-mono">admin / admin123</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200">مدير:</span>
                <span className="text-white font-mono">manager / manager123</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200">كاشير:</span>
                <span className="text-white font-mono">cashier / cashier123</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-yellow-300 text-xs">
                جميع البيانات مشفرة ومحمية بأعلى معايير الأمان
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
