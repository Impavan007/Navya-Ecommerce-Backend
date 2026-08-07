import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Listen
  app.listen(PORT, () => {
    console.log(`📡 E-Commerce backend listening on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
  });
};

startServer();
