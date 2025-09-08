// Hoá đơn bán hàng
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createInvoice } from "../api";


function Invoice() {
  const navigate = useNavigate();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [date, setDate] = useState(() => {
    // Lấy giờ Hồ Chí Minh (GMT+7)
    const now = new Date();
    return now.toISOString().slice(0,16); // "YYYY-MM-DDTHH:mm"
  });
  const [seller, setSeller] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerTaxCode, setCustomerTaxCode] = useState("");
  const [items, setItems] = useState([
    { name: "", unit: "", quantity: 1, price: 0 }
  ]);
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [invoiceSymbol, setInvoiceSymbol] = useState("1C22TAA");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  // Thêm dòng sản phẩm mới
  const addItemRow = () => {
    setItems([...items, { name: "", unit: "", quantity: 1, price: 0 }]);
  };

    const [invoiceId, setInvoiceId] = useState(null);

    useEffect(() => {
      const editInvoice = window.localStorage.getItem('editInvoice');
      if (editInvoice) {
        const inv = JSON.parse(editInvoice);
        setInvoiceId(inv.id);
        setDate(inv.created_at ? new Date(inv.created_at).toISOString().slice(0,16) : "");
        setSeller(inv.seller || "");
        setCustomerName(inv.customer_name || "");
        setCustomerAddress(inv.customerAddress || inv.address || "");
        setItems(Array.isArray(inv.items) ? inv.items : []);
        window.localStorage.removeItem('editInvoice');
      } else {
        // Nếu tạo mới, set ngày hiện tại
        setDate(new Date().toISOString().slice(0,16));
      }
    }, []);

    // Xử lý thay đổi dòng sản phẩm
    const handleItemChange = (idx, field, value) => {
      const newItems = items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      );
      setItems(newItems);
    };

  // Xóa dòng sản phẩm
  const removeItemRow = (idx) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0), 0);
  const vat = Math.round(subtotal * 0.1);
  const total = subtotal + vat;

  return (
  <div style={{
    maxWidth:820,
    margin:'40px auto',
    background:'#fff',
    border:'1px solid #e3eaf3',
    borderRadius:12,
    boxShadow:'0 4px 24px rgba(52,152,219,0.08)',
    padding:'36px 32px',
    fontFamily:'Segoe UI, Roboto, Arial, sans-serif',
    transition:'box-shadow 0.2s',
    position:'relative'
  }}>
      <div style={{display:'flex', alignItems:'center', marginBottom:16}}>
  <img src={require('../img/logo.png')} alt="Logo" style={{height:100, borderRadius:12, marginRight:32}} />
        <div>
          <div style={{fontWeight:800, fontSize:24, color:'#1a237e', textTransform:'uppercase', marginBottom:8, textAlign:'center', fontFamily:'Times New Roman, Times, serif', letterSpacing:1}}>CÔNG TY FOODLINK</div>
          <div style={{fontSize:16, color:'#444',marginBottom:2, textAlign:'center', fontFamily:'Times New Roman, Times, serif'}}>Địa chỉ: 668/7e, Quốc Lộ 13, Hiệp Bình Phước, Thủ Đức, TP.Hồ Chí Minh</div>
          <div style={{fontSize:16, color:'#444', textAlign:'center', fontFamily:'Times New Roman, Times, serif'}}>Điện thoại: 0335094943</div>
        </div>
      </div>
      <div style={{textAlign:'center', marginBottom:18}}>
  <h2 style={{fontWeight:700, fontSize:28, color:'#1565c0', letterSpacing:2, textTransform:'uppercase', margin:'8px 0', fontFamily:'Segoe UI, Roboto, Arial, sans-serif'}}>HÓA ĐƠN BÁN HÀNG</h2>
         </div>
      <div style={{display:'flex', gap:32, flexWrap:'wrap', marginBottom:24}}>
  <div style={{flex:1, minWidth:220, paddingRight:12}}>
    <div style={{marginBottom:12, paddingLeft:12}}>
            <span style={{fontWeight:600}}>Ngày lập:</span>
            <input type="date" value={date.slice(0,10)} onChange={e => setDate(e.target.value + date.slice(10))} style={{width:'120px', fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8}} />
            <input type="time" value={date.slice(11,16)} onChange={e => setDate(date.slice(0,11) + e.target.value)} style={{width:'110px', fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8}} />
          </div>
          <div style={{marginBottom:12}}>
            <span style={{fontWeight:600}}>Người bán:</span>
            <input value={seller} onChange={e => setSeller(e.target.value)} placeholder="Người bán" style={{width:'100px', fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8}} />
          </div>
        </div>
        <div style={{flex:1, minWidth:220}}>
          <div style={{marginBottom:12}}>
            <span style={{fontWeight:600}}>Khách hàng:</span>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Tên khách hàng" style={{ fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8}} />
          </div>
          <div style={{marginBottom:12}}>
            <span style={{fontWeight:600}}>Số điện thoại:</span>
            <input value={customerTaxCode} onChange={e => setCustomerTaxCode(e.target.value)} placeholder="Số điện thoại khách hàng" style={{ fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8}} />
          </div>
          <div style={{marginBottom:12}}>
            <span style={{fontWeight:600}}>Địa chỉ:</span>
            <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Địa chỉ khách hàng" style={{ fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8}} />
          </div>
        </div>
      </div>
  <table style={{width:'100%', borderCollapse:'collapse', marginBottom:24, background:'#f8fafc', borderRadius:0, overflow:'hidden'}}>
        <thead>
          <tr style={{background:'#e3eaf3', color:'#222', fontWeight:700, fontSize:16}}>
            <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>STT</th>
            <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Tên sản phẩm</th>
            <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Đơn vị tính</th>
            <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Số lượng</th>
            <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Đơn giá</th>
            <th style={{padding:'12px 0', border:'1px solid #e3eaf3'}}>Thành tiền</th>
            <th style={{border:'1px solid #e3eaf3'}}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const amount = (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0);
            return (
              <tr key={idx} style={{background:'#fff', borderBottom:'1px solid #e3eaf3'}}>
                <td style={{textAlign:'center', fontWeight:600}}>{idx + 1}</td>
                <td style={{textAlign:'center'}}>
                  <input value={item.name} onChange={e => handleItemChange(idx, "name", e.target.value)} placeholder="Tên sản phẩm" style={{width:'50%', fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:0, textAlign:'center'}} />
                </td>
                <td style={{textAlign:'center'}}>
                  <input value={item.unit} onChange={e => handleItemChange(idx, "unit", e.target.value)} placeholder="Đơn vị" style={{width:'80px', fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8, textAlign:'center'}} />
                </td>
                <td style={{textAlign:'center'}}>
                  <input type="number" min={0} value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} style={{width:'80px', fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8, textAlign:'center'}} />
                </td>
                <td style={{textAlign:'center'}}>
                  <input type="number" min={0} value={item.price} onChange={e => handleItemChange(idx, "price", e.target.value)} style={{width:'100px', fontWeight:700, fontSize:15, border:'none', borderBottom:'2px solid #bbb', background:'transparent', outline:'none', padding:'6px', borderRadius:0, marginLeft:8, textAlign:'center'}} />
                </td>
                <td style={{textAlign:'center', fontWeight:600}}>{amount.toLocaleString('vi-VN')}</td>
                <td>
                  <button onClick={() => removeItemRow(idx)} disabled={items.length <= 1} style={{background:'#fff', color:'#e74c3c', border:'1px solid #e74c3c', borderRadius:4, padding:'6px 12px', cursor:'pointer', fontWeight:500, transition:'box-shadow 0.2s'}}>
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{display:'flex', gap:16, marginBottom:24}}>
  <button onClick={addItemRow} style={{background:'#f5f5f5', color:'#222', border:'1px solid #e3eaf3', borderRadius:4, padding:'8px 18px', fontWeight:600, fontSize:18, cursor:'pointer', transition:'box-shadow 0.2s'}}>+</button>
        <button
          style={{background:'#e3eaf3', color:'#222', border:'none', borderRadius:4, padding:'10px 24px', fontWeight:600, fontSize:16, cursor:'pointer', boxShadow:'0 2px 8px #e3eaf3', transition:'box-shadow 0.2s'}}
          onClick={async () => {
            const invoiceData = {
              date,
              seller,
              customer_name: customerName,
              customerPhone: customerTaxCode,
              address: customerAddress,
              items,
              total_amount: subtotal,
              status: "pending"
            };
            try {
              await createInvoice(invoiceData);
              setSaveSuccess(true);
              setPreviewData(invoiceData);
              setShowPreview(true);
              setTimeout(() => {
                navigate("/history");
              }, 1200);
            } catch (err) {
              console.error("Invoice save error:", err?.response?.data || err);
              alert("Lưu hóa đơn thất bại!");
            }
          }}
  >Lưu hóa đơn</button>
        <button
          style={{background:'#d4f5e9', color:'#222', border:'none', borderRadius:4, padding:'10px 24px', fontWeight:600, fontSize:16, cursor:'pointer', boxShadow:'0 2px 8px #d4f5e9', transition:'box-shadow 0.2s'}}
          onClick={() => {
            setPreviewData({
              date,
              seller,
              customerName,
              customerTaxCode,
              customerAddress,
              items,
              total_amount: subtotal
            });
            setShowPreview(true);
          }}
        >Xem lại hóa đơn</button>
      </div>
      {saveSuccess && (
        <div style={{color:'#27ae60', fontWeight:'bold', marginTop:12, textAlign:'center'}}>Đã lưu hóa đơn thành công!</div>
      )}
      {doneMessage && (
        <div style={{color:'#27ae60', fontWeight:'bold', marginTop:12, textAlign:'center'}}>{doneMessage}</div>
      )}
      <div style={{marginTop:32, background:'#f8fafc', borderRadius:12, padding:'18px 32px', display:'flex', justifyContent:'flex-end', alignItems:'center', fontSize:18, fontWeight:700, color:'#222', boxShadow:'0 2px 8px rgba(52,152,219,0.04)'}}>
  <span style={{marginRight:24}}>Tổng Tiền hóa đơn:</span>
  <span style={{color:'#1565c0', fontWeight:800, fontSize:20}}>{subtotal.toLocaleString('vi-VN')} đ</span>
      </div>

      {/* Modal preview hóa đơn */}
      {showPreview && previewData && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.2)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:'32px 24px',borderRadius:8,minWidth:500,maxWidth:700,boxShadow:'0 2px 16px #aaa',position:'relative', fontFamily:'Segoe UI, Roboto, Arial, sans-serif'}}>
            <div style={{display:'flex', alignItems:'center', marginBottom:16}}>
              <img src={require('../img/logo.png')} alt="Logo" style={{height:80, borderRadius:8, marginRight:24}} />
              <div>
                <div style={{fontWeight:800, fontSize:20, color:'#222', textTransform:'uppercase', marginBottom:8, textAlign:'center', fontFamily:'Times New Roman, Times, serif'}}>CÔNG TY FOOD LINK</div>
                <div style={{fontSize:14, color:'#444',marginBottom:2, textAlign:'center', fontFamily:'Times New Roman, Times, serif'}}>Địa chỉ:668/7e, Quốc Lộ 13, Hiệp Bình Phước, Thủ Đức, TP.Hồ Chí Minh</div>
                <div style={{fontSize:14, color:'#444', textAlign:'center', fontFamily:'Times New Roman, Times, serif'}}>Điện thoại: 0335094943</div>
              </div>
            </div>
            <div style={{textAlign:'center', marginBottom:12}}>
              <h3 style={{fontWeight:700, fontSize:22, color:'#222', letterSpacing:1, textTransform:'uppercase', margin:'8px 0'}}>HÓA ĐƠN BÁN HÀNG</h3>
            </div>
            <div style={{display:'flex', gap:32, flexWrap:'wrap', marginBottom:18}}>
              <div style={{flex:1, minWidth:180}}>
                <div style={{marginBottom:8}}><span style={{fontWeight:600}}>Ngày lập:</span> <span style={{fontWeight:700}}>{previewData.date}</span></div>
                <div style={{marginBottom:8}}><span style={{fontWeight:600}}>Người bán:</span> <span style={{fontWeight:700}}>{previewData.seller}</span></div>
              </div>
              <div style={{flex:1, minWidth:180}}>
                <div style={{marginBottom:8}}><span style={{fontWeight:600}}>Khách hàng:</span> <span style={{fontWeight:700}}>{previewData.customerName}</span></div>
                <div style={{marginBottom:8}}><span style={{fontWeight:600}}>Số điện thoại:</span> <span style={{fontWeight:700}}>{previewData.customerTaxCode}</span></div>
                <div style={{marginBottom:8}}><span style={{fontWeight:600}}>Địa chỉ:</span> <span style={{fontWeight:700}}>{previewData.customerAddress}</span></div>
              </div>
            </div>
            <table style={{width:'100%', borderCollapse:'collapse', marginBottom:18, background:'#f8fafc', borderRadius:0, overflow:'hidden'}}>
              <thead>
                <tr style={{background:'#e3eaf3', color:'#222', fontWeight:700}}>
                  <th style={{padding:'10px 0'}}>STT</th>
                  <th style={{padding:'10px 0'}}>Tên sản phẩm</th>
                  <th style={{padding:'10px 0'}}>Đơn vị tính</th>
                  <th style={{padding:'10px 0'}}>Số lượng</th>
                  <th style={{padding:'10px 0'}}>Đơn giá</th>
                  <th style={{padding:'10px 0'}}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {previewData.items.map((item, idx) => {
                  const amount = (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0);
                  return (
                    <tr key={idx} style={{background:'#fff', borderBottom:'1px solid #f0f0f0'}}>
                      <td style={{textAlign:'center', fontWeight:600}}>{idx + 1}</td>
                      <td style={{textAlign:'center'}}>{item.name}</td>
                      <td style={{textAlign:'center'}}>{item.unit}</td>
                      <td style={{textAlign:'center'}}>{item.quantity}</td>
                      <td style={{textAlign:'center'}}>{item.price}</td>
                      <td style={{textAlign:'center', fontWeight:600}}>{amount.toLocaleString('vi-VN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{marginTop:12, background:'#f8fafc', borderRadius:0, padding:'12px 24px', display:'flex', justifyContent:'flex-end', alignItems:'center', fontSize:17, fontWeight:700, color:'#222', boxShadow:'0 2px 8px rgba(52,152,219,0.04)'}}>
              <span style={{marginRight:24}}>Tổng Tiền hóa đơn:</span>
              <span style={{color:'#3498db'}}>{previewData.total_amount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div style={{marginTop:24,display:'flex',gap:16, justifyContent:'center'}}>
              <button style={{padding:'8px 24px',background:'#3498db',color:'#fff',border:'none',borderRadius:6,fontWeight:'bold',cursor:'pointer'}} onClick={()=>setShowPreview(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoice;