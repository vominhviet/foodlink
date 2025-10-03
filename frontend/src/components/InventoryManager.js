// src/components/InventoryManager.js
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactionType, setTransactionType] = useState("import");
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState("");
  const [transactions, setTransactions] = useState([]);

  // Fetch danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lịch sử giao dịch
  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stock/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử giao dịch:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  // Thực hiện giao dịch (nhập/xuất)
  const handleTransaction = async () => {
    if (!selectedProduct || quantity <= 0) {
      alert("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/stock/transaction", {
        product_id: selectedProduct._id,
        type: transactionType,
        quantity: transactionType === "import" ? quantity : -quantity,
        note: note
      });
      
      alert("Thực hiện giao dịch thành công!");
      setQuantity(0);
      setNote("");
      fetchProducts(); // Refresh danh sách
      fetchTransactions(); // Refresh lịch sử
    } catch (err) {
      console.error("Lỗi khi thực hiện giao dịch:", err);
      alert("Lỗi khi thực hiện giao dịch!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Quản lý tồn kho</h1>
          <p className="text-gray-600">Theo dõi số lượng hàng hóa trong kho</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel điều khiển */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác kho</h2>
              
              {/* Chọn sản phẩm */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn sản phẩm
                </label>
                <select
                  value={selectedProduct?._id || ""}
                  onChange={(e) => setSelectedProduct(products.find(p => p._id === e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.current_stock} {product.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loại giao dịch */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giao dịch
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="import"
                      checked={transactionType === "import"}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-green-600 font-medium">Nhập kho</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="export"
                      checked={transactionType === "export"}
                      onChange={(e) => setTransactionType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-red-600 font-medium">Xuất kho</span>
                  </label>
                </div>
              </div>

              {/* Số lượng */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Ghi chú */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Lý do nhập/xuất..."
                />
              </div>

              {/* Nút thực hiện */}
              <button
                onClick={handleTransaction}
                disabled={!selectedProduct || quantity <= 0}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                  !selectedProduct || quantity <= 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : transactionType === "import"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:red-700"
                }`}
              >
                {transactionType === "import" ? "📥 Nhập kho" : "📤 Xuất kho"}
              </button>

              {/* Thông tin sản phẩm được chọn */}
              {selectedProduct && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Thông tin sản phẩm:</h3>
                  <p className="text-sm text-blue-800">
                    <strong>Tên:</strong> {selectedProduct.name}<br/>
                    <strong>Tồn hiện tại:</strong> {selectedProduct.current_stock} {selectedProduct.unit}<br/>
                    <strong>Sau giao dịch:</strong> {
                      transactionType === "import" 
                        ? selectedProduct.current_stock + quantity
                        : selectedProduct.current_stock - quantity
                    } {selectedProduct.unit}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Danh sách tồn kho */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Danh sách tồn kho</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng tồn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                        </td>
                      </tr>
                    ) : products.length > 0 ? (
                      products.map((product, index) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            <span className={
                              product.current_stock === 0 
                                ? "text-red-600" 
                                : product.current_stock < 10 
                                ? "text-yellow-600" 
                                : "text-green-600"
                            }>
                              {product.current_stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.current_stock === 0 
                                ? "bg-red-100 text-red-800" 
                                : product.current_stock < 10 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {product.current_stock === 0 
                                ? "Hết hàng" 
                                : product.current_stock < 10 
                                ? "Sắp hết" 
                                : "Còn hàng"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sản phẩm nào</h3>
                          <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách nhập sản phẩm mới.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lịch sử giao dịch */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Lịch sử giao dịch</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.slice(0, 10).map((transaction, index) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.created_at).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.product_id?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === "import" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {transaction.type === "import" ? "NHẬP" : "XUẤT"}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          transaction.type === "import" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.type === "import" ? "+" : "-"}{Math.abs(transaction.quantity)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transaction.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}