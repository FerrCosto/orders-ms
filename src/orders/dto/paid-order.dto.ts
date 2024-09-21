import { IsNumber, IsString } from 'class-validator';

export class paidOrderDto {
  @IsString()
  stripePaymentId: string;
  @IsNumber()
  orderId: number;
}
