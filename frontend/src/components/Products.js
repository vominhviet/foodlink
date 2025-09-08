// components/Products.js - Quản lý sản phẩm
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getProducts } from "../api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", stock: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
  const response = await getProducts();
        setProducts(response.data);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [navigate]);

  // Thêm sản phẩm
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
  const res = await axios.post("http://localhost:5000/api/products", form);
      setProducts([...products, res.data]);
      setForm({ name: "", price: "", stock: "" });
      setShowAdd(false);
    } catch (error) {
      alert("Lỗi khi thêm sản phẩm");
    }
  };

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
  await axios.delete(`http://localhost:5000/api/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm");
    }
  };

  // Sửa sản phẩm
  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({ name: product.name, price: product.price, stock: product.stock });
    setShowEdit(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
  const res = await axios.put(`http://localhost:5000/api/products/${editProduct._id}`, form);
      setProducts(products.map((p) => (p._id === editProduct._id ? res.data : p)));
      setShowEdit(false);
      setEditProduct(null);
      setForm({ name: "", price: "", stock: "" });
    } catch (error) {
      alert("Lỗi khi cập nhật sản phẩm");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Quản lý Sản phẩm</h1>

      {/* Thêm sản phẩm */}
      <button
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShowAdd(true)}
      >
        Thêm sản phẩm
      </button>

      {showAdd && (
        <form className="mb-8 bg-white p-6 rounded shadow max-w-md" onSubmit={handleAdd}>
          <h2 className="text-lg font-bold mb-4">Thêm sản phẩm mới</h2>
          <input
            className="block w-full mb-2 p-2 border rounded"
            placeholder="Tên sản phẩm"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="block w-full mb-2 p-2 border rounded"
            placeholder="Giá"
            type="number"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            className="block w-full mb-4 p-2 border rounded"
            placeholder="Tồn kho"
            type="number"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Lưu</button>
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowAdd(false)}>Hủy</button>
          </div>
        </form>
      )}

      {/* Sửa sản phẩm */}
      {showEdit && (
        <form className="mb-8 bg-white p-6 rounded shadow max-w-md" onSubmit={handleUpdate}>
          <h2 className="text-lg font-bold mb-4">Sửa sản phẩm</h2>
          <input
            className="block w-full mb-2 p-2 border rounded"
            placeholder="Tên sản phẩm"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="block w-full mb-2 p-2 border rounded"
            placeholder="Giá"
            type="number"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            className="block w-full mb-4 p-2 border rounded"
            placeholder="Tồn kho"
            type="number"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Cập nhật</button>
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowEdit(false)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-4 rounded shadow flex flex-col gap-2">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p>Giá: {product.price} VND</p>
            <p>Tồn kho: {product.stock}</p>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500" onClick={() => handleEdit(product)}>Sửa</button>
              <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleDelete(product._id)}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}