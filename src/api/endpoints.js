import http from "./http";

export const authAPI = {
  login: (email, password) => http.post("/auth/login", { email, password }),
  register: (name, email, password, role) => http.post("/auth/register", { name, email, password, role }),
  me: () => http.get("/auth/me"),
};

export const storeAPI = {
  getStore: () => http.get("/store"),
  updateStore: (data) => http.put("/store", data),
};

export const usersAPI = {
  getUsers: () => http.get("/users"),
  createUser: (data) => http.post("/users", data),
  changeRole: (id, role) => http.patch(`/users/${id}/role`, { role }),
  toggleActive: (id) => http.patch(`/users/${id}/toggle`),
};

export const categoriesAPI = {
  getCategories: () => http.get("/categories"),
  createCategory: (name) => http.post("/categories", { name }),
  updateCategory: (id, name) => http.put(`/categories/${id}`, { name }),
  deleteCategory: (id) => http.delete(`/categories/${id}`),
};

export const productsAPI = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.categoryId) query.append("categoryId", params.categoryId);
    if (params.active !== undefined) query.append("active", params.active);
    const qs = query.toString();
    return http.get(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id) => http.get(`/products/${id}`),
  createProduct: (data) => http.post("/products", data),
  updateProduct: (id, data) => http.put(`/products/${id}`, data),
  toggleActive: (id) => http.patch(`/products/${id}/toggle`),
  updateStock: (id, change) => http.patch(`/products/${id}/stock`, { change }),
};

export const salesAPI = {
  createSale: (data) => http.post("/sales", data),
  getSales: (params = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.append("from", params.from);
    if (params.to) query.append("to", params.to);
    if (params.cashierId) query.append("cashierId", params.cashierId);
    const qs = query.toString();
    return http.get(`/sales${qs ? `?${qs}` : ""}`);
  },
  getSale: (id) => http.get(`/sales/${id}`),
};

export const reportsAPI = {
  getSummary: (from, to) => http.get(`/reports/summary?from=${from}&to=${to}`),
  getTopItems: (from, to) => http.get(`/reports/top-items?from=${from}&to=${to}`),
};