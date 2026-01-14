# Taxi Booking API

Backend API cho ứng dụng đặt taxi.

## Cài đặt

```bash
cd backend
npm install
```

## Cấu hình

File `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/taxi_booking
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

## Chạy

```bash
npm run seed    # Tạo dữ liệu mẫu
npm run dev     # Development
npm start       # Production
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Users
- `POST /api/users` - Tạo user
- `GET /api/users/:id` - Lấy thông tin user

### Drivers
- `PUT /api/drivers/:id/free` - Cập nhật RẢNH
- `PUT /api/drivers/:id/busy` - Cập nhật BẬN

### Bookings
- `POST /api/bookings` - Tạo booking
- `GET /api/bookings` - Danh sách booking
- `PUT /api/bookings/:id/nhan` - Nhận booking
- `PUT /api/bookings/:id/hoan-thanh` - Hoàn thành
- `PUT /api/bookings/:id/huy` - Hủy

### Payments
- `POST /api/payments` - Tạo payment
- `GET /api/payments/:bookingId` - Lấy payment

## Test accounts (password: 123456)
- Admin: admin@taxi.com
- Customer: customer1@test.com
- Driver: driver1@test.com
