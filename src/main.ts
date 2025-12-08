import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Inicializar Firebase Admin SDK desde variable de entorno
  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    
    if (!serviceAccountBase64) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env - push notifications will not work');
    } else {
      // Decodificar el Base64 y parsear el JSON
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully from environment variable');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.warn('⚠️ Push notifications will not work');
  }
  
  app.useGlobalFilters(new AllExceptionsFilter());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
