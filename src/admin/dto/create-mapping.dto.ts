import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TIRE_SIZE_FLEXIBLE_PATTERN,
  TIRE_SIZE_DTO_ERROR_MESSAGE,
} from '../../common/constants/validation';

export class CreateMappingDto {
  @ApiProperty({
    description: 'Public tire code identifier',
    example: 'MICMPR2',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  codePublic: string;

  @ApiProperty({
    description:
      'Tire size in standardized format (e.g., 225/50R17, 225 50 R 17)',
    example: '225/50R17',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(TIRE_SIZE_FLEXIBLE_PATTERN, {
    message: TIRE_SIZE_DTO_ERROR_MESSAGE,
  })
  sizeRaw: string;
}
