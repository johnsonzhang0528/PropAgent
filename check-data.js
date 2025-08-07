const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/propagent');

const customerSchema = new mongoose.Schema({}, { strict: false });
const propertySchema = new mongoose.Schema({}, { strict: false });

const Customer = mongoose.model('Customer', customerSchema);
const Property = mongoose.model('Property', propertySchema);

async function checkData() {
  try {
    console.log('檢查數據庫數據...\n');
    
    const customerCount = await Customer.countDocuments();
    const propertyCount = await Property.countDocuments();
    
    console.log(`客戶總數: ${customerCount}`);
    console.log(`房產總數: ${propertyCount}`);
    
    if (customerCount > 0) {
      console.log('\n客戶狀態分布:');
      const statusDist = await Customer.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      statusDist.forEach(item => {
        console.log(`- ${item._id}: ${item.count}`);
      });
      
      console.log('\n購買意願評分範圍:');
      const intentScores = await Customer.find({}, 'purchase_intent_score').limit(10);
      console.log('前10個意願評分:', intentScores.map(c => c.purchase_intent_score));
    }
    
    if (propertyCount > 0) {
      console.log('\n房產狀態分布:');
      const statusDist = await Property.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      statusDist.forEach(item => {
        console.log(`- ${item._id}: ${item.count}`);
      });
      
      console.log('\n房產價格範圍:');
      const prices = await Property.find({}, 'price').limit(10);
      console.log('前10個價格:', prices.map(p => p.price));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('檢查數據錯誤:', error);
    process.exit(1);
  }
}

checkData();