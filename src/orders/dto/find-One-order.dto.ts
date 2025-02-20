import { IsMongoId, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class FindOneByOrderDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsMongoId()
  userId: string;
}
