import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: resolve(__dirname, '../../.env'), quiet: true });
loadEnv({ path: resolve(__dirname, '../../.env.local'), quiet: true });

const appConfig = { connectionString: process.env.DATABASE_URL };
if (process.env.DATABASE_SCHEMA) appConfig.schema = process.env.DATABASE_SCHEMA;

const adapter = new PrismaPg(appConfig);
const prisma = new PrismaClient({ adapter });

export default prisma;