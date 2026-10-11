require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];
required.forEach((key) => {
  if (!process.env[key] && process.env.NODE_ENV !== 'test') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'test-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicVerifyUrl: process.env.PUBLIC_VERIFY_URL || 'http://localhost:5173/verify',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },
  smsProvider: process.env.SMS_PROVIDER || 'mock',
  mock: {
    otp: process.env.MOCK_OTP !== 'false',
    aadhaar: process.env.MOCK_AADHAAR !== 'false',
    biometric: process.env.MOCK_BIOMETRIC !== 'false',
  },
};
