import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  NATS_SERVICE: string;
}

const envSchema = joi
  .object({
    NATS_SERVICE: joi.array().items(joi.string()).required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate({
  ...process.env,
  NATS_SERVICE: process.env.NATS_SERVICE?.split(','),
});

if (error) throw new Error(`Config validation error: ${error.message}`);

const envVars: EnvVars = value;

export const envs = {
  nats_service: envVars.NATS_SERVICE,
};
