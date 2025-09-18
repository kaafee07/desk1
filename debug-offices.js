// Debug script to check office data
const https = require('https');
const http = require('http');

async function checkOffices() {
  try {
    console.log('🔍 Fetching offices data...');

    const data = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/admin/offices', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
    });
    
    console.log('📊 Total offices:', data.offices?.length || 0);
    
    if (data.offices && data.offices.length > 0) {
      data.offices.forEach((office, index) => {
        console.log(`\n🏢 Office ${index + 1}: ${office.name}`);
        console.log('💰 Current Prices:');
        console.log(`   Hour: ${office.pricePerHour} SAR`);
        console.log(`   Day: ${office.pricePerDay} SAR`);
        console.log(`   Month: ${office.pricePerMonth} SAR`);
        
        console.log('📈 Previous Prices:');
        console.log(`   Hour: ${office.previousPricePerHour || 'N/A'} SAR`);
        console.log(`   Day: ${office.previousPricePerDay || 'N/A'} SAR`);
        console.log(`   Month: ${office.previousPricePerMonth || 'N/A'} SAR`);
        
        // Calculate discounts
        const hourlyDiscount = office.previousPricePerHour && office.previousPricePerHour > office.pricePerHour 
          ? Math.round(((office.previousPricePerHour - office.pricePerHour) / office.previousPricePerHour) * 100)
          : 0;
        const dailyDiscount = office.previousPricePerDay && office.previousPricePerDay > office.pricePerDay 
          ? Math.round(((office.previousPricePerDay - office.pricePerDay) / office.previousPricePerDay) * 100)
          : 0;
        const monthlyDiscount = office.previousPricePerMonth && office.previousPricePerMonth > office.pricePerMonth 
          ? Math.round(((office.previousPricePerMonth - office.pricePerMonth) / office.previousPricePerMonth) * 100)
          : 0;
          
        console.log('🏷️ Calculated Discounts:');
        console.log(`   Hour: ${hourlyDiscount}%`);
        console.log(`   Day: ${dailyDiscount}%`);
        console.log(`   Month: ${monthlyDiscount}%`);
      });
    } else {
      console.log('❌ No offices found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkOffices();
