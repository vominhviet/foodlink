// frontend/src/components/StockHistory.js

import { useEffect, useState } from "react";
import axios from "axios";

export default function StockHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/stock-history")
      .then(res => setHistory(res.data))
      .catch(() => setHistory([]));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Lịch sử nhập/xuất kho</h1>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-blue-50 text-blue-700">
            <th className="py-3 px-4">Ngày</th>
            <th className="py-3 px-4">Sản phẩm</th>
            <th className="py-3 px-4">Loại</th>
            <th className="py-3 px-4 text-right">Số lượng</th>
            <th className="py-3 px-4">Người thao tác</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-2 px-4">{new Date(item.date).toLocaleString()}</td>
              <td className="py-2 px-4">{item.productName}</td>
              <td className="py-2 px-4">{item.type === "import" ? "Nhập" : "Xuất"}</td>
              <td className="py-2 px-4 text-right">{item.quantity}</td>
              <td className="py-2 px-4">{item.user || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}