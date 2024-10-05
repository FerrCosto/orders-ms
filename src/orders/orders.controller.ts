import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { paidOrderDto } from './dto/paid-order.dto';
import { FindOneByOrderDto } from './dto/find-One-order.dto';

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
  findOne(@Payload() findOneDto: FindOneByOrderDto) {
    return this.ordersService.findOne(findOneDto);
  }

  @MessagePattern('order.findOnePaid')
  findOnePaid(@Payload() findOneDto: FindOneByOrderDto) {
    return this.ordersService.findOnePaid(findOneDto);
  }

  @EventPattern('payment.succeded')
  paidOrder(@Payload() paidOrderDto: paidOrderDto) {
    return this.ordersService.paidOrder(paidOrderDto);
  }
}
