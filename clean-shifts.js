/**
 * سكريبت تنظيف الورديات غير النشطة
 * يزيل أي ورديات غير نشطة من localStorage
 */

console.log('🧹 بدء تنظيف الورديات غير النشطة...');

// تنظيف activeShift إذا لم تكن نشطة
const activeShift = localStorage.getItem('activeShift');
if (activeShift) {
  try {
    const activeShiftData = JSON.parse(activeShift);
    if (activeShiftData.status !== 'active') {
      console.log('🗑️ حذف وردية غير نشطة من activeShift:', activeShiftData);
      localStorage.removeItem('activeShift');
    } else {
      console.log('✅ الوردية النشطة صحيحة:', activeShiftData);
    }
  } catch (error) {
    console.log('❌ خطأ في تحليل activeShift، سيتم حذفها:', error);
    localStorage.removeItem('activeShift');
  }
} else {
  console.log('ℹ️ لا توجد وردية نشطة محفوظة');
}

// تنظيف الورديات غير النشطة من مصفوفة shifts
const shifts = localStorage.getItem('shifts');
if (shifts) {
  try {
    const shiftsData = JSON.parse(shifts);
    const activeShifts = shiftsData.filter(shift => shift.status === 'active');
    
    if (activeShifts.length > 1) {
      console.log('⚠️ يوجد أكثر من وردية نشطة، سيتم الاحتفاظ بالأحدث فقط');
      const latestActiveShift = activeShifts.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
      const cleanedShifts = shiftsData.filter(shift => shift.status !== 'active' || shift.id === latestActiveShift.id);
      localStorage.setItem('shifts', JSON.stringify(cleanedShifts));
      console.log('✅ تم تنظيف الورديات المتعددة النشطة');
    } else if (activeShifts.length === 1) {
      console.log('✅ يوجد وردية نشطة واحدة فقط:', activeShifts[0]);
    } else {
      console.log('ℹ️ لا توجد ورديات نشطة في مصفوفة shifts');
    }
  } catch (error) {
    console.log('❌ خطأ في تحليل shifts:', error);
  }
} else {
  console.log('ℹ️ لا توجد ورديات محفوظة');
}

console.log('✅ انتهى تنظيف الورديات');

