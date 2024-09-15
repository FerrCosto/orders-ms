import { IsDate, IsObject } from 'class-validator';
import { CreateOrderDetailDto } from './create-detail-order.dto';

export class CreateOrderDto {
  @IsObject()
  detail: CreateOrderDetailDto;
}
