import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { NATS_SERVICE } from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Decimal } from '@prisma/client/runtime/library';
import { CurrencyFormatter } from 'src/helpers';

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
      const totalPrice = createOrderDto.detail.reduce((acc, detail) => {
        const price = products.find(
          (products) => products.id === detail.productId,
        ).price;
        return parseFloat(price) * detail.quantity;
      }, 0);

      // Crear la orden y los detalles
      const order = await this.order.create({
        data: {
          date_order: new Date(),
          details: {
            createMany: {
              data: createOrderDto.detail.map((detail) => ({
                productId: detail.productId,
                quantity: detail.quantity,
                price: new Decimal(
                  products.find(
                    (product) => product.id === detail.productId,
                  ).price,
                ),
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
          price: CurrencyFormatter.formatCurrency(detail.price.toNumber()),
          name: products.map((product) => product.name),
          total: CurrencyFormatter.formatCurrency(totalPrice),
        })),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: 400,
        message: 'Check Logs',
      });
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
