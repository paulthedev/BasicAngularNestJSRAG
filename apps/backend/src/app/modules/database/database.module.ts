import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Document } from '../../../shared/entities/document.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] as string) || 5432,
      username: process.env['DB_USERNAME'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'postgres',
      database: process.env['DB_NAME'] || 'BasicRAG',
      entities: [Document],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([Document]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
