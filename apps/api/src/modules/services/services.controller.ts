import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List active service categories' })
  listCategories() {
    return this.servicesService.listCategories();
  }

  @Get()
  @ApiOperation({ summary: 'List active services' })
  listServices(@Query('categoryId') categoryId?: string) {
    return this.servicesService.listServices(categoryId);
  }

  @Post('categories')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a service category' })
  createCategory(@Request() req, @Body() dto: CreateServiceCategoryDto) {
    return this.servicesService.createCategory(dto, req.user.role);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a service' })
  createService(@Request() req, @Body() dto: CreateServiceDto) {
    return this.servicesService.createService(dto, req.user.role);
  }
}