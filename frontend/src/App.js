import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import InvoiceManager from './components/InvoiceManager';
import History from "./components/History";
import Expenses from "./components/Expenses";
import InventoryReport from './components/InventoryReport';
import InventoryManager from "./components/InventoryManager";
import ImportForm from "./components/ImportForm";

function ProtectedLayout({ children }) {
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
          element={isLoggedIn ? <ProtectedLayout><InvoiceManager /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={isLoggedIn ? <ProtectedLayout><History /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/report"
          element={isLoggedIn ? <ProtectedLayout><InventoryReport /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/expenses"
          element={isLoggedIn ? <ProtectedLayout><Expenses /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/inventory"
          element={isLoggedIn ? <ProtectedLayout><InventoryManager /></ProtectedLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/import"
          element={isLoggedIn ? <ProtectedLayout><ImportForm /></ProtectedLayout> : <Navigate to="/login" />}
        />

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