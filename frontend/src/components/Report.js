import React, { useState } from "react";
import axios from "axios";

export default function ImportForm() {
  const [rows, setRows] = useState([
    { name: "", unit: "", quantity: 0, price: 0 }
  ]);
  const [message, setMessage] = useState("");

  // Thêm dòng mới
  const addRow = () => setRows([...rows, { name: "", unit: "", quantity: 0, price: 0 }]);

  // Xóa dòng
  const removeRow = (idx) => setRows(rows.filter((_, i) => i !== idx));

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
    try {
      await axios.post("http://localhost:5000/api/import", { items: rows });
      setMessage("Lưu đơn nhập thành công!");
      setRows([{ name: "", unit: "", quantity: 0, price: 0 }]);
    } catch (err) {
      setMessage("Lỗi khi lưu đơn nhập!");
    }
  };

  return (
    <div style={{padding: 32, maxWidth: 800, margin: "0 auto"}}>
      <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 24}}>Nhập hàng</h2>
      <table style={{width: "100%", borderCollapse: "collapse", background: "#fff"}}>
        <thead>
          <tr style={{background: "#f6f8fa"}}>
            <th>STT</th>
            <th>Tên sản phẩm</th>
            <th>Đơn vị</th>
            <th>Số lượng</th>
            <th>Giá tiền</th>
            <th>Thành tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td style={{textAlign: "center"}}>{idx + 1}</td>
              <td>
                <input value={row.name} onChange={e => handleChange(idx, "name", e.target.value)} style={{width: 120}} />
              </td>
              <td>
                <input value={row.unit} onChange={e => handleChange(idx, "unit", e.target.value)} style={{width: 80}} />
              </td>
              <td>
                <input type="number" value={row.quantity} min={0} onChange={e => handleChange(idx, "quantity", e.target.value)} style={{width: 60}} />
              </td>
              <td>
                <input type="number" value={row.price} min={0} onChange={e => handleChange(idx, "price", e.target.value)} style={{width: 80}} />
              </td>
              <td style={{textAlign: "right"}}>{(row.quantity * row.price).toLocaleString()}</td>
              <td>
                {rows.length > 1 && <button onClick={() => removeRow(idx)}>Xóa</button>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{textAlign: "right", fontWeight: "bold"}}>Tổng tiền:</td>
            <td style={{textAlign: "right", fontWeight: "bold"}}>
              {total.toLocaleString()}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <button onClick={addRow} style={{marginTop: 16, marginRight: 16}}>Thêm dòng</button>
      <button onClick={handleSave} style={{marginTop: 16, background: "#27ae60", color: "#fff", padding: "8px 24px", border: "none", borderRadius: 6, fontWeight: 600}}>Lưu</button>
      {message && <div style={{marginTop: 16, color: "#27ae60"}}>{message}</div>}
    </div>
  );
}
