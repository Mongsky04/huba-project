import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║     KGiTON API - License & Token Management    ║
║                                                ║
╚════════════════════════════════════════════════╝

Server running on port ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}

API Documentation: http://localhost:${PORT}/api-docs
Health Check: http://localhost:${PORT}/

Press Ctrl+C to stop the server
  `);
});
