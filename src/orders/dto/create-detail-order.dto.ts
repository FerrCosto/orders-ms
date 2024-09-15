import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Roles } from 'src/enums/roles-user.enum';
class Direccion {
  @IsString()
  city: string;
  @IsString()
  street: string;
  @IsInt()
  postal: number;
}
class User {
  @IsString()
  fullName: string;
  @IsString()
  email: string;
  @IsPhoneNumber('CO')
  telefono: number;
  @IsObject()
  direccion: Direccion;
  @IsEnum(Roles, { each: true })
  roles: Roles[];
}

export class Products {
  @IsString()
  id: string;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  description: string;
  @IsDate()
  date_update: Date;
  @IsString()
  price: string;
  @IsArray({ each: true })
  img_products: ImgProduct[];
}

export class ImgProduct {
  @IsString()
  id: string;
  @IsString()
  url: string;
  @IsString()
  alt: string;
  @IsString()
  state_image: string;
}
export class CreateOrderDetailDto {
  @IsObject()
  user: User;
  @IsArray({
    each: true,
  })
  products: Products;
  @IsNumber()
  quantity: number;
}
