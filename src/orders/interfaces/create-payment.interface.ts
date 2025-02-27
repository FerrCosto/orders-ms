import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface PaymentSessionInterface {
  details: {
    price: number;
    name: any;
    total: string;
    id: number;
    productId: number;
    quantity: number;
    img: any;
    totalPrice: Decimal;
    id_order: number | null;
  }[];
  id: number;
  createAt: Date;
  updateAt?: Date;
  status: OrderStatus;
  paid: boolean;
}
