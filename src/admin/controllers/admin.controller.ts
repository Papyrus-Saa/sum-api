import { Controller, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { CreateMappingDto } from '../dto/create-mapping.dto';
import { UpdateMappingDto } from '../dto/update-mapping.dto';

@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post('mappings')
  async createMapping(@Body() body: CreateMappingDto) {
    return this.adminService.createMapping(body);
  }

  @Patch('mappings/:id')
  async updateMapping(
    @Param('id') id: string,
    @Body() body: UpdateMappingDto,
  ) {
    return this.adminService.updateMapping(id, body);
  }

  @Delete('mappings/:id')
  async deleteMapping(@Param('id') id: string) {
    return this.adminService.deleteMapping(id);
  }
}
