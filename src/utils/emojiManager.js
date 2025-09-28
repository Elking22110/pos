/**
 * نظام إدارة الإيموجي للمنتجات - Elking Store
 * يحدد الإيموجي المناسب لكل نوع منتج
 */

class EmojiManager {
  constructor() {
    this.categoryEmojis = {
      // ملابس رجالية
      'قمصان': '👔',
      'تيشيرتات': '👕',
      'بنطلونات': '👖',
      'جاكيتات': '🧥',
      'كنزات': '🧥',
      'معاطف': '🧥',
      'بدلات': '👔',
      'سراويل': '👖',
      'شورتات': '🩳',
      'جينز': '👖',
      'قمصان رسمية': '👔',
      'قمصان كاجوال': '👕',
      
      // ملابس نسائية
      'فساتين': '👗',
      'بلوزات': '👚',
      'تنانير': '👗',
      'بنطلونات نسائية': '👖',
      'جاكيتات نسائية': '🧥',
      'كنزات نسائية': '🧥',
      'معاطف نسائية': '🧥',
      'قمصان نسائية': '👚',
      'تيشيرتات نسائية': '👕',
      'جينز نسائي': '👖',
      'شورتات نسائية': '🩳',
      
      // أحذية
      'أحذية رجالية': '👞',
      'أحذية نسائية': '👠',
      'صندل': '👡',
      'بوت': '👢',
      'حذاء رياضي': '👟',
      'نعال': '🩴',
      'أحذية رسمية': '👞',
      'أحذية كاجوال': '👟',
      'أحذية عالية': '👠',
      'أحذية مسطحة': '👡',
      'أحذية شتوية': '👢',
      'أحذية صيفية': '👡',
      
      // حقائب وإكسسوارات
      'حقائب يد': '👜',
      'حقائب ظهر': '🎒',
      'حقائب سفر': '🧳',
      'محافظ': '👛',
      'حزام': '🪢',
      'ساعة': '⌚',
      'نظارات': '🕶️',
      'قبعة': '👒',
      'وشاح': '🧣',
      'قفازات': '🧤',
      'حلق': '💍',
      'سوار': '💍',
      'قلادة': '💍',
      'خاتم': '💍',
      'سلسلة': '💍',
      
      // ملابس داخلية
      'ملابس داخلية': '🩲',
      'ملابس داخلية نسائية': '🩱',
      'بيجاما': '🩱',
      'نوم': '🩱',
      'جوارب': '🧦',
      'جوارب نسائية': '🧦',
      'جوارب رجالية': '🧦',
      
      // ملابس أطفال
      'ملابس أطفال': '👶',
      'أحذية أطفال': '👶',
      'حقائب أطفال': '👶',
      
      // ملابس رياضية
      'ملابس رياضية': '🏃‍♂️',
      'أحذية رياضية': '👟',
      'حقائب رياضية': '🎒',
      
      // إكسسوارات أخرى
      'إكسسوارات': '💍',
      'مجوهرات': '💍',
      'ساعات': '⌚',
      'نظارات شمسية': '🕶️',
      'قبعات': '👒',
      'وشاحات': '🧣',
      'قفازات': '🧤',
      
      // منتجات عامة
      'منتجات متنوعة': '🛍️',
      'عروض': '🎁',
      'جديد': '✨',
      'مخفض': '🏷️',
      'موسمي': '🌸',
      'صيفي': '☀️',
      'شتوي': '❄️',
      'ربيعي': '🌸',
      'خريفي': '🍂'
    };

    this.keywordEmojis = {
      // كلمات مفتاحية للملابس
      'قميص': '👔',
      'تيشيرت': '👕',
      'بنطلون': '👖',
      'جاكيت': '🧥',
      'كنزة': '🧥',
      'معطف': '🧥',
      'بدلة': '👔',
      'سروال': '👖',
      'شورت': '🩳',
      'جينز': '👖',
      'فستان': '👗',
      'بلوزة': '👚',
      'تنورة': '👗',
      
      // كلمات مفتاحية للأحذية
      'حذاء': '👞',
      'صندل': '👡',
      'بوت': '👢',
      'رياضي': '👟',
      'نعل': '🩴',
      'عالي': '👠',
      'مسطح': '👡',
      'شتوي': '👢',
      'صيفي': '👡',
      
      // كلمات مفتاحية للحقائب
      'حقيبة': '👜',
      'محفظة': '👛',
      'حزام': '🪢',
      'ساعة': '⌚',
      'نظارة': '🕶️',
      'قبعة': '👒',
      'وشاح': '🧣',
      'قفاز': '🧤',
      
      // كلمات مفتاحية للمجوهرات
      'حلق': '💍',
      'سوار': '💍',
      'قلادة': '💍',
      'خاتم': '💍',
      'سلسلة': '💍',
      'مجوهرات': '💍',
      'إكسسوار': '💍',
      
      // كلمات مفتاحية أخرى
      'ملابس': '👕',
      'أحذية': '👞',
      'حقائب': '👜',
      'إكسسوارات': '💍',
      'جديد': '✨',
      'مخفض': '🏷️',
      'عرض': '🎁',
      'موسمي': '🌸',
      'صيف': '☀️',
      'شتاء': '❄️',
      'ربيع': '🌸',
      'خريف': '🍂',
      'رياضة': '🏃‍♂️',
      'أطفال': '👶',
      'رجالي': '👔',
      'نسائي': '👗',
      'داخلي': '🩲',
      'نوم': '🩱',
      'جورب': '🧦'
    };

    this.defaultEmoji = '🛍️';
  }

  // الحصول على إيموجي للمنتج
  getProductEmoji(product) {
    if (!product) return this.defaultEmoji;

    const name = (product.name || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const description = (product.description || '').toLowerCase();

    // البحث في الفئات أولاً
    for (const [cat, emoji] of Object.entries(this.categoryEmojis)) {
      if (category.includes(cat.toLowerCase()) || name.includes(cat.toLowerCase())) {
        return emoji;
      }
    }

    // البحث في الكلمات المفتاحية
    for (const [keyword, emoji] of Object.entries(this.keywordEmojis)) {
      if (name.includes(keyword.toLowerCase()) || 
          description.includes(keyword.toLowerCase()) ||
          category.includes(keyword.toLowerCase())) {
        return emoji;
      }
    }

    // البحث في الاسم والوصف
    const searchText = `${name} ${description} ${category}`;
    
    // البحث عن كلمات محددة
    if (searchText.includes('قميص') || searchText.includes('shirt')) return '👔';
    if (searchText.includes('تيشيرت') || searchText.includes('t-shirt')) return '👕';
    if (searchText.includes('بنطلون') || searchText.includes('pants')) return '👖';
    if (searchText.includes('جاكيت') || searchText.includes('jacket')) return '🧥';
    if (searchText.includes('فستان') || searchText.includes('dress')) return '👗';
    if (searchText.includes('حذاء') || searchText.includes('shoe')) return '👞';
    if (searchText.includes('حقيبة') || searchText.includes('bag')) return '👜';
    if (searchText.includes('محفظة') || searchText.includes('wallet')) return '👛';
    if (searchText.includes('ساعة') || searchText.includes('watch')) return '⌚';
    if (searchText.includes('نظارة') || searchText.includes('glasses')) return '🕶️';
    if (searchText.includes('قبعة') || searchText.includes('hat')) return '👒';
    if (searchText.includes('وشاح') || searchText.includes('scarf')) return '🧣';
    if (searchText.includes('قفاز') || searchText.includes('glove')) return '🧤';
    if (searchText.includes('حلق') || searchText.includes('earring')) return '💍';
    if (searchText.includes('سوار') || searchText.includes('bracelet')) return '💍';
    if (searchText.includes('قلادة') || searchText.includes('necklace')) return '💍';
    if (searchText.includes('خاتم') || searchText.includes('ring')) return '💍';
    if (searchText.includes('جورب') || searchText.includes('sock')) return '🧦';
    if (searchText.includes('صندل') || searchText.includes('sandal')) return '👡';
    if (searchText.includes('بوت') || searchText.includes('boot')) return '👢';
    if (searchText.includes('رياضي') || searchText.includes('sport')) return '👟';
    if (searchText.includes('عالي') || searchText.includes('heel')) return '👠';
    if (searchText.includes('مسطح') || searchText.includes('flat')) return '👡';
    if (searchText.includes('نعل') || searchText.includes('slipper')) return '🩴';
    if (searchText.includes('حزام') || searchText.includes('belt')) return '🪢';
    if (searchText.includes('ملابس داخلية') || searchText.includes('underwear')) return '🩲';
    if (searchText.includes('بيجاما') || searchText.includes('pajama')) return '🩱';
    if (searchText.includes('نوم') || searchText.includes('sleep')) return '🩱';
    if (searchText.includes('أطفال') || searchText.includes('kids')) return '👶';
    if (searchText.includes('رياضة') || searchText.includes('sport')) return '🏃‍♂️';
    if (searchText.includes('جديد') || searchText.includes('new')) return '✨';
    if (searchText.includes('مخفض') || searchText.includes('sale')) return '🏷️';
    if (searchText.includes('عرض') || searchText.includes('offer')) return '🎁';
    if (searchText.includes('صيف') || searchText.includes('summer')) return '☀️';
    if (searchText.includes('شتاء') || searchText.includes('winter')) return '❄️';
    if (searchText.includes('ربيع') || searchText.includes('spring')) return '🌸';
    if (searchText.includes('خريف') || searchText.includes('autumn')) return '🍂';

    // إيموجي افتراضي
    return this.defaultEmoji;
  }

  // الحصول على إيموجي للفئة
  getCategoryEmoji(category) {
    if (!category) return this.defaultEmoji;

    const categoryLower = category.toLowerCase();
    
    for (const [cat, emoji] of Object.entries(this.categoryEmojis)) {
      if (categoryLower.includes(cat.toLowerCase())) {
        return emoji;
      }
    }

    return this.defaultEmoji;
  }

  // الحصول على جميع الإيموجي المتاحة
  getAllEmojis() {
    return {
      categories: this.categoryEmojis,
      keywords: this.keywordEmojis,
      default: this.defaultEmoji
    };
  }

  // إضافة إيموجي مخصص
  addCustomEmoji(keyword, emoji) {
    this.keywordEmojis[keyword.toLowerCase()] = emoji;
  }

  // إضافة فئة مخصصة
  addCustomCategory(category, emoji) {
    this.categoryEmojis[category.toLowerCase()] = emoji;
  }

  // الحصول على إيموجي عشوائي للعروض
  getRandomOfferEmoji() {
    const offerEmojis = ['🎁', '✨', '🏷️', '💎', '🌟', '🎉', '🎊', '💫'];
    return offerEmojis[Math.floor(Math.random() * offerEmojis.length)];
  }

  // الحصول على إيموجي حسب الموسم
  getSeasonalEmoji() {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) { // ربيع
      return '🌸';
    } else if (month >= 5 && month <= 7) { // صيف
      return '☀️';
    } else if (month >= 8 && month <= 10) { // خريف
      return '🍂';
    } else { // شتاء
      return '❄️';
    }
  }
}

// إنشاء مثيل واحد من مدير الإيموجي
const emojiManager = new EmojiManager();

export default emojiManager;

