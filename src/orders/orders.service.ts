import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { NATS_SERVICE } from 'src/config';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productsId = createOrderDto.detail.map(
        (detail) => detail.productId,
      );

      console.log(productsId);
      // Obtener los productos asociados con los IDs
      const products: any[] = await firstValueFrom(
        this.client.send('products.validate', productsId),
      );

      // Crear la orden y los detalles
      const order = await this.order.create({
        data: {
          date_order: new Date(),
          details: {
            createMany: {
              data: createOrderDto.detail.map((detail) => ({
                productId: detail.productId,
                quantity: detail.quantity,
              })),
            },
          },
        },
        include: {
          details: true, // Asegúrate de incluir todos los detalles
        },
      });

      return {
        ...order,
        details: order.details.map((detail) => ({
          ...detail,
          name: products.map((product) => product.name),
        })),
      };
    } catch (error) {
      console.log(error);
    }
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
