import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { PGliteDriver } from 'typeorm-pglite';
import { Document } from '../../shared/entities/document.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      driver: new PGliteDriver().driver,
      entities: [Document],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([Document]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
