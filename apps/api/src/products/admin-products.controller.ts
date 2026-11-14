import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ImageUploadInterceptor } from '../uploads/image-upload.interceptor';

import {
  AdminProductsQueryDto,
  CreateProductDto,
  StockAdjustmentDto,
  UpdateProductDto,
  UpdateProductImageDto,
} from './dto/products.dto';
import { ProductsService } from './products.service';

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: AdminProductsQueryDto) {
    return this.products.adminList(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.adminGet(id);
  }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.products.create(admin.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.products.update(admin.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() admin: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.products.remove(admin.id, id);
  }

  @Post(':id/stock')
  adjustStock(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockAdjustmentDto
  ) {
    return this.products.adjustStock(admin.id, id, dto);
  }

  @Get(':id/stock-movements')
  stockMovements(@Param('id', ParseUUIDPipe) id: string, @Query() query: PaginationQueryDto) {
    return this.products.stockMovements(id, query.limit, query.offset);
  }

  @Post(':id/images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(ImageUploadInterceptor)
  addImage(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.products.addImage(admin.id, id, file);
  }

  @Patch(':id/images/:imageId')
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateProductImageDto
  ) {
    return this.products.updateImage(id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeImage(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string
  ) {
    await this.products.removeImage(admin.id, id, imageId);
  }
}
