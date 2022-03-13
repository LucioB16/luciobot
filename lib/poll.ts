import { Option, Poll, Prisma, PrismaClient, Vote } from '@prisma/client'

export type PollWithOptions = Poll & {options: OptionWithVoters[]}
export type OptionWithVoters = Option & {voters: Vote[]}
const prisma = new PrismaClient()

export const getPoll = async (pollId: number) : Promise<PollWithOptions | null> => {
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

export const getPublishedPolls = async () : Promise<PollWithOptions[]> => {
  const polls = await prisma.poll.findMany({
    where: {
      published: true
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
  return polls
}

export const createPoll = async (poll: Prisma.PollCreateInput) : Promise<PollWithOptions> => {
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
  const option = await prisma.option.findUnique({
    where: {
      id: optionId
    },
    include: {
      voters: true
    }
  })
  await prisma.$disconnect()
  return option
}

export const getOptionByPollOrder = async (order: number, pollId: number) : Promise<OptionWithVoters | null> => {
  const option = await prisma.option.findFirst({
    where: {
      order: order,
      pollId: pollId
    },
    include: {
      voters: true
    }
  })
  await prisma.$disconnect()
  return option
}

export const addOption = async (option: Prisma.OptionCreateInput) : Promise<PollWithOptions | null> => {
  const newOption = await prisma.option.create({ data: option })
  await prisma.$disconnect()
  return await getPoll(newOption.pollId)
}

export const updateOption = async (optionId: number, option: Prisma.OptionUpdateInput) : Promise<PollWithOptions | null> => {
  const updatedOption = await prisma.option.update({
    where: {
      id: optionId
    },
    data: option
  })
  await prisma.$disconnect()
  return await getPoll(updatedOption.pollId)
}

export const deleteOption = async (optionId: number) : Promise<PollWithOptions | null> => {
  const deletedOption = await prisma.option.delete({
    where: {
      id: optionId
    }
  })
  await prisma.$disconnect()
  return await getPoll(deletedOption.pollId)
}

export const getVote = async (voteId: number) : Promise<Vote | null> => {
  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    }
  })
  await prisma.$disconnect()
  return vote
}

export const getVotesByVoterId = async (voterId: string) : Promise<Vote[] | null> => {
  const votes = await prisma.vote.findMany({
    where: {
      voterId: voterId
    }
  })
  await prisma.$disconnect()
  return votes
}

export const addVote = async (vote: Prisma.VoteCreateInput) : Promise<Vote> => {
  const newVote = await prisma.vote.create({data: vote})
  await prisma.$disconnect()
  return newVote
}

export const updateVote = async (vote: Prisma.VoteUpdateInput, voteId: number) : Promise<PollWithOptions | null> => {
  const updatedVote = await prisma.vote.update({
    where: {
      id: voteId
    },
    data : vote
  })
  await prisma.$disconnect()
  const option = await getOption(updatedVote.optionId)
  return await getPoll(option!.pollId)
}

export const deleteVote = async (voteId: number) : Promise<PollWithOptions | null> => {
  const deletedVote = await prisma.vote.delete({
    where: {
      id: voteId
    }
  })
  await prisma.$disconnect()
  const option = await getOption(deletedVote.optionId)
  return await getPoll(option!.pollId)
}
