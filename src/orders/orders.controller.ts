import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('order.create')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createPaymentSession(order);

    return {
      order,
      payment: paymentSession,
    };
  }

  @MessagePattern('orders.findAll')
  findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern('order.findOne')
  findOne(@Payload() id: number) {
    return this.ordersService.findOne(id);
  }
}
