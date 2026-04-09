import { Queue } from 'bullmq'
import { createBullMQConnection } from '@cache/redis'

export interface DunningJobPayload {
  executionId: string
  actionId: string
  invoiceId: string
  companyId: string
  // Optional fields for test email jobs
  test?: boolean
  testTo?: string
  testSubject?: string
  testBody?: string
}

export const dunningQueue = new Queue<DunningJobPayload>('dunning-queue', {
  connection: createBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})
