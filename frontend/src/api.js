import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Sửa lại nếu backend chạy port khác

// Đăng nhập
export const login = async (username, password) => {
  return axios.post(`${API_BASE_URL}/auth/login`, { username, password });
};

// Đăng ký
export const register = async (username, password) => {
  return axios.post(`${API_BASE_URL}/auth/register`, { username, password });
};

/// Lấy danh sách hóa đơn
export const getInvoices = async () => {
  return axios.get(`${API_BASE_URL}/invoices`);
};

// ... Thêm các hàm khác nếu cần

// Tạo mới hóa đơn
export const createInvoice = async (invoiceData) => {
  return axios.post(`${API_BASE_URL}/invoices`, invoiceData);
};
