// Branching conversation scenarios.
//
// Node shapes:
//  - Statement node (no `responses`): NPC speaks a line, user just presses "Continue".
//      { id, npc, npcEn, next }              // next: id of following node, or "end"
//  - Response node: NPC speaks a line, then the app listens for the user's
//    reply. Each entry in `responses` is one acceptable branch: if the
//    transcript matches one of its `variants`, the dialogue continues at
//    `next`. If nothing matches after a couple of tries, a hint (built from
//    `label`/`variants`) is shown, and "Skip" moves to `responses[0].next`.
//      { id, npc, npcEn, responses: [ { variants: [...], label, next } ] }

export const dialogues = [
  {
    id: "sich-vorstellen",
    title: "Sich vorstellen",
    titleEn: "Introducing Yourself",
    tier: "beginner",
    description: "Practice greeting someone and saying who you are.",
    startNode: "n1",
    nodes: {
      n1: {
        id: "n1",
        npc: "Hallo! Wie heißt du?",
        npcEn: "Hello! What is your name?",
        responses: [
          {
            variants: ["ich heiße", "ich heisse", "mein name ist"],
            label: "Say: 'Ich heiße ...' (My name is ...)",
            next: "n2",
          },
        ],
      },
      n2: {
        id: "n2",
        npc: "Freut mich! Woher kommst du?",
        npcEn: "Nice to meet you! Where are you from?",
        responses: [
          {
            variants: ["ich komme aus", "ich bin aus"],
            label: "Say: 'Ich komme aus ...' (I come from ...)",
            next: "n3",
          },
        ],
      },
      n3: {
        id: "n3",
        npc: "Wie geht's dir?",
        npcEn: "How are you?",
        responses: [
          {
            variants: ["mir geht es gut", "gut danke", "gut, danke", "es geht mir gut"],
            label: "Say: 'Mir geht es gut' or 'Gut, danke' (I'm good, thanks)",
            next: "n4",
          },
        ],
      },
      n4: {
        id: "n4",
        npc: "Das freut mich. Bis bald!",
        npcEn: "Glad to hear it. See you soon!",
        next: "end",
      },
    },
  },
  {
    id: "im-cafe",
    title: "Im Café",
    titleEn: "At the Café",
    tier: "beginner",
    description: "Order a drink at a café. Try answering differently to see the conversation branch.",
    startNode: "c1",
    nodes: {
      c1: {
        id: "c1",
        npc: "Guten Tag! Was möchten Sie trinken?",
        npcEn: "Hello! What would you like to drink?",
        responses: [
          {
            variants: ["kaffee", "einen kaffee", "ich möchte einen kaffee", "ich hätte gern einen kaffee"],
            label: "Say: 'Ich möchte einen Kaffee, bitte' (I would like a coffee, please). Add 'mit Milch und Zucker' for milk and sugar!",
            next: "c2-coffee",
          },
          {
            variants: ["tee", "einen tee", "ich möchte einen tee", "ich hätte gern einen tee"],
            label: "Say: 'Einen Tee, bitte' (A tea, please)",
            next: "c2-tea",
          },
        ],
      },
      "c2-coffee": {
        id: "c2-coffee",
        npc: "Ein Kaffee, sehr gerne. Mit Milch?",
        npcEn: "One coffee, coming up. With milk?",
        responses: [
          {
            variants: ["ja", "ja bitte", "ja, bitte"],
            label: "Say: 'Ja, bitte' (Yes, please)",
            next: "c3",
          },
          {
            variants: ["nein", "nein danke", "nein, danke", "schwarz"],
            label: "Say: 'Nein, danke' (No, thanks)",
            next: "c3",
          },
        ],
      },
      "c2-tea": {
        id: "c2-tea",
        npc: "Ein Tee, sehr gerne. Mit Zucker?",
        npcEn: "One tea, coming up. With sugar?",
        responses: [
          {
            variants: ["ja", "ja bitte", "ja, bitte"],
            label: "Say: 'Ja, bitte' (Yes, please)",
            next: "c3",
          },
          {
            variants: ["nein", "nein danke", "nein, danke"],
            label: "Say: 'Nein, danke' (No, thanks)",
            next: "c3",
          },
        ],
      },
      c3: {
        id: "c3",
        npc: "Das macht drei Euro fünfzig, bitte.",
        npcEn: "That's three euros fifty, please.",
        responses: [
          {
            variants: ["bitte schön", "hier bitte", "bitte", "hier ist das geld"],
            label: "Say: 'Bitte schön' (Here you go) as you hand over payment",
            next: "c4",
          },
        ],
      },
      c4: {
        id: "c4",
        npc: "Danke schön! Einen schönen Tag noch!",
        npcEn: "Thank you! Have a nice day!",
        next: "end",
      },
    },
  },
  {
    id: "bezahlen",
    title: "Bezahlen & Wechselgeld",
    titleEn: "Paying & Getting Change",
    tier: "beginner",
    description: "Hear a price, hand over money, and understand your change.",
    startNode: "b1",
    nodes: {
      b1: {
        id: "b1",
        npc: "Das macht vier Euro zwanzig.",
        npcEn: "That comes to 4.20 €.",
        responses: [
          {
            variants: ["hier sind fünf euro", "hier bitte fünf euro", "fünf euro"],
            label: "Say: 'Hier sind fünf Euro' (Here is five euros)",
            next: "b2",
          },
        ],
      },
      b2: {
        id: "b2",
        npc: "Danke. Und achtzig Cent zurück.",
        npcEn: "Thanks. And 80 cents back in change.",
        responses: [
          {
            variants: ["danke", "danke schön", "vielen dank"],
            label: "Say: 'Danke!' (Thank you!)",
            next: "b3",
          },
        ],
      },
      b3: {
        id: "b3",
        npc: "Bitte schön! Schönen Tag noch!",
        npcEn: "You're welcome! Have a nice day!",
        responses: [
          {
            variants: ["tschüss", "auf wiedersehen", "danke gleichfalls", "ihnen auch"],
            label: "Say: 'Tschüss!' or 'Danke, gleichfalls!' (Bye! / You too!)",
            next: "b4",
          },
        ],
      },
      b4: {
        id: "b4",
        npc: "Tschüss!",
        npcEn: "Bye!",
        next: "end",
      },
    },
  },
  {
    id: "einkaufen",
    title: "Einkaufen",
    titleEn: "Shopping",
    tier: "a1",
    description: "Buy some apples at the market and practice numbers.",
    startNode: "s1",
    nodes: {
      s1: {
        id: "s1",
        npc: "Guten Tag! Was darf es sein?",
        npcEn: "Hello! What can I get you?",
        responses: [
          {
            variants: ["ich möchte äpfel", "ich hätte gern äpfel", "äpfel", "ich möchte apfel"],
            label: "Say: 'Ich möchte Äpfel, bitte' (I'd like some apples, please)",
            next: "s2",
          },
        ],
      },
      s2: {
        id: "s2",
        npc: "Gerne. Wie viele möchten Sie?",
        npcEn: "Sure. How many would you like?",
        responses: [
          {
            variants: ["fünf", "sechs", "drei", "zwei", "vier", "sieben", "acht", "zehn"],
            label: "Say a number, e.g. 'Fünf, bitte' (Five, please)",
            next: "s3",
          },
        ],
      },
      s3: {
        id: "s3",
        npc: "Sonst noch etwas?",
        npcEn: "Anything else?",
        responses: [
          {
            variants: ["nein danke", "nein, danke", "das ist alles", "nein das ist alles"],
            label: "Say: 'Nein, danke, das ist alles' (No thanks, that's all)",
            next: "s4",
          },
        ],
      },
      s4: {
        id: "s4",
        npc: "In Ordnung, das macht zwei Euro.",
        npcEn: "Alright, that's two euros.",
        next: "end",
      },
    },
  },
  {
    id: "nach-dem-weg-fragen",
    title: "Nach dem Weg fragen",
    titleEn: "Asking for Directions",
    tier: "a2",
    description: "Ask a stranger how to get to the train station.",
    startNode: "d1",
    nodes: {
      d1: {
        id: "d1",
        npc: "Entschuldigung, kann ich Ihnen helfen?",
        npcEn: "Excuse me, can I help you?",
        responses: [
          {
            variants: [
              "wie komme ich zum bahnhof",
              "wo ist der bahnhof",
              "ich suche den bahnhof",
            ],
            label: "Say: 'Wie komme ich zum Bahnhof?' (How do I get to the train station?)",
            next: "d2",
          },
        ],
      },
      d2: {
        id: "d2",
        npc: "Gehen Sie geradeaus und dann links.",
        npcEn: "Go straight ahead and then left.",
        responses: [
          {
            variants: ["ist es weit", "ist das weit"],
            label: "Say: 'Ist es weit?' (Is it far?)",
            next: "d3",
          },
        ],
      },
      d3: {
        id: "d3",
        npc: "Nein, nur fünf Minuten zu Fuß.",
        npcEn: "No, just five minutes on foot.",
        responses: [
          {
            variants: ["danke", "danke schön", "vielen dank"],
            label: "Say: 'Danke schön!' (Thank you!)",
            next: "d4",
          },
        ],
      },
      d4: {
        id: "d4",
        npc: "Bitte schön! Auf Wiedersehen.",
        npcEn: "You're welcome! Goodbye.",
        next: "end",
      },
    },
  },
];

export function getDialogue(id) {
  return dialogues.find((d) => d.id === id);
}
