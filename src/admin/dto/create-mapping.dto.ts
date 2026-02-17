import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TIRE_SIZE_FLEXIBLE_PATTERN,
  TIRE_SIZE_DTO_ERROR_MESSAGE,
} from '../../common/constants/validation';

export class CreateMappingDto {
  @ApiProperty({
    description:
      'Tire size in standardized format (e.g., 225/50R17, 225 50 R 17). Code is auto-generated.',
    example: '225/50R17',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(TIRE_SIZE_FLEXIBLE_PATTERN, {
    message: TIRE_SIZE_DTO_ERROR_MESSAGE,
  })
  sizeRaw: string;

  @ApiProperty({
    description: 'Load index (optional)',
    example: 91,
    type: 'integer',
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  loadIndex?: number;

  @ApiProperty({
    description: 'Speed index (optional)',
    example: 'V',
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  speedIndex?: string;
}
