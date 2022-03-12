import { Poll, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getPoll = async (pollId: number) : Promise<Poll | null> => {
  return await prisma.poll.findUnique({
    where: {
      id: pollId
    },
    include: {
      options: {
        include: {
          voters: true
        }
      }
    }
  })
}

export const createPoll = async (poll: Poll) : Promise<Poll> => {
  return await prisma.poll.create({
    data: poll
  })
}

// export const updatePoll = async (poll: Poll) : Promise<Poll> => {
//   await prisma.poll.u
// }
