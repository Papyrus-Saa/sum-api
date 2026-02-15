import { IsString, IsNumber, Matches } from 'class-validator';

export class CreateTireSizeDto {
  @IsString()
  sizeRaw: string;

  @IsString()
  @Matches(/^\d{3}\/\d{2}R\d{2}$/, {
    message: 'sizeNormalized must match format: 205/55R16',
  })
  sizeNormalized: string;

  @IsNumber()
  width: number;

  @IsNumber()
  aspectRatio: number;

  @IsNumber()
  rimDiameter: number;
}

export class CreateTireCodeDto {
  @IsString()
  codePublic: string;

  @IsString()
  tireSizeId: string;
}
