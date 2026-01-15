require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Wallet = require('./models/Wallet');
const DriverEarning = require('./models/DriverEarning');
const Rating = require('./models/Rating');

const PLATFORM_FEE_PERCENT = 20;

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all data
    await User.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Wallet.deleteMany({});
    await DriverEarning.deleteMany({});
    await Rating.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin
    const admin = await User.create({
      username: 'admin',
      password: '123456',
      role: 'ADMIN',
      name: 'Admin',
      phone: '0900000000',
      email: 'admin@taxigo.vn'
    });

    // Create Customers
    const customer1 = await User.create({
      username: 'khach1',
      password: '123456',
      role: 'CUSTOMER',
      name: 'Nguyen Van A',
      phone: '0901111111',
      email: 'khach1@gmail.com'
    });

    const customer2 = await User.create({
      username: 'khach2',
      password: '123456',
      role: 'CUSTOMER',
      name: 'Tran Thi B',
      phone: '0902222222',
      email: 'khach2@gmail.com'
    });

    // Create Drivers
    const driver1 = await User.create({
      username: 'taixe1',
      password: '123456',
      role: 'DRIVER',
      name: 'Le Van C',
      phone: '0903333333',
      email: 'taixe1@gmail.com',
      driverStatus: 'RANH'
    });

    const driver2 = await User.create({
      username: 'taixe2',
      password: '123456',
      role: 'DRIVER',
      name: 'Pham Van D',
      phone: '0904444444',
      email: 'taixe2@gmail.com',
      driverStatus: 'RANH'
    });

    console.log('Created users');

    // Create Wallets for customers
    const wallet1 = await Wallet.create({
      userId: customer1._id,
      balance: 500000,
      bankAccount: {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'NGUYEN VAN A'
      },
      isLinked: true,
      transactions: [{
        type: 'NAP_TIEN',
        amount: 500000,
        description: 'Nạp tiền vào ví'
      }]
    });

    await Wallet.create({
      userId: customer2._id,
      balance: 200000,
      isLinked: false,
      transactions: [{
        type: 'NAP_TIEN',
        amount: 200000,
        description: 'Nạp tiền vào ví'
      }]
    });

    // Create Wallets for drivers (with linked bank for withdrawal)
    const driverWallet1 = await Wallet.create({
      userId: driver1._id,
      balance: 0, // Will be updated after earnings
      bankAccount: {
        bankName: 'BIDV',
        accountNumber: '9876543210',
        accountHolder: 'LE VAN C'
      },
      isLinked: true,
      transactions: []
    });

    const driverWallet2 = await Wallet.create({
      userId: driver2._id,
      balance: 0,
      bankAccount: {
        bankName: 'Techcombank',
        accountNumber: '5555666677',
        accountHolder: 'PHAM VAN D'
      },
      isLinked: true,
      transactions: []
    });

    console.log('Created wallets');

    // Create completed bookings with earnings
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
      price: 52000,
      status: 'HOAN_THANH',
      paymentMethod: 'TIEN_MAT',
      paymentStatus: 'DA_THANH_TOAN'
    });

    const booking2 = await Booking.create({
      customerId: customer2._id,
      driverId: driver1._id,
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
      price: 35000,
      status: 'HOAN_THANH',
      paymentMethod: 'CHUYEN_KHOAN',
      paymentStatus: 'DA_THANH_TOAN'
    });

    const booking3 = await Booking.create({
      customerId: customer1._id,
      driverId: driver2._id,
      pickup: {
        address: '100 Pasteur, Quan 1, HCM',
        lat: 10.7800,
        lng: 106.6950
      },
      dropoff: {
        address: '200 CMT8, Quan 10, HCM',
        lat: 10.7650,
        lng: 106.6700
      },
      distance: 4000,
      duration: 720,
      price: 40000,
      status: 'HOAN_THANH',
      paymentMethod: 'TIEN_MAT',
      paymentStatus: 'DA_THANH_TOAN'
    });

    console.log('Created bookings');

    // Create Payments
    await Payment.create({
      bookingId: booking1._id,
      amount: 52000,
      method: 'TIEN_MAT',
      status: 'DA_THANH_TOAN',
      paidAt: new Date()
    });

    await Payment.create({
      bookingId: booking2._id,
      amount: 35000,
      method: 'CHUYEN_KHOAN',
      status: 'DA_THANH_TOAN',
      paidAt: new Date()
    });

    await Payment.create({
      bookingId: booking3._id,
      amount: 40000,
      method: 'TIEN_MAT',
      status: 'DA_THANH_TOAN',
      paidAt: new Date()
    });

    console.log('Created payments');

    // Create Driver Earnings and update wallets
    const createEarningAndUpdateWallet = async (booking, driverWallet) => {
      const fareAmount = booking.price;
      const platformFeeAmount = Math.round(fareAmount * PLATFORM_FEE_PERCENT / 100);
      const netEarning = fareAmount - platformFeeAmount;

      await DriverEarning.create({
        driverId: booking.driverId,
        bookingId: booking._id,
        fareAmount,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        platformFeeAmount,
        netEarning,
        totalEarning: netEarning,
        distance: booking.distance,
        duration: booking.duration,
        status: 'PAID',
        paidAt: new Date()
      });

      // Update driver wallet
      driverWallet.balance += netEarning;
      driverWallet.transactions.push({
        type: 'THU_NHAP',
        amount: netEarning,
        description: `Thu nhập chuyến xe #${booking._id.toString().slice(-6)}`,
        bookingId: booking._id
      });
      await driverWallet.save();

      return netEarning;
    };

    // Driver 1 earnings (booking1 + booking2)
    await createEarningAndUpdateWallet(booking1, driverWallet1);
    await createEarningAndUpdateWallet(booking2, driverWallet1);
    
    // Driver 2 earnings (booking3)
    await createEarningAndUpdateWallet(booking3, driverWallet2);

    console.log('Created driver earnings');

    // Create a pending booking (no payment method selected yet - for testing)
    await Booking.create({
      customerId: customer2._id,
      pickup: {
        address: '50 Nguyen Trai, Quan 5, HCM',
        lat: 10.7550,
        lng: 106.6800
      },
      dropoff: {
        address: '100 Ly Thuong Kiet, Quan 10, HCM',
        lat: 10.7700,
        lng: 106.6600
      },
      distance: 2800,
      duration: 480,
      price: 28000,
      status: 'MOI_TAO',
      paymentMethod: 'TIEN_MAT',
      paymentStatus: 'CHUA_THANH_TOAN'
    });

    console.log('Created pending booking');

    // Create Ratings
    // Khách đánh giá tài xế
    await Rating.create({
      bookingId: booking1._id,
      fromUserId: customer1._id,
      toUserId: driver1._id,
      type: 'CUSTOMER_TO_DRIVER',
      stars: 5,
      comment: 'Tài xế rất thân thiện và lái xe an toàn!',
      tags: ['THAN_THIEN', 'AN_TOAN', 'XE_SACH']
    });
    await Booking.findByIdAndUpdate(booking1._id, { customerRated: true });

    await Rating.create({
      bookingId: booking2._id,
      fromUserId: customer2._id,
      toUserId: driver1._id,
      type: 'CUSTOMER_TO_DRIVER',
      stars: 4,
      comment: 'Chuyến đi tốt, đúng giờ',
      tags: ['DUNG_GIO', 'CHUYEN_NGHIEP']
    });
    await Booking.findByIdAndUpdate(booking2._id, { customerRated: true });

    // Booking3 chưa đánh giá để test
    // await Rating.create({...});

    // Tài xế đánh giá khách
    await Rating.create({
      bookingId: booking1._id,
      fromUserId: driver1._id,
      toUserId: customer1._id,
      type: 'DRIVER_TO_CUSTOMER',
      stars: 5,
      comment: 'Khách lịch sự, đúng hẹn',
      tags: ['LICH_SU', 'DUNG_HEN']
    });
    await Booking.findByIdAndUpdate(booking1._id, { driverRated: true });

    await Rating.create({
      bookingId: booking2._id,
      fromUserId: driver1._id,
      toUserId: customer2._id,
      type: 'DRIVER_TO_CUSTOMER',
      stars: 4,
      comment: 'Khách dễ chịu',
      tags: ['DE_CHIU']
    });
    await Booking.findByIdAndUpdate(booking2._id, { driverRated: true });

    await Rating.create({
      bookingId: booking3._id,
      fromUserId: driver2._id,
      toUserId: customer1._id,
      type: 'DRIVER_TO_CUSTOMER',
      stars: 5,
      comment: 'Khách rất tốt',
      tags: ['LICH_SU', 'DE_CHIU']
    });
    await Booking.findByIdAndUpdate(booking3._id, { driverRated: true });

    console.log('Created ratings');

    // Final wallet balances
    const finalDriver1Wallet = await Wallet.findOne({ userId: driver1._id });
    const finalDriver2Wallet = await Wallet.findOne({ userId: driver2._id });

    console.log('\n=== SEED DATA COMPLETED ===');
    console.log('\nTest accounts (password: 123456):');
    console.log('- Admin: admin');
    console.log('- Khach hang: khach1 (500,000đ), khach2 (200,000đ)');
    console.log('- Tai xe: taixe1, taixe2');
    console.log('\nDriver earnings (after 20% platform fee):');
    console.log(`- taixe1: ${finalDriver1Wallet.balance.toLocaleString()}đ (2 trips)`);
    console.log(`- taixe2: ${finalDriver2Wallet.balance.toLocaleString()}đ (1 trip)`);
    console.log('\nPending booking: 1 (from khach2)');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
