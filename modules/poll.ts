import { Client, List, Message, MessageTypes } from 'whatsapp-web.js'
import { Command } from '../luciobot'
import * as log from '../lib/log'
import { Prisma } from '@prisma/client'
import * as dbPoll from '../lib/poll'

type PollRow = {description: string, id: string, title: string}

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
    run: async (message: Message, client: Client, args: string[]) => {
      try {
        const question = args.join(" ")

        if (question.includes("|")) {
          return await message.reply("No se puede incluir el carácter | en una pregunta")
        }

        const chatId = (await message.getChat()).id._serialized
        const author = message.from

        // TODO: set last message id

        // Register poll in DB
        const poll : Prisma.PollCreateInput = {
          question: question,
          author: author,
          chatId: chatId,
          lastMessageId: message.id._serialized
        }

        const newPoll = await dbPoll.createPoll(poll)

        const replyText = `!Encuesta |${newPoll.id}| creada\nPregunta: ${newPoll.question}\n\nContestá este mensaje citándolo para agregar una opción a la encuesta\nEjemplo: Si`

        return await message.reply(replyText);
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  },
  {
    name: 'add-option',
    secret: true,
    description: 'Adds a new option to a poll',
    examples: ['add-option Si'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: 'add-option <description>',
    run: async (message: Message, client: Client, args: string[]) => {
      try {
        const description = args.join(" ")

        if (description.includes("|")) {
          return await message.reply("No se puede incluir el carácter | en una pregunta")
        }

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

        let lastOption = poll!.options[0]

        for (let option of poll!.options) {
          if (lastOption.order < option.order) {
            lastOption = option
          }
        }

        const optionOrder = lastOption.order + 1;

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

        if (poll!.options.length > 1) {
          replyText += "\n\nO contestá este mensaje con **!publicar <horas>** para publicar la encuesta en este chat"
          replyText += "\nEjemplo:\n!publicar 24\nEn ese caso la encuesta tendrá una duración de 24 horas, si no especificás una cantidad de hora, la encuestá durará 1 hora"
        }

        const newMessage = await message.reply(replyText);

        const updatePollMessageId : Prisma.PollUpdateInput = {
          lastMessageId: newMessage.id._serialized
        }

        await dbPoll.updatePoll(poll!.id, updatePollMessageId)

        return newMessage
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
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
    run: async (message: Message, client: Client, args: string[]) => {
      try {
        const hours = Number(args[0])

        if(isNaN(hours)) {
          return await message.reply(`Debe especificar una cantidad de horas en formato númerico`)
        }

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

        let rows: PollRow[] = []

        for (let option of poll!.options) {
          rows.push({
            id: option.id.toString(),
            title: option.id.toString(),
            description: option.content,
          })
        }

        let sections = [{title:`!Encuesta |${poll!.id}|`,rows: rows}];
        let list = new List(poll!.question,'Elegí una opción',sections,`Encuesta |${poll!.id}|`,`Encuesta |${poll!.id}|`);
        let newMessage = await client.sendMessage(message.from, list);

        const updatePollMessageId : Prisma.PollUpdateInput = {
          lastMessageId: newMessage.id._serialized,
          published: true
        }

        await dbPoll.updatePoll(poll!.id, updatePollMessageId)

        return newMessage;
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  },
  {
    name: 'vote',
    secret: true,
    description: 'Selects an option from a poll',
    examples: ['!vote 1 Description'],
    adminOnly: false,
    aliases: [],
    cooldown: 0,
    minArgs: 1,
    maxArgs: Infinity,
    signature: '!vote <option>',
    run: async (message: Message, client: Client, args: string[]) => {
      try {
        const option = args.join(" ")

        console.log(option)

        console.log(message)

        return await message.reply("Voto registrado");
      } catch (e) {
        return await log.error(JSON.stringify(e), client)
      }
    }
  }
]