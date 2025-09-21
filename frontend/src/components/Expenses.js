// ExpenseManager.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

export default function ExpenseManager() {
  const navigate = useNavigate();

  // --- State ---
  const [rows, setRows] = useState([{ name: "", type: "", amount: 0, note: "", date: "" }]);
  const [message, setMessage] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", type: "" });
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Ref ---
  const currentRequestRef = useRef(null);

  // --- Parse data ---
  const parseAndSet = (data) => {
    if (Array.isArray(data)) {
      setExpenses(data);
      setTotalFiltered(data.reduce((s, e) => s + Number(e.amount || 0), 0));
    } else {
      setExpenses(data.expenses || []);
      setTotalFiltered(
        Number(
          data.total ||
            data.expenses?.reduce((s, e) => s + Number(e.amount || 0), 0) ||
            0
        )
      );
    }
  };

  // --- Fetch data ---
  const fetchExpenses = useCallback(async () => {
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
    }

    const controller = new AbortController();
    currentRequestRef.current = controller;
    setLoading(true);
    setError("");

    try {
      const res = await axios.get("http://localhost:5000/api/expenses", {
        signal: controller.signal,
      });

      let data = Array.isArray(res.data) ? res.data : res.data.expenses || [];

      // --- filter ở frontend ---
      data = data.filter((e) => {
        const matchDate =
          (!filters.from || new Date(e.date) >= new Date(filters.from)) &&
          (!filters.to || new Date(e.date) <= new Date(filters.to));
        const matchType =
          !filters.type || e.type?.toLowerCase().includes(filters.type.toLowerCase());
        return matchDate && matchType;
      });

      parseAndSet({ expenses: data });
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        console.error("Lỗi khi load expenses:", err);
        setError("Không thể tải dữ liệu. Kiểm tra server hoặc network.");
      }
    } finally {
      setLoading(false);
      currentRequestRef.current = null;
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // --- Form input ---
  const addRow = () => setRows((s) => [...s, { name: "", type: "", amount: 0, note: "", date: "" }]);
  const removeRow = (idx) => setRows((s) => s.filter((_, i) => i !== idx));
  const handleChange = (idx, field, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: field === "amount" ? Number(value) : value,
      };
      return copy;
    });
  };
  const totalInput = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // --- Save ---
  const handleSave = async () => {
    try {
      setMessage("");
      await axios.post("http://localhost:5000/api/expenses", { items: rows });
      setMessage("💾 Lưu chi phí thành công!");
      setRows([{ name: "", type: "", amount: 0, note: "", date: "" }]);
      fetchExpenses();
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      setMessage("❌ Lỗi khi lưu chi phí");
    }
  };

  // --- Delete ---
  const deleteExpense = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      alert("Xóa thất bại");
    }
  };

  // --- Export Excel ---
  const exportExcel = () => {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      alert("Không có dữ liệu để export");
      return;
    }
    const wsData = expenses.map((e, idx) => ({
      STT: idx + 1,
      "Tên chi phí": e.name,
      Loại: e.type,
      "Số tiền": Number(e.amount || 0),
      "Ghi chú": e.note,
      Ngày: e.date ? e.date.slice(0, 10) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi phí");
    XLSX.writeFile(wb, `expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // --- Styles ---
  const th = { padding: 8, border: "1px solid #ddd", background: "#f1f3f6", textAlign: "center" };
  const td = { padding: 8, border: "1px solid #ddd", textAlign: "center" };

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", padding: 20, fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>📊 Quản lý chi phí</h2>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ padding: "6px 14px", background: "#636e72", color: "#fff", border: "none", borderRadius: 6 }}
        >
          ⬅ Trở lại Dashboard
        </button>
      </div>

      {/* Form nhập */}
      <div style={{ background: "#fff", padding: 14, borderRadius: 8, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>STT</th>
              <th style={th}>Tên</th>
              <th style={th}>Loại</th>
              <th style={th}>Số tiền</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Ngày</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={td}>{i + 1}</td>
                <td style={td}><input value={r.name} onChange={(e) => handleChange(i, "name", e.target.value)} style={{ width: 140 }} /></td>
                <td style={td}><input value={r.type} onChange={(e) => handleChange(i, "type", e.target.value)} style={{ width: 110 }} /></td>
                <td style={td}><input type="number" value={r.amount} onChange={(e) => handleChange(i, "amount", e.target.value)} style={{ width: 100, textAlign: "right" }} /></td>
                <td style={td}><input value={r.note} onChange={(e) => handleChange(i, "note", e.target.value)} style={{ width: 160 }} /></td>
                <td style={td}><input type="date" value={r.date} onChange={(e) => handleChange(i, "date", e.target.value)} /></td>
                <td style={td}>{rows.length > 1 && <button onClick={() => removeRow(i)}>❌</button>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", padding: 8, border: "1px solid #ddd", fontWeight: 600 }}>Tổng:</td>
              <td style={{ textAlign: "right", padding: 8, border: "1px solid #ddd", fontWeight: 600 }}>{totalInput.toLocaleString()} đ</td>
              <td colSpan={3} style={{ border: "1px solid #ddd" }}></td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={addRow} style={{ padding: "6px 12px" }}>➕ Thêm dòng</button>
          <button onClick={handleSave} style={{ padding: "6px 12px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6 }}>💾 Lưu</button>
          <div style={{ marginLeft: "auto", color: "#2d3748", fontWeight: 600, alignSelf: "center" }}>{message}</div>
        </div>
      </div>

      {/* Filter + actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <label> Từ ngày: <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /> </label>
        <label> Đến ngày: <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /> </label>
        <label> Loại: <input placeholder="Ví dụ: MKT" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} /> </label>

        <button onClick={fetchExpenses} style={{ padding: "6px 12px", background: "#3498db", color: "#fff", border: "none", borderRadius: 6 }}>🔍 Lọc</button>
        <button onClick={exportExcel} style={{ padding: "6px 12px", background: "#6c5ce7", color: "#fff", border: "none", borderRadius: 6 }}>📤 Export</button>

        <div style={{ marginLeft: "auto", fontWeight: 700, alignSelf: "center" }}>
          {loading ? "Đang tải..." : `Tổng lọc: ${Number(totalFiltered || 0).toLocaleString()} đ`}
        </div>
      </div>

      {/* Bảng danh sách chi phí */}
      <div style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>STT</th>
              <th style={th}>Tên</th>
              <th style={th}>Loại</th>
              <th style={th}>Số tiền</th>
              <th style={th}>Ghi chú</th>
              <th style={th}>Ngày</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(expenses) && expenses.length > 0 ? (
              expenses.map((e, idx) => (
                <tr key={e.id ?? idx}>
                  <td style={td}>{idx + 1}</td>
                  <td style={td}>{e.name}</td>
                  <td style={td}>{e.type}</td>
                  <td style={{ ...td, textAlign: "right" }}>{Number(e.amount || 0).toLocaleString()} đ</td>
                  <td style={td}>{e.note}</td>
                  <td style={td}>{e.date ? e.date.slice(0, 10) : ""}</td>
                  <td style={td}><button onClick={() => deleteExpense(e.id)}>❌</button></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 14, textAlign: "center" }}>
                  {loading ? "Đang tải..." : "Chưa có chi phí nào"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
