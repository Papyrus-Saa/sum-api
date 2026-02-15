import { IsOptional, IsString, Matches } from 'class-validator';
import { TIRE_SIZE_FLEXIBLE_PATTERN, TIRE_SIZE_DTO_ERROR_MESSAGE } from '../../common/constants/validation';

export class UpdateMappingDto {
  @IsString()
  @IsOptional()
  codePublic?: string;

  @IsString()
  @IsOptional()
  @Matches(TIRE_SIZE_FLEXIBLE_PATTERN, {
    message: TIRE_SIZE_DTO_ERROR_MESSAGE,
  })
  sizeRaw?: string;
}
