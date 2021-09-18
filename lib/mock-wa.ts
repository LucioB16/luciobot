import WAWebJS, {
  Chat,
  Contact,
  Message,
  MessageMedia,
  MessageTypes,
  Order, Payment,
  Product,
  ProductMetadata
} from 'whatsapp-web.js'

export const mockMessage: Message =
  {
    getPayment(): WAWebJS.Payment {
      return mockPayment;
    },
    acceptGroupV4Invite(): Promise<{ status: number }> {
      return Promise.resolve({status: 0});
    },
    delete(everyone: boolean | undefined): Promise<void> {
      return Promise.resolve(undefined);
    },
    downloadMedia(): Promise<WAWebJS.MessageMedia> {
      return Promise.resolve(new MessageMedia("", ""));
    },
    forward(chat: WAWebJS.Chat | string): Promise<void> {
      return Promise.resolve(undefined);
    },
    forwardingScore: 0,
    getChat(): Promise<WAWebJS.Chat> {
      return Promise.resolve(mockChat)
    },
    getContact(): Promise<WAWebJS.Contact> {
      return Promise.resolve(mockContact);
    },
    getInfo(): Promise<WAWebJS.MessageInfo | null> {
      return Promise.resolve(null);
    },
    getMentions(): Promise<WAWebJS.Contact[]> {
      return Promise.resolve([]);
    },
    getOrder(): WAWebJS.Order {
      return mockOrder;
    },
    getQuotedMessage(): Promise<WAWebJS.Message> {
      return Promise.resolve(this);
    },
    isStarred: false,
    isStatus: false,
    links: new Array<{link: string; isSuspicious: boolean}>(),
    orderId: "",
    reply(content: WAWebJS.MessageContent, chatId: string | undefined, options: WAWebJS.MessageSendOptions | undefined): Promise<WAWebJS.Message> {
      return Promise.resolve(this);
    },
    star(): Promise<void> {
      return Promise.resolve(undefined);
    },
    unstar(): Promise<void> {
      return Promise.resolve(undefined);
    },
    vCards: [],
    mediaKey: undefined,
    id:
      {
        fromMe: false,
        remote: `554199999999@c.us`,
        id: '1234567890ABCDEFGHIJ',
        _serialized: `false_554199999999@c.us_1234567890ABCDEFGHIJ`
      },
    ack: -1,
    hasMedia: false,
    body: 'Hello!',
    type: MessageTypes.TEXT,
    timestamp: 1591482682,
    from: `554199999999@c.us`,
    to: `554188888888@c.us`,
    author: undefined,
    isForwarded: false,
    broadcast: false,
    fromMe: false,
    hasQuotedMsg: false,
    location: {
      latitude: "1",
      longitude: "1"
    },
    mentionedIds: []
  }

export const mockChat: Chat =
  {
    archive(): Promise<void> {
      return Promise.resolve(undefined);
    },
    clearMessages(): Promise<boolean> {
      return Promise.resolve(false);
    },
    clearState(): Promise<boolean> {
      return Promise.resolve(false);
    },
    delete(): Promise<boolean> {
      return Promise.resolve(false);
    },
    fetchMessages(searchOptions: WAWebJS.MessageSearchOptions): Promise<WAWebJS.Message[]> {
      return Promise.resolve([]);
    },
    getContact(): Promise<WAWebJS.Contact> {
      return Promise.resolve(mockContact);
    },
    getLabels(): Promise<WAWebJS.Label[]> {
      return Promise.resolve([]);
    },
    isMuted: false,
    markUnread(): Promise<void> {
      return Promise.resolve(undefined);
    },
    mute(unmuteDate: Date): Promise<void> {
      return Promise.resolve(undefined);
    },
    muteExpiration: 0,
    pin(): Promise<boolean> {
      return Promise.resolve(false);
    },
    sendMessage(content: WAWebJS.MessageContent, options: WAWebJS.MessageSendOptions | undefined): Promise<WAWebJS.Message> {
      return Promise.resolve(mockMessage);
    },
    sendSeen(): Promise<void> {
      return Promise.resolve(undefined);
    },
    sendStateRecording(): Promise<void> {
      return Promise.resolve(undefined);
    },
    sendStateTyping(): Promise<void> {
      return Promise.resolve(undefined);
    },
    unarchive(): Promise<void> {
      return Promise.resolve(undefined);
    },
    unmute(): Promise<void> {
      return Promise.resolve(undefined);
    },
    unpin(): Promise<boolean> {
      return Promise.resolve(false);
    },
    id: {
      server: 'c.us',
      user: '554199999999',
      _serialized: `554199999999@c.us`
    },
    name: '+55 41 9999-9999',
    isGroup: false,
    isReadOnly: false,
    unreadCount: 6,
    timestamp: 1591484087,
    archived: false
  }

export const mockContact: Contact =
  {
    block(): Promise<boolean> {
      return Promise.resolve(false);
    }, getAbout(): Promise<string | null> {
      return Promise.resolve(null);
    }, getChat(): Promise<WAWebJS.Chat> {
      return Promise.resolve(mockChat);
    }, getProfilePicUrl(): Promise<string> {
      return Promise.resolve("");
    }, isBlocked: false, unblock(): Promise<boolean> {
      return Promise.resolve(false);
    },
    id: {
      server: 'c.us',
      user: '554199999999',
      _serialized: `554199999999@c.us`
    },
    number: '554199999999',
    isBusiness: false,
    isEnterprise: false,
    labels: [],
    name: undefined,
    pushname: 'John',
    sectionHeader: "",
    shortName: undefined,
    statusMute: false,
    type: 'in',
    verifiedLevel: undefined,
    verifiedName: undefined,
    isMe: false,
    isUser: true,
    isGroup: false,
    isWAContact: true,
    isMyContact: false
  }

export const mockOrder: Order =
  {
    products:
      [

      ],
    subtotal: "150000",
    total: "150000",
    currency: "GTQ",
    createdAt: 1610136796,
  }

export const mockProduct: Product =
  {
    getData(): Promise<WAWebJS.ProductMetadata> {
      return Promise.resolve(mockProductMetadata);
    },
    id: "123456789",
    price: "150000",
    thumbnailUrl: "https://mmg.whatsapp.net",
    currency: "GTQ",
    name: "Store Name",
    quantity: 1
  }

export const mockProductMetadata: ProductMetadata =
  {
    description: "",
    name: "",
    id: ""
  }

export const mockPayment: Payment =
  {
    id: { },
    paymentAmount1000: 0,
    paymentCurrency: '',
    paymentMessageReceiverJid: { },
    paymentNote: '',
    paymentStatus: 0,
    paymentTransactionTimestamp: 0,
    paymentTxnStatus: 0

  }