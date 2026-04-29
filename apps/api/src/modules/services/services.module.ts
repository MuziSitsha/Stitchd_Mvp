import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServiceCategoryEntity } from './entities/service-category.entity';
import { ServiceEntity } from './entities/service.entity';

@Module({
	imports: [TypeOrmModule.forFeature([ServiceCategoryEntity, ServiceEntity])],
	controllers: [ServicesController],
	providers: [ServicesService],
	exports: [ServicesService, TypeOrmModule],
})
export class ServicesModule {}