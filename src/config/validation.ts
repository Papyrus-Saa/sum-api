import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().optional(),
});

export type EnvConfig = {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL?: string;
};
