/**
 * سكريبت إعادة تعيين بيانات نقطة البيع
 * يزيل أي بيانات متبقية من الورديات المنتهية
 */

console.log('🧹 بدء إعادة تعيين بيانات نقطة البيع...');

// التحقق من وجود وردية نشطة
const activeShift = localStorage.getItem('activeShift');
if (activeShift) {
  try {
    const activeShiftData = JSON.parse(activeShift);
    if (activeShiftData.status === 'active') {
      console.log('✅ يوجد وردية نشطة، لا حاجة لإعادة التعيين:', activeShiftData);
    } else {
      console.log('❌ الوردية المحفوظة ليست نشطة، سيتم حذفها');
      localStorage.removeItem('activeShift');
    }
  } catch (error) {
    console.log('❌ خطأ في تحليل activeShift، سيتم حذفها:', error);
    localStorage.removeItem('activeShift');
  }
} else {
  console.log('ℹ️ لا توجد وردية نشطة محفوظة');
}

// التحقق من وجود بيانات متبقية في نقطة البيع
const cart = localStorage.getItem('cart');
const customerInfo = localStorage.getItem('customerInfo');
const paymentMethod = localStorage.getItem('paymentMethod');
const discounts = localStorage.getItem('discounts');
const downPayment = localStorage.getItem('downPayment');

let hasData = false;

if (cart && cart !== '[]') {
  console.log('🗑️ حذف بيانات السلة المتبقية:', cart);
  localStorage.removeItem('cart');
  hasData = true;
}

if (customerInfo && customerInfo !== '{"name":"","phone":""}') {
  console.log('🗑️ حذف بيانات العميل المتبقية:', customerInfo);
  localStorage.removeItem('customerInfo');
  hasData = true;
}

if (paymentMethod && paymentMethod !== 'cash') {
  console.log('🗑️ إعادة تعيين طريقة الدفع:', paymentMethod);
  localStorage.setItem('paymentMethod', 'cash');
  hasData = true;
}

if (discounts && discounts !== '{"percentage":"","fixed":"","type":"percentage"}') {
  console.log('🗑️ حذف بيانات الخصم المتبقية:', discounts);
  localStorage.removeItem('discounts');
  hasData = true;
}

if (downPayment && downPayment !== '{"enabled":false,"amount":""}') {
  console.log('🗑️ حذف بيانات العربون المتبقية:', downPayment);
  localStorage.removeItem('downPayment');
  hasData = true;
}

if (hasData) {
  console.log('✅ تم تنظيف البيانات المتبقية من نقطة البيع');
} else {
  console.log('ℹ️ لا توجد بيانات متبقية في نقطة البيع');
}

console.log('✅ انتهى تنظيف بيانات نقطة البيع');

