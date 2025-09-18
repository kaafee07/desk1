// Script لإنشاء مكتب تجريبي مع أسعار سابقة
const testOffice = {
  officeNumber: "TEST-001",
  name: "مكتب تجريبي للخصومات",
  description: "مكتب تجريبي لاختبار نظام الخصومات",
  capacity: 4,
  // الأسعار الحالية
  pricePerHour: 40,
  pricePerDay: 200,
  pricePerMonth: 1200,
  // الأسعار السابقة (لحساب الخصم)
  previousPricePerHour: 50,  // خصم 20%
  previousPricePerDay: 300,  // خصم 33%
  previousPricePerMonth: 1800, // خصم 33%
  // أسعار التجديد
  renewalPricePerHour: 35,
  renewalPricePerDay: 180,
  renewalPricePerMonth: 1000,
  // أسعار التجديد السابقة
  previousRenewalPricePerHour: 45, // خصم 22%
  previousRenewalPricePerDay: 250,  // خصم 28%
  previousRenewalPricePerMonth: 1500, // خصم 33%
  discountPercentage: 0,
  isAvailable: true
}

// إرسال البيانات إلى API
fetch('http://localhost:3000/api/admin/offices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testOffice)
})
.then(response => response.json())
.then(data => {
  console.log('✅ Test office created:', data)
})
.catch(error => {
  console.error('❌ Error creating test office:', error)
})
