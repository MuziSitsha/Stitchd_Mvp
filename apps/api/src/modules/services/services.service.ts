import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceCategoryEntity } from './entities/service-category.entity';
import { ServiceEntity } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceCategoryEntity)
    private readonly categoriesRepository: Repository<ServiceCategoryEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,
  ) {}

  async listCategories() {
    return this.categoriesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async listServices(categoryId?: string) {
    return this.servicesRepository.find({
      where: categoryId ? { categoryId, isActive: true } : { isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async createCategory(dto: CreateServiceCategoryDto, userRole: UserRole) {
    this.ensureAdmin(userRole);
    const category = this.categoriesRepository.create({
      ...dto,
      slug: this.slugify(dto.name),
    });
    return this.categoriesRepository.save(category);
  }

  async createService(dto: CreateServiceDto, userRole: UserRole) {
    this.ensureAdmin(userRole);
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Service category not found');

    const service = this.servicesRepository.create({
      ...dto,
      slug: this.slugify(dto.name),
      estimatedDurationMinutes: dto.estimatedDurationMinutes || 60,
      supportsInstantBooking: dto.supportsInstantBooking ?? true,
    });
    return this.servicesRepository.save(service);
  }

  private ensureAdmin(role: UserRole) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}