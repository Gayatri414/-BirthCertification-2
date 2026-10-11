const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

(async () => {
  try {
    await connectDB();
    app.listen(env.port, () => console.log(`SmartBirth API on port ${env.port} [${env.nodeEnv}]`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
