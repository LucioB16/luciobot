import { Client, Contact, List, Message, MessageSendOptions, MessageTypes } from 'whatsapp-web.js'
import { Command, TelegramBotWrapper } from '../luciobot'
import * as log from '../lib/log'
import { Prisma, Vote } from '@prisma/client'
import * as dbPoll from '../lib/poll'

type PollRow = {description: string, id: string, title: string}

type MessageWrapper = {to: string, content: string, options: MessageSendOptions}
export const name = 'poll'
export const commands: Command[] = [
  {
    name: 'poll',
    secret: false,
    description: 'Creates a new poll',
    examples: ['poll sale asado?'],
    adminOnly: false,
    aliases: ['encuesta', 'votacion'],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: 'poll <question>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        const question = args.join(" ")

        if (question.includes("|")) {
          return await message.reply("No se puede incluir el carácter | en una pregunta")
        }

        const chatId = (await message.getChat()).id._serialized
        const author = message.author ?? message.from

        // Register poll in DB
        const poll : Prisma.PollCreateInput = {
          question: question,
          author: author,
          chatId: chatId,
          lastMessageId: message.id._serialized
        }

        const newPoll = await dbPoll.createPoll(poll)

        const replyText = `!Encuesta |${newPoll.id}| creada\nPregunta: ${newPoll.question}\n\nContestá este mensaje citándolo para agregar una opción a la encuesta\nEjemplo: Si`

        let newMessage = await message.reply(replyText)

        const updatePollMessageId : Prisma.PollUpdateInput = {
          lastMessageId: newMessage.id._serialized
        }

        await dbPoll.updatePoll(newPoll.id, updatePollMessageId)

        return newMessage
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'add-option',
    secret: true,
    description: 'Adds a new option to a poll',
    examples: ['add-option 1234 Si'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 3,
    maxArgs: 3,
    signature: 'add-option <pollId> <quotedMessageId> <description>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        const description = args[2]

        if (description.includes("|")) {
          return await message.reply("No se puede incluir el carácter | en una pregunta")
        }

        const pollId = Number(args[0]);

        if(isNaN(pollId)) {
          return await message.reply(`Error al recuperar la encuesta ${args[1]}`)
        }

        const poll = await dbPoll.getPoll(pollId)

        const quotedMsgId = args[1]

        if (poll!.lastMessageId !== quotedMsgId) {
          return await message.reply(`Contestá mi último mensaje de la encuesta ${poll!.id}\nPregunta: ${poll!.question}`)
        }

        let author = message.author ?? message.from
        if (poll!.author !== author) {
          let contact = await client.getContactById(poll!.author)
          return await message.reply(
            `Solo @${contact.number} puede agregar opciones porque es el creador de la encuesta`,
            message.from,
            {mentions: [contact]}
          )
        }

        let optionOrder = 1;

        let lastOption = poll!.options[0]

        if (lastOption !== undefined) {
          for (let option of poll!.options) {
            if (lastOption.order < option.order) {
              lastOption = option
            }
          }
          optionOrder = lastOption.order + 1;
        }

        const option : Prisma.OptionCreateInput = {
          order: optionOrder,
          content: description,
          poll: { connect: { id: poll!.id } }
        }

        let updatedPoll = await dbPoll.addOption(option)

        let replyText = `!Encuesta |${updatedPoll!.id}|\n\nNueva opción registrada: ${description}\n\nPregunta: ${updatedPoll!.question}\n\nOpciones:`

        for (let option of updatedPoll!.options) {
          replyText += `\n\n${option.order} - ${option.content}`
        }

        replyText += "\n\nContestá este mensaje citándolo para agregar más opciones a la encuesta\nEjemplo: Si"

        if (updatedPoll!.options.length > 1) {
          replyText += "\n\nO contestá este mensaje con *!publicar <horas>* para publicar la encuesta en este chat"
          replyText += "\n\n*HASTA NO QUE NO SE PUBLIQUE LA ENCUESTA, NO SE PUEDE VOTAR*"
          replyText += "\n\nEjemplo:\n!publicar 24\nEn ese caso la encuesta tendrá una duración de 24 horas, si no especificás una cantidad de hora, la encuestá durará 1 hora"
        }
        else {
          replyText +="\n\n*LA ENCUESTA TIENE QUE TENER MINIMO 2 OPCIONES PARA FUNCIONAR*"
        }

        const newMessage = await message.reply(replyText);

        const updatePollMessageId : Prisma.PollUpdateInput = {
          lastMessageId: newMessage.id._serialized
        }

        await dbPoll.updatePoll(poll!.id, updatePollMessageId)

        return newMessage
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'publish',
    secret: true,
    description: 'Publishes a poll',
    examples: ['publish', 'publish 24'],
    adminOnly: false,
    aliases: ['publicar'],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 1,
    signature: 'publish',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        let hours = 1
        if (args.length > 0) {
          hours = Number(args[0])

          if(isNaN(hours)) {
            return await message.reply(`Debe especificar una cantidad de horas en formato númerico`)
          }
        }

        if (hours <= 0) {
          return await message.reply("No se aceptan números iguales o menores a cero para la cantidad de horas")
        }

        if (hours > 72) {
          return await message.reply("No se permite una duración de encuesta de más de 72 horas")
        }

        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + hours)

        if (!message.hasQuotedMsg) {
          return await message.reply("Tenés que citar un mensaje")
        }

        const quotedMsg = await message.getQuotedMessage()

        if (!quotedMsg.fromMe) {
          return await message.reply ("Contestá a un mensaje mío")
        }

        if (quotedMsg.type !== MessageTypes.TEXT) {
          return await message.reply("Solo se acepta texto")
        }
        const messageBody = quotedMsg.body

        let pollIdText = messageBody.slice(
          messageBody.indexOf('|') + 1,
          messageBody.lastIndexOf('|'),
        )
        const pollId = Number(pollIdText);

        if(isNaN(pollId)) {
          return await message.reply(`Error al recuperar la encuesta ${pollIdText}`)
        }

        const poll = await dbPoll.getPoll(pollId)

        if (poll!.lastMessageId !== quotedMsg.id._serialized) {
          return await message.reply(`Contestá mi último mensaje de la encuesta ${poll!.id}\nPregunta: ${poll!.question}`)
        }

        let author = message.author ?? message.from
        if (poll!.author !== author) {
          let contact = await client.getContactById(poll!.author)
          return await message.reply(
            `Solo @${contact.number} puede publicar la encuesta porque es el creador`,
            message.from,
            {mentions: [contact]}
            )
        }

        if (poll!.options.length < 2) {
          return await message.reply("La encuesta debe tener más de 1 opción registrada")
        }

        let rows: PollRow[] = []

        for (let option of poll!.options) {
          rows.push({
            id: option.order.toString(),
            title: option.order.toString(),
            description: option.content,
          })
        }

        let sections = [{title: poll!.question,rows: rows}];
        let list = new List(poll!.question,'Elegí una opción',sections,`!Encuesta |${poll!.id}|`,`!Encuesta |${poll!.id}|`);
        let newMessage = await client.sendMessage(message.from, list);

        const updatePollMessageId : Prisma.PollUpdateInput = {
          expiresAt: expiresAt,
          lastMessageId: newMessage.id._serialized,
          published: true
        }

        await dbPoll.updatePoll(poll!.id, updatePollMessageId)

        const textAdvise = "Podés citar la encuesta y enviar *!resultados* para ver como van los resultados"
        await client.sendMessage(message.from, textAdvise)

        return newMessage;
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'vote',
    secret: true,
    description: 'Selects an option from a poll',
    examples: ['!vote 1 1324'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 2,
    maxArgs: 2,
    signature: '!vote <option> <pollId>',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        const optionOrder = Number(args[0])

        if(isNaN(optionOrder)) {
          return await message.reply(`Error al recuperar la opción ${args[0]}`)
        }

        const pollId = Number(args[1]);

        if(isNaN(pollId)) {
          return await message.reply(`Error al recuperar la encuesta ${args[1]}`)
        }

        const poll = await dbPoll.getPoll(pollId)

        if (poll === null) {
          return await message.reply(`Error al recuperar la encuesta ${pollId}, puede que ya haya finalizado`)
        }

        if (!poll.published) {
          return await message.reply("La encuesta no está publicada")
        }

        const option = await dbPoll.getOptionByPollOrder(optionOrder, pollId)

        if (option === null) {
          return await message.reply(`Error al recuperar la opción ${optionOrder}`)
        }

        const voterId = message.author ?? message.from

        let vote: Vote | null = null

        for (let optionVote of poll.options) {
          for (let voter of optionVote.voters) {
            if (voter.voterId === voterId) {
              vote = await dbPoll.getVote(voter.id)
            }
          }
        }

        if (vote === null) {
          const voteInsert: Prisma.VoteCreateInput = {
            voterId: voterId,
            option: { connect: { id: option.id } }
          }

          await dbPoll.addVote(voteInsert)

          return await message.reply(`Voto registrado\nOpción: ${option.content}`)
        }
        else {
          if (vote.optionId === option.id) {
            return await message.reply(`Ya hay un voto tuyo registrado por la opción: ${option.content}`)
          }

          const oldOption = await dbPoll.getOption(vote.optionId)

          const voteUpdate: Prisma.VoteUpdateInput = {
            option: { connect: { id: option.id }}
          }

          await dbPoll.updateVote(voteUpdate, vote.id)

          return await message.reply(`Voto cambiado\nOpción anterior: ${oldOption!.content}\nNueva Opción: ${option.content}`)
        }
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  },
  {
    name: 'results',
    secret: false,
    description: 'Gets results from a poll',
    examples: ['results'],
    adminOnly: false,
    aliases: ["resultados"],
    cooldown: 0,
    minArgs: 0,
    maxArgs: 0,
    signature: 'results',
    run: async (message: Message, client: Client, args: string[], telegramBot?: TelegramBotWrapper) => {
      try {
        if (!message.hasQuotedMsg) {
          return await message.reply("Tenés que citar un mensaje")
        }

        const quotedMsg = await message.getQuotedMessage()

        if (!quotedMsg.fromMe) {
          return await message.reply ("Contestá a una encuesta que haya mandado el bot")
        }

        if (quotedMsg.type !== MessageTypes.LIST) {
          return await message.reply("Contestá a una encuesta, no otra cosa")
        }

        // @ts-ignore
        const list = quotedMsg.rawData.list as List

        if (!list.title!.toLowerCase().startsWith("!encuesta"))
        {
          return await message.reply("Conteste a una encuesta válida")
        }

        let pollIdText = list.title!.slice(
          list.title!.indexOf('|') + 1,
          list.title!.lastIndexOf('|'),
        )

        const pollId = Number(pollIdText);

        if(isNaN(pollId)) {
          return await message.reply(`Error al recuperar la encuesta ${pollIdText}`)
        }

        const poll = await dbPoll.getPoll(pollId)

        if (poll === null) {
          return await message.reply(`Error al recuperar la encuesta ${pollId}, puede que ya haya finalizado`)
        }

        const newMessage = await getResults(poll, client)

        return await message.reply(newMessage.content, newMessage.to, newMessage.options)
      } catch (e) {
        return await log.error({ message: JSON.stringify(e), client: client, telegramBot: telegramBot!})
      }
    }
  }
]

const getResults = async (poll: dbPoll.PollWithOptions, client: Client) : Promise<MessageWrapper> => {
  let text = `*Resultados Encuesta:* ${poll.question}`
  let votesByOptions: number[] = new Array(poll.options.length).fill(0)
  let totalVotes = 0
  let percentagesText = "*Porcentajes:*"
  let votersTexts = "*Votos:*\n"
  let mentions: Contact[] = []

  for (let option of poll.options) {
    let count = 0

    let textVotesOption = `• ${option.content} :`

    for (let vote of option.voters) {
      count += 1
      let contact = await client.getContactById(vote.voterId)
      let contactNumber = vote.voterId.split("@")[0]
      textVotesOption += `\n\t@${contactNumber}`
      mentions.push(contact)
      totalVotes += 1
    }

    votersTexts += textVotesOption + "\n\n"
    votesByOptions[option.order - 1] = count
  }

  for (let option of poll.options) {
    const percentage = ((100 * votesByOptions[option.order - 1]) / totalVotes).toFixed(2)
    percentagesText += `\n• ${option.content} - ${percentage}%`
  }

  text += "\n\n" + percentagesText + "\n\n" + votersTexts

  const messageOptions: MessageSendOptions = { mentions: mentions }

  return {
    to: poll.chatId,
    content: text,
    options: messageOptions
  }
}

const checkFinishedPolls = async (client: Client) => {
  const polls = await dbPoll.getPublishedPolls()

  const currentDate = new Date()

  for (let poll of polls) {
    if (poll.expiresAt!.getTime() < currentDate.getTime()) {
      const message = await getResults(poll, client)

      await client.sendMessage(message.to, message.content, message.options)

      for (let option of poll.options) {
        for (let voter of option.voters) {
          await dbPoll.deleteVote(voter.id)
        }
        await dbPoll.deleteOption(option.id)
      }
      await dbPoll.deletePoll(poll.id)

      await client.sendMessage(poll.chatId, "Encuesta Finalizada")
      return
    }
  }
}

export const jobs = [
  {
    period: 3600,
    runInstantly: false,
    job: checkFinishedPolls
  }
]