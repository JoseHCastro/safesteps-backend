import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Inicializar Firebase Admin SDK desde variables de entorno individuales
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Log para debug (sin mostrar valores sensibles)
    console.log('🔧 Firebase Config Check:');
    console.log(`   - FIREBASE_PROJECT_ID: ${projectId ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - FIREBASE_PRIVATE_KEY: ${privateKey ? '✓ Set (' + privateKey.substring(0, 30) + '...)' : '✗ Missing'}`);
    console.log(`   - FIREBASE_CLIENT_EMAIL: ${clientEmail ? '✓ Set' : '✗ Missing'}`);

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('⚠️ Firebase credentials not found in environment - push notifications will not work');
      console.warn('   Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
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
