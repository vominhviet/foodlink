import React, { useState } from "react";
import axios from "axios";

export default function ImportForm() {
  const [rows, setRows] = useState([
    { name: "", unit: "", quantity: 0, price: 0 }
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Thêm dòng mới
  const addRow = () => setRows([...rows, { name: "", unit: "", quantity: 0, price: 0 }]);

  // Xóa dòng
  const removeRow = (idx) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== idx));
    }
  };

  // Cập nhật giá trị từng ô
  const handleChange = (idx, field, value) => {
    const newRows = [...rows];
    newRows[idx][field] = field === "quantity" || field === "price" ? Number(value) : value;
    setRows(newRows);
  };

  // Tính tổng tiền
  const total = rows.reduce((sum, r) => sum + r.quantity * r.price, 0);

  // Hàm lưu đơn nhập
  const handleSave = async () => {
    // Validate dữ liệu
    const hasEmptyFields = rows.some(row => !row.name.trim() || !row.unit.trim() || row.quantity <= 0 || row.price <= 0);
    if (hasEmptyFields) {
      setMessage("❌ Vui lòng điền đầy đủ thông tin cho tất cả sản phẩm!");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      await axios.post("http://localhost:5000/api/import", { items: rows });
      setMessage("✅ Lưu đơn nhập thành công!");
      setRows([{ name: "", unit: "", quantity: 0, price: 0 }]);
    } catch (err) {
      console.error("Lỗi khi lưu đơn nhập:", err);
      setMessage("❌ Lỗi khi lưu đơn nhập!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">📦 Nhập hàng</h1>
              <p className="text-gray-600">Thêm sản phẩm mới vào kho hàng</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="text-lg font-semibold text-gray-900">
                Tổng tiền: <span className="text-green-600">{total.toLocaleString()} đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form nhập hàng */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Tên sản phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Đơn vị</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Giá tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Thành tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        value={row.name}
                        onChange={e => handleChange(idx, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tên sản phẩm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        value={row.unit}
                        onChange={e => handleChange(idx, "unit", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Đơn vị"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={row.quantity}
                        min={0}
                        onChange={e => handleChange(idx, "quantity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={row.price}
                        min={0}
                        onChange={e => handleChange(idx, "price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                      {(row.quantity * row.price).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => removeRow(idx)}
                        disabled={rows.length <= 1}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Xóa dòng"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Tổng cộng:
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-green-600">
                    {total.toLocaleString()} đ
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={addRow}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm dòng
              </button>
              
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Lưu đơn nhập
                  </>
                )}
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
        </div>

        {/* Hướng dẫn */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Hướng dẫn sử dụng:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Nhập đầy đủ thông tin sản phẩm: tên, đơn vị, số lượng và giá tiền</li>
            <li>• Số lượng và giá tiền phải lớn hơn 0</li>
            <li>• Thêm nhiều sản phẩm cùng lúc bằng nút "Thêm dòng"</li>
            <li>• Xóa dòng không cần thiết bằng biểu tượng thùng rác</li>
          </ul>
        </div>
      </div>
    </div>
  );
}