// ExpenseManager.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

export default function ExpenseManager() {
  const navigate = useNavigate();

  // State
  const [rows, setRows] = useState([{ name: "", type: "", amount: 0, note: "", date: "" }]);
  const [message, setMessage] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", type: "" });
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ref
  const currentRequestRef = useRef(null);

  // Parse data
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

  // Fetch expenses
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

      // Frontend filtering
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
        console.error("Error loading expenses:", err);
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

  // Form handlers
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

  // Save expenses
  const handleSave = async () => {
    try {
      setMessage("");

      const normalized = rows.map(r => ({
        ...r,
        date: r.date ? new Date(r.date).toISOString().slice(0, 10) : null
      }));

      await axios.post("http://localhost:5000/api/expenses", { items: normalized });
      setMessage("💾 Lưu chi phí thành công!");
      setRows([{ name: "", type: "", amount: 0, note: "", date: "" }]);
      fetchExpenses();
    } catch (err) {
      console.error("Error saving:", err);
      setMessage("❌ Lỗi khi lưu chi phí");
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Xóa thất bại");
    }
  };

  // Export to Excel
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
      Ngày: e.date ? new Date(e.date).toLocaleDateString("vi-VN") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi phí");
    XLSX.writeFile(wb, `expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Quản lý chi phí</h1>
            <p className="text-gray-600">Theo dõi và quản lý tất cả chi phí của bạn</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Trở lại Dashboard
          </button>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm chi phí mới</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">STT</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Tên chi phí</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Số tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border text-gray-900">{i + 1}</td>
                    <td className="px-4 py-3 border">
                      <input
                        value={r.name}
                        onChange={(e) => handleChange(i, "name", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tên chi phí"
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        value={r.type}
                        onChange={(e) => handleChange(i, "type", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Loại"
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        type="number"
                        value={r.amount}
                        onChange={(e) => handleChange(i, "amount", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        value={r.note}
                        onChange={(e) => handleChange(i, "note", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ghi chú"
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      <input
                        type="date"
                        value={r.date}
                        onChange={(e) => handleChange(i, "date", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 border">
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(i)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Xóa dòng"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-4 py-3 border text-right font-semibold text-gray-900">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 border text-right font-semibold text-green-600">
                    {totalInput.toLocaleString()} đ
                  </td>
                  <td colSpan={3} className="px-4 py-3 border"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm dòng
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Lưu chi phí
            </button>
            {message && (
              <div className={`flex-1 flex items-center justify-center text-sm font-semibold ${
                message.includes("❌") ? "text-red-600" : "text-green-600"
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bộ lọc & Thao tác</h2>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí</label>
                <input
                  placeholder="Ví dụ: MKT, Vận chuyển..."
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={fetchExpenses}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Lọc
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Số lượng chi phí</p>
                <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng chi phí</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "Đang tải..." : `${Number(totalFiltered || 0).toLocaleString()} đ`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách chi phí</h2>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên chi phí</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(expenses) && expenses.length > 0 ? (
                  expenses.map((e, idx) => (
                    <tr key={e.id ?? idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {e.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 text-right">
                        {Number(e.amount || 0).toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{e.note}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {e.date ? new Date(e.date).toLocaleDateString("vi-VN") : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteExpense(e.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Xóa chi phí"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Không có chi phí nào</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {loading ? "Đang tải dữ liệu..." : "Bắt đầu bằng cách thêm chi phí mới."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}