const PriceConfig = require('../models/PriceConfig');
const { notifyAllCustomers } = require('./notificationController');

// Lấy cấu hình giá hiện tại (tháng hiện tại)
exports.getCurrentPrice = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let priceConfig = await PriceConfig.findOne({
      month: currentMonth,
      year: currentYear,
      isActive: true
    }).sort({ createdAt: -1 });

    // Nếu không có config cho tháng hiện tại, lấy config gần nhất
    if (!priceConfig) {
      priceConfig = await PriceConfig.findOne({ isActive: true })
        .sort({ year: -1, month: -1, createdAt: -1 });
    }

    // Nếu vẫn không có, trả về giá mặc định
    if (!priceConfig) {
      return res.status(200).json({
        priceConfig: {
          pricePerKm: 10000,
          basePrice: 10000,
          minPrice: 15000,
          month: currentMonth,
          year: currentYear,
          description: 'Giá mặc định'
        }
      });
    }

    res.status(200).json({ priceConfig });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy tất cả cấu hình giá (Admin)
exports.getAllPriceConfigs = async (req, res) => {
  try {
    const priceConfigs = await PriceConfig.find()
      .populate('createdBy', 'name username')
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.status(200).json({ priceConfigs });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy cấu hình giá theo tháng/năm
exports.getPriceByMonth = async (req, res) => {
  try {
    const { month, year } = req.params;

    const priceConfig = await PriceConfig.findOne({
      month: parseInt(month),
      year: parseInt(year),
      isActive: true
    }).populate('createdBy', 'name username');

    if (!priceConfig) {
      return res.status(404).json({ message: 'Không tìm thấy cấu hình giá cho tháng này' });
    }

    res.status(200).json({ priceConfig });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Tạo hoặc cập nhật cấu hình giá (Admin)
exports.createOrUpdatePrice = async (req, res) => {
  try {
    const { month, year, pricePerKm, basePrice, minPrice, description } = req.body;

    // Validate
    if (!month || !year || !pricePerKm) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ message: 'Tháng không hợp lệ (1-12)' });
    }

    if (pricePerKm < 0 || basePrice < 0 || minPrice < 0) {
      return res.status(400).json({ message: 'Giá không được âm' });
    }

    // Kiểm tra đã có config cho tháng này chưa
    const existingConfig = await PriceConfig.findOne({
      month: parseInt(month),
      year: parseInt(year)
    });

    let isUpdate = false;
    let priceConfig;

    if (existingConfig) {
      // Cập nhật
      const oldPricePerKm = existingConfig.pricePerKm;
      existingConfig.pricePerKm = pricePerKm;
      existingConfig.basePrice = basePrice || 10000;
      existingConfig.minPrice = minPrice || 15000;
      existingConfig.description = description || '';
      existingConfig.isActive = true;
      await existingConfig.save();
      
      priceConfig = existingConfig;
      isUpdate = true;

      // Gửi thông báo nếu thay đổi giá
      if (oldPricePerKm !== pricePerKm) {
        const priceChange = pricePerKm - oldPricePerKm;
        const changePercent = ((priceChange / oldPricePerKm) * 100).toFixed(1);
        const changeText = priceChange > 0 ? 'tăng' : 'giảm';
        
        await notifyAllCustomers({
          type: 'PRICE_CHANGE',
          title: 'Thông báo thay đổi giá cước',
          message: `Giá cước tháng ${month}/${year} đã ${changeText} ${Math.abs(changePercent)}%. Giá mới: ${pricePerKm.toLocaleString()}đ/km (Giá mở cửa: ${(basePrice || 10000).toLocaleString()}đ, Tối thiểu: ${(minPrice || 15000).toLocaleString()}đ)`,
          data: {
            month,
            year,
            oldPrice: oldPricePerKm,
            newPrice: pricePerKm,
            basePrice: basePrice || 10000,
            minPrice: minPrice || 15000,
            changePercent
          }
        });
      }

      return res.status(200).json({
        message: 'Cập nhật cấu hình giá thành công',
        priceConfig,
        notificationSent: oldPricePerKm !== pricePerKm
      });
    }

    // Tạo mới
    priceConfig = await PriceConfig.create({
      month: parseInt(month),
      year: parseInt(year),
      pricePerKm,
      basePrice: basePrice || 10000,
      minPrice: minPrice || 15000,
      description: description || '',
      createdBy: req.user._id
    });

    // Gửi thông báo cho khách hàng về giá mới
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Chỉ thông báo nếu là tháng hiện tại hoặc tháng tiếp theo
    if ((year === currentYear && month >= currentMonth) || (year === currentYear + 1 && month === 1 && currentMonth === 12)) {
      await notifyAllCustomers({
        type: 'PRICE_CHANGE',
        title: 'Thông báo giá cước mới',
        message: `Giá cước tháng ${month}/${year}: ${pricePerKm.toLocaleString()}đ/km (Giá mở cửa: ${(basePrice || 10000).toLocaleString()}đ, Tối thiểu: ${(minPrice || 15000).toLocaleString()}đ). ${description || ''}`,
        data: {
          month,
          year,
          pricePerKm,
          basePrice: basePrice || 10000,
          minPrice: minPrice || 15000,
          description
        }
      });
    }

    res.status(201).json({
      message: 'Tạo cấu hình giá thành công',
      priceConfig,
      notificationSent: true
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa cấu hình giá (Admin)
exports.deletePriceConfig = async (req, res) => {
  try {
    const priceConfig = await PriceConfig.findById(req.params.id);

    if (!priceConfig) {
      return res.status(404).json({ message: 'Không tìm thấy cấu hình giá' });
    }

    // Không cho xóa config của tháng hiện tại
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (priceConfig.month === currentMonth && priceConfig.year === currentYear) {
      return res.status(400).json({ 
        message: 'Không thể xóa cấu hình giá của tháng hiện tại' 
      });
    }

    await PriceConfig.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Xóa cấu hình giá thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Tính giá chuyến xe dựa trên cấu hình hiện tại
exports.calculatePrice = async (req, res) => {
  try {
    const { distance } = req.body; // distance in meters

    if (!distance || distance <= 0) {
      return res.status(400).json({ message: 'Khoảng cách không hợp lệ' });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Lấy config giá hiện tại
    let priceConfig = await PriceConfig.findOne({
      month: currentMonth,
      year: currentYear,
      isActive: true
    }).sort({ createdAt: -1 });

    // Nếu không có, lấy config gần nhất
    if (!priceConfig) {
      priceConfig = await PriceConfig.findOne({ isActive: true })
        .sort({ year: -1, month: -1, createdAt: -1 });
    }

    // Giá mặc định nếu không có config
    const pricePerKm = priceConfig ? priceConfig.pricePerKm : 10000;
    const basePrice = priceConfig ? priceConfig.basePrice : 10000;
    const minPrice = priceConfig ? priceConfig.minPrice : 15000;

    // Tính giá: basePrice + (distance_km * pricePerKm)
    const distanceKm = distance / 1000;
    let totalPrice = basePrice + (distanceKm * pricePerKm);

    // Làm tròn đến 1000đ
    totalPrice = Math.round(totalPrice / 1000) * 1000;

    // Đảm bảo giá tối thiểu
    if (totalPrice < minPrice) {
      totalPrice = minPrice;
    }

    res.status(200).json({
      distance,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      pricePerKm,
      basePrice,
      minPrice,
      totalPrice,
      priceConfig: priceConfig ? {
        month: priceConfig.month,
        year: priceConfig.year,
        description: priceConfig.description
      } : null
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
