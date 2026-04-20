export type ProductCategory = 'electronics' | 'appliances' | 'telecom' | 'smart_home' | 'accessories';
export interface Product {
  id: string;
  name: string;
  nameAr: string;
  brand: string;
  brandAr: string;
  model: string;
  sku: string;
  description: string;
  descriptionAr: string;
  price: number;
  originalPrice: number;
  image: string;
  category: ProductCategory;
  categoryAr: string;
  rating: number;
  reviews: number;
  specs: string[];
  specsAr: string[];
  useCases: string[];
  useCasesAr: string[];
  warranty: string;
  warrantyAr: string;
  leadTime: string;
  leadTimeAr: string;
  badge?: string;
  badgeAr?: string;
  inStock: boolean;
  stockCount: number;
}

export const products: Product[] = [
  {
    "id": "samsung-samsung-55-4k-smart-tv-1",
    "name": "Samsung 55\" 4K Smart TV",
    "nameAr": "تلفاز سامسونج 55 بوصة 4K ذكي",
    "brand": "Samsung",
    "brandAr": "سامسونج",
    "model": "Televisions",
    "sku": "PRM-SAM-001",
    "description": "Premium 4K Smart TV with HDR, Quantum Processor, and voice control. Perfect for modern homes with exceptional picture quality.",
    "descriptionAr": "تلفاز 4K ذكي متميز مع تقنية HDR ومعالج كوانتم والتحكم الصوتي. مثالي للمنازل الحديثة.",
    "price": 2299,
    "originalPrice": 2799,
    "image": "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 234,
    "specs": [
      "Size: 55 inch",
      "Resolution: 4K UHD",
      "Refresh Rate: 120Hz",
      "Hdr: HDR10+, Dolby Vision"
    ],
    "specsAr": [
      "المقاس: 55 inch",
      "الدقة: 4K UHD",
      "معدل التحديث: 120Hz",
      "HDR: HDR10+, Dolby Vision"
    ],
    "useCases": [
      "Televisions",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "تلفزيونات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 15
  },
  {
    "id": "lg-lg-65-oled-tv-4k-2",
    "name": "LG 65\" OLED TV 4K",
    "nameAr": "تلفاز إل جي 65 بوصة OLED 4K",
    "brand": "LG",
    "brandAr": "إل جي",
    "model": "Televisions",
    "sku": "PRM-LG-002",
    "description": "Premium OLED technology with perfect blacks and vibrant colors. Next-level viewing experience.",
    "descriptionAr": "تكنولوجيا OLED فائقة مع ألوان حية وسود كاملة. تجربة مشاهدة من الدرجة الأولى.",
    "price": 3499,
    "originalPrice": 4199,
    "image": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.9,
    "reviews": 156,
    "specs": [
      "Size: 65 inch",
      "Resolution: 4K UHD",
      "Technology: OLED",
      "Brightness: Excellent"
    ],
    "specsAr": [
      "المقاس: 65 inch",
      "الدقة: 4K UHD",
      "التقنية: OLED",
      "السطوع: Excellent"
    ],
    "useCases": [
      "Televisions",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "تلفزيونات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "3 Years",
    "warrantyAr": "ضمان ثلاث سنوات",
    "leadTime": "Available in 2–5 business days",
    "leadTimeAr": "متاح خلال 2–5 أيام عمل",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 8
  },
  {
    "id": "sony-sony-bravia-55-4k-3",
    "name": "Sony Bravia 55\" 4K",
    "nameAr": "تلفاز سوني بريفيا 55 بوصة 4K",
    "brand": "Sony",
    "brandAr": "سوني",
    "model": "Televisions",
    "sku": "PRM-SON-003",
    "description": "Sony Bravia with exceptional color accuracy and processing. Great for gaming and movies.",
    "descriptionAr": "سوني بريفيا بدقة ألوان استثنائية. رائع للألعاب والأفلام.",
    "price": 2599,
    "originalPrice": 3199,
    "image": "https://images.unsplash.com/photo-1618514886286-5e796dd8c1d0?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.7,
    "reviews": 189,
    "specs": [
      "Televisions",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "تلفزيونات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Televisions",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "تلفزيونات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 12
  },
  {
    "id": "apple-apple-iphone-15-pro-max-256gb-4",
    "name": "Apple iPhone 15 Pro Max 256GB",
    "nameAr": "آبل آيفون 15 برو ماكس 256GB",
    "brand": "Apple",
    "brandAr": "أبل",
    "model": "Smartphones",
    "sku": "PRM-APP-004",
    "description": "Latest iPhone with A17 Pro chip, advanced camera system, and titanium design.",
    "descriptionAr": "أحدث آيفون مع معالج A17 Pro وكاميرا متقدمة وتصميم من التيتانيوم.",
    "price": 3199,
    "originalPrice": 3499,
    "image": "https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.9,
    "reviews": 512,
    "specs": [
      "Smartphones",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "هواتف ذكية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Smartphones",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "هواتف ذكية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 25
  },
  {
    "id": "samsung-samsung-galaxy-s24-ultra-5",
    "name": "Samsung Galaxy S24 Ultra",
    "nameAr": "سامسونج جالاكسي S24 ألترا",
    "brand": "Samsung",
    "brandAr": "سامسونج",
    "model": "Smartphones",
    "sku": "PRM-SAM-005",
    "description": "Flagship Android phone with stunning display, powerful processor, and amazing camera.",
    "descriptionAr": "هاتف أندرويد رائد مع شاشة مذهلة ومعالج قوي وكاميرا رائعة.",
    "price": 2799,
    "originalPrice": 3299,
    "image": "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 421,
    "specs": [
      "Smartphones",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "هواتف ذكية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Smartphones",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "هواتف ذكية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 20
  },
  {
    "id": "google-google-pixel-8-pro-6",
    "name": "Google Pixel 8 Pro",
    "nameAr": "جوجل بيكسل 8 برو",
    "brand": "Google",
    "brandAr": "جوجل",
    "model": "Smartphones",
    "sku": "PRM-GOO-006",
    "description": "Google Pixel with best-in-class AI features and computational photography.",
    "descriptionAr": "جوجل بيكسل مع أفضل ميزات الذكاء الاصطناعي والتصوير الحسابي.",
    "price": 1999,
    "originalPrice": 2299,
    "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.7,
    "reviews": 298,
    "specs": [
      "Smartphones",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "هواتف ذكية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Smartphones",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "هواتف ذكية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 18
  },
  {
    "id": "apple-apple-macbook-pro-16-m3-max-7",
    "name": "Apple MacBook Pro 16\" M3 Max",
    "nameAr": "آبل ماك بوك برو 16 بوصة M3 Max",
    "brand": "Apple",
    "brandAr": "أبل",
    "model": "Laptops",
    "sku": "PRM-APP-007",
    "description": "Professional laptop with M3 Max chip, 16\" Liquid Retina display, and exceptional performance.",
    "descriptionAr": "حاسوب احترافي مع معالج M3 Max وشاشة Liquid Retina 16 بوصة.",
    "price": 3999,
    "originalPrice": 4499,
    "image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.9,
    "reviews": 245,
    "specs": [
      "Laptops",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "حواسيب محمولة",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Laptops",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "حواسيب محمولة",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 10
  },
  {
    "id": "dell-dell-xps-15-i7-rtx-4060-8",
    "name": "Dell XPS 15 i7 RTX 4060",
    "nameAr": "ديل XPS 15 i7 RTX 4060",
    "brand": "Dell",
    "brandAr": "ديل",
    "model": "Laptops",
    "sku": "PRM-DEL-008",
    "description": "Premium Windows laptop with RTX 4060, perfect for creative professionals.",
    "descriptionAr": "حاسوب Windows فاخر مع RTX 4060، مثالي للمحترفين.",
    "price": 2299,
    "originalPrice": 2799,
    "image": "https://images.unsplash.com/photo-1588872657840-4eae48a75f9b?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 187,
    "specs": [
      "Laptops",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "حواسيب محمولة",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Laptops",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "حواسيب محمولة",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 12
  },
  {
    "id": "lenovo-lenovo-thinkpad-x1-carbon-9",
    "name": "Lenovo ThinkPad X1 Carbon",
    "nameAr": "لينوفو ثينك باد X1 كاربون",
    "brand": "Lenovo",
    "brandAr": "لينوفو",
    "model": "Laptops",
    "sku": "PRM-LEN-009",
    "description": "Business ultrabook with premium build, great keyboard, and long battery life.",
    "descriptionAr": "حاسوب عمل خفيف الوزن بتصميم فاخر وبطارية طويلة الأمد.",
    "price": 1899,
    "originalPrice": 2299,
    "image": "https://images.unsplash.com/photo-1595225476933-918a6cf47db3?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.7,
    "reviews": 156,
    "specs": [
      "Laptops",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "حواسيب محمولة",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Laptops",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "حواسيب محمولة",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 15
  },
  {
    "id": "apple-apple-ipad-pro-12-9-m2-10",
    "name": "Apple iPad Pro 12.9\" M2",
    "nameAr": "آبل آيباد برو 12.9 بوصة M2",
    "brand": "Apple",
    "brandAr": "أبل",
    "model": "Tablets",
    "sku": "PRM-APP-010",
    "description": "Powerful tablet with M2 chip, stunning Liquid Retina XDR display, and Apple Pencil support.",
    "descriptionAr": "جهاز لوحي قوي مع معالج M2 وشاشة Liquid Retina XDR.",
    "price": 2299,
    "originalPrice": 2699,
    "image": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.9,
    "reviews": 234,
    "specs": [
      "Tablets",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "أجهزة لوحية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Tablets",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "أجهزة لوحية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 18
  },
  {
    "id": "samsung-samsung-galaxy-tab-s9-ultra-11",
    "name": "Samsung Galaxy Tab S9 Ultra",
    "nameAr": "سامسونج جالاكسي تاب S9 ألترا",
    "brand": "Samsung",
    "brandAr": "سامسونج",
    "model": "Tablets",
    "sku": "PRM-SAM-011",
    "description": "Android tablet with 14.6\" display, S Pen included, and excellent performance.",
    "descriptionAr": "جهاز لوحي أندرويد مع شاشة 14.6 بوصة وقلم S Pen.",
    "price": 1899,
    "originalPrice": 2299,
    "image": "https://images.unsplash.com/photo-1585790050230-9f280e2e7f35?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 178,
    "specs": [
      "Tablets",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "أجهزة لوحية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Tablets",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "أجهزة لوحية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 14
  },
  {
    "id": "sony-sony-wh-1000xm5-headphones-12",
    "name": "Sony WH-1000XM5 Headphones",
    "nameAr": "سوني WH-1000XM5 سماعات رأس",
    "brand": "Sony",
    "brandAr": "سوني",
    "model": "Audio",
    "sku": "PRM-SON-012",
    "description": "Premium noise-canceling headphones with exceptional sound quality and comfort.",
    "descriptionAr": "سماعات رأس فاخرة بإلغاء الضوضاء واستثنائية الجودة.",
    "price": 399,
    "originalPrice": 499,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.9,
    "reviews": 567,
    "specs": [
      "Audio",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "صوتيات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Audio",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "صوتيات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 35
  },
  {
    "id": "apple-apple-airpods-pro-2-13",
    "name": "Apple AirPods Pro 2",
    "nameAr": "آبل إيربودز برو 2",
    "brand": "Apple",
    "brandAr": "أبل",
    "model": "Audio",
    "sku": "PRM-APP-013",
    "description": "Wireless earbuds with active noise cancellation and spatial audio.",
    "descriptionAr": "سماعات لاسلكية مع إلغاء الضوضاء والصوت المكاني.",
    "price": 279,
    "originalPrice": 329,
    "image": "https://images.unsplash.com/photo-1606841836720-b91ffe398d5d?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 423,
    "specs": [
      "Audio",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "صوتيات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Audio",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "صوتيات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 40
  },
  {
    "id": "bose-bose-quietcomfort-45-14",
    "name": "Bose QuietComfort 45",
    "nameAr": "بوز كويت كومفورت 45",
    "brand": "Bose",
    "brandAr": "بوز",
    "model": "Audio",
    "sku": "PRM-BOS-014",
    "description": "Comfort-focused headphones with best-in-class noise cancellation.",
    "descriptionAr": "سماعات موجهة للراحة مع أفضل إلغاء ضوضاء.",
    "price": 349,
    "originalPrice": 429,
    "image": "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.7,
    "reviews": 289,
    "specs": [
      "Audio",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "صوتيات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Audio",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "صوتيات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 22
  },
  {
    "id": "jbl-jbl-charge-5-bluetooth-speaker-15",
    "name": "JBL Charge 5 Bluetooth Speaker",
    "nameAr": "جي بي إل تشارج 5 سماعة بلوتوث",
    "brand": "JBL",
    "brandAr": "جي بي إل",
    "model": "Audio",
    "sku": "PRM-JBL-015",
    "description": "Portable Bluetooth speaker with powerful bass and long battery life.",
    "descriptionAr": "سماعة بلوتوث محمولة بباص قوي وبطارية طويلة الأمد.",
    "price": 179,
    "originalPrice": 219,
    "image": "https://images.unsplash.com/photo-1589003077984-894fdbb6d1b6?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.6,
    "reviews": 178,
    "specs": [
      "Audio",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "صوتيات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Audio",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "صوتيات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 28
  },
  {
    "id": "canon-canon-eos-r6-mirrorless-camera-16",
    "name": "Canon EOS R6 Mirrorless Camera",
    "nameAr": "كانون EOS R6 كاميرا بدون مرآة",
    "brand": "Canon",
    "brandAr": "كانون",
    "model": "Cameras",
    "sku": "PRM-CAN-016",
    "description": "Professional mirrorless camera with 20MP sensor and excellent 4K video.",
    "descriptionAr": "كاميرا احترافية بدون مرآة مع مستشعر 20MP وفيديو 4K رائع.",
    "price": 2699,
    "originalPrice": 3299,
    "image": "https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 134,
    "specs": [
      "Cameras",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "كاميرات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Cameras",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "كاميرات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Available in 2–5 business days",
    "leadTimeAr": "متاح خلال 2–5 أيام عمل",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 6
  },
  {
    "id": "sony-sony-a7iv-full-frame-17",
    "name": "Sony a7IV Full Frame",
    "nameAr": "سوني A7IV كامل الإطار",
    "brand": "Sony",
    "brandAr": "سوني",
    "model": "Cameras",
    "sku": "PRM-SON-017",
    "description": "Full-frame mirrorless camera with 61MP sensor and outstanding autofocus.",
    "descriptionAr": "كاميرا بدون مرآة كاملة الإطار مع مستشعر 61MP.",
    "price": 2499,
    "originalPrice": 2999,
    "image": "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.9,
    "reviews": 156,
    "specs": [
      "Cameras",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "كاميرات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Cameras",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "كاميرات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Available in 2–5 business days",
    "leadTimeAr": "متاح خلال 2–5 أيام عمل",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 8
  },
  {
    "id": "gopro-gopro-hero-12-18",
    "name": "GoPro Hero 12",
    "nameAr": "جو برو هيرو 12",
    "brand": "GoPro",
    "brandAr": "جو برو",
    "model": "Cameras",
    "sku": "PRM-GOP-018",
    "description": "Action camera with 4K60 video and waterproof design.",
    "descriptionAr": "كاميرا حركة مع فيديو 4K60 وتصميم مقاوم للماء.",
    "price": 499,
    "originalPrice": 599,
    "image": "https://images.unsplash.com/photo-1615626589141-b5d4b6c5f1c9?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.7,
    "reviews": 267,
    "specs": [
      "Cameras",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "كاميرات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Cameras",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "كاميرات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 20
  },
  {
    "id": "lg-lg-inverter-ac-2-0-ton-19",
    "name": "LG Inverter AC 2.0 Ton",
    "nameAr": "مكيف إل جي إنفرتر 2 طن",
    "brand": "LG",
    "brandAr": "إل جي",
    "model": "Air Conditioning",
    "sku": "PRM-LG-019",
    "description": "Energy-efficient air conditioner with inverter technology and smart controls.",
    "descriptionAr": "مكيف هواء موفر للطاقة مع تقنية إنفرتر والتحكم الذكي.",
    "price": 1899,
    "originalPrice": 2399,
    "image": "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.7,
    "reviews": 213,
    "specs": [
      "Air Conditioning",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "تكييف",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Air Conditioning",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "تكييف",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "3 Years",
    "warrantyAr": "ضمان ثلاث سنوات",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 22
  },
  {
    "id": "daikin-daikin-split-ac-1-5-ton-inverter-20",
    "name": "Daikin Split AC 1.5 Ton Inverter",
    "nameAr": "مكيف دايكن انقسام 1.5 طن إنفرتر",
    "brand": "Daikin",
    "brandAr": "دايكن",
    "model": "Air Conditioning",
    "sku": "PRM-DAI-020",
    "description": "Japanese technology AC with quiet operation and excellent cooling.",
    "descriptionAr": "مكيف بتكنولوجيا يابانية بتشغيل هادئ وتبريد ممتاز.",
    "price": 1199,
    "originalPrice": 1599,
    "image": "https://images.unsplash.com/photo-1615760988477-5ebb9edc5ef3?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.8,
    "reviews": 178,
    "specs": [
      "Air Conditioning",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "تكييف",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Air Conditioning",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "تكييف",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "3 Years",
    "warrantyAr": "ضمان ثلاث سنوات",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 25
  },
  {
    "id": "samsung-samsung-refrigerator-670l-side-by-side-21",
    "name": "Samsung Refrigerator 670L Side by Side",
    "nameAr": "ثلاجة سامسونج 670 لتر جنب لجنب",
    "brand": "Samsung",
    "brandAr": "سامسونج",
    "model": "Refrigerators",
    "sku": "PRM-SAM-021",
    "description": "Modern refrigerator with smart features, ice maker, and excellent storage.",
    "descriptionAr": "ثلاجة حديثة بميزات ذكية وصانع ثلج وتخزين ممتاز.",
    "price": 2199,
    "originalPrice": 2699,
    "image": "https://images.unsplash.com/photo-1584568694244-92ccdf39b62e?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.7,
    "reviews": 145,
    "specs": [
      "Refrigerators",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "ثلاجات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Refrigerators",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "ثلاجات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Available in 2–5 business days",
    "leadTimeAr": "متاح خلال 2–5 أيام عمل",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 8
  },
  {
    "id": "bosch-bosch-front-load-washing-machine-8kg-22",
    "name": "Bosch Front Load Washing Machine 8kg",
    "nameAr": "غسالة بوش أمامية 8 كيلو",
    "brand": "Bosch",
    "brandAr": "بوش",
    "model": "Washing Machines",
    "sku": "PRM-BOS-022",
    "description": "German engineering washing machine with EcoSilence drive.",
    "descriptionAr": "غسالة هندسة ألمانية مع محرك EcoSilence.",
    "price": 1499,
    "originalPrice": 1899,
    "image": "https://images.unsplash.com/photo-1584622181563-e7b9919cf509?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.8,
    "reviews": 189,
    "specs": [
      "Washing Machines",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "غسالات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Washing Machines",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "غسالات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 12
  },
  {
    "id": "lg-lg-top-load-washing-machine-10kg-23",
    "name": "LG Top Load Washing Machine 10kg",
    "nameAr": "غسالة إل جي علوية 10 كيلو",
    "brand": "LG",
    "brandAr": "إل جي",
    "model": "Washing Machines",
    "sku": "PRM-LG-023",
    "description": "Reliable top-load washer with multiple wash programs.",
    "descriptionAr": "غسالة علوية موثوقة مع برامج غسيل متعددة.",
    "price": 899,
    "originalPrice": 1199,
    "image": "https://images.unsplash.com/photo-1583849212688-d0236dc8a050?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.6,
    "reviews": 112,
    "specs": [
      "Washing Machines",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "غسالات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Washing Machines",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "غسالات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 16
  },
  {
    "id": "philips-philips-rice-cooker-1-8l-24",
    "name": "Philips Rice Cooker 1.8L",
    "nameAr": "جهاز طهي الأرز فيليبس 1.8 لتر",
    "brand": "Philips",
    "brandAr": "فيليبس",
    "model": "Kitchen",
    "sku": "PRM-PHI-024",
    "description": "Smart rice cooker with keep-warm function and easy operation.",
    "descriptionAr": "جهاز طهي أرز ذكي مع وظيفة الحفاظ على الدفء.",
    "price": 149,
    "originalPrice": 199,
    "image": "https://images.unsplash.com/photo-1574080556435-10d37e71d6b1?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.5,
    "reviews": 89,
    "specs": [
      "Kitchen",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "kitchen",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Kitchen",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "kitchen",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 35
  },
  {
    "id": "breville-breville-microwave-oven-25",
    "name": "Breville Microwave Oven",
    "nameAr": "فرن الميكروويف برفيل",
    "brand": "Breville",
    "brandAr": "بريفيل",
    "model": "Kitchen",
    "sku": "PRM-BRE-025",
    "description": "Premium microwave oven with convection and multiple cooking modes.",
    "descriptionAr": "فرن ميكروويف فاخر مع وضع الحمل الهواء.",
    "price": 449,
    "originalPrice": 599,
    "image": "https://images.unsplash.com/photo-1584568694244-92ccdf39b62e?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.7,
    "reviews": 134,
    "specs": [
      "Kitchen",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "kitchen",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Kitchen",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "kitchen",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 14
  },
  {
    "id": "dyson-dyson-v15-detect-vacuum-26",
    "name": "Dyson V15 Detect Vacuum",
    "nameAr": "مكنسة ديسون V15 ديتيكت",
    "brand": "Dyson",
    "brandAr": "دايسون",
    "model": "Cleaning",
    "sku": "PRM-DYS-026",
    "description": "Cordless vacuum with laser dust detection and strong suction.",
    "descriptionAr": "مكنسة بدون سلك مع كشف الغبار بالليزر وشفط قوي.",
    "price": 749,
    "originalPrice": 899,
    "image": "https://images.unsplash.com/photo-1583291214556-19a1f98c4770?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.9,
    "reviews": 267,
    "specs": [
      "Cleaning",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "تنظيف",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Cleaning",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "تنظيف",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Available in 2–5 business days",
    "leadTimeAr": "متاح خلال 2–5 أيام عمل",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 9
  },
  {
    "id": "shark-shark-robot-vacuum-27",
    "name": "Shark Robot Vacuum",
    "nameAr": "مكنسة روبوت شارك",
    "brand": "Shark",
    "brandAr": "شارك",
    "model": "Cleaning",
    "sku": "PRM-SHA-027",
    "description": "Smart robot vacuum with app control and auto-scheduling.",
    "descriptionAr": "مكنسة روبوت ذكية مع التحكم بالتطبيق والجدولة التلقائية.",
    "price": 399,
    "originalPrice": 499,
    "image": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=800&fit=crop",
    "category": "appliances",
    "categoryAr": "الأجهزة المنزلية",
    "rating": 4.6,
    "reviews": 198,
    "specs": [
      "Cleaning",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "تنظيف",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Cleaning",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "تنظيف",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Home",
    "badgeAr": "منزلي",
    "inStock": true,
    "stockCount": 18
  },
  {
    "id": "tp-link-tp-link-wifi-6-router-ax3000-28",
    "name": "TP-Link WiFi 6 Router AX3000",
    "nameAr": "جهاز توجيه TP-Link WiFi 6 AX3000",
    "brand": "TP-Link",
    "brandAr": "تي بي لينك",
    "model": "Routers",
    "sku": "PRM-TP--028",
    "description": "Fast WiFi 6 router with excellent range and reliability.",
    "descriptionAr": "جهاز توجيه WiFi 6 سريع مع نطاق ممتاز وموثوقية.",
    "price": 399,
    "originalPrice": 549,
    "image": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&h=800&fit=crop",
    "category": "telecom",
    "categoryAr": "الاتصالات",
    "rating": 4.7,
    "reviews": 234,
    "specs": [
      "Routers",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "routers",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Routers",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "routers",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Business",
    "badgeAr": "أعمال",
    "inStock": true,
    "stockCount": 28
  },
  {
    "id": "cisco-cisco-catalyst-2960-switch-29",
    "name": "Cisco Catalyst 2960 Switch",
    "nameAr": "محول سيسكو كاتاليست 2960",
    "brand": "Cisco",
    "brandAr": "سيسكو",
    "model": "Switches",
    "sku": "PRM-CIS-029",
    "description": "Enterprise network switch with VLAN support and management.",
    "descriptionAr": "محول شبكة مؤسسي مع دعم VLAN والإدارة.",
    "price": 899,
    "originalPrice": 1199,
    "image": "https://images.unsplash.com/photo-1558100017-b8a74f55c1e5?w=800&h=800&fit=crop",
    "category": "telecom",
    "categoryAr": "الاتصالات",
    "rating": 4.8,
    "reviews": 67,
    "specs": [
      "Switches",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "switches",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Switches",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "switches",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "3 Years",
    "warrantyAr": "ضمان ثلاث سنوات",
    "leadTime": "Available in 2–5 business days",
    "leadTimeAr": "متاح خلال 2–5 أيام عمل",
    "badge": "Business",
    "badgeAr": "أعمال",
    "inStock": true,
    "stockCount": 4
  },
  {
    "id": "netgear-netgear-nighthawk-wifi-6-pro-30",
    "name": "Netgear Nighthawk WiFi 6 Pro",
    "nameAr": "نيتجير نايت هوك WiFi 6 برو",
    "brand": "Netgear",
    "brandAr": "نتجير",
    "model": "Routers",
    "sku": "PRM-NET-030",
    "description": "Premium WiFi 6 router with tri-band and gaming optimization.",
    "descriptionAr": "جهاز توجيه WiFi 6 فاخر مع ثلاث نطاقات وتحسين الألعاب.",
    "price": 599,
    "originalPrice": 799,
    "image": "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=800&fit=crop",
    "category": "telecom",
    "categoryAr": "الاتصالات",
    "rating": 4.8,
    "reviews": 145,
    "specs": [
      "Routers",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "routers",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Routers",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "routers",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Business",
    "badgeAr": "أعمال",
    "inStock": true,
    "stockCount": 12
  },
  {
    "id": "ubiquiti-ubiquiti-unifi-access-point-31",
    "name": "Ubiquiti UniFi Access Point",
    "nameAr": "نقطة وصول يوبيكويتي يوني فاي",
    "brand": "Ubiquiti",
    "brandAr": "يوبيكويتي",
    "model": "Access Points",
    "sku": "PRM-UBI-031",
    "description": "Professional access point for enterprise environments.",
    "descriptionAr": "نقطة وصول احترافية للبيئات المؤسسية.",
    "price": 279,
    "originalPrice": 349,
    "image": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=800&fit=crop",
    "category": "telecom",
    "categoryAr": "الاتصالات",
    "rating": 4.7,
    "reviews": 98,
    "specs": [
      "Access Points",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "access points",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Access Points",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "access points",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Business",
    "badgeAr": "أعمال",
    "inStock": true,
    "stockCount": 15
  },
  {
    "id": "amazon-amazon-echo-dot-5th-gen-32",
    "name": "Amazon Echo Dot 5th Gen",
    "nameAr": "أمازون إيكو دوت الجيل الخامس",
    "brand": "Amazon",
    "brandAr": "أمازون",
    "model": "Smart Speakers",
    "sku": "PRM-AMA-032",
    "description": "Compact smart speaker with Alexa and excellent sound.",
    "descriptionAr": "سماعة ذكية مدمجة مع أليكسا وصوت ممتاز.",
    "price": 59,
    "originalPrice": 79,
    "image": "https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=800&h=800&fit=crop",
    "category": "smart_home",
    "categoryAr": "المنزل الذكي",
    "rating": 4.6,
    "reviews": 456,
    "specs": [
      "Smart Speakers",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "سماعات ذكية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Smart Speakers",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "سماعات ذكية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Smart",
    "badgeAr": "ذكي",
    "inStock": true,
    "stockCount": 50
  },
  {
    "id": "google-google-nest-hub-8-33",
    "name": "Google Nest Hub 8\"",
    "nameAr": "جوجل نيست هاب 8 بوصة",
    "brand": "Google",
    "brandAr": "جوجل",
    "model": "Smart Displays",
    "sku": "PRM-GOO-033",
    "description": "Smart display with Google Assistant and touch interface.",
    "descriptionAr": "شاشة ذكية مع مساعد جوجل والواجهة اللمسية.",
    "price": 99,
    "originalPrice": 129,
    "image": "https://images.unsplash.com/photo-1558089158-185a0ac1d24e?w=800&h=800&fit=crop",
    "category": "smart_home",
    "categoryAr": "المنزل الذكي",
    "rating": 4.7,
    "reviews": 267,
    "specs": [
      "Smart Displays",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "شاشات ذكية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Smart Displays",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "شاشات ذكية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Smart",
    "badgeAr": "ذكي",
    "inStock": true,
    "stockCount": 22
  },
  {
    "id": "tp-link-tp-link-smart-light-bulb-34",
    "name": "TP-Link Smart Light Bulb",
    "nameAr": "مصباح TP-Link ذكي",
    "brand": "TP-Link",
    "brandAr": "تي بي لينك",
    "model": "Smart Lighting",
    "sku": "PRM-TP--034",
    "description": "WiFi-enabled smart bulb with color control via app.",
    "descriptionAr": "مصباح ذكي موصول بـ WiFi مع التحكم بالألوان.",
    "price": 29,
    "originalPrice": 39,
    "image": "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=800&fit=crop",
    "category": "smart_home",
    "categoryAr": "المنزل الذكي",
    "rating": 4.5,
    "reviews": 189,
    "specs": [
      "Smart Lighting",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "إضاءة ذكية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Smart Lighting",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "إضاءة ذكية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Smart",
    "badgeAr": "ذكي",
    "inStock": true,
    "stockCount": 75
  },
  {
    "id": "google-nest-thermostat-35",
    "name": "Nest Thermostat",
    "nameAr": "ترموستات جوجل نيست",
    "brand": "Google",
    "brandAr": "جوجل",
    "model": "Smart Thermostat",
    "sku": "PRM-GOO-035",
    "description": "Smart thermostat with learning capability and energy saving.",
    "descriptionAr": "ترموستات ذكي بقدرات التعلم وتوفير الطاقة.",
    "price": 249,
    "originalPrice": 319,
    "image": "https://images.unsplash.com/photo-1600881333471-f6c7ba94c3ba?w=800&h=800&fit=crop",
    "category": "smart_home",
    "categoryAr": "المنزل الذكي",
    "rating": 4.8,
    "reviews": 234,
    "specs": [
      "Smart Thermostat",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "ثرموستات ذكي",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Smart Thermostat",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "ثرموستات ذكي",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Smart",
    "badgeAr": "ذكي",
    "inStock": true,
    "stockCount": 16
  },
  {
    "id": "sony-playstation-5-console-36",
    "name": "PlayStation 5 Console",
    "nameAr": "جهاز بلايستيشن 5",
    "brand": "Sony",
    "brandAr": "سوني",
    "model": "Gaming",
    "sku": "PRM-SON-036",
    "description": "Next-gen gaming console with ultra-fast SSD and 4K gaming.",
    "descriptionAr": "جهاز ألعاب من الجيل القادم مع SSD سريع جداً.",
    "price": 499,
    "originalPrice": 599,
    "image": "https://images.unsplash.com/photo-1635944714919-30ea4c69d75a?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.9,
    "reviews": 567,
    "specs": [
      "Gaming",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "gaming",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Gaming",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "gaming",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Available in 2–5 business days",
    "leadTimeAr": "متاح خلال 2–5 أيام عمل",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 8
  },
  {
    "id": "microsoft-xbox-series-x-37",
    "name": "Xbox Series X",
    "nameAr": "إكس بوكس سيريز إكس",
    "brand": "Microsoft",
    "brandAr": "Microsoft",
    "model": "Gaming",
    "sku": "PRM-MIC-037",
    "description": "Powerful gaming console with Game Pass and 4K support.",
    "descriptionAr": "جهاز ألعاب قوي مع Game Pass ودعم 4K.",
    "price": 499,
    "originalPrice": 599,
    "image": "https://images.unsplash.com/photo-1605901287671-07770c19f46e?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 456,
    "specs": [
      "Gaming",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "gaming",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Gaming",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "gaming",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 10
  },
  {
    "id": "nintendo-nintendo-switch-oled-38",
    "name": "Nintendo Switch OLED",
    "nameAr": "نينتندو سويتش OLED",
    "brand": "Nintendo",
    "brandAr": "نينتندو",
    "model": "Gaming",
    "sku": "PRM-NIN-038",
    "description": "Portable gaming console with OLED screen and versatile gameplay.",
    "descriptionAr": "جهاز ألعاب محمول مع شاشة OLED.",
    "price": 349,
    "originalPrice": 399,
    "image": "https://images.unsplash.com/photo-1606664515524-2ff4c62fb432?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.7,
    "reviews": 345,
    "specs": [
      "Gaming",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "gaming",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Gaming",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "gaming",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–72 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–72 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 15
  },
  {
    "id": "corsair-corsair-gaming-mouse-39",
    "name": "Corsair Gaming Mouse",
    "nameAr": "فأرة كورسير للألعاب",
    "brand": "Corsair",
    "brandAr": "كورسير",
    "model": "Gaming Peripherals",
    "sku": "PRM-COR-039",
    "description": "High-precision gaming mouse with RGB lighting.",
    "descriptionAr": "فأرة ألعاب دقيقة جداً مع إضاءة RGB.",
    "price": 79,
    "originalPrice": 99,
    "image": "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.7,
    "reviews": 178,
    "specs": [
      "Gaming Peripherals",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "gaming peripherals",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Gaming Peripherals",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "gaming peripherals",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 32
  },
  {
    "id": "corsair-mechanical-gaming-keyboard-40",
    "name": "Mechanical Gaming Keyboard",
    "nameAr": "لوحة مفاتيح ميكانيكية للألعاب",
    "brand": "Corsair",
    "brandAr": "كورسير",
    "model": "Gaming Peripherals",
    "sku": "PRM-COR-040",
    "description": "Premium mechanical keyboard with custom switches.",
    "descriptionAr": "لوحة مفاتيح ميكانيكية فاخرة مع مفاتيح مخصصة.",
    "price": 129,
    "originalPrice": 169,
    "image": "https://images.unsplash.com/photo-1587829191301-bfc2b10e5399?w=800&h=800&fit=crop",
    "category": "electronics",
    "categoryAr": "الإلكترونيات",
    "rating": 4.8,
    "reviews": 234,
    "specs": [
      "Gaming Peripherals",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "gaming peripherals",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Gaming Peripherals",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "gaming peripherals",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "2 Years",
    "warrantyAr": "ضمان سنتين",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Featured",
    "badgeAr": "مميز",
    "inStock": true,
    "stockCount": 24
  },
  {
    "id": "apple-apple-usb-c-to-lightning-cable-41",
    "name": "Apple USB-C to Lightning Cable",
    "nameAr": "كابل آبل USB-C إلى Lightning",
    "brand": "Apple",
    "brandAr": "أبل",
    "model": "Cables",
    "sku": "PRM-APP-041",
    "description": "Durable charging and data transfer cable.",
    "descriptionAr": "كابل شحن وتحويل بيانات متين.",
    "price": 29,
    "originalPrice": 39,
    "image": "https://images.unsplash.com/photo-1607936591149-9eee0394b612?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.6,
    "reviews": 89,
    "specs": [
      "Cables",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "كابلات",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Cables",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "كابلات",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 100
  },
  {
    "id": "generic-phone-screen-protector-tempered-glass-42",
    "name": "Phone Screen Protector Tempered Glass",
    "nameAr": "واقي شاشة الهاتف زجاج مقسى",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Phone Protection",
    "sku": "PRM-GEN-042",
    "description": "High-quality tempered glass screen protector.",
    "descriptionAr": "واقي شاشة زجاجي مقسى عالي الجودة.",
    "price": 9,
    "originalPrice": 15,
    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.5,
    "reviews": 456,
    "specs": [
      "Phone Protection",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "phone protection",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Phone Protection",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "phone protection",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "6 Months",
    "warrantyAr": "ضمان 6 أشهر",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 150
  },
  {
    "id": "generic-phone-case-leather-premium-43",
    "name": "Phone Case Leather Premium",
    "nameAr": "حالة الهاتف جلد فاخر",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Phone Cases",
    "sku": "PRM-GEN-043",
    "description": "Premium leather phone case with cardholder.",
    "descriptionAr": "حالة هاتف جلد فاخرة مع حامل بطاقات.",
    "price": 39,
    "originalPrice": 59,
    "image": "https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.7,
    "reviews": 234,
    "specs": [
      "Phone Cases",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "phone cases",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Phone Cases",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "phone cases",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 85
  },
  {
    "id": "generic-usb-c-hub-multi-port-44",
    "name": "USB-C Hub Multi-Port",
    "nameAr": "مركز USB-C متعدد المنافذ",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Adapters",
    "sku": "PRM-GEN-044",
    "description": "Multi-port USB-C hub with HDMI, USB, and SD card reader.",
    "descriptionAr": "مركز USB-C متعدد المنافذ مع HDMI و USB.",
    "price": 49,
    "originalPrice": 69,
    "image": "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.6,
    "reviews": 178,
    "specs": [
      "Adapters",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "adapters",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Adapters",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "adapters",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24–48 hours",
    "leadTimeAr": "مخزون جاهز خلال 24–48 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 42
  },
  {
    "id": "generic-portable-power-bank-20000mah-45",
    "name": "Portable Power Bank 20000mAh",
    "nameAr": "بنك الطاقة المحمول 20000mAh",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Power Banks",
    "sku": "PRM-GEN-045",
    "description": "High-capacity power bank with fast charging.",
    "descriptionAr": "بنك الطاقة بسعة عالية مع الشحن السريع.",
    "price": 39,
    "originalPrice": 59,
    "image": "https://images.unsplash.com/photo-1609042202906-e7159e6bcd9f?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.7,
    "reviews": 345,
    "specs": [
      "Power Banks",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "power banks",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Power Banks",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "power banks",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 64
  },
  {
    "id": "generic-laptop-stand-adjustable-46",
    "name": "Laptop Stand Adjustable",
    "nameAr": "حامل الكمبيوتر المحمول قابل للتعديل",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Computer Accessories",
    "sku": "PRM-GEN-046",
    "description": "Ergonomic laptop stand with multiple angle adjustments.",
    "descriptionAr": "حامل كمبيوتر محمول مريح مع تعديلات متعددة الزوايا.",
    "price": 29,
    "originalPrice": 49,
    "image": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.6,
    "reviews": 123,
    "specs": [
      "Computer Accessories",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "ملحقات كمبيوتر",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Computer Accessories",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "ملحقات كمبيوتر",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 56
  },
  {
    "id": "generic-wireless-mouse-2-4ghz-47",
    "name": "Wireless Mouse 2.4GHz",
    "nameAr": "فأرة لاسلكية 2.4GHz",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Computer Peripherals",
    "sku": "PRM-GEN-047",
    "description": "Reliable wireless mouse with long battery life.",
    "descriptionAr": "فأرة لاسلكية موثوقة ببطارية طويلة الأمد.",
    "price": 19,
    "originalPrice": 29,
    "image": "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.5,
    "reviews": 267,
    "specs": [
      "Computer Peripherals",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "ملحقات طرفية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Computer Peripherals",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "ملحقات طرفية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 98
  },
  {
    "id": "generic-keyboard-and-mouse-combo-48",
    "name": "Keyboard and Mouse Combo",
    "nameAr": "لوحة مفاتيح وفأرة معاً",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Computer Peripherals",
    "sku": "PRM-GEN-048",
    "description": "Wireless keyboard and mouse combo set.",
    "descriptionAr": "مجموعة لوحة مفاتيح وفأرة لاسلكية.",
    "price": 49,
    "originalPrice": 79,
    "image": "https://images.unsplash.com/photo-1587829191301-bfc2b10e5399?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.6,
    "reviews": 189,
    "specs": [
      "Computer Peripherals",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "ملحقات طرفية",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Computer Peripherals",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "ملحقات طرفية",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 72
  },
  {
    "id": "generic-phone-holder-car-mount-49",
    "name": "Phone Holder Car Mount",
    "nameAr": "حامل الهاتف لسيارة",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Mobile Accessories",
    "sku": "PRM-GEN-049",
    "description": "Secure car phone mount with adjustable grip.",
    "descriptionAr": "حامل هاتف سيارة آمن مع قبضة قابلة للتعديل.",
    "price": 19,
    "originalPrice": 29,
    "image": "https://images.unsplash.com/photo-1604887557309-8e1a20d457e9?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.7,
    "reviews": 234,
    "specs": [
      "Mobile Accessories",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "إكسسوارات هاتف",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Mobile Accessories",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "إكسسوارات هاتف",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "6 Months",
    "warrantyAr": "ضمان 6 أشهر",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 120
  },
  {
    "id": "generic-phone-charger-fast-charging-65w-50",
    "name": "Phone Charger Fast Charging 65W",
    "nameAr": "شاحن الهاتف سريع 65W",
    "brand": "Generic",
    "brandAr": "عام",
    "model": "Chargers",
    "sku": "PRM-GEN-050",
    "description": "Fast charging adapter compatible with most devices.",
    "descriptionAr": "محول شحن سريع متوافق مع معظم الأجهزة.",
    "price": 39,
    "originalPrice": 59,
    "image": "https://images.unsplash.com/photo-1609042202906-e7159e6bcd9f?w=800&h=800&fit=crop",
    "category": "accessories",
    "categoryAr": "الملحقات",
    "rating": 4.8,
    "reviews": 312,
    "specs": [
      "Chargers",
      "UAE market supply",
      "Ready for delivery"
    ],
    "specsAr": [
      "شواحن",
      "توريد للسوق الإماراتي",
      "جاهز للتسليم"
    ],
    "useCases": [
      "Chargers",
      "Retail display",
      "Direct purchase"
    ],
    "useCasesAr": [
      "شواحن",
      "عرض للبيع",
      "شراء مباشر"
    ],
    "warranty": "1 Year",
    "warrantyAr": "ضمان سنة واحدة",
    "leadTime": "Ready stock in 24 hours",
    "leadTimeAr": "مخزون جاهز خلال 24 ساعة",
    "badge": "Accessory",
    "badgeAr": "ملحق",
    "inStock": true,
    "stockCount": 85
  }
];

export const categories = [
  {
    "id": "all",
    "name": "All Products",
    "nameAr": "جميع المنتجات"
  },
  {
    "id": "electronics",
    "name": "Electronics",
    "nameAr": "الإلكترونيات"
  },
  {
    "id": "appliances",
    "name": "Home Appliances",
    "nameAr": "الأجهزة المنزلية"
  },
  {
    "id": "telecom",
    "name": "Telecommunications",
    "nameAr": "الاتصالات"
  },
  {
    "id": "smart_home",
    "name": "Smart Home",
    "nameAr": "المنزل الذكي"
  },
  {
    "id": "accessories",
    "name": "Accessories",
    "nameAr": "الملحقات"
  }
];
