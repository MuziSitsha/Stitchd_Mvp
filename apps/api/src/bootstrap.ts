import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
];

/**
 * Shared setup applied by both the local dev server (main.ts) and the
 * Vercel serverless entry point (serverless.ts), so the two never drift.
 */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) || defaultAllowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('STITCHD API')
      .setDescription('STITCHD On-Demand Services Platform - South Africa')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & OTP')
      .addTag('users', 'Customer management')
      .addTag('providers', 'Service provider management')
      .addTag('bookings', 'Booking engine')
      .addTag('services', 'Service categories')
      .addTag('payments', 'Payments & wallet')
      .addTag('chat', 'In-app messaging')
      .addTag('reviews', 'Ratings & reviews')
      .addTag('admin', 'Admin panel APIs')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
}
