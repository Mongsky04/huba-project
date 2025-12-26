import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { authenticateWeb } from './middlewares/auth';

import authRoutes from './routes/authRoutes';
import licenseRoutes from './routes/licenseRoutes';
import topupRoutes from './routes/topupRoutes';
import userRoutes from './routes/userRoutes';
import webhookRoutes from './routes/webhookRoutes';

const app: Application = express();

// Configure Helmet with relaxed CSP for HTML pages
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (assets)
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Serve swagger custom JS
app.get('/swagger-custom.js', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/swagger-custom.js'));
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'KGiTON API - License & Token Management',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Serve login and register pages (public)
app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/login.html'));
});

app.get('/register', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/register.html'));
});

// Logout route (clear cookie and redirect)
app.get('/logout', (_req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/login');
});

// Payment complete page (redirect from payment gateway after payment)
app.get('/payment/complete', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/payment-complete.html'));
});

// Secure Swagger Documentation with authentication
app.use('/api-docs', authenticateWeb, swaggerUi.serve);
app.get('/api-docs', (req: any, res) => {
  // Get user role from authenticated request
  const userRole = req.user?.role;
  
  // Clone swagger spec and filter based on role
  let filteredSpec: any = JSON.parse(JSON.stringify(swaggerSpec));
  
  // If not super admin, remove super admin endpoints
  if (userRole !== 'super_admin') {
    const paths: any = {};
    
    // Filter paths - exclude License Keys endpoints
    for (const [path, methods] of Object.entries(filteredSpec.paths || {})) {
      // Skip super admin endpoints
      if (path.includes('/admin/license-keys')) {
        continue;
      }
      
      // Filter methods that require super admin
      const filteredMethods: any = {};
      for (const [method, spec] of Object.entries(methods as any)) {
        const tags = (spec as any).tags || [];
        // Skip if tagged as "License Keys"
        if (!tags.includes('License Keys')) {
          filteredMethods[method] = spec;
        }
      }
      
      // Only add path if it has methods
      if (Object.keys(filteredMethods).length > 0) {
        paths[path] = filteredMethods;
      }
    }
    
    filteredSpec.paths = paths;
    
    // Filter tags
    if (filteredSpec.tags) {
      filteredSpec.tags = filteredSpec.tags.filter((tag: any) => tag.name !== 'License Keys');
    }
  }
  
  const html = swaggerUi.generateHTML(filteredSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'KGiTON API Documentation',
    customJs: '/swagger-custom.js',
  });
  res.send(html);
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/license-keys', licenseRoutes);
app.use('/api/topup', topupRoutes);
app.use('/api/user', userRoutes);
app.use('/api/webhook', webhookRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
