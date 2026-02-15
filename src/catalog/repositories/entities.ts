export interface ITireSize {
  id: string;
  sizeRaw: string;
  sizeNormalized: string;
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITireCode {
  id: string;
  codePublic: string;
  tireSizeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTireSizeDto {
  sizeRaw: string;
  sizeNormalized: string;
  width: number;
  aspectRatio: number;
  rimDiameter: number;
}

export interface ICreateTireCodeDto {
  codePublic: string;
  tireSizeId: string;
}
