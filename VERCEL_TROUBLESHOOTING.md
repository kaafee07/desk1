# 🔧 استكشاف أخطاء Vercel

## 🚨 المشكلة الحالية
```
POST /api/auth/login 500 (Internal Server Error)
```

## ✅ خطوات الحل

### 1. تحقق من متغيرات البيئة في Vercel
اذهب إلى: **Vercel Dashboard → Project → Settings → Environment Variables**

أضف المتغيرات التالية:
```env
DATABASE_URL=mysql://u283511061_addressmood:E123123123ee90@193.203.168.5:3306/u283511061_workspace_mana
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://desk1-663v.vercel.app
CASHIER_PIN=1234
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
NODE_ENV=production
```

### 2. اختبار الاتصال بقاعدة البيانات
بعد رفع التحديثات، اختبر:
```
https://desk1-663v.vercel.app/api/test-db
```

### 3. إعادة النشر
بعد إضافة متغيرات البيئة:
1. اذهب إلى **Deployments**
2. اضغط على **Redeploy** للنشر الأخير
3. أو انتظر النشر التلقائي بعد push جديد

### 4. فحص السجلات
في Vercel Dashboard:
1. اذهب إلى **Functions**
2. اضغط على **View Function Logs**
3. ابحث عن أخطاء في `/api/auth/login`

## 🔍 اختبارات إضافية

### اختبار قاعدة البيانات
```bash
# محلياً
npm run db:push
npm run db:seed
```

### اختبار API محلياً
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"type":"admin","username":"admin","password":"admin123"}'
```

## 📋 قائمة التحقق

- [ ] متغيرات البيئة مُضافة في Vercel
- [ ] DATABASE_URL صحيح ومتصل
- [ ] JWT_SECRET مُعرف
- [ ] NEXTAUTH_URL يطابق رابط Vercel
- [ ] إعادة النشر بعد إضافة المتغيرات
- [ ] اختبار /api/test-db يعمل
- [ ] فحص Function Logs في Vercel

## 🆘 إذا استمرت المشكلة

1. تحقق من Function Logs في Vercel
2. اختبر /api/test-db للتأكد من الاتصال
3. تأكد من أن قاعدة البيانات تقبل الاتصالات الخارجية
4. جرب إعادة إنشاء المشروع في Vercel
