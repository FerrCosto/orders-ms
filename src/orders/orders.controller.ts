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
  findAll(@Payload() userId: string) {
    return this.ordersService.findAll(userId);
  }

  @MessagePattern('order.findOne')
  async findOne(@Payload() findOneDto: FindOneByOrderDto) {
    const order = await this.ordersService.findOne(findOneDto);
    const orderPayment = await this.ordersService.paymentByFindOne(findOneDto);
    const paymentSession = await this.ordersService.createPaymentSession(
      orderPayment,
    );

    return {
      order,
      payment: paymentSession,
    };
  }

  @MessagePattern('order.findOnePaid')
  findOnePaid(@Payload() findOneDto: FindOneByOrderDto) {
    return this.ordersService.findOnePaid(findOneDto);
  }

  @MessagePattern('orders.count')
  countOrders() {
    return this.ordersService.countOrders();
  }

  @EventPattern('payment.succeded')
  paidOrder(@Payload() paidOrderDto: paidOrderDto) {
    return this.ordersService.paidOrder(paidOrderDto);
  }
}
