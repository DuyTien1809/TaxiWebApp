# Taxi Booking Frontend

Frontend React + TailwindCSS cho ứng dụng đặt taxi.

## Cài đặt

```bash
cd frontend
npm install
```

## Chạy

```bash
npm run dev
```

Mở http://localhost:5173

## Lưu ý

- Backend phải chạy trên port 3000
- Vite proxy tự động forward `/api` requests đến backend

## Tài khoản test

Sau khi chạy `npm run seed` ở backend:

- Customer: `customer1@test.com` / `123456`
- Driver: `driver1@test.com` / `123456`
- Admin: `admin@taxi.com` / `123456`

## Luồng test

1. Đăng nhập Customer → Đặt xe
2. Đăng nhập Driver (tab khác) → Nhận chuyến → Hoàn thành
3. Quay lại Customer → Thanh toán
