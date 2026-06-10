import { ClassSerializerInterceptor, HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // CORS: read allowed origins from env (comma-separated). Defaults to the
    // local frontend dev URL so a fresh clone Just Works; production deployments
    // must set CORS_ORIGINS explicitly.
    const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
    app.enableCors({ origin: corsOrigins });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );

    // ClassSerializerInterceptor turns entities into plain objects via
    // class-transformer on the way out, honoring @Exclude on fields like
    // User.password so the bcrypt hash never leaves the server.
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    const httpFilter = app.get(HttpExceptionFilter);
    app.useGlobalFilters(httpFilter);

    await app.listen(process.env.PORT ?? 7000);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Error starting application:', error);
  }
}
bootstrap();
