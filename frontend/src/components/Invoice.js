// src/components/Invoice.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createInvoice } from "../api";

function Invoice() {
  const navigate = useNavigate();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [seller, setSeller] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([{ name: "", unit: "", quantity: 1, price: 0 }]);
  const [invoiceId, setInvoiceId] = useState(null);

  useEffect(() => {
    const editInvoice = window.localStorage.getItem("editInvoice");
    if (editInvoice) {
      const inv = JSON.parse(editInvoice);
      setInvoiceId(inv.id);
      setDate(inv.created_at ? new Date(inv.created_at).toISOString().slice(0, 16) : "");
      setSeller(inv.seller || "");
      setCustomerName(inv.customer_name || "");
      setCustomerAddress(inv.customer_address || inv.address || "");
      setCustomerPhone(inv.customer_phone || "");
      setItems(Array.isArray(inv.items) ? inv.items : []);
      window.localStorage.removeItem("editInvoice");
    }
  }, []);

  const addItemRow = () => {
    setItems([...items, { name: "", unit: "", quantity: 1, price: 0 }]);
  };

  const handleItemChange = (idx, field, value) => {
    const newItems = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(newItems);
  };

  const removeItemRow = (idx) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0),
    0
  );

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <img
          src={require("../img/logo.png")}
          alt="Logo"
          style={{ height: 100, borderRadius: 12, marginRight: 32 }}
        />
        <div>
          <div style={companyName}>CÔNG TY FOODLINK</div>
          <div style={companyInfo}>
            Địa chỉ: 668/7e, Quốc Lộ 13, Hiệp Bình Phước, Thủ Đức, TP.Hồ Chí
            Minh
          </div>
          <div style={companyInfo}>Điện thoại: 0335094943</div>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h2 style={titleStyle}>HÓA ĐƠN BÁN HÀNG</h2>
      </div>

      {/* Form */}
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={labelStyle}>Ngày lập:</span>
            <input
              type="date"
              value={date.slice(0, 10)}
              onChange={(e) => setDate(e.target.value + date.slice(10))}
              style={inputDate}
            />
            <input
              type="time"
              value={date.slice(11, 16)}
              onChange={(e) => setDate(date.slice(0, 11) + e.target.value)}
              style={inputDate}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={labelStyle}>Người bán:</span>
            <input
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="Người bán"
              style={inputText}
            />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={labelStyle}>Khách hàng:</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách hàng"
              style={inputText}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={labelStyle}>Số điện thoại:</span>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Số điện thoại"
              style={inputText}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={labelStyle}>Địa chỉ:</span>
            <input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Địa chỉ"
              style={inputText}
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table style={tableStyle}>
        <thead>
          <tr style={theadRow}>
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
          {items.map((item, idx) => {
            const amount =
              (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0);
            return (
              <tr key={idx} style={tbodyRow}>
                <td style={centerCell}>{idx + 1}</td>
                <td style={centerCell}>
                  <input
                    value={item.name}
                    onChange={(e) =>
                      handleItemChange(idx, "name", e.target.value)
                    }
                    placeholder="Tên sản phẩm"
                    style={inputCell}
                  />
                </td>
                <td style={centerCell}>
                  <input
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(idx, "unit", e.target.value)
                    }
                    placeholder="Đơn vị"
                    style={inputCell}
                  />
                </td>
                <td style={centerCell}>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", e.target.value)
                    }
                    style={inputCell}
                  />
                </td>
                <td style={centerCell}>
                  <input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(idx, "price", e.target.value)
                    }
                    style={inputCell}
                  />
                </td>
                <td style={{ ...centerCell, fontWeight: 600 }}>
                  {amount.toLocaleString("vi-VN")}
                </td>
                <td>
                  <button
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    style={btnDelete}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <button onClick={addItemRow} style={btnAdd}>
          +
        </button>
        <button
          style={btnSave}
          onClick={async () => {
            const invoiceData = {
              date,
              seller,
              customer_name: customerName,
              customer_phone: customerPhone,
              customer_address: customerAddress,
              items,
              total_amount: subtotal,
              status: "pending",
            };
            try {
              await createInvoice(invoiceData);
              setSaveSuccess(true);
              setPreviewData(invoiceData);
              setShowPreview(true);
              setTimeout(() => navigate("/history"), 1200);
            } catch (err) {
              console.error("Invoice save error:", err?.response?.data || err);
              alert("Lưu hóa đơn thất bại!");
            }
          }}
        >
          Lưu hóa đơn
        </button>
        <button
          style={btnPreview}
          onClick={() => {
            setPreviewData({
              date,
              seller,
              customerName,
              customerPhone,
              customerAddress,
              items,
              total_amount: subtotal,
            });
            setShowPreview(true);
          }}
        >
          Xem lại hóa đơn
        </button>
      </div>

      {/* Tổng tiền */}
      <div style={totalBox}>
        <span style={{ marginRight: 24 }}>Tổng Tiền hóa đơn:</span>
        <span style={totalNumber}>{subtotal.toLocaleString("vi-VN")} đ</span>
      </div>

      {/* Modal Preview */}
      {showPreview && previewData && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ textAlign: "center", marginBottom: 16 }}>
              XEM LẠI HÓA ĐƠN
            </h3>
            <pre>{JSON.stringify(previewData, null, 2)}</pre>
            <button onClick={() => setShowPreview(false)} style={btnClose}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Styles --- */
const containerStyle = {
  maxWidth: 820,
  margin: "40px auto",
  background: "#fff",
  border: "1px solid #e3eaf3",
  borderRadius: 12,
  boxShadow: "0 4px 24px rgba(52,152,219,0.08)",
  padding: "36px 32px",
  fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
};
const companyName = {
  fontWeight: 800,
  fontSize: 24,
  color: "#1a237e",
  textTransform: "uppercase",
  marginBottom: 8,
  textAlign: "center",
  fontFamily: "Times New Roman, Times, serif",
};
const companyInfo = {
  fontSize: 16,
  color: "#444",
  textAlign: "center",
  fontFamily: "Times New Roman, Times, serif",
};
const titleStyle = {
  fontWeight: 700,
  fontSize: 28,
  color: "#1565c0",
  letterSpacing: 2,
  textTransform: "uppercase",
  margin: "8px 0",
};
const labelStyle = { fontWeight: 600 };
const inputDate = {
  width: "120px",
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  borderBottom: "2px solid #bbb",
  background: "transparent",
  outline: "none",
  padding: "6px",
  marginLeft: 8,
};
const inputText = {
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  borderBottom: "2px solid #bbb",
  background: "transparent",
  outline: "none",
  padding: "6px",
  marginLeft: 8,
};
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 24,
  background: "#f8fafc",
};
const theadRow = { background: "#e3eaf3", fontWeight: 700, fontSize: 16 };
const tbodyRow = { background: "#fff", borderBottom: "1px solid #e3eaf3" };
const centerCell = { textAlign: "center" };
const inputCell = {
  width: "80px",
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  borderBottom: "2px solid #bbb",
  background: "transparent",
  outline: "none",
  padding: "6px",
  textAlign: "center",
};
const btnAdd = {
  background: "#f5f5f5",
  border: "1px solid #e3eaf3",
  borderRadius: 4,
  padding: "8px 18px",
  fontWeight: 600,
  fontSize: 18,
  cursor: "pointer",
};
const btnSave = {
  background: "#e3eaf3",
  border: "none",
  borderRadius: 4,
  padding: "10px 24px",
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
};
const btnPreview = {
  background: "#d4f5e9",
  border: "none",
  borderRadius: 4,
  padding: "10px 24px",
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
};
const btnDelete = {
  background: "#fff",
  color: "#e74c3c",
  border: "1px solid #e74c3c",
  borderRadius: 4,
  padding: "6px 12px",
  cursor: "pointer",
};
const totalBox = {
  marginTop: 32,
  background: "#f8fafc",
  borderRadius: 12,
  padding: "18px 32px",
  display: "flex",
  justifyContent: "flex-end",
  fontSize: 18,
  fontWeight: 700,
};
const totalNumber = {
  color: "#1565c0",
  fontWeight: 800,
  fontSize: 20,
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalBox = {
  background: "#fff",
  padding: "32px",
  borderRadius: 8,
  minWidth: 500,
  maxWidth: 700,
};
const btnClose = {
  marginTop: 16,
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 16px",
  cursor: "pointer",
};

export default Invoice;
