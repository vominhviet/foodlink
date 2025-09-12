
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Invoice from './components/Invoice';
import History from "./components/History";
import Report from './components/Report'; 
import StockHistory from './components/StockHistory';

function ProtectedLayout({ children }) {
  // Layout cho các trang đã đăng nhập (có thể thêm header/sidebar ở đây)
  return <div>{children}</div>;
}

function App() {
  const isLoggedIn = !!localStorage.getItem("user");

  return (
    <BrowserRouter>
      <Routes>
        {/* Trang gốc: luôn chuyển hướng đến login */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        {/* Login và Register nằm ngoài layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Các trang bảo vệ nằm trong layout riêng */}
        <Route
          path="/dashboard"
          element={isLoggedIn ? <ProtectedLayout><Dashboard /></ProtectedLayout> : <Navigate to="/login" />}
        />

        <Route
          path="/invoice"
          element={isLoggedIn ? <ProtectedLayout><Invoice /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={isLoggedIn ? <ProtectedLayout><History /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/report"
          element={isLoggedIn ? <ProtectedLayout><Report /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route path="/stock-history" element={<StockHistory />} />

        {/* Fallback route cho các trang không tồn tại */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;