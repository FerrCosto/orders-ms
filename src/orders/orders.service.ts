import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { CreateOrderDetailDto } from './dto/create-detail-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async createDetail(createOrderDetailDto: CreateOrderDetailDto) {
    const { products, user, quantity } = createOrderDetailDto;
    const detailOrder = await this.detail.create({
      data: {
        product: JSON.stringify(products),
        user: JSON.stringify(user),
        quantity,
      },
    });

    return detailOrder;
  }
  async create(createOrderDto: CreateOrderDto) {
    const { detail } = createOrderDto;
    const details = await this.createDetail(detail);
    const order = await this.orders.create({
      data: {
        date_order: new Date(),
        detail: {
          connect: { id: details.id },
        },
      },
    });

    return order;
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
