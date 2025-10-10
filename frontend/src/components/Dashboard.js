// frontend/src/components/Dashboard.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getInvoices } from "../api";
import ImportForm from "./ImportForm";

export default function Dashboard() {
  const [filteredRevenue, setFilteredRevenue] = useState(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [allInvoices, setAllInvoices] = useState([]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    todayInvoices: 0,
    revenue: 0,
    growth: 0,
    totalProducts: 0,
    pendingInvoices: 0
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = useNavigate();

  // Fetch dữ liệu và user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) {
          navigate("/login");
          return;
        }
        setUser(JSON.parse(userData));

        const allInvoicesRes = await getInvoices();
        const data = allInvoicesRes.data || [];
        console.log("Invoices:", data);
        setAllInvoices(data);

        // Tính toán thống kê
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        
        // Hóa đơn hôm nay
        const todayInvoices = data.filter(
          (inv) => inv.created_at?.slice(0, 10) === today
        );

        // Hóa đơn hôm qua (để tính tăng trưởng)
        const yesterdayInvoices = data.filter(
          (inv) => inv.created_at?.slice(0, 10) === yesterday
        );

        // Doanh thu hôm nay
        const todayRevenue = todayInvoices.reduce((sum, inv) => {
          let total = inv.total_amount ?? inv.total ?? 0;
          return sum + Number(total);
        }, 0);

        // Doanh thu hôm qua
        const yesterdayRevenue = yesterdayInvoices.reduce((sum, inv) => {
          let total = inv.total_amount ?? inv.total ?? 0;
          return sum + Number(total);
        }, 0);

        // Tổng doanh thu
        const totalRevenue = data.reduce((sum, inv) => {
          let total = inv.total_amount ?? inv.total ?? 0;
          return sum + Number(total);
        }, 0);

        // Tính phần trăm tăng trưởng
        let growth = 0;
        if (yesterdayRevenue > 0) {
          growth = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1);
        } else if (todayRevenue > 0) {
          growth = 100;
        }

        // Hóa đơn chờ xử lý (giả định status = 'pending' hoặc không có status)
        const pendingInvoices = data.filter(
          (inv) => inv.status === 'pending' || !inv.status
        ).length;

        // Ước tính tổng sản phẩm từ tất cả hóa đơn
        const estimatedProducts = new Set();
        data.forEach(inv => {
          if (Array.isArray(inv.items)) {
            inv.items.forEach(item => {
              if (item.name) estimatedProducts.add(item.name);
            });
          }
        });

        setStats({ 
          revenue: totalRevenue, 
          todayInvoices: todayInvoices.length, 
          growth: parseFloat(growth),
          totalProducts: estimatedProducts.size,
          pendingInvoices
        });

        // 5 hóa đơn gần nhất (sắp xếp theo created_at giảm dần)
        const sortedInvoices = [...data].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ).slice(0, 5);
        
        setInvoices(sortedInvoices);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Refresh data khi import thành công
  const handleImportSuccess = () => {
    setShowImportModal(false);
    // Reload data
    window.location.reload();
  };

  // Lọc doanh thu theo ngày
  useEffect(() => {
    const filtered = allInvoices.filter((inv) => {
      if (!inv.created_at) return false;
      const invoiceDate = inv.created_at.slice(0, 10);
      let ok = true;
      if (filterFrom) ok = invoiceDate >= filterFrom;
      if (filterTo) ok = ok && invoiceDate <= filterTo;
      return ok;
    });

    const revenue = filtered.reduce((sum, inv) => {
      let total = inv.total_amount ?? inv.total ?? 0;
      return sum + Number(total);
    }, 0);

    setFilteredRevenue(revenue);
  }, [filterFrom, filterTo, allInvoices]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Format số tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r border-blue-100">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-8">Manage - Food Link</h1>
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:border-blue-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link
              to="/invoice"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Tạo Hóa đơn
            </Link>
            <Link
              to="/history"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quản Lý Đơn Hàng
            </Link>
            <Link
              to="/inventory"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              Quản Lý Tồn Kho
            </Link>
            <Link
              to="/expenses"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Quản Lý Chi Phí
            </Link>
             <Link
              to="/import"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Quản lí nhập hàng
            </Link>
          </nav>
        </div>
        
        <div className="p-6 border-t border-blue-100 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
              <span className="font-semibold text-blue-600">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.username}</p>
              <p className="text-sm text-blue-500">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-all duration-200 border border-red-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-blue-100">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm hóa đơn, khách hàng..."
                  className="block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Import Excel
              </button>
              <div className="text-right">
                <p className="font-medium text-gray-900">Chào mừng trở lại!</p>
                <p className="text-sm text-blue-500">{user?.username}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Xin chào, {user?.username}! 👋</h1>
                <p className="text-blue-100 text-lg">Chúc bạn một ngày làm việc hiệu quả và thành công</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-blue-500 bg-opacity-50 rounded-lg px-4 py-2">
                    <p className="text-sm text-blue-100">Hôm nay</p>
                    <p className="font-semibold">{new Date().toLocaleDateString('vi-VN', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  <div className="bg-green-500 bg-opacity-50 rounded-lg px-4 py-2">
                    <p className="text-sm text-green-100">Tổng doanh thu</p>
                    <p className="font-semibold">{formatCurrency(stats.revenue)}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white bg-opacity-20 rounded-full p-4 inline-block">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              Bộ lọc thống kê
            </h2>
            <div className="flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 transition-all duration-200"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 transition-all duration-200"
                />
              </div>
              <div className="flex-1 min-w-[300px]">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Doanh thu đã lọc</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(filteredRevenue !== null ? filteredRevenue : stats.revenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Thống kê */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tổng sản phẩm */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tổng sản phẩm</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
                  <p className="text-blue-200 text-xs mt-1">Từ {allInvoices.length} hóa đơn</p>
                </div>
                <div className="p-3 bg-blue-400 bg-opacity-50 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Hóa đơn hôm nay */}
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm font-medium">Hóa đơn hôm nay</p>
                  <p className="text-3xl font-bold mt-2">{stats.todayInvoices}</p>
                  <p className="text-cyan-200 text-xs mt-1">Tổng: {allInvoices.length} hóa đơn</p>
                </div>
                <div className="p-3 bg-cyan-400 bg-opacity-50 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Doanh thu */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Tổng doanh thu</p>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(filteredRevenue !== null ? filteredRevenue : stats.revenue)}
                  </p>
                  <p className={`text-xs mt-1 ${stats.growth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {stats.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.growth)}% so với hôm qua
                  </p>
                </div>
                <div className="p-3 bg-indigo-400 bg-opacity-50 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chờ xử lý */}
            <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-100 text-sm font-medium">Chờ xử lý</p>
                  <p className="text-3xl font-bold mt-2">{stats.pendingInvoices}</p>
                  <p className="text-sky-200 text-xs mt-1">Cần xác nhận</p>
                </div>
                <div className="p-3 bg-sky-400 bg-opacity-50 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Grid dưới */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hóa đơn mới nhất */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Hóa đơn mới nhất
                </h3>
                <Link 
                  to="/history" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors duration-200"
                >
                  Xem tất cả
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Mã HĐ</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Khách hàng</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Tổng tiền</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ngày</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {inv.invoice_number || `HD${inv.id}`}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {inv.customer_name || `Khách #${inv.customer_id}`}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-blue-600 text-right">
                          {formatCurrency(inv.total_amount || inv.total || 0)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(inv.created_at).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">Chưa có hóa đơn nào</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Thao tác nhanh
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/invoice"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors duration-200">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-medium text-blue-700">Tạo hóa đơn</span>
                </Link>
                <Link
                  to="/inventory"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cyan-200 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 group hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-cyan-200 transition-colors duration-200">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="font-medium text-cyan-700">Nhập kho</span>
                </Link>
                <Link
                  to="/expenses"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 group hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors duration-200">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <span className="font-medium text-indigo-700">Chi phí</span>
                </Link>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 group hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors duration-200">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  </div>
                  <span className="font-medium text-green-700">Import Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900">Import dữ liệu từ Excel</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ImportForm onSuccess={handleImportSuccess} onCancel={() => setShowImportModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}