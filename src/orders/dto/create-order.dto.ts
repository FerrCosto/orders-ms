import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';

class CreateOrderDetailDto {
  @IsNumber()
  @IsPositive()
  productId: number;
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateOrderDto {
  @IsMongoId()
  userId: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  detail: CreateOrderDetailDto[];
}
