# Quản Lý Bán Hàng & Tồn Kho

Ứng dụng này được xây dựng bằng **React (frontend)** và **Node.js + Express + PostgreSQL (backend)** để quản lý **hóa đơn, tồn kho và chi phí**.

---

## 🚀 Chức năng chính

### 🧾 Quản lý Hóa đơn (Invoices)
- Tạo hóa đơn bán hàng với thông tin khách hàng:
  - Tên khách hàng
  - Địa chỉ
  - Số điện thoại
  - Người bán
- Thêm danh sách sản phẩm (tên, đơn vị, giá, số lượng)
- Tự động tính tổng tiền và thành tiền
- Xem lại hóa đơn trước khi lưu
- Chỉnh sửa hóa đơn
- Xóa hóa đơn

### 📦 Quản lý Tồn kho (Inventory)
- **Nhập kho**: Thêm sản phẩm mới vào kho
- **Xuất kho**: Quản lý xuất hàng bán
- **Theo dõi tồn kho**: Xem số lượng tồn thực tế
- **Cảnh báo**: Thông báo khi sản phẩm sắp hết
- **Lịch sử giao dịch**: Theo dõi nhập/xuất kho

### 💰 Quản lý Chi phí (Expenses)
- Thêm chi phí: loại, số tiền, ghi chú, ngày
- Hiển thị danh sách chi phí
- Lọc chi phí theo loại và ngày
- Tính tổng chi phí

### 📊 Báo cáo & Thống kê
- **Dashboard tổng quan**: Doanh thu, số hóa đơn, tồn kho
- **Báo cáo tồn kho**: Thống kê hàng hóa trong kho
- **Lịch sử đơn hàng**: Quản lý và theo dõi đơn hàng
- **Xuất Excel**: Xuất dữ liệu ra file Excel

---

## 🛠️ Cấu trúc dự án

### 📂 Frontend (React)
frontend/
├── public/
│ ├── index.html
│ └── favicon.ico
└── src/
├── components/
│ ├── Dashboard.js # Trang tổng quan
│ ├── Login.js # Đăng nhập
│ ├── Register.js # Đăng ký
│ ├── InvoiceManager.js # Tạo hóa đơn
│ ├── History.js # Lịch sử đơn hàng
│ ├── Expenses.js # Quản lý chi phí
│ ├── InventoryManager.js # Quản lý tồn kho
│ ├── ImportForm.js # Nhập kho
│ └── InventoryReport.js # Báo cáo tồn kho
├── App.js # Component chính
├── index.js # Entry point
└── api.js # API calls


### 📂 Backend (Node.js + Express + PostgreSQL)
backend/
├── config/
│ └── db.js # Kết nối database
├── database/
│ └── init.js # Khởi tạo bảng
├── routes/
│ ├── auth.js # API xác thực
│ ├── invoices.js # API hóa đơn
│ ├── history.js # API lịch sử
│ ├── expenses.js # API chi phí
│ ├── products.js # API sản phẩm
│ ├── import.js # API nhập kho
│ └── reports.js # API báo cáo
├── .env # Biến môi trường
└── server.js # Server chính



---

## 🗄️ Cơ sở dữ liệu (PostgreSQL)

### Các bảng chính:
- **users** - Người dùng hệ thống
- **customers** - Khách hàng
- **products** - Sản phẩm
- **invoices** - Hóa đơn
- **stock_transactions** - Giao dịch tồn kho
- **expenses** - Chi phí

---

## ⚙️ Cài đặt và chạy

### 1. Clone dự án
```bash
git clone https://github.com/your-repo/manage-system.git
cd manage-system
Cài đặt Backend
cd backend
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa file .env với thông tin database của bạn
DB_HOST=localhost
DB_PORT=5432
DB_NAME=manage_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=5000