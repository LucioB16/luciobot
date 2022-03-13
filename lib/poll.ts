import { Option, Poll, Prisma, PrismaClient, Vote } from '@prisma/client'

export type PollWithOptions = Poll & {options: OptionWithVoters[]}
export type OptionWithVoters = Option & {voters: Vote[]}

export const getPoll = async (pollId: number) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  const poll = await prisma.poll.findUnique({
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

export const createPoll = async (poll: Prisma.PollCreateInput) : Promise<PollWithOptions> => {
  const prisma = new PrismaClient()
  const newPoll = await prisma.poll.create({
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

export const updatePoll = async (pollId: number, poll: Prisma.PollUpdateInput) : Promise<PollWithOptions> => {
  const prisma = new PrismaClient()
  const updatedPoll = await prisma.poll.update({
    where: {
      id: pollId
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

export const deletePoll = async (pollId: number) : Promise<PollWithOptions> => {
  const prisma = new PrismaClient()
  const deletedPoll = await prisma.poll.delete({
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

export const getOption = async (optionId: number) : Promise<OptionWithVoters | null> => {
  const prisma = new PrismaClient()
  const option = await prisma.option.findUnique({
    where: {
      id: optionId
    },
    include: {
      voters: true
    }
  })
  prisma.$disconnect()
  return option
}

export const getOptionByPollOrder = async (order: number, pollId: number) : Promise<OptionWithVoters | null> => {
  const prisma = new PrismaClient()
  const option = await prisma.option.findFirst({
    where: {
      order: order,
      pollId: pollId
    },
    include: {
      voters: true
    }
  })
  prisma.$disconnect()
  return option
}

export const addOption = async (option: Prisma.OptionCreateInput) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  const newOption = await prisma.option.create({ data: option })
  prisma.$disconnect()
  return await getPoll(newOption.pollId)
}

export const updateOption = async (optionId: number, option: Prisma.OptionUpdateInput) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  const updatedOption = await prisma.option.update({
    where: {
      id: optionId
    },
    data: option
  })
  prisma.$disconnect()
  return await getPoll(updatedOption.pollId)
}

export const deleteOption = async (optionId: number) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  const deletedOption = await prisma.option.delete({
    where: {
      id: optionId
    }
  })
  prisma.$disconnect()
  return await getPoll(deletedOption.pollId)
}

export const getVote = async (voteId: number) : Promise<Vote | null> => {
  const prisma = new PrismaClient()
  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    }
  })
  prisma.$disconnect()
  return vote
}

export const getVoteByVoterOption = async (voterId: string, optionId: number) : Promise<Vote | null> => {
  const prisma = new PrismaClient()
  const vote = await prisma.vote.findFirst({
    where: {
      voterId: voterId,
      optionId: optionId
    }
  })
  prisma.$disconnect()
  return vote
}

export const addVote = async (vote: Prisma.VoteCreateInput) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  const newVote = await prisma.vote.create({data: vote})
  prisma.$disconnect()
  const option = await getOption(newVote.optionId)
  return await getPoll(option!.pollId)
}

export const updateVote = async (vote: Prisma.VoteUpdateInput, voteId: number) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  const updatedVote = await prisma.vote.update({
    where: {
      id: voteId
    },
    data : vote
  })
  prisma.$disconnect()
  const option = await getOption(updatedVote.optionId)
  return await getPoll(option!.pollId)
}

export const updateVoteByVoterOption = async (vote: Prisma.VoteUpdateInput, voterId: string, optionId: number) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  await prisma.vote.updateMany({
    where: {
      voterId: voterId,
      optionId: optionId
    },
    data: vote
  })
  prisma.$disconnect()
  const updatedVote = await getVoteByVoterOption(voterId, optionId)
  const option = await getOption(updatedVote!.optionId)
  return await getPoll(option!.pollId)
}

export const deleteVote = async (voteId: number) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  const deletedVote = await prisma.vote.delete({
    where: {
      id: voteId
    }
  })
  prisma.$disconnect()
  const option = await getOption(deletedVote.optionId)
  return await getPoll(option!.pollId)
}

export const deleteVoteByVoterOption = async (voterId: string, optionId: number) : Promise<PollWithOptions | null> => {
  const prisma = new PrismaClient()
  await prisma.vote.deleteMany({
    where: {
      voterId: voterId,
      optionId: optionId
    }
  })
  prisma.$disconnect()
  const updatedVote = await getVoteByVoterOption(voterId, optionId)
  const option = await getOption(updatedVote!.optionId)
  return await getPoll(option!.pollId)
}
