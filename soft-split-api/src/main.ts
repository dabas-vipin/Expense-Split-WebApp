import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    
    const httpFilter = app.get(HttpExceptionFilter);
    app.useGlobalFilters(httpFilter);
    
    await app.listen(process.env.PORT ?? 7000);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Error starting application:', error);
  }
}
bootstrap();
