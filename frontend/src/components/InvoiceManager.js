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
    // Xử lý dấu phẩy cho số thập phân (ví dụ: 0,500 -> 0.500)
    if (field === "quantity" || field === "price") {
      value = value.replace(",", ".");
    }
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
      sum + (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0),
    0
  );

  const handleSaveInvoice = async () => {
    const invoiceData = {
      date,
      seller,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      items: items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        price: parseFloat(item.price) || 0
      })),
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
  };

  const handlePreview = () => {
    setPreviewData({
      date,
      seller,
      customerName,
      customerPhone,
      customerAddress,
      items: items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        price: parseFloat(item.price) || 0
      })),
      total_amount: subtotal,
    });
    setShowPreview(true);
  };

  return (
    <div className="max-w-4xl mx-auto my-10 bg-white border border-gray-200 rounded-xl shadow-lg p-8 font-sans">
      {/* Header */}
      <div className="flex items-center mb-6">
        <img
          src={require("../img/logo.png")}
          alt="Logo"
          className="h-24 rounded-xl mr-8"
        />
        <div>
          <div className="font-bold text-2xl text-blue-900 uppercase mb-2 text-center font-serif">
            CÔNG TY FOODLINK
          </div>
          <div className="text-gray-700 text-center font-serif">
            Địa chỉ: 668/7e, Quốc Lộ 13, Hiệp Bình Phước, Thủ Đức, TP.Hồ Chí Minh
          </div>
          <div className="text-gray-700 text-center font-serif">
            Điện thoại: 0335094943
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="font-bold text-2xl text-blue-700 tracking-wide uppercase">
          HÓA ĐƠN BÁN HÀNG
        </h2>
      </div>

      {/* Form */}
      <div className="flex gap-8 flex-wrap mb-8">
        <div className="flex-1 min-w-64">
          <div className="mb-4">
            <span className="font-semibold">Ngày lập:</span>
            <input
              type="date"
              value={date.slice(0, 10)}
              onChange={(e) => setDate(e.target.value + date.slice(10))}
              className="ml-2 font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 w-32"
            />
            <input
              type="time"
              value={date.slice(11, 16)}
              onChange={(e) => setDate(date.slice(0, 11) + e.target.value)}
              className="ml-2 font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 w-32"
            />
          </div>
          <div className="mb-4">
            <span className="font-semibold">Người bán:</span>
            <input
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              placeholder="Người bán"
              className="ml-2 font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 flex-1 min-w-40"
            />
          </div>
        </div>
        <div className="flex-1 min-w-64">
          <div className="mb-4">
            <span className="font-semibold">Khách hàng:</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách hàng"
              className="ml-2 font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 flex-1 min-w-40"
            />
          </div>
          <div className="mb-4">
            <span className="font-semibold">Số điện thoại:</span>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Số điện thoại"
              className="ml-2 font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 flex-1 min-w-40"
            />
          </div>
          <div className="mb-4">
            <span className="font-semibold">Địa chỉ:</span>
            <input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Địa chỉ"
              className="ml-2 font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 flex-1 min-w-40"
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse bg-gray-50 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-100 font-bold text-lg">
              <th className="p-3">STT</th>
              <th className="p-3">Tên sản phẩm</th>
              <th className="p-3">Đơn vị tính</th>
              <th className="p-3">Số lượng</th>
              <th className="p-3">Đơn giá</th>
              <th className="p-3">Thành tiền</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const amount = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);
              return (
                <tr key={idx} className="bg-white border-b border-blue-100">
                  <td className="p-3 text-center">{idx + 1}</td>
                  <td className="p-3 text-center">
                    <input
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      placeholder="Tên sản phẩm"
                      className="w-full font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 text-center"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                      placeholder="Đơn vị"
                      className="w-full font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 text-center"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="text"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      placeholder="0,500"
                      className="w-full font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 text-center"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="text"
                      min={0}
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                      placeholder="0"
                      className="w-full font-semibold border-b-2 border-gray-400 bg-transparent outline-none px-2 text-center"
                    />
                  </td>
                  <td className="p-3 text-center font-semibold">
                    {amount.toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length <= 1}
                      className="bg-white text-red-500 border border-red-500 rounded px-3 py-1 cursor-pointer hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={addItemRow}
          className="bg-gray-100 border border-gray-300 rounded px-6 py-2 font-semibold text-lg cursor-pointer hover:bg-gray-200"
        >
          +
        </button>
        <button
          onClick={handleSaveInvoice}
          className="bg-blue-100 border-none rounded px-6 py-2 font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
        >
          Lưu hóa đơn
        </button>
        <button
          onClick={handlePreview}
          className="bg-green-100 border-none rounded px-6 py-2 font-semibold cursor-pointer hover:bg-green-200 transition-colors"
        >
          Xem lại hóa đơn
        </button>
      </div>

      {/* Tổng tiền */}
      <div className="mt-8 bg-gray-50 rounded-xl px-8 py-5 flex justify-end items-center text-lg font-bold">
        <span className="mr-6">Tổng Tiền hóa đơn:</span>
        <span className="text-blue-700 font-extrabold text-xl">
          {subtotal.toLocaleString("vi-VN")} đ
        </span>
      </div>

      {/* Modal Preview */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg min-w-[500px] max-w-[700px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-center mb-6 text-xl font-bold">XEM LẠI HÓA ĐƠN</h3>
            <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded border">
              {JSON.stringify(previewData, null, 2)}
            </pre>
            <button 
              onClick={() => setShowPreview(false)}
              className="mt-4 bg-blue-500 text-white border-none rounded px-4 py-2 cursor-pointer hover:bg-blue-600 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoice;