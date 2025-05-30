// Create a config file for API URLs
const config = {
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://quiz-production-2796.up.railway.app'  // ✅ Correct Railway URL
    : 'http://localhost:5000'
};

export default config; 