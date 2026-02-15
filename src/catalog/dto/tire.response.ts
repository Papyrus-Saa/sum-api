export class TireSizeResponseDto {
  id: string;
  sizeNormalized: string;
  width: number;
  aspectRatio: number;
  rimDiameter: number;
}

export class TireCodeResponseDto {
  id: string;
  codePublic: string;
  tireSizeId: string;
}
