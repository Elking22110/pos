// أداة إصلاح الفواتير غير المكتملة
console.log('🔧 بدء إصلاح الفواتير...');

// تحميل الفواتير من localStorage
const sales = JSON.parse(localStorage.getItem('sales') || '[]');
console.log('📊 إجمالي الفواتير:', sales.length);

let fixedCount = 0;
let partialInvoices = 0;

// فحص وإصلاح كل فاتورة
sales.forEach((invoice, index) => {
    console.log(`\n🔍 فحص الفاتورة #${invoice.id}:`);
    console.log('- الإجمالي:', invoice.total);
    console.log('- طريقة الدفع:', invoice.paymentMethod);
    
    // فحص وجود عربون
    if (invoice.downPayment && invoice.downPayment.enabled) {
        console.log('- العربون:', invoice.downPayment.amount);
        console.log('- المتبقي المحفوظ:', invoice.downPayment.remaining);
        
        // حساب المبلغ المتبقي الصحيح
        const correctRemaining = invoice.total - invoice.downPayment.amount;
        console.log('- المتبقي الصحيح:', correctRemaining);
        
        // إصلاح المبلغ المتبقي إذا كان خطأ
        if (!invoice.downPayment.remaining || invoice.downPayment.remaining !== correctRemaining) {
            invoice.downPayment.remaining = correctRemaining;
            fixedCount++;
            console.log('✅ تم إصلاح الفاتورة');
        } else {
            console.log('✅ الفاتورة صحيحة');
        }
        
        partialInvoices++;
    } else {
        console.log('- فاتورة مكتملة الدفع');
    }
});

// حفظ البيانات المحدثة
if (fixedCount > 0) {
    localStorage.setItem('sales', JSON.stringify(sales));
    console.log(`\n🎉 تم إصلاح ${fixedCount} فاتورة!`);
} else {
    console.log('\n✅ جميع الفواتير صحيحة!');
}

console.log(`\n📊 الإحصائيات:`);
console.log('- إجمالي الفواتير:', sales.length);
console.log('- فواتير غير مكتملة:', partialInvoices);
console.log('- فواتير مكتملة:', sales.length - partialInvoices);
console.log('- فواتير تم إصلاحها:', fixedCount);

// عرض الفواتير غير المكتملة
const partialInvoicesList = sales.filter(invoice => 
    invoice.downPayment && 
    invoice.downPayment.enabled && 
    invoice.downPayment.remaining > 0
);

console.log('\n📋 الفواتير غير المكتملة:');
partialInvoicesList.forEach(invoice => {
    console.log(`- فاتورة #${invoice.id}: ${invoice.customer?.name || 'غير محدد'} - متبقي: ${invoice.downPayment.remaining} جنيه`);
});

console.log('\n✅ انتهى الإصلاح!');

