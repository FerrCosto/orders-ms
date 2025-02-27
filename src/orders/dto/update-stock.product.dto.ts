import { IsBoolean, IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateProductStockDto {
  @IsInt()
  @Min(5)
  @IsPositive()
  id: number;
  @IsInt()
  @Min(1)
  @IsPositive()
  quantity: number;
  @IsBoolean()
  @IsOptional()
  isFind?: boolean = false;
}
