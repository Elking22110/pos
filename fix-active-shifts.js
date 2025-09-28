/**
 * سكريبت إصلاح الورديات النشطة الخاطئة
 * يزيل أي ورديات محفوظة كـ "نشطة" ولكنها في الواقع منتهية
 */

console.log('🔧 بدء إصلاح الورديات النشطة الخاطئة...');

try {
    // فحص الوردية النشطة في activeShift
    const activeShift = localStorage.getItem('activeShift');
    if (activeShift) {
        try {
            const activeShiftData = JSON.parse(activeShift);
            console.log('🔍 فحص الوردية النشطة:', activeShiftData.id, 'الحالة:', activeShiftData.status);
            
            // إذا كانت الوردية ليست نشطة، احذفها
            if (activeShiftData.status !== 'active') {
                console.log('❌ الوردية المحفوظة كـ "نشطة" ولكن حالتها:', activeShiftData.status);
                localStorage.removeItem('activeShift');
                console.log('🗑️ تم حذف الوردية النشطة الخاطئة');
            } else {
                console.log('✅ الوردية النشطة صحيحة');
            }
        } catch (error) {
            console.log('❌ خطأ في تحليل الوردية النشطة:', error);
            localStorage.removeItem('activeShift');
            console.log('🗑️ تم حذف الوردية النشطة التالفة');
        }
    } else {
        console.log('ℹ️ لا توجد وردية نشطة محفوظة');
    }
    
    // فحص الورديات في مصفوفة shifts
    const shifts = JSON.parse(localStorage.getItem('shifts') || '[]');
    console.log(`📊 فحص ${shifts.length} وردية في مصفوفة shifts`);
    
    let activeShiftsInArray = 0;
    let fixedShifts = 0;
    
    shifts.forEach((shift, index) => {
        if (shift.status === 'active') {
            activeShiftsInArray++;
            console.log(`⚠️ وردية نشطة في مصفوفة shifts: ${shift.id}`);
            
            // إذا كانت الوردية لها endTime، فهي منتهية فعلاً
            if (shift.endTime) {
                console.log(`🔧 إصلاح وردية منتهية محفوظة كـ "نشطة": ${shift.id}`);
                shifts[index].status = 'completed';
                fixedShifts++;
            }
        }
    });
    
    if (activeShiftsInArray > 0) {
        console.log(`📊 تم العثور على ${activeShiftsInArray} وردية نشطة في مصفوفة shifts`);
        if (fixedShifts > 0) {
            console.log(`🔧 تم إصلاح ${fixedShifts} وردية`);
            localStorage.setItem('shifts', JSON.stringify(shifts));
        }
    } else {
        console.log('✅ لا توجد ورديات نشطة في مصفوفة shifts');
    }
    
    // فحص قاعدة البيانات (إذا كانت متاحة)
    console.log('🔍 فحص قاعدة البيانات...');
    try {
        // محاولة الوصول لقاعدة البيانات
        if (typeof window !== 'undefined' && window.indexedDB) {
            console.log('✅ قاعدة البيانات متاحة للفحص');
        } else {
            console.log('ℹ️ قاعدة البيانات غير متاحة للفحص');
        }
    } catch (error) {
        console.log('ℹ️ لا يمكن فحص قاعدة البيانات:', error.message);
    }
    
    console.log('✅ انتهى إصلاح الورديات النشطة الخاطئة');
    
} catch (error) {
    console.error('❌ خطأ أثناء إصلاح الورديات النشطة:', error);
}

