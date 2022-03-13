import { Poll, Option, Vote, PrismaClient } from '@prisma/client'

export type PollWithOptions = Poll & {options: OptionWithVoters[]}
export type OptionWithVoters = Option & {voters: Vote[]}

export const getPoll = async (pollId: number) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  let poll = await prisma.poll.findUnique({
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
  await prisma.$disconnect()
  return poll
}

export const createPoll = async (poll: Poll) : Promise<PollWithOptions> => {
  const prisma = new PrismaClient()
  let newPoll = await prisma.poll.create({
    data: poll,
    include: {
      options: {
        include: {
          voters: true
        }
      }
    }
  })
  await prisma.$disconnect()
  return newPoll
}

export const updatePoll = async (poll: Poll) : Promise<Poll> => {
  const prisma = new PrismaClient()
  let updatedPoll = await prisma.poll.update({
    where: {
      id: poll.id
    },
    data: poll,
    include: {
      options: {
        include: {
          voters: true
        }
      }
    }
  })
  await prisma.$disconnect()
  return updatedPoll
}

export const deletePoll = async (pollId: number) : Promise<Poll> => {
  const prisma = new PrismaClient()
  let deletedPoll = await prisma.poll.delete({
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
  await prisma.$disconnect()
  return deletedPoll
}

export const addOption = async (option: Option, pollId: number) : Promise<void> => {
  const prisma = new PrismaClient()
  await prisma.poll.update({
    where: {
      id: pollId
    },
    include: {
      options: true
    },
    data: {
      options: {
        push:
      }
    }
  })
  let poll = await getPoll(pollId)

  poll?.options.push(option)

  return
}
