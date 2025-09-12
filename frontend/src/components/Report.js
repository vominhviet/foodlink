// Quản lý nhập hàng, xuất hàng và báo cáo tồn kho
import React, { useState, useEffect } from "react";
import axios from "axios";
import {  } from "../api";

export default function Report() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("report");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([
    { name: "", unit: "", quantity: 0, price: 0 }
  ]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await axios.get('/api/products');
        setProducts(res.data);
        // Giả sử có API /api/stock-history trả về lịch sử nhập/xuất
        const his = await axios.get("http://localhost:5000/api/stock-history");
        setHistory(his.data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Nhập hàng
  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    await axios.post("http://localhost:5000/api/stock-history", {
      productId: selectedProduct,
      productName: products.find(p => p._id === selectedProduct).name,
      type: "import",
      quantity: Number(quantity),
      date: new Date().toISOString(),
      user: "admin" // Thay đổi theo thông tin người dùng thực tế
    });
    // Cập nhật tồn kho
    await axios.put(`http://localhost:5000/api/products/${selectedProduct}`, {
      stock: Number(products.find(p => p._id === selectedProduct).stock) + Number(quantity)
    });
    window.location.reload();
  };

  // Xuất hàng
  const handleExport = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const prod = products.find(p => p._id === selectedProduct);
    if (Number(prod.stock) < Number(quantity)) {
      alert("Số lượng xuất vượt tồn kho!");
      return;
    }
    await axios.post("http://localhost:5000/api/stock-history", {
      productId: selectedProduct,
      productName: prod.name,
      type: "export",
      quantity: Number(quantity),
      date: new Date().toISOString(),
      user: "admin" // Thay đổi theo thông tin người dùng thực tế
    });
    await axios.put(`http://localhost:5000/api/products/${selectedProduct}`, {
      stock: Number(prod.stock) - Number(quantity)
    });
    window.location.reload();
  };

  // Thêm dòng mới
  const addRow = () => setRows([...rows, { name: "", unit: "", quantity: 0, price: 0 }]);

  // Xóa dòng
  const removeRow = (idx) => setRows(rows.filter((_, i) => i !== idx));

  // Cập nhật giá trị từng ô
  const handleChange = (idx, field, value) => {
    const newRows = [...rows];
    newRows[idx][field] = field === "quantity" || field === "price" ? Number(value) : value;
    setRows(newRows);
  };

  // Lưu vào database
  const handleSave = async () => {
    try {
      // Gửi từng dòng lên backend để lưu vào stock_history và cập nhật tồn kho
      for (const row of rows) {
        await axios.post("http://localhost:5000/api/stock-history", {
          product_name: row.name,
          unit: row.unit,
          quantity: row.quantity,
          price: row.price,
          type: "import"
        });
      }
      alert("Đã lưu nhập kho!");
      setRows([{ name: "", unit: "", quantity: 0, price: 0 }]);
    } catch (err) {
      alert("Lỗi khi lưu nhập kho!");
    }
  };

  return (
    <div style={{width:'100vw', minHeight:'100vh', background:'#f6f8fa', fontFamily:'Segoe UI, Roboto, Arial'}}>
      <div style={{maxWidth:1200, margin:'40px auto', background:'#fff', borderRadius:16, boxShadow:'0 8px 32px #e3eaf3', padding:32}}>
        <div style={{display:'flex', gap:16, marginBottom:32}}>
          <button onClick={()=>setTab('import')} style={{padding:'10px 32px', fontWeight:700, borderRadius:8, border:'none', background:tab==='import'?'#27ae60':'#e3eaf3', color:tab==='import'?'#fff':'#222'}}>Nhập kho</button>
          <button onClick={()=>setTab('export')} style={{padding:'10px 32px', fontWeight:700, borderRadius:8, border:'none', background:tab==='export'?'#1b73d8':'#e3eaf3', color:tab==='export'?'#fff':'#222'}}>Xuất kho</button>
          <button onClick={()=>setTab('report')} style={{padding:'10px 32px', fontWeight:700, borderRadius:8, border:'none', background:tab==='report'?'#f39c12':'#e3eaf3', color:tab==='report'?'#fff':'#222'}}>Báo cáo tồn kho</button>
        </div>
        {loading ? <div>Đang tải dữ liệu...</div> : (
          <>
            {tab === 'export' && (
              <form onSubmit={handleExport} style={{maxWidth:500, margin:'0 auto', background:'#f8fafc', padding:24, borderRadius:12, boxShadow:'0 2px 8px #e3eaf3'}}>
                <h2 style={{fontWeight:700, fontSize:24, marginBottom:24}}>Xuất kho</h2>
                <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)} style={{width:'100%', padding:12, borderRadius:8, marginBottom:16}} required>
                  <option value="">Chọn sản phẩm...</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Số lượng xuất" style={{width:'100%', padding:12, borderRadius:8, marginBottom:16}} required />
                <button type="submit" style={{padding:'10px 32px', background:'#1b73d8', color:'#fff', border:'none', borderRadius:8, fontWeight:700}}>Xác nhận xuất kho</button>
              </form>
            )}
            {tab === 'report' && (
              <div>
                <h2 style={{fontWeight:700, fontSize:24, marginBottom:24}}>Báo cáo tồn kho</h2>
                <table style={{width:'100%', borderCollapse:'collapse', background:'#f8fafc', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px #e3eaf3'}}>
                  <thead>
                    <tr style={{background:'#e3eaf3', fontWeight:700}}>
                      <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Sản phẩm</th>
                      <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Tồn kho</th>
                      <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Nhập/Xuất gần nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const his = history.filter(h => h.productId === p._id);
                      const last = his.length ? his[his.length-1] : null;
                      return (
                        <tr key={p._id} style={{background:'#fff'}}>
                          <td style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>{p.name}</td>
                          <td style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>{p.stock}</td>
                          <td style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>{last ? `${last.type === 'import' ? 'Nhập' : 'Xuất'} ${last.quantity} lúc ${new Date(last.date).toLocaleString()}` : 'Chưa có'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <h3 style={{marginTop:32, fontWeight:700}}>Lịch sử nhập/xuất</h3>
                <table style={{width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px #e3eaf3', marginTop:16}}>
                  <thead>
                    <tr style={{background:'#e3eaf3', fontWeight:700}}>
                      <th style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>Thời gian</th>
                      <th style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>Sản phẩm</th>
                      <th style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>Loại</th>
                      <th style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, idx) => {
                      const prod = products.find(p => p._id === h.productId);
                      return (
                        <tr key={idx}>
                          <td style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>{new Date(h.date).toLocaleString()}</td>
                          <td style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>{prod ? prod.name : h.productId}</td>
                          <td style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>{h.type === 'import' ? 'Nhập' : 'Xuất'}</td>
                          <td style={{padding:'10px 0', border:'1px solid #e3eaf3'}}>{h.quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <h3 style={{marginTop:32, fontWeight:700}}>Chi tiết đơn nhập</h3>
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4">STT</th>
                      <th className="py-2 px-4">Tên sản phẩm</th>
                      <th className="py-2 px-4">Đơn vị tính</th>
                      <th className="py-2 px-4">Số lượng</th>
                      <th className="py-2 px-4">Đơn giá</th>
                      <th className="py-2 px-4">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2 px-4">{idx + 1}</td>
                        <td className="py-2 px-4">{item.name}</td>
                        <td className="py-2 px-4">{item.unit}</td>
                        <td className="py-2 px-4">{item.quantity}</td>
                        <td className="py-2 px-4">{item.price?.toLocaleString()}</td>
                        <td className="py-2 px-4">{(item.quantity * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="py-2 px-4 font-bold text-right">Tổng tiền đơn nhập:</td>
                      <td className="py-2 px-4 font-bold">
                        {rows.reduce((sum, item) => sum + item.quantity * item.price, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
        <div style={{marginTop: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16}}>Nhập kho nhanh</h2>
          <table style={{width: "100%", borderCollapse: "collapse", background: "#fff"}}>
            <thead>
              <tr style={{background: "#f6f8fa"}}>
                <th>STT</th>
                <th>Tên sản phẩm</th>
                <th>Đơn vị tính</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{textAlign: "center"}}>{idx + 1}</td>
                  <td>
                    <input value={row.name} onChange={e => handleChange(idx, "name", e.target.value)} style={{width: 120}} />
                  </td>
                  <td>
                    <input value={row.unit} onChange={e => handleChange(idx, "unit", e.target.value)} style={{width: 80}} />
                  </td>
                  <td>
                    <input type="number" value={row.quantity} min={0} onChange={e => handleChange(idx, "quantity", e.target.value)} style={{width: 60}} />
                  </td>
                  <td>
                    <input type="number" value={row.price} min={0} onChange={e => handleChange(idx, "price", e.target.value)} style={{width: 80}} />
                  </td>
                  <td style={{textAlign: "right"}}>{(row.quantity * row.price).toLocaleString()}₫</td>
                  <td>
                    {rows.length > 1 && <button onClick={() => removeRow(idx)}>Xóa</button>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{textAlign: "right", fontWeight: "bold"}}>Tổng tiền đơn nhập:</td>
                <td style={{textAlign: "right", fontWeight: "bold"}}>
                  {rows.reduce((sum, r) => sum + r.quantity * r.price, 0).toLocaleString()}₫
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <button onClick={addRow} style={{marginTop: 16, marginRight: 16}}>Thêm dòng</button>
          <button onClick={handleSave} style={{marginTop: 16, background: "#27ae60", color: "#fff", padding: "8px 24px", border: "none", borderRadius: 6, fontWeight: 600}}>Lưu nhập kho</button>
        </div>
      </div>
    </div>
  );
}
