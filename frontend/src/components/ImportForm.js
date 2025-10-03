// components/ImportForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ImportForm() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    { name: "", unit: "", quantity: 0, price: 0, product_id: null, operation: "create" }
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingProducts, setExistingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch danh sách sản phẩm hiện có
  useEffect(() => {
    fetchExistingProducts();
  }, []);

  const fetchExistingProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setExistingProducts(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
    }
  };

  // Thêm dòng mới
  const addRow = () => setRows([...rows, { name: "", unit: "", quantity: 0, price: 0, product_id: null, operation: "create" }]);

  // Xóa dòng
  const removeRow = (idx) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== idx));
    }
  };

  // Đánh dấu dòng để xóa
  const markForDelete = (idx) => {
    const newRows = [...rows];
    newRows[idx].markedForDelete = !newRows[idx].markedForDelete;
    setRows(newRows);
  };

  // Cập nhật giá trị từng ô
  const handleChange = (idx, field, value) => {
    const newRows = [...rows];
    
    if (field === "name") {
      // Tự động tìm sản phẩm đã tồn tại
      const existingProduct = existingProducts.find(
        product => product.name.toLowerCase() === value.toLowerCase().trim()
      );
      
      if (existingProduct) {
        newRows[idx] = {
          ...newRows[idx],
          name: existingProduct.name,
          unit: existingProduct.unit,
          price: existingProduct.price,
          quantity: 0, // Reset số lượng để nhập thêm
          product_id: existingProduct.id,
          operation: "update"
        };
      } else {
        newRows[idx] = {
          ...newRows[idx],
          [field]: value,
          product_id: null,
          operation: "create"
        };
      }
    } else {
      newRows[idx][field] = field === "quantity" || field === "price" ? Number(value) : value;
    }
    
    setRows(newRows);
  };

  // Chọn sản phẩm từ danh sách
  const selectProduct = (idx, product) => {
    const newRows = [...rows];
    newRows[idx] = {
      name: product.name,
      unit: product.unit,
      price: product.price,
      quantity: 0,
      product_id: product.id,
      operation: "update"
    };
    setRows(newRows);
    setSearchTerm("");
  };

  // Tính tổng tiền
  const total = rows.reduce((sum, r) => sum + r.quantity * r.price, 0);

  // Lọc sản phẩm gợi ý
  const filteredProducts = existingProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !rows.some(row => row.product_id === product.id)
  );

  // Hàm lưu đơn nhập và cập nhật tồn kho
  const handleSave = async () => {
    // Validate dữ liệu
    const hasEmptyFields = rows.some(row => 
      !row.markedForDelete && (!row.name.trim() || !row.unit.trim())
    );
    
    if (hasEmptyFields) {
      setMessage("❌ Vui lòng điền đầy đủ thông tin cho tất cả sản phẩm!");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      // Phân loại items
      const itemsToProcess = rows.filter(row => !row.markedForDelete);
      const itemsToDelete = rows.filter(row => row.markedForDelete && row.product_id);

      const payload = {
        items: itemsToProcess.map(row => ({
          name: row.name.trim(),
          unit: row.unit.trim(),
          quantity: row.quantity || 0,
          price: row.price || 0,
          product_id: row.product_id,
          operation: row.operation
        })),
        deleted_items: itemsToDelete.map(row => ({
          product_id: row.product_id,
          name: row.name
        }))
      };

      const response = await axios.post("http://localhost:5000/api/import", payload);
      
      let successMessage = `✅ ${response.data.message}! `;
      
      if (response.data.processed_items) {
        const created = response.data.processed_items.filter(item => item.action === 'created').length;
        const updated = response.data.processed_items.filter(item => item.action === 'updated').length;
        const imported = response.data.processed_items.filter(item => item.action === 'imported').length;
        
        if (created > 0) successMessage += `Tạo mới: ${created} sản phẩm. `;
        if (updated > 0) successMessage += `Cập nhật: ${updated} sản phẩm. `;
        if (imported > 0) successMessage += `Nhập kho: ${imported} sản phẩm. `;
      }
      
      if (itemsToDelete.length > 0) {
        successMessage += `Xóa: ${itemsToDelete.length} sản phẩm.`;
      }
      
      setMessage(successMessage);
      
      // Reset form và tải lại danh sách sản phẩm
      setRows([{ name: "", unit: "", quantity: 0, price: 0, product_id: null, operation: "create" }]);
      fetchExistingProducts();
      
      // Tự động chuyển hướng sau 3 giây
      setTimeout(() => {
        navigate("/inventory");
      }, 3000);
      
    } catch (err) {
      console.error("Lỗi khi xử lý sản phẩm:", err);
      if (err.response?.data?.error) {
        setMessage(`❌ ${err.response.data.error}`);
      } else {
        setMessage("❌ Lỗi khi xử lý sản phẩm!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Đếm số lượng thao tác
  const newProductsCount = rows.filter(row => !row.markedForDelete && row.operation === "create").length;
  const updateProductsCount = rows.filter(row => !row.markedForDelete && row.operation === "update").length;
  const deleteProductsCount = rows.filter(row => row.markedForDelete).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header với nút quay lại */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Quản lý Sản phẩm</h1>
            <p className="text-gray-600">Thêm mới, cập nhật hoặc xóa sản phẩm trong kho</p>
          </div>
          <button
            onClick={() => navigate("/inventory")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại Tồn kho
          </button>
        </div>

        {/* Thông tin tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900">{rows.filter(r => r.name.trim() && !r.markedForDelete).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Thêm mới</p>
                <p className="text-2xl font-bold text-gray-900">{newProductsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cập nhật</p>
                <p className="text-2xl font-bold text-gray-900">{updateProductsCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Xóa</p>
                <p className="text-2xl font-bold text-gray-900">{deleteProductsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form quản lý sản phẩm */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh sách sản phẩm</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">STT</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Tên sản phẩm *</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Đơn vị *</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Số lượng nhập</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Giá nhập</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Thành tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${r.markedForDelete ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 border text-gray-900 text-center">{i + 1}</td>
                    
                    {/* Tên sản phẩm với autocomplete */}
                    <td className="px-4 py-3 border relative">
                      <input
                        value={r.name}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          handleChange(i, "name", e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập tên sản phẩm"
                      />
                      {searchTerm && i === rows.length - 1 && filteredProducts.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.map(product => (
                            <div
                              key={product.id}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b"
                              onClick={() => selectProduct(i, product)}
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                {product.unit} • {product.price.toLocaleString()}₫ • Tồn: {product.stock}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 border">
                      <input
                        value={r.unit}
                        onChange={(e) => handleChange(i, "unit", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="kg, cái, hộp..."
                      />
                    </td>
                    
                    <td className="px-4 py-3 border">
                      <input
                        type="number"
                        value={r.quantity}
                        min="0"
                        onChange={(e) => handleChange(i, "quantity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                        placeholder="0"
                      />
                    </td>
                    
                    <td className="px-4 py-3 border">
                      <input
                        type="number"
                        value={r.price}
                        min="0"
                        onChange={(e) => handleChange(i, "price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                        placeholder="0"
                      />
                    </td>
                    
                    <td className="px-4 py-3 border text-right font-semibold text-green-600">
                      {(r.quantity * r.price).toLocaleString()}₫
                    </td>
                    
                    {/* Trạng thái */}
                    <td className="px-4 py-3 border text-center">
                      {r.markedForDelete ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                          Sẽ xóa
                        </span>
                      ) : r.product_id ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                          Cập nhật
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          Mới
                        </span>
                      )}
                    </td>
                    
                    {/* Thao tác */}
                    <td className="px-4 py-3 border text-center">
                      <div className="flex justify-center gap-2">
                        {r.product_id && !r.markedForDelete && (
                          <button
                            onClick={() => markForDelete(i)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Đánh dấu xóa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {r.markedForDelete && (
                          <button
                            onClick={() => markForDelete(i)}
                            className="text-green-600 hover:text-green-800 transition-colors p-1"
                            title="Hủy đánh dấu xóa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {rows.length > 1 && (
                          <button
                            onClick={() => removeRow(i)}
                            className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                            title="Xóa dòng"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-4 py-3 border text-right font-semibold text-gray-900">
                    Tổng giá trị nhập kho:
                  </td>
                  <td className="px-4 py-3 border text-right font-semibold text-green-600">
                    {total.toLocaleString()}₫
                  </td>
                  <td colSpan={2} className="px-4 py-3 border"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
              disabled={loading || rows.every(row => !row.name.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lưu thay đổi
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
    </div>
  );
}