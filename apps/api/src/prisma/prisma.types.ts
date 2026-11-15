import { Prisma } from '@prisma/client';

/** Either the root client or an interactive-transaction client. */
export type DbClient = Prisma.TransactionClient;
