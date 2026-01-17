# Hệ thống quản lý giá cước động

## Tổng quan
Hệ thống cho phép Admin cấu hình giá cước taxi theo từng tháng, thay vì sử dụng giá cố định. Khi Admin thay đổi giá, hệ thống sẽ **tự động gửi thông báo đến tất cả khách hàng**.

## Cấu trúc giá
Mỗi cấu hình giá bao gồm:
- **Giá mở cửa (basePrice)**: Chi phí cố định khi bắt đầu chuyến đi
- **Giá/km (pricePerKm)**: Chi phí cho mỗi km di chuyển
- **Giá tối thiểu (minPrice)**: Số tiền tối thiểu cho một chuyến đi

### Công thức tính giá
```
Tổng tiền = Giá mở cửa + (Khoảng cách (km) × Giá/km)
Nếu Tổng tiền < Giá tối thiểu thì Tổng tiền = Giá tối thiểu
Làm tròn đến 1000đ
```

## API Endpoints

### Public APIs (không cần đăng nhập)

#### 1. Lấy cấu hình giá hiện tại
```
GET /api/price-config/current
```
Trả về cấu hình giá của tháng hiện tại hoặc gần nhất.

#### 2. Tính giá chuyến xe
```
POST /api/price-config/calculate
Body: {
  "distance": 5000  // meters
}
```
Trả về chi tiết tính giá dựa trên cấu hình hiện tại.

### Admin APIs (yêu cầu role ADMIN)

#### 3. Lấy tất cả cấu hình giá
```
GET /api/price-config
Headers: Authorization: Bearer <token>
```

#### 4. Lấy cấu hình giá theo tháng/năm
```
GET /api/price-config/:year/:month
Headers: Authorization: Bearer <token>
```

#### 5. Tạo hoặc cập nhật cấu hình giá
```
POST /api/price-config
Headers: Authorization: Bearer <token>
Body: {
  "month": 1,
  "year": 2026,
  "pricePerKm": 12000,
  "basePrice": 15000,
  "minPrice": 20000,
  "description": "Giá cước mùa cao điểm"
}
```

#### 6. Xóa cấu hình giá
```
DELETE /api/price-config/:id
Headers: Authorization: Bearer <token>
```
Lưu ý: Không thể xóa cấu hình giá của tháng hiện tại.

## Sử dụng trong Frontend

### Admin - Quản lý giá
Truy cập: `/admin/price`
- Xem danh sách tất cả cấu hình giá
- Thêm cấu hình giá mới cho tháng tương lai
- Cập nhật cấu hình giá hiện có
- Xóa cấu hình giá (trừ tháng hiện tại)

### Customer - Đặt xe
Khi khách hàng chọn điểm đón và điểm đến:
1. Hệ thống tự động tính khoảng cách
2. Gọi API `/api/price-config/calculate` với khoảng cách
3. Hiển thị giá dự kiến cho khách hàng
4. Giá được tính dựa trên cấu hình của tháng hiện tại

## Ví dụ sử dụng

### Ví dụ 1: Tạo giá cho tháng 2/2026
```javascript
// Admin tạo cấu hình giá mới
const response = await createOrUpdatePrice({
  month: 2,
  year: 2026,
  pricePerKm: 11000,
  basePrice: 12000,
  minPrice: 18000,
  description: 'Giá cước tháng 2/2026'
});
```

### Ví dụ 2: Tính giá chuyến xe 5.2km
```javascript
// Khách hàng đặt xe
const response = await calculatePrice(5200); // 5200 meters
// Kết quả:
// {
//   distance: 5200,
//   distanceKm: 5.2,
//   pricePerKm: 11000,
//   basePrice: 12000,
//   minPrice: 18000,
//   totalPrice: 69000  // 12000 + (5.2 * 11000) = 69200 -> làm tròn 69000
// }
```

## Seed Data
File `seed.js` đã được cập nhật để tự động tạo:
- Cấu hình giá cho tháng hiện tại
- Cấu hình giá cho tháng tiếp theo

Chạy seed:
```bash
node backend/src/seed.js
```

## Lưu ý quan trọng
1. **Luôn có cấu hình giá cho tháng hiện tại**: Nếu không có, hệ thống sẽ sử dụng cấu hình gần nhất hoặc giá mặc định
2. **Không xóa giá tháng hiện tại**: Để đảm bảo hệ thống hoạt động ổn định
3. **Chuẩn bị trước**: Admin nên tạo cấu hình giá cho tháng tiếp theo trước khi tháng hiện tại kết thúc
4. **Giá được làm tròn**: Tất cả giá đều được làm tròn đến 1000đ để dễ thanh toán

## Model Schema
```javascript
{
  month: Number,        // 1-12
  year: Number,         // 2024, 2025, ...
  pricePerKm: Number,   // Giá/km
  basePrice: Number,    // Giá mở cửa
  minPrice: Number,     // Giá tối thiểu
  description: String,  // Mô tả
  isActive: Boolean,    // Trạng thái
  createdBy: ObjectId   // Admin tạo
}
```

## Hệ thống thông báo

### Tự động gửi thông báo
Khi Admin tạo hoặc cập nhật cấu hình giá, hệ thống sẽ **tự động gửi thông báo** đến tất cả khách hàng trong các trường hợp:

1. **Tạo giá mới**: Khi tạo cấu hình giá cho tháng hiện tại hoặc tháng tiếp theo
2. **Cập nhật giá**: Khi thay đổi giá/km của cấu hình hiện có

### Nội dung thông báo

#### Khi tạo giá mới:
```
📢 Thông báo giá cước mới
Giá cước tháng [month]/[year]: [pricePerKm]đ/km 
(Giá mở cửa: [basePrice]đ, Tối thiểu: [minPrice]đ). 
[description]
```

#### Khi cập nhật giá:
```
📢 Thông báo thay đổi giá cước
Giá cước tháng [month]/[year] đã [tăng/giảm] [X]%. 
Giá mới: [pricePerKm]đ/km 
(Giá mở cửa: [basePrice]đ, Tối thiểu: [minPrice]đ)
```

### Notification Model
```javascript
{
  userId: ObjectId,           // ID người nhận
  type: String,               // 'PRICE_CHANGE', 'BOOKING_UPDATE', 'PAYMENT', 'SYSTEM', 'PROMOTION'
  title: String,              // Tiêu đề thông báo
  message: String,            // Nội dung thông báo
  data: {                     // Dữ liệu bổ sung
    month: Number,
    year: Number,
    oldPrice: Number,         // Giá cũ (nếu cập nhật)
    newPrice: Number,         // Giá mới
    basePrice: Number,
    minPrice: Number,
    changePercent: Number     // % thay đổi (nếu cập nhật)
  },
  isRead: Boolean,            // Đã đọc chưa
  readAt: Date,               // Thời gian đọc
  createdAt: Date             // Thời gian tạo
}
```

### Notification API Endpoints

#### 1. Lấy danh sách thông báo
```
GET /api/notifications
Headers: Authorization: Bearer <token>
Query params:
  - limit: số lượng thông báo (mặc định 50)
  - unreadOnly: true/false (chỉ lấy chưa đọc)

Response: {
  notifications: [...],
  unreadCount: Number
}
```

#### 2. Đếm số thông báo chưa đọc
```
GET /api/notifications/unread-count
Headers: Authorization: Bearer <token>

Response: {
  count: Number
}
```

#### 3. Đánh dấu đã đọc
```
PUT /api/notifications/:id/read
Headers: Authorization: Bearer <token>

Response: {
  message: "Đã đánh dấu đọc",
  notification: {...}
}
```

#### 4. Đánh dấu tất cả đã đọc
```
PUT /api/notifications/read-all
Headers: Authorization: Bearer <token>

Response: {
  message: "Đã đánh dấu tất cả đã đọc"
}
```

#### 5. Xóa thông báo
```
DELETE /api/notifications/:id
Headers: Authorization: Bearer <token>

Response: {
  message: "Đã xóa thông báo"
}
```

#### 6. Xóa tất cả thông báo đã đọc
```
DELETE /api/notifications/read/all
Headers: Authorization: Bearer <token>

Response: {
  message: "Đã xóa tất cả thông báo đã đọc"
}
```

### Frontend - NotificationBell Component

Component hiển thị icon chuông thông báo trên Navbar với các tính năng:

- **Badge đỏ**: Hiển thị số thông báo chưa đọc
- **Dropdown**: Danh sách thông báo khi click vào chuông
- **Auto-refresh**: Tự động cập nhật số thông báo chưa đọc mỗi 30 giây
- **Thao tác**: Đánh dấu đã đọc, xóa từng thông báo
- **Icon động**: Mỗi loại thông báo có icon riêng:
  - 💰 PRICE_CHANGE
  - 🚗 BOOKING_UPDATE
  - 💳 PAYMENT
  - 🎉 PROMOTION
  - 📢 SYSTEM

### Sử dụng trong Frontend

```javascript
import NotificationBell from './components/NotificationBell';

// Thêm vào Navbar
<NotificationBell />
```

Component tự động:
1. Lấy số thông báo chưa đọc khi mount
2. Cập nhật mỗi 30 giây
3. Hiển thị badge nếu có thông báo chưa đọc
4. Cho phép người dùng đọc và xóa thông báo

## Ví dụ thực tế

### Ví dụ 1: Admin tạo giá mới cho tháng 3/2026
```javascript
// Admin tạo cấu hình
await createOrUpdatePrice({
  month: 3,
  year: 2026,
  pricePerKm: 12000,
  basePrice: 15000,
  minPrice: 20000,
  description: 'Giá cước mùa cao điểm'
});

// Hệ thống tự động gửi thông báo đến tất cả khách hàng:
// "📢 Thông báo giá cước mới
//  Giá cước tháng 3/2026: 12,000đ/km 
//  (Giá mở cửa: 15,000đ, Tối thiểu: 20,000đ). 
//  Giá cước mùa cao điểm"
```

### Ví dụ 2: Admin cập nhật giá từ 10,000đ lên 11,000đ
```javascript
// Admin cập nhật giá
await createOrUpdatePrice({
  month: 2,
  year: 2026,
  pricePerKm: 11000,  // Tăng từ 10,000đ
  basePrice: 12000,
  minPrice: 18000
});

// Hệ thống tự động gửi thông báo:
// "📢 Thông báo thay đổi giá cước
//  Giá cước tháng 2/2026 đã tăng 10.0%. 
//  Giá mới: 11,000đ/km 
//  (Giá mở cửa: 12,000đ, Tối thiểu: 18,000đ)"
```

### Ví dụ 3: Khách hàng nhận và đọc thông báo
```javascript
// Lấy danh sách thông báo
const { data } = await getNotifications({ limit: 20 });
console.log(data.notifications);
console.log(`Có ${data.unreadCount} thông báo chưa đọc`);

// Đánh dấu đã đọc
await markAsRead(notificationId);

// Xóa thông báo
await deleteNotification(notificationId);
```
