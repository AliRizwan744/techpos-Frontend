const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// LocalStorage se token nikalne ka tareeqa
const getToken = () => {
  // ✅ pehle "token" key check karo
  const token = localStorage.getItem("token");
  if (token) return token;

  // ✅ phir "userInfo" check karo (backup)
  const userInfo = localStorage.getItem("userInfo");
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      return parsed.token;
    } catch { return null; }
  }

  return null;
};

const request = async (method, url, body = null) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = { 
    method, 
    headers 
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);
    
    // Agar response khali ho (e.g. DELETE) toh empty object return karein
    const data = response.status === 204 ? {} : await response.json();

    if (!response.ok) {
      // 🔥 YAHAN SE ERROR THROW HOGA
      // Frontend par 'next' nahi likhna, sirf throw Error karna hai
      const errorMessage = data.message || "Kuch gadbad ho gayi";
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error; 
    }

    return data;
  } catch (err) {
    // Agar fetch fail ho jaye (Network Error)
    console.error("HTTP Request Error:", err.message);
    throw err; 
  }
};

const http = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  put: (url, body) => request("PUT", url, body),
  patch: (url, body) => request("PATCH", url, body),
  delete: (url) => request("DELETE", url),
};

export default http;