// Create a config file for API URLs
const config = {
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://web-production-abc123.up.railway.app'  // ✅ This is the working URL
    : 'http://localhost:5000'
};

export default config; 