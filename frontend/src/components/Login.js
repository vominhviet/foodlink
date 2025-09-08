// Login.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await login(username, password);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
  navigate("/dashboard", { replace: true });
  window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng nhập");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f6fa",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/295/295128.png"
            alt="login"
            style={{ width: 56, height: 56 }}
          />
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            textAlign: "center",
            color: "#4b5ae2",
            marginBottom: 24,
          }}
        >
          Đăng nhập hệ thống
        </h2>

        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #dbe2ef",
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 4,
            }}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #dbe2ef",
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 4,
            }}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            background: "#4b5ae2",
            color: "#fff",
            fontWeight: 600,
            padding: "10px 0",
            borderRadius: 8,
            fontSize: 16,
            border: "none",
            boxShadow: "0 2px 8px rgba(75,90,226,0.12)",
            cursor: isLoading ? "not-allowed" : "pointer",
            marginTop: 8,
          }}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: 14,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
