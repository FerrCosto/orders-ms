import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { paidOrderDto } from './dto/paid-order.dto';
import { PrismaClient } from '@prisma/client';
import { NATS_SERVICE } from 'src/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, lastValueFrom, throwError } from 'rxjs';
import { Decimal } from '@prisma/client/runtime/library';
import { CurrencyFormatter } from 'src/helpers';
import { PaymentSessionInterface } from './interfaces/create-payment.interface';

import { FindOneByOrderDto } from './dto/find-One-order.dto';
import { UpdateProductStockDto } from './dto/update-stock.product.dto';

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
      // Obtener los productos asociados con los IDs
      const data: UpdateProductStockDto[] = createOrderDto.detail.map(
        (detail) => ({
          id: detail.productId,
          quantity: detail.quantity,
        }),
      );

      const products: any[] = await firstValueFrom(
        this.client.send('products.validate', data),
      );
      const totalPrice = createOrderDto.detail.reduce((acc, detail) => {
        const product = products.find(
          (product) => product.id === detail.productId,
        );
        const totalProductPrice = parseFloat(product.price) * detail.quantity;
        return acc + totalProductPrice;
      }, 0);

      // Crear la orden y los detalles
      const order = await this.order.create({
        data: {
          createAt: new Date(),
          userId: createOrderDto.userId,
          details: {
            createMany: {
              data: createOrderDto.detail.map((detail) => {
                const product = products.find(
                  (product) => product.id === detail.productId,
                );
                const price = product.price;
                const totalProductPrice = price * detail.quantity;
                return {
                  productId: detail.productId,
                  quantity: detail.quantity,
                  price: new Decimal(price),
                  totalPrice: new Decimal(totalProductPrice),
                };
              }),
            },
          },
        },
        include: {
          details: true, // Asegúrate de incluir todos los detalles
        },
      });

      const { updateAt, ...resData } = order;
      console.log(order);
      return {
        ...resData,
        details: order.details.map((detail) => {
          const product = products.find(
            (product) => product.id === detail.productId,
          );
          const price = product.price;
          const totalProductPrice = price * detail.quantity;

          return {
            ...detail,
            price: detail.price.toDecimalPlaces(2).toNumber(),
            name: product.name,
            description: product.description,
            img: product.img_products[0]?.url || null,
            total: CurrencyFormatter.formatCurrency(totalProductPrice),
          };
        }),
        totalAmount: CurrencyFormatter.formatCurrency(totalPrice),
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(userId?: string) {
    let totalProductPrice = 0;
    const orders = userId
      ? await this.order.findMany({
          where: {
            userId,
            // AND: {
            //   paid: true,
            // },
          },
          include: {
            details: true,
          },
        })
      : await this.order.findMany({
          include: {
            details: true,
          },
        });
    const data: UpdateProductStockDto[] = orders
      .flatMap((detail) =>
        detail.details.map((data) => ({
          id: data.productId,
          quantity: data.quantity,
          isFind: true,
        })),
      )
      .reduce((acc, item) => {
        const existing = acc.find((x) => x.id === item.id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as UpdateProductStockDto[]);

    const products: any[] = await firstValueFrom(
      this.client.send('products.validate', data).pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );

    const ordersWithTotal = orders.map((order) => {
      const totalPrice = order.details.reduce((sum, item) => {
        const product = products.find(
          (product) => product.id === item.productId,
        );
        if (!product) return sum;

        const totalProductPrice = parseFloat(product.price) * item.quantity;
        return sum + totalProductPrice;
      }, 0);

      return {
        order: {
          id: order.id,
          status: order.status,
          userId: order.userId,
          paid: order.paid,
          createAt: order.createAt,
          totalAmount: `$${totalPrice.toFixed(2)}`, // Se formatea con dos decimales
        },
      };
    });

    return { orders: ordersWithTotal };
  }

  async getData(findOneDto: FindOneByOrderDto) {
    const { id, userId } = findOneDto;
    const order = await this.order.findFirst({
      where: {
        id,
        AND: {
          userId,
          //   paid: false,
        },
      },
      include: {
        details: true,
      },
    });

    if (!order)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with #${id} not found`,
      });

    const data: UpdateProductStockDto[] = order.details.map((detail) => ({
      id: detail.productId,
      quantity: detail.quantity,
      isFind: true,
    }));

    const products: any[] = await firstValueFrom(
      this.client.send('products.validate', data).pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );

    const totalPrice = order.details.reduce((acc, detail) => {
      const product = products.find(
        (product) => product.id === detail.productId,
      );
      const totalProductPrice = parseFloat(product.price) * detail.quantity;
      return acc + totalProductPrice;
    }, 0);
    const { updateAt, ...resData } = order;
    return { resData, order, products, totalPrice };
  }

  async findOne(findOneDto: FindOneByOrderDto) {
    const { order, resData, products, totalPrice } = await this.getData(
      findOneDto,
    );
    return {
      ...resData,
      details: resData.details.map((detail) => {
        const product = products.find(
          (product) => product.id === detail.productId,
        );

        return {
          ...detail,
          price: detail.price.toDecimalPlaces(2).toNumber() || null,
          name: product?.name || 'Desconocido',
          description: product?.description || 'Sin descripción',
          img: product?.img_products?.[0]?.url || null,
          total: CurrencyFormatter.formatCurrency(
            detail.totalPrice.toDecimalPlaces(2).toNumber(),
          ),
        };
      }),

      //   details: order.details.map((detail) => {
      //     const product = products.find(
      //       (product) => product.id === detail.productId,
      //     );

      //     return {
      //       id: detail.id,
      //       quantity: detail.quantity,
      //       price: CurrencyFormatter.formatCurrency(detail.price.toNumber()),
      //       name: product.name,
      //       description: product.description,
      //       img: product.img_products.map((img: any) => ({
      //         url: img.url,
      //         alt: img.alt,
      //         state_image: img.state_image,
      //       })),
      //       totalPrice: CurrencyFormatter.formatCurrency(
      //         detail.totalPrice.toNumber(),
      //       ),
      //     };
      //   }),
      totalAmount: CurrencyFormatter.formatCurrency(totalPrice),
    };
  }

  async paymentByFindOne(findOneDto: FindOneByOrderDto) {
    const { order, resData, products, totalPrice } = await this.getData(
      findOneDto,
    );
    return {
      ...resData,
      details: order.details.map((detail) => {
        const product = products.find(
          (product) => product.id === detail.productId,
        );
        const price = product.price;
        const totalProductPrice = price * detail.quantity;
        return {
          ...detail,
          price: detail.price.toNumber(),
          name: product.name,
          description: product.description,
          img: product.img_products[0]?.url || null,
          total: CurrencyFormatter.formatCurrency(totalProductPrice),
        };
      }),
      totalAmount: CurrencyFormatter.formatCurrency(totalPrice),
    };
  }
  async findOnePaid(findOneDto: FindOneByOrderDto) {
    let priceAmount: number = 0;
    const { id, userId } = findOneDto;
    console.log({ id, userId });
    const order = await this.order.findFirst({
      where: {
        id,
        AND: {
          userId,
          paid: true,
        },
      },
      include: {
        details: true,
      },
    });

    console.log({ order });
    if (!order)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with #${id} not found`,
      });
    const data: UpdateProductStockDto[] = order.details.map((detail) => ({
      id: detail.productId,
      quantity: detail.quantity,
      isFind: true,
    }));

    const products: any[] = await firstValueFrom(
      this.client.send('products.validate', data).pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );

    console.log({ products });
    return {
      ...order,
      details: order.details.map((detail) => {
        const product = products.find(
          (product) => product.id === detail.productId,
        );
        priceAmount += detail.totalPrice.toNumber();
        console.log(detail.price);

        return {
          id: detail.id,
          quantity: detail.quantity,
          price: CurrencyFormatter.formatCurrency(detail.price.toNumber()),
          name: product.name,
          description: product.description,
          img: product.img_products.map((img: any) => ({
            url: img.url,
            alt: img.alt,
            state_image: img.state_image,
          })),

          totalPrice: CurrencyFormatter.formatCurrency(
            detail.totalPrice.toNumber(),
          ),
        };
      }),

      totalAmount: CurrencyFormatter.formatCurrency(priceAmount),
    };
  }

  async countOrders() {
    try {
      const [totalOrders, ordersIsPaid, orderIsNotPaid] = await Promise.all([
        this.order.count({}),
        this.order.count({ where: { paid: true } }),
        this.order.count({ where: { paid: false } }),
      ]);

      return {
        totalOrders,
        ordersIsPaid,
        orderIsNotPaid,
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: 500,
        message: 'Mirar los logs',
      });
    }
  }

  async createPaymentSession(order: PaymentSessionInterface) {
    const paymentSession = await firstValueFrom(
      this.client.send('create.session.payment', {
        orderId: order.id,
        currency: 'usd',
        items: order.details.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: Array.isArray(item.img) ? item.img : [item.img],
        })),
      }),
    );
    return paymentSession;
  }

  async paidOrder(paidOrder: paidOrderDto) {
    const orderOne = await this.order.findFirst({
      where: { id: paidOrder.orderId },
      include: {
        details: true,
      },
    });

    const data: UpdateProductStockDto[] = orderOne.details.map((detail) => ({
      id: detail.productId,
      quantity: detail.quantity,
    }));
    await lastValueFrom(
      this.client.send('product.updateStock', data).pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );

    const order = await this.order.update({
      where: {
        id: paidOrder.orderId,
      },
      data: {
        status: 'PAID',
        paid: true,
      },
    });

    return order;
  }
}
