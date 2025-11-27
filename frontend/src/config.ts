const API_BASE_URL =
  import.meta.env.PROD ? window.location.origin : "http://localhost:8000";
export default API_BASE_URL;