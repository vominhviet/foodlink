// frontend/src/components/Dashboard.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getProducts, getInvoices, login, register } from "../api";

export default function Dashboard() {
  const [filteredRevenue, setFilteredRevenue] = useState(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [allInvoices, setAllInvoices] = useState([]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    todayInvoices: 0,
    revenue: 0,
    growth: 0
  });
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          navigate("/login");
          return;
        }
  // Lấy danh sách hóa đơn đầy đủ để tính doanh thu
  // allInvoicesRes.data là mảng các hóa đơn lấy từ backend
  const allInvoicesRes = await getInvoices();
  setAllInvoices(allInvoicesRes.data);
  console.log('Invoices:', allInvoicesRes.data); // Debug: in ra danh sách hóa đơn

  // Tính tổng doanh thu ban đầu (không lọc)
  //  Duyệt qua từng hóa đơn, cộng dồn trường total_amount (hoặc total nếu không có)
  const revenue = allInvoicesRes.data.reduce((sum, inv) => {
    // Ưu tiên lấy trường total_amount, nếu không có thì lấy total, nếu không có thì 0
    let total = 0;
    if (inv.total_amount !== undefined && inv.total_amount !== null) {
      total = parseInt(inv.total_amount) || 0;
    } else if (inv.total !== undefined && inv.total !== null) {
      total = parseInt(inv.total) || 0;
    }
    return sum + total;
  }, 0);
  // setStats chỉ lưu revenue, các trường khác đã bỏ
  setStats({ revenue });

  // Lấy danh sách sản phẩm rút gọn
  const productsRes = await getProducts();
  setProducts(productsRes.data.slice(0, 5)); // lấy 5 sản phẩm mới nhất

  // Lấy danh sách hóa đơn rút gọn
  setInvoices(allInvoices.slice(0, 5)); // lấy 5 hóa đơn mới nhất

  // Lấy danh sách báo cáo rút gọn
  // Giả sử chưa có hàm getReports, tạm bỏ qua hoặc thêm sau
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Tự động lọc doanh thu khi thay đổi ngày/tháng
  useEffect(() => {
    // Debug: log allInvoices và ngày lọc
    console.log('Auto-filter: allInvoices', allInvoices);
    console.log('Auto-filter: filterFrom', filterFrom, 'filterTo', filterTo);
    const from = filterFrom ? new Date(filterFrom) : null;
    const to = filterTo ? new Date(filterTo) : null;
    // Sử dụng trường 'created_at' của hóa đơn để lọc
    const filtered = allInvoices.filter(inv => {
  if (!inv.created_at) return false;
  // Chỉ lấy phần ngày để so sánh
  const invoiceDate = inv.created_at.slice(0, 10); // "YYYY-MM-DD"
  let dateOk = true;
  if (filterFrom) dateOk = invoiceDate >= filterFrom;
  if (filterTo) dateOk = dateOk && invoiceDate <= filterTo;
  return dateOk;
});

    console.log('Filtered invoices:', filtered);
    // Tính tổng doanh thu của các hóa đơn đã lọc
    const revenue = filtered.reduce((sum, inv) => {
      let total = 0;
      if (inv.total_amount !== undefined && inv.total_amount !== null) {
        total = parseInt(inv.total_amount) || 0;
      } else if (inv.total !== undefined && inv.total !== null) {
        total = parseInt(inv.total) || 0;
      }
      console.log('Invoice:', inv, 'total:', total);
      return sum + total;
    }, 0);
    console.log('Filtered revenue:', revenue);
    setFilteredRevenue(revenue);
    // Debug: Hiển thị danh sách hóa đơn đã lọc ra bảng
    console.log('Filtered invoices for table:', filtered);
  }, [filterFrom, filterTo, allInvoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
  <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,width:'100vw',height:'100vh',background:'#f6f8fa',display:'flex',fontFamily:'Segoe UI, Arial, sans-serif',overflow:'auto'}}>
      {/* Sidebar */}
      <aside style={{width:260, background:'#fff', boxShadow:'2px 0 16px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'40px 24px', borderRadius:'0 24px 24px 0'}}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:32}}>
            {/* <div style={{width:44, height:44, background:'#eafbe7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#2ecc71', fontSize:24}}>M</div> */}
            <span style={{fontSize:22, fontWeight:700, color:'#222'}}>Manage - Food Link</span>
          </div>
          <nav style={{display:'flex', flexDirection:'column', gap:10}}> 
            <Link to="/dashboard" style={{padding:'10px 18px', borderRadius:10, fontWeight:600, color:'#2ecc71', background:'#eafbe7', textDecoration:'none'}}>Dashboard</Link>
            <Link to="/products" style={{padding:'10px 18px', borderRadius:10, fontWeight:600, color:'#555', textDecoration:'none', marginTop:2}}>Sản phẩm</Link>
            <Link to="/invoice" style={{padding:'10px 18px', borderRadius:10, fontWeight:600, color:'#555', textDecoration:'none', marginTop:2}}>Tạo Hóa đơn</Link>
            <Link to="/history" style={{padding:'10px 18px', borderRadius:10, fontWeight:600, color:'#555', textDecoration:'none', marginTop:2}}>Quản Lý Đơn Hàng</Link>
            <Link to="/report" style={{padding:'10px 18px', borderRadius:10, fontWeight:600, color:'#555', textDecoration:'none', marginTop:2}}>Báo cáo</Link>
          </nav>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:32}}>
          <span style={{fontSize:15, color:'#888'}}>{user?.username}</span>
          <button onClick={handleLogout} style={{padding:'10px 18px', borderRadius:10, background:'#ffeaea', color:'#e74c3c', fontWeight:600, border:'none', cursor:'pointer'}}>Đăng xuất</button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        {/* Header */}
        <header style={{width:'100%', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', padding:'24px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:'0 0 24px 24px'}}>
          <input type="text" placeholder="Tìm kiếm..." style={{width:'32%', padding:'10px 16px', borderRadius:8, border:'1px solid #e1e4e8', fontSize:16}} />
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <span style={{fontWeight:600, color:'#222', fontSize:16}}>{user?.username}</span>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main style={{flex:1, padding:'40px 40px 0 40px'}}>
          <h2 style={{fontSize:28, fontWeight:700, color:'#222', marginBottom:32}}>Dashboard</h2>
          {/* Bộ lọc doanh thu theo ngày/tháng - doanh thu sẽ tự động cập nhật khi chọn ngày */}
          <div style={{display:'flex', gap:24, marginBottom:32, alignItems:'center', flexWrap:'wrap'}}>
            <div>
              <label style={{fontWeight:600, marginRight:8}}>Từ ngày (chọn để tự động lọc):</label>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{padding:'6px 12px', borderRadius:6, border:'1px solid #e3eaf3', fontSize:15}} />
            </div>
            <div>
              <label style={{fontWeight:600, marginRight:8}}>Đến ngày (chọn để tự động lọc):</label>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{padding:'6px 12px', borderRadius:6, border:'1px solid #e3eaf3', fontSize:15}} />
            </div>
            {/* Doanh thu sẽ tự động cập nhật khi bạn chọn ngày, không cần bấm nút */}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:32, marginBottom:40}}>
            <div style={{background:'linear-gradient(135deg,#eafbe7,#fff)', borderRadius:18, boxShadow:'0 2px 12px rgba(46,204,113,0.08)', padding:28, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:15, color:'#888'}}>Tổng sản phẩm</div>
                <div style={{fontSize:32, fontWeight:700, color:'#2ecc71', marginTop:8}}>{stats.totalProducts}</div>
              </div>
              <div style={{fontSize:13, color:'#27ae60', marginTop:18}}>Tăng so với tháng trước</div>
            </div>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(46,204,113,0.08)', padding:28, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:15, color:'#888'}}>Hóa đơn hôm nay</div>
                <div style={{fontSize:32, fontWeight:700, color:'#2ecc71', marginTop:8}}>{stats.todayInvoices}</div>
              </div>
              <div style={{fontSize:13, color:'#27ae60', marginTop:18}}>Tăng so với tháng trước</div>
            </div>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(241,196,15,0.08)', padding:28, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:15, color:'#888'}}>Doanh thu</div>
                <div style={{fontSize:32, fontWeight:700, color:'#f1c40f', marginTop:8}}>
                  {filteredRevenue !== null
                    ? `${filteredRevenue.toLocaleString()}₫`
                    : `${stats.revenue.toLocaleString()}₫`}
                </div>
                <div style={{fontSize:15, color:'#888', marginTop:8}}>
                  {filteredRevenue !== null && (filterFrom || filterTo) ? (
                    <span>
                      (Từ {filterFrom || '...'} đến {filterTo || '...'})
                    </span>
                  ) : null}
                </div>
              </div>
              <div style={{fontSize:13, color:'#f1c40f', marginTop:18}}>Tăng trưởng</div>
            </div>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(46,204,113,0.08)', padding:28, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:15, color:'#888'}}>Tăng trưởng</div>
                <div style={{fontSize:32, fontWeight:700, color: stats.growth >= 0 ? '#2ecc71' : '#888', marginTop:8}}>{stats.growth > 0 ? '+' : ''}{stats.growth}%</div>
              </div>
              <div style={{fontSize:13, color:'#27ae60', marginTop:18}}>So với tháng trước</div>
            </div>
          </div>

          {/* Project Analytics & Progress (placeholder) */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:32}}>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(46,204,113,0.08)', padding:28}}>
              <div style={{fontWeight:600, color:'#222', marginBottom:12}}>Phân tích sản phẩm</div>
              <div style={{display:'flex', gap:8, marginTop:16}}>
                <div style={{height:48, width:16, background:'#eafbe7', borderRadius:8}}></div>
                <div style={{height:36, width:16, background:'#2ecc71', borderRadius:8}}></div>
                <div style={{height:60, width:16, background:'#b7e4c7', borderRadius:8}}></div>
                <div style={{height:28, width:16, background:'#eafbe7', borderRadius:8}}></div>
                <div style={{height:44, width:16, background:'#b7e4c7', borderRadius:8}}></div>
              </div>
            </div>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(46,204,113,0.08)', padding:28, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div style={{fontWeight:600, color:'#222', marginBottom:12}}>Tiến độ dự án</div>
              <div style={{display:'flex', alignItems:'center', gap:18, marginTop:16}}>
                <div style={{width:64, height:64, borderRadius:'50%', background:'#eafbe7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#2ecc71'}}>41%</div>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <span style={{fontSize:13, color:'#27ae60'}}>Hoàn thành</span>
                  <span style={{fontSize:13, color:'#f1c40f'}}>Đang làm</span>
                  <span style={{fontSize:13, color:'#888'}}>Chờ xử lý</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng rút gọn danh sách sản phẩm, hóa đơn, báo cáo */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:32, marginTop:48}}>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(46,204,113,0.08)', padding:28}}>
              <div style={{fontWeight:700, fontSize:18, color:'#2ecc71', marginBottom:18}}>SẢN PHẨM</div>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{textAlign:'left', background:'#f6f8fa'}}>
                    <th style={{padding:'8px 0'}}>Tên</th>
                    <th style={{padding:'8px 0'}}>Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                      <td style={{padding:'8px 0'}}>{p.name}</td>
                      <td style={{padding:'8px 0'}}>{p.price?.toLocaleString()}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(52,152,219,0.08)', padding:28}}>
              <div style={{fontWeight:700, fontSize:18, color:'#3498db', marginBottom:18}}>Hóa đơn mới nhất</div>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{textAlign:'left', background:'#f6f8fa'}}>
                    <th style={{padding:'8px 0'}}>Mã</th>
                    <th style={{padding:'8px 0'}}>Khách</th>
                    <th style={{padding:'8px 0'}}>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                      <td style={{padding:'8px 0'}}>{inv.code}</td>
                      <td style={{padding:'8px 0'}}>{inv.customer}</td>
                      <td style={{padding:'8px 0'}}>{inv.total?.toLocaleString()}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:'#fff', borderRadius:18, boxShadow:'0 2px 12px rgba(155,89,182,0.08)', padding:28}}>
              <div style={{fontWeight:700, fontSize:18, color:'#9b59b6', marginBottom:18}}>Báo cáo mới nhất</div>
              <ul style={{paddingLeft:0, margin:0}}>
                {reports.map((r) => (
                  <li key={r.id} style={{marginBottom:16, listStyle:'none', borderBottom:'1px solid #f0f0f0', paddingBottom:8}}>
                    <strong style={{fontSize:16}}>{r.title}</strong><br/>
                    <span style={{fontSize:13, color:'#888'}}>{r.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}