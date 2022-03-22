import { Prisma, PrismaClient, Reminder } from '@prisma/client'

const prisma = new PrismaClient()

export const getReminder = async (reminderId: number) : Promise<Reminder | null> => {
  const reminder = await prisma.reminder.findUnique({
    where: {
      id: reminderId
    }
  })

  await prisma.$disconnect()

  return reminder
}

export const getExpiredReminders = async () : Promise<Reminder[]> => {
  const reminders = await prisma.reminder.findMany({
    where: {
      expiresAt: {
        lt: (new Date()).toISOString()
      }
    }
  })

  await prisma.$disconnect()

  return reminders
}

export const createReminder = async (reminder: Prisma.ReminderCreateInput) : Promise<Reminder> => {
  const newReminder = await prisma.reminder.create({
    data: reminder
  })

  await prisma.$disconnect()

  return newReminder
}

export const deleteReminder = async (reminderId: number) : Promise<Reminder> => {
  const deletedReminder = await prisma.reminder.delete({
    where: {
      id: reminderId
    }
  })

  await prisma.$disconnect()

  return deletedReminder
}