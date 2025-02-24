import { IsInt, IsPositive, Min } from 'class-validator';

export class UpdateProductStockDto {
  @IsInt()
  @Min(5)
  @IsPositive()
  id: number;
  @IsInt()
  @Min(1)
  @IsPositive()
  quantity: number;
}
