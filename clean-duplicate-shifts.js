/**
 * سكريبت تنظيف الورديات المكررة
 * يزيل الورديات التي لها نفس المعرف
 */

console.log('🧹 بدء تنظيف الورديات المكررة...');

try {
    // تحميل الورديات من localStorage
    const shifts = JSON.parse(localStorage.getItem('shifts') || '[]');
    console.log(`📊 العدد الأصلي للورديات: ${shifts.length}`);
    
    // إزالة الورديات المكررة بناءً على المعرف
    const uniqueShifts = shifts.filter((shift, index, self) => 
        index === self.findIndex(s => s.id === shift.id)
    );
    
    console.log(`📊 العدد بعد التنظيف: ${uniqueShifts.length}`);
    
    if (uniqueShifts.length !== shifts.length) {
        const removedCount = shifts.length - uniqueShifts.length;
        console.log(`🗑️ تم إزالة ${removedCount} وردية مكررة`);
        
        // حفظ الورديات المنظفة
        localStorage.setItem('shifts', JSON.stringify(uniqueShifts));
        console.log('✅ تم حفظ الورديات المنظفة');
        
        // عرض تفاصيل الورديات المكررة التي تم حذفها
        const duplicateIds = shifts
            .filter((shift, index, self) => 
                index !== self.findIndex(s => s.id === shift.id)
            )
            .map(shift => shift.id);
        
        if (duplicateIds.length > 0) {
            console.log('🔍 الورديات المكررة التي تم حذفها:', duplicateIds);
        }
    } else {
        console.log('✅ لا توجد ورديات مكررة');
    }
    
    // التحقق من الوردية النشطة
    const activeShift = localStorage.getItem('activeShift');
    if (activeShift) {
        try {
            const activeShiftData = JSON.parse(activeShift);
            console.log('🔍 الوردية النشطة:', activeShiftData.id, 'الحالة:', activeShiftData.status);
            
            // التحقق من وجود الوردية النشطة في قائمة الورديات
            const activeShiftExists = uniqueShifts.some(shift => shift.id === activeShiftData.id);
            if (!activeShiftExists && activeShiftData.status === 'completed') {
                console.log('⚠️ الوردية النشطة مكتملة ولكنها غير موجودة في قائمة الورديات');
            }
        } catch (error) {
            console.log('❌ خطأ في تحليل الوردية النشطة:', error);
        }
    } else {
        console.log('ℹ️ لا توجد وردية نشطة');
    }
    
    console.log('✅ انتهى تنظيف الورديات المكررة');
    
} catch (error) {
    console.error('❌ خطأ أثناء تنظيف الورديات المكررة:', error);
}

