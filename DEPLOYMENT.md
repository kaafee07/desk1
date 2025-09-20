# نشر المشروع على Vercel

## الخطوات المطلوبة للنشر

### 1. إعداد قاعدة البيانات

قبل النشر، تحتاج إلى قاعدة بيانات MySQL في السحابة. يمكنك استخدام إحدى الخدمات التالية:

- **PlanetScale** (مجاني للمشاريع الصغيرة)
- **Railway** (سهل الاستخدام)
- **Supabase** (يدعم PostgreSQL أيضاً)
- **AWS RDS** (للمشاريع الكبيرة)

### 2. رفع الكود إلى Git

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. ربط المشروع بـ Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط على "New Project"
4. اختر مستودع الكود الخاص بك
5. اضغط على "Deploy"

### 4. إعداد متغيرات البيئة في Vercel

في لوحة تحكم Vercel، اذهب إلى:
**Settings** → **Environment Variables**

أضف المتغيرات التالية:

#### متغيرات مطلوبة:

```
DATABASE_URL = mysql://username:password@host:port/database_name
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET = your-nextauth-secret-key
NEXTAUTH_URL = https://your-app-name.vercel.app
CASHIER_PIN = 1234
ADMIN_USERNAME = admin
ADMIN_PASSWORD = admin123
NODE_ENV = production
```

#### ملاحظات مهمة:

- **DATABASE_URL**: احصل على هذا من مزود قاعدة البيانات
- **JWT_SECRET**: استخدم مولد كلمات مرور قوية
- **NEXTAUTH_URL**: استبدل `your-app-name` باسم تطبيقك الفعلي
- **ADMIN_PASSWORD**: غير كلمة المرور الافتراضية لأمان أفضل

### 5. إعادة النشر

بعد إضافة متغيرات البيئة:
1. اذهب إلى تبويب **Deployments**
2. اضغط على النقاط الثلاث بجانب آخر نشر
3. اختر **Redeploy**

### 6. التحقق من النشر

1. انتظر حتى ينتهي النشر (عادة 2-3 دقائق)
2. اضغط على رابط التطبيق
3. تأكد من أن الصفحة الرئيسية تعمل
4. جرب تسجيل الدخول كمدير:
   - اذهب إلى `/admin-login`
   - استخدم بيانات المدير التي حددتها

## استكشاف الأخطاء

### خطأ في قاعدة البيانات
- تأكد من صحة `DATABASE_URL`
- تأكد من أن قاعدة البيانات متاحة من الإنترنت
- تحقق من أن المستخدم له صلاحيات كاملة

### خطأ في البناء
- تحقق من سجلات البناء في Vercel
- تأكد من أن جميع التبعيات مثبتة بشكل صحيح
- تأكد من أن `package.json` محدث

### خطأ في تسجيل الدخول
- تأكد من أن `JWT_SECRET` و `NEXTAUTH_SECRET` محددان
- تأكد من أن `NEXTAUTH_URL` يطابق رابط التطبيق

## الأمان

### تغيير البيانات الافتراضية
```bash
# بيانات المدير الافتراضية
ADMIN_USERNAME = "your-secure-username"
ADMIN_PASSWORD = "your-very-secure-password"

# رقم الكاشير السري
CASHIER_PIN = "your-secure-4-digit-pin"
```

### مفاتيح التشفير
استخدم مولدات كلمات مرور قوية لـ:
- `JWT_SECRET`
- `NEXTAUTH_SECRET`

## الصيانة

### تحديث قاعدة البيانات
إذا احتجت لتحديث هيكل قاعدة البيانات:

1. قم بتحديث `prisma/schema.prisma`
2. أنشئ migration جديد:
   ```bash
   npx prisma migrate dev --name your-migration-name
   ```
3. ادفع التغييرات إلى Git
4. Vercel ستقوم بتطبيق التحديثات تلقائياً

### مراقبة الأداء
- استخدم لوحة تحكم Vercel لمراقبة الأداء
- تحقق من سجلات الأخطاء بانتظام
- راقب استخدام قاعدة البيانات

## الدعم

إذا واجهت مشاكل:
1. تحقق من سجلات Vercel
2. تأكد من متغيرات البيئة
3. تحقق من اتصال قاعدة البيانات
4. راجع وثائق Vercel الرسمية
