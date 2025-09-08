// chưa danh sách đơn hàng
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getInvoices } from "../api";

function History() {
  // State cho filter và tìm kiếm
  const [searchText, setSearchText] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);

 useEffect(() => {
  getInvoices().then((res) => {
    setInvoices(res.data);
  });
}, []);
  // Hàm mở modal sửa
  const openEdit = (inv) => {
    setEditInvoice({
      ...inv,
      items: Array.isArray(inv.items) ? inv.items.map(item => ({...item})) : []
    });
    setEditModal(true);
  };

  // Hàm lưu sửa đổi
  const handleEditSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/invoices/${editInvoice.id}`, {
        date: editInvoice.created_at,
        seller: editInvoice.seller,
        customer_name: editInvoice.customer_name,
        customerPhone: editInvoice.customerPhone,
        address: editInvoice.address,
        items: editInvoice.items,
        total_amount: editInvoice.items.reduce((sum, item) => sum + (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0), 0),
        status: 'pending'
      });
      // Cập nhật lại danh sách
      const res = await getInvoices();
      setInvoices(res.data);
      setEditModal(false);
    } catch (err) {
      alert('Lưu sửa đổi thất bại!');
    }
  };

  // Hàm thay đổi trường trong modal
  const handleEditChange = (field, value) => {
    setEditInvoice({ ...editInvoice, [field]: value });
  };
  const handleEditItemChange = (idx, field, value) => {
    const newItems = editInvoice.items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setEditInvoice({ ...editInvoice, items: newItems });
  };
  const addEditItemRow = () => {
    setEditInvoice({ ...editInvoice, items: [...editInvoice.items, { name: '', unit: '', quantity: 1, price: 0 }] });
  };
  const removeEditItemRow = (idx) => {
    if (editInvoice.items.length > 1) {
      setEditInvoice({ ...editInvoice, items: editInvoice.items.filter((_, i) => i !== idx) });
    }
  };

  return (
    <div>
      <div style={{maxWidth:900, margin:'32px auto', background:'#fff', padding:32, borderRadius:16, boxShadow:'0 4px 24px rgba(52,152,219,0.08)', position:'relative'}}>
        <button
          style={{position:'absolute',top:24,right:32,padding:'8px 20px',background:'#1b73d8',color:'#fff',border:'none',borderRadius:6,fontWeight:'bold',cursor:'pointer',zIndex:1100}}
          onClick={()=>window.location.href='/dashboard'}
        >Quay về Dashboard</button>
        <h2 style={{textAlign:'center', marginBottom:32, fontFamily:'Segoe UI, Roboto, Arial, sans-serif', fontWeight:800, fontSize:30, color:'#1b73d8ff', letterSpacing:1}}>Danh sách hóa đơn</h2>
        <div style={{display:'flex', gap:24, marginBottom:24, alignItems:'center', flexWrap:'wrap'}}>
          <div>
            <label style={{fontWeight:600, marginRight:8}}>Từ ngày:</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{padding:'6px 12px', borderRadius:6, border:'1px solid #e3eaf3', fontSize:15}} />
          </div>
          <div>
            <label style={{fontWeight:600, marginRight:8}}>Đến ngày:</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{padding:'6px 12px', borderRadius:6, border:'1px solid #e3eaf3', fontSize:15}} />
          </div>
          <div>
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Tìm kiếm số điện thoại..." style={{padding:'6px 16px', borderRadius:6, border:'1px solid #e3eaf3', fontSize:15, minWidth:220}} />
          </div>
        </div>
        {/* <h2 style={{textAlign:'center', marginBottom:32, fontFamily:'Segoe UI, Roboto, Arial, sans-serif', fontWeight:800, fontSize:30, color:'#1565c0', letterSpacing:1}}>Danh sách hóa đơn</h2> */}
        <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0, marginBottom:24, fontFamily:'Segoe UI, Roboto, Arial, sans-serif', fontSize:16, borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px #e3eaf3'}}>
          <thead>
            {/* Thứ tự cột: Khách hàng -> Số điện thoại -> Địa chỉ -> Sản phẩm -> Tổng tiền -> Thao tác. Đảm bảo hiển thị đúng chuẩn UI. */}
            <tr style={{background:'#e3eaf3', color:'#222', fontWeight:700, fontSize:16}}>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Ngày lập</th>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Người bán</th>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Khách hàng</th>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Số điện thoại</th>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Địa chỉ</th>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Sản phẩm</th>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Tổng tiền</th>
              <th style={{padding:'12px 0', border:'1px solid #e3eaf3', textAlign:'center'}}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {/* Số điện thoại hiển thị sau Khách hàng và trước Địa chỉ. Đã chỉnh lại cho đúng bản chuẩn. */}
            {invoices
              .filter(inv => {
                // Filter theo ngày
                const created = inv.created_at ? new Date(inv.created_at) : null;
                const from = filterFrom ? new Date(filterFrom) : null;
                const to = filterTo ? new Date(filterTo) : null;
                let dateOk = true;
                if (from && created) dateOk = created >= from;
                if (to && created) dateOk = dateOk && created <= to;
                // Filter theo tên người bán, tên khách hàng, số điện thoại
                const search = searchText.trim().toLowerCase();
                let searchOk = true;
                if (search) {
                  searchOk = (inv.seller?.toLowerCase().includes(search) || "") ||
                    (inv.customer_name?.toLowerCase().includes(search) || "") ||
                    (inv.customer_phone?.toLowerCase().includes(search) || "") ||
                    (inv.phone?.toLowerCase().includes(search) || "");
                }
                return dateOk && searchOk;
              })
              .map(inv => (
              <tr key={inv.id} style={{background:'#fff', borderBottom:'1px solid #e3eaf3', transition:'background 0.2s'}} onMouseEnter={e => e.currentTarget.style.background='#f8fafc'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                <td style={{padding:'12px 0', border:'none', textAlign:'center', fontWeight:500}}>{inv.created_at ? new Date(inv.created_at).toLocaleString() : ''}</td>
                <td style={{padding:'12px 0', border:'none', textAlign:'center'}}>{inv.seller}</td>
                <td style={{padding:'12px 0', border:'none', textAlign:'center'}}>{inv.customer_name}</td>
                <td style={{padding:'12px 0', border:'none', textAlign:'center'}}>{inv.customer_phone || inv.phone || ''}</td>
                <td style={{padding:'12px 0', border:'none', textAlign:'center'}}> {
                  inv.address ||
                  inv.customerAddress ||
                  inv.customer_address ||
                  inv.customeraddress ||
                  ''
                }</td>
                <td style={{padding:'12px 0', border:'none', textAlign:'center'}}>
                  {Array.isArray(inv.items) ? inv.items.map((item, idx) => (
                    <span key={idx}>{item.name}{idx < inv.items.length - 1 ? ', ' : ''}</span>
                  )) : ''}
                </td>
                <td style={{padding:'12px 0', border:'none', textAlign:'center', fontWeight:700, color:'#1565c0'}}>{Number(inv.total_amount).toLocaleString('vi-VN')} đ</td>
                <td style={{padding:'12px 0', border:'none', textAlign:'center'}}>
                  <button
                    style={{marginRight:8, padding:'6px 18px', background:'#e74c3c', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, boxShadow:'0 2px 8px #e3eaf3', transition:'box-shadow 0.2s'}}
                    onClick={async () => {
                      if(window.confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
                        await axios.delete(`http://localhost:5000/api/invoices/${inv.id}`);
                        setInvoices(invoices.filter(i => i.id !== inv.id));
                      }
                    }}
                  >Xóa</button>
                  <button
                    style={{padding:'6px 18px', background:'#f1c40f', color:'#222', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, boxShadow:'0 2px 8px #e3eaf3', transition:'box-shadow 0.2s'}}
                    onClick={() => openEdit(inv)}
                  >Sửa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <div style={{textAlign:'center', color:'#888'}}>Chưa có hóa đơn nào được lưu.</div>}
      </div>
      
      {/* Modal sửa hóa đơn */}
      {editModal && editInvoice && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.2)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:48,borderRadius:0,width:'100vw',height:'100vh',maxWidth:'100vw',maxHeight:'100vh',boxShadow:'0 2px 16px #aaa',position:'relative',overflow:'auto',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
            <h3 style={{marginBottom:16}}>Sửa hóa đơn</h3>
            <div style={{marginBottom:12}}>
              <label>Ngày lập: </label>
              <input type="datetime-local" value={editInvoice.created_at ? new Date(editInvoice.created_at).toISOString().slice(0,16) : ''} onChange={e => handleEditChange('created_at', e.target.value)} />
            </div>
            <div style={{marginBottom:12}}>
              <label>Người bán: </label>
              <input value={editInvoice.seller} onChange={e => handleEditChange('seller', e.target.value)} />
            </div>
            <div style={{marginBottom:12}}>
              <label>Khách hàng: </label>
              <input value={editInvoice.customer_name} onChange={e => handleEditChange('customer_name', e.target.value)} />
            </div>
            <div style={{marginBottom:12}}>
              <label>Số điện thoại: </label>
              <input value={editInvoice.customerPhone || ''} onChange={e => handleEditChange('customerPhone', e.target.value)} />
            </div>
            <div style={{marginBottom:12}}>
              <label>Địa chỉ: </label>
              <input value={editInvoice.address || ''} onChange={e => handleEditChange('address', e.target.value)} />
            </div>
            <div style={{marginBottom:12}}>
              <label>Sản phẩm:</label>
              <table style={{width:'100%',marginTop:8}}>
                <thead>
                  <tr><th>Tên</th><th>Đơn vị</th><th>Số lượng</th><th>Đơn giá</th><th></th></tr>
                </thead>
                <tbody>
                  {editInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td><input value={item.name} onChange={e => handleEditItemChange(idx, 'name', e.target.value)} /></td>
                      <td><input value={item.unit} onChange={e => handleEditItemChange(idx, 'unit', e.target.value)} /></td>
                      <td><input type="number" min={1} value={item.quantity} onChange={e => handleEditItemChange(idx, 'quantity', e.target.value)} /></td>
                      <td><input type="number" min={0} value={item.price} onChange={e => handleEditItemChange(idx, 'price', e.target.value)} /></td>
                      <td><button onClick={() => removeEditItemRow(idx)} disabled={editInvoice.items.length<=1}>Xóa</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button style={{marginTop:8}} onClick={addEditItemRow}>Thêm sản phẩm</button>
            </div>
            <div style={{marginTop:24,display:'flex',gap:16}}>
              <button style={{padding:'8px 24px',background:'#27ae60',color:'#fff',border:'none',borderRadius:6,fontWeight:'bold',cursor:'pointer'}} onClick={handleEditSave}>Lưu sửa đổi</button>
              <button style={{padding:'8px 24px',background:'#e74c3c',color:'#fff',border:'none',borderRadius:6,fontWeight:'bold',cursor:'pointer'}} onClick={()=>setEditModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
        {/* Modal xem hóa đơn (preview) full màn hình */}
        {viewModal && viewInvoice && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.2)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{background:'#fff',padding:48,borderRadius:0,width:'100vw',height:'100vh',maxWidth:'100vw',maxHeight:'100vh',boxShadow:'0 2px 16px #aaa',position:'relative',overflow:'auto',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
              {/* Nội dung hóa đơn preview, thay thế bằng code hiện tại của bạn nếu cần */}
              <h3 style={{marginBottom:16}}>Xem hóa đơn</h3>
              <div style={{marginBottom:12}}>
                <b>Ngày lập:</b> {viewInvoice.created_at ? new Date(viewInvoice.created_at).toLocaleString() : ''}
              </div>
              <div style={{marginBottom:12}}>
                <b>Người bán:</b> {viewInvoice.seller}
              </div>
              <div style={{marginBottom:12}}>
                <b>Khách hàng:</b> {viewInvoice.customer_name}
              </div>
              <div style={{marginBottom:12}}>
                <b>Số điện thoại:</b> {viewInvoice.customer_phone || viewInvoice.phone || ''}
              </div>
              <div style={{marginBottom:12}}>
                <b>Địa chỉ:</b> {viewInvoice.address || viewInvoice.customerAddress || viewInvoice.customer_address || viewInvoice.customeraddress || ''}
              </div>
              <div style={{marginBottom:12}}>
                <b>Sản phẩm:</b> {Array.isArray(viewInvoice.items) ? viewInvoice.items.map((item, idx) => (
                  <span key={idx}>{item.name}{idx < viewInvoice.items.length - 1 ? ', ' : ''}</span>
                )) : ''}
              </div>
              <div style={{marginBottom:12, fontWeight:'bold', color:'#1565c0'}}>
                <b>Tổng tiền:</b> {Number(viewInvoice.total_amount).toLocaleString('vi-VN')} đ
              </div>
              <div style={{marginTop:24}}>
                <button style={{padding:'8px 24px',background:'#e74c3c',color:'#fff',border:'none',borderRadius:6,fontWeight:'bold',cursor:'pointer'}} onClick={()=>setViewModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default History;
