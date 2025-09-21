// src/components/History.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

export default function History() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa hóa đơn này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      console.error("Lỗi xóa:", err);
    }
  };

  const handleEdit = (invoice) => {
    window.localStorage.setItem("editInvoice", JSON.stringify(invoice));
    navigate("/invoice");
  };

  const handleExport = () => {
    const data = filteredInvoices.map((inv) => ({
      "Mã HĐ": inv.invoice_number,
      "Khách hàng": inv.customer_name,
      "SĐT": inv.customer_phone,
      "Địa chỉ": inv.customer_address,
      "Người bán": inv.seller,
      "Ngày": new Date(inv.created_at).toLocaleString("vi-VN"),
      "Tổng tiền": inv.total_amount,
      "Trạng thái": inv.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hóa đơn");
    XLSX.writeFile(workbook, "hoa_don.xlsx");
  };

  // lọc theo từ khóa và ngày
  const filteredInvoices = invoices.filter((inv) => {
    const searchMatch =
      inv.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      inv.customer_phone?.toLowerCase().includes(searchText.toLowerCase()) ||
      inv.customer_address?.toLowerCase().includes(searchText.toLowerCase()) ||
      inv.seller?.toLowerCase().includes(searchText.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(searchText.toLowerCase());

    const createdAt = inv.created_at ? new Date(inv.created_at) : null;
    const fromDate = filterFrom ? new Date(filterFrom) : null;
    const toDate = filterTo ? new Date(filterTo) : null;

    const dateMatch =
      (!fromDate || (createdAt && createdAt >= fromDate)) &&
      (!toDate || (createdAt && createdAt <= toDate));

    return searchMatch && dateMatch;
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Lịch sử hóa đơn</h2>

      {/* Nút Export + Quay về Dashboard */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={handleExport} style={{ marginRight: 10 }}>
          📤 Xuất Excel
        </button>
        <button onClick={() => navigate("/")}>🏠 Quay về Dashboard</button>
      </div>

      {/* Bộ lọc */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Tìm kiếm..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
        />
      </div>

      {/* Bảng hóa đơn */}
      <table border="1" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Mã HĐ</th>
            <th>Khách hàng</th>
            <th>SĐT</th>
            <th>Địa chỉ</th>
            <th>Người bán</th>
            <th>Ngày</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.invoice_number}</td>
              <td>{inv.customer_name}</td>
              <td>{inv.customer_phone}</td>
              <td>{inv.customer_address}</td>
              <td>{inv.seller}</td>
              <td>{new Date(inv.created_at).toLocaleString("vi-VN")}</td>
              <td>{Number(inv.total_amount).toLocaleString("vi-VN")} đ</td>
              <td>{inv.status}</td>
              <td>
                <button onClick={() => setViewInvoice(inv)}>Xem</button>
                <button onClick={() => handleEdit(inv)}>Sửa</button>
                <button onClick={() => handleDelete(inv.id)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tổng cộng */}
      {filteredInvoices.length > 0 && (
        <div style={{ marginTop: 10, fontWeight: "bold" }}>
          Tổng cộng:{" "}
          {filteredInvoices
            .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
            .toLocaleString("vi-VN")}{" "}
          đ
        </div>
      )}

      {/* Modal chi tiết */}
      {viewInvoice && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            padding: 20,
            marginTop: 20,
          }}
        >
          <h3>Chi tiết hóa đơn</h3>
          <p>Mã HĐ: {viewInvoice.invoice_number}</p>
          <p>Khách hàng: {viewInvoice.customer_name}</p>
          <p>SĐT: {viewInvoice.customer_phone}</p>
          <p>Địa chỉ: {viewInvoice.customer_address}</p>
          <p>Người bán: {viewInvoice.seller}</p>
          <p>
            Ngày: {new Date(viewInvoice.created_at).toLocaleString("vi-VN")}
          </p>
          <p>
            Tổng tiền:{" "}
            {Number(viewInvoice.total_amount).toLocaleString("vi-VN")} đ
          </p>
          <p>Trạng thái: {viewInvoice.status}</p>
          <button onClick={() => setViewInvoice(null)}>Đóng</button>
        </div>
      )}
    </div>
  );
}
