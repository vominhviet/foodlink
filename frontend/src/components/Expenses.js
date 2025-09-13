import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

export default function ExpenseManager() {
  const [rows, setRows] = useState([
    { name: "", type: "", amount: 0, note: "", date: "" }
  ]);
  const [message, setMessage] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", type: "" });
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Lấy danh sách chi phí
  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/expenses", {
        params: filters
      });
      console.log("API trả về:", res.data);

      if (Array.isArray(res.data)) {
        setExpenses(res.data);
        setTotalFiltered(res.data.reduce((s, e) => s + Number(e.amount), 0));
      } else {
        setExpenses(res.data.expenses || []);
        setTotalFiltered(res.data.total || 0);
      }
    } catch (err) {
      console.error("Lỗi khi load expenses:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  // Thêm dòng nhập
  const addRow = () =>
    setRows([...rows, { name: "", type: "", amount: 0, note: "", date: "" }]);

  // Xóa dòng nhập
  const removeRow = (idx) =>
    setRows(rows.filter((_, i) => i !== idx));

  // Cập nhật dữ liệu trong form
  const handleChange = (idx, field, value) => {
    const newRows = [...rows];
    newRows[idx][field] = field === "amount" ? Number(value) : value;
    setRows(newRows);
  };

  // Tổng trong form nhập
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  // Lưu chi phí
  const handleSave = async () => {
    try {
      await axios.post("http://localhost:5000/api/expenses", { items: rows });
      setMessage("💾 Lưu chi phí thành công!");
      setRows([{ name: "", type: "", amount: 0, note: "", date: "" }]);
      fetchExpenses();
    } catch {
      setMessage("❌ Lỗi khi lưu chi phí!");
    }
  };

  // Xóa chi phí đã lưu
  const deleteExpense = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error("Lỗi khi xóa chi phí:", err);
    }
  };

  // Export Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(expenses.map((e, idx) => ({
      STT: idx + 1,
      "Tên chi phí": e.name,
      "Loại": e.type,
      "Số tiền": e.amount,
      "Ghi chú": e.note,
      "Ngày": e.date?.slice(0, 10)
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi phí");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  // Style chung
  const thStyle = { padding: 8, border: "1px solid #ddd", background: "#f1f3f4" };
  const tdStyle = { padding: 8, border: "1px solid #ddd", textAlign: "center" };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "Arial" }}>
      <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 20 }}>
        📊 Quản lý chi phí
      </h2>

      {/* Form nhập */}
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={thStyle}>STT</th>
            <th style={thStyle}>Tên chi phí</th>
            <th style={thStyle}>Loại</th>
            <th style={thStyle}>Số tiền</th>
            <th style={thStyle}>Ghi chú</th>
            <th style={thStyle}>Ngày</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td style={tdStyle}>{idx + 1}</td>
              <td style={tdStyle}>
                <input value={r.name} onChange={(e) => handleChange(idx, "name", e.target.value)} style={{ width: 120 }} />
              </td>
              <td style={tdStyle}>
                <input value={r.type} onChange={(e) => handleChange(idx, "type", e.target.value)} style={{ width: 100 }} />
              </td>
              <td style={tdStyle}>
                <input type="number" value={r.amount} min={0} onChange={(e) => handleChange(idx, "amount", e.target.value)} style={{ width: 90, textAlign: "right" }} />
              </td>
              <td style={tdStyle}>
                <input value={r.note} onChange={(e) => handleChange(idx, "note", e.target.value)} style={{ width: 140 }} />
              </td>
              <td style={tdStyle}>
                <input type="date" value={r.date} onChange={(e) => handleChange(idx, "date", e.target.value)} />
              </td>
              <td style={tdStyle}>
                {rows.length > 1 && <button onClick={() => removeRow(idx)}>🗑️</button>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#fafafa", fontWeight: "bold" }}>
            <td colSpan={3} style={{ textAlign: "right", padding: 8, border: "1px solid #ddd" }}>
              Tổng chi phí:
            </td>
            <td style={{ textAlign: "right", padding: 8, border: "1px solid #ddd" }}>
              {total.toLocaleString()} đ
            </td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
      <div style={{ marginBottom: 24 }}>
        <button onClick={addRow} style={{ marginRight: 12, padding: "6px 14px" }}>➕ Thêm dòng</button>
        <button onClick={handleSave} style={{ background: "#27ae60", color: "#fff", padding: "6px 14px", border: "none", borderRadius: 4 }}>💾 Lưu</button>
      </div>
      {message && <div style={{ marginBottom: 24, fontWeight: "bold", color: "#27ae60" }}>{message}</div>}

      {/* Bộ lọc */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          Từ ngày: <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          Đến ngày: <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div>
          Loại: <input type="text" placeholder="Ví dụ: Điện nước" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
        </div>
        <button onClick={fetchExpenses} style={{ background: "#3498db", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}>🔍 Lọc</button>
        <button onClick={exportExcel} style={{ background: "#8e44ad", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}>⬇️ Excel</button>
      </div>

      <div style={{ fontWeight: "bold", marginBottom: 12 }}>
        Tổng chi phí đã lọc: {totalFiltered.toLocaleString()} đ
      </div>

      {/* Danh sách */}
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr>
            <th style={thStyle}>STT</th>
            <th style={thStyle}>Tên chi phí</th>
            <th style={thStyle}>Loại</th>
            <th style={thStyle}>Số tiền</th>
            <th style={thStyle}>Ghi chú</th>
            <th style={thStyle}>Ngày</th>
            <th style={thStyle}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length > 0 ? (
            expenses.map((e, idx) => (
              <tr key={e.id || idx}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={tdStyle}>{e.name}</td>
                <td style={tdStyle}>{e.type}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{Number(e.amount).toLocaleString()} đ</td>
                <td style={tdStyle}>{e.note}</td>
                <td style={tdStyle}>{e.date?.slice(0, 10)}</td>
                <td style={tdStyle}>
                  <button onClick={() => deleteExpense(e.id)}>❌ Xóa</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>Chưa có chi phí nào</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}