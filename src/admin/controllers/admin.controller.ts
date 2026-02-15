import { Controller, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiCreatedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { CreateMappingDto } from '../dto/create-mapping.dto';
import { UpdateMappingDto } from '../dto/update-mapping.dto';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('mappings')
  @ApiOperation({
    summary: 'Create a new tire mapping',
    description:
      'Create a new mapping between a tire code and normalized size.',
  })
  @ApiBody({
    type: CreateMappingDto,
    description: 'Mapping data with code and size',
  })
  @ApiCreatedResponse({
    description: 'Tire mapping created successfully',
    schema: {
      example: {
        id: 'uuid-v4',
        codePublic: '100',
        sizeRaw: '205/55R16',
        sizeNormalized: '205/55R16',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid format or missing fields',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - code or size already exists',
  })
  async createMapping(@Body() body: CreateMappingDto) {
    return this.adminService.createMapping(body);
  }

  @Patch('mappings/:id')
  @ApiOperation({
    summary: 'Update an existing tire mapping',
    description:
      'Update either the code or size (or both) of an existing mapping.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mapping ID (UUID)',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @ApiBody({
    type: UpdateMappingDto,
    description: 'Fields to update (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tire mapping updated successfully',
    schema: {
      example: {
        id: 'uuid-v4',
        codePublic: '100',
        sizeRaw: '205/55R16',
        sizeNormalized: '205/55R16',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no fields provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Mapping not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - code or size already exists',
  })
  async updateMapping(@Param('id') id: string, @Body() body: UpdateMappingDto) {
    return this.adminService.updateMapping(id, body);
  }

  @Delete('mappings/:id')
  @ApiOperation({
    summary: 'Delete a tire mapping',
    description: 'Permanently delete a tire mapping by ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mapping ID (UUID)',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @ApiResponse({
    status: 200,
    description: 'Tire mapping deleted successfully',
    schema: {
      example: {
        id: 'uuid-v4',
        codePublic: '100',
        sizeRaw: '205/55R16',
        sizeNormalized: '205/55R16',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Mapping not found',
  })
  async deleteMapping(@Param('id') id: string) {
    return this.adminService.deleteMapping(id);
  }
}
