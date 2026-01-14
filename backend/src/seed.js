require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    console.log('Cleared existing data');

    const admin = await User.create({
      username: 'admin',
      password: '123456',
      role: 'ADMIN',
      name: 'Admin',
      phone: '0900000000'
    });

    const customer1 = await User.create({
      username: 'khach1',
      password: '123456',
      role: 'CUSTOMER',
      name: 'Nguyen Van A',
      phone: '0901111111'
    });

    const customer2 = await User.create({
      username: 'khach2',
      password: '123456',
      role: 'CUSTOMER',
      name: 'Tran Thi B',
      phone: '0902222222'
    });

    const driver1 = await User.create({
      username: 'taixe1',
      password: '123456',
      role: 'DRIVER',
      name: 'Le Van C',
      phone: '0903333333',
      driverStatus: 'RANH'
    });

    const driver2 = await User.create({
      username: 'taixe2',
      password: '123456',
      role: 'DRIVER',
      name: 'Pham Van D',
      phone: '0904444444',
      driverStatus: 'RANH'
    });

    console.log('Created users');

    const booking1 = await Booking.create({
      customerId: customer1._id,
      driverId: driver1._id,
      pickup: {
        address: '123 Nguyen Hue, Quan 1, HCM',
        lat: 10.7731,
        lng: 106.7030
      },
      dropoff: {
        address: '456 Le Loi, Quan 3, HCM',
        lat: 10.7769,
        lng: 106.6905
      },
      distance: 5200,
      duration: 900,
      status: 'HOAN_THANH',
      price: 52000
    });

    await Booking.create({
      customerId: customer1._id,
      pickup: {
        address: '789 Hai Ba Trung, Quan 1, HCM',
        lat: 10.7875,
        lng: 106.7053
      },
      dropoff: {
        address: '321 Vo Van Tan, Quan 3, HCM',
        lat: 10.7721,
        lng: 106.6832
      },
      distance: 3500,
      duration: 600,
      status: 'MOI_TAO',
      price: 35000
    });

    console.log('Created bookings');

    await Payment.create({
      bookingId: booking1._id,
      amount: 52000,
      method: 'TIEN_MAT',
      status: 'DA_THANH_TOAN',
      paidAt: new Date()
    });

    console.log('Created payments');

    console.log('\n=== SEED DATA COMPLETED ===');
    console.log('\nTest accounts (password: 123456):');
    console.log('- Admin: admin');
    console.log('- Khach hang: khach1, khach2');
    console.log('- Tai xe: taixe1, taixe2');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
