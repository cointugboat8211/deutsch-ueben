// Course content. Exercises are generated from `items` (words/phrases) and
// `sentences` (full sentences, used for word-tile and speaking exercises), so
// authoring a lesson only needs correct German + English.
//
// lesson.qa (optional): German-only "which answer fits?" pairs { q, a, wrong: [..] }
// item.pic (optional): an emoji, used for German-only picture exercises (added by PICS below)
//
// lesson.digits (optional) adds generated "hear a number/price, type the digits" drills:
//   { kind: "number", lo, hi, count }  or  { kind: "price", count }

const w = (de, en, note) => ({ de, en, ...(note ? { note } : {}) });

export const lessonUnits = [
  {
    id: "u1",
    title: "Erste Schritte",
    titleEn: "First steps",
    emoji: "👋",
    lessons: [
      {
        id: "u1l1",
        title: "Greetings",
        items: [
          w("Hallo", "Hello", "HAH-loh"),
          w("Guten Morgen", "Good morning", "GOO-ten MOR-gen"),
          w("Guten Tag", "Good day / Hello", "GOO-ten tahk"),
          w("Guten Abend", "Good evening", "GOO-ten AH-bent"),
          w("Tschüss", "Bye", "chewss"),
          w("Auf Wiedersehen", "Goodbye (formal)", "owf VEE-der-zay-en"),
        ],
        sentences: [
          w("Hallo, wie geht's?", "Hello, how are you?"),
          w("Mir geht es gut.", "I'm doing well."),
          w("Guten Morgen, Anna!", "Good morning, Anna!"),
        ],
      },
      {
        id: "u1l2",
        title: "Polite words",
        items: [
          w("Bitte", "Please / You're welcome", "BIT-teh"),
          w("Danke", "Thank you", "DAHN-keh"),
          w("Vielen Dank", "Thank you very much"),
          w("Entschuldigung", "Excuse me / Sorry", "ent-SHOOL-dee-gung"),
          w("Ja", "Yes"),
          w("Nein", "No"),
        ],
        sentences: [
          w("Ja, bitte.", "Yes, please."),
          w("Nein, danke.", "No, thank you."),
          w("Vielen Dank, tschüss!", "Thank you very much, bye!"),
        ],
      },
      {
        id: "u1l3",
        title: "Introducing yourself",
        items: [
          w("Ich heiße", "My name is (I am called)"),
          w("Wie heißt du?", "What's your name?"),
          w("Ich komme aus", "I come from"),
          w("Woher kommst du?", "Where are you from?"),
          w("Freut mich", "Nice to meet you"),
          w("Ich bin", "I am"),
        ],
        sentences: [
          w("Ich heiße Anna.", "My name is Anna."),
          w("Ich komme aus Amerika.", "I come from America."),
          w("Woher kommst du?", "Where are you from?"),
          w("Freut mich, Anna.", "Nice to meet you, Anna."),
        ],
      },
      {
        id: "u1l4",
        title: "Formal: Sie",
        items: [
          w("Sie", "you (formal)", "capital S: used with strangers, staff and guides"),
          w("Wie heißen Sie?", "What is your name? (formal)"),
          w("Woher kommen Sie?", "Where are you from? (formal)"),
          w("Wie geht es Ihnen?", "How are you? (formal)"),
          w("Freut mich, Sie kennenzulernen", "Nice to meet you (formal)"),
          w("Herr", "Mr."),
          w("Frau", "Mrs. / Ms."),
        ],
        sentences: [
          w("Guten Tag, Herr Müller.", "Good day, Mr. Müller."),
          w("Wie heißen Sie?", "What is your name?"),
          w("Woher kommen Sie?", "Where are you from?"),
          w("Wie geht es Ihnen?", "How are you?"),
          w("Sprechen Sie Deutsch?", "Do you speak German?"),
        ],
        qa: [
          { q: "Wie heißen Sie?", a: "Ich heiße Anna Weber.", wrong: ["Mir geht es gut.", "Ich komme aus Berlin.", "Danke, tschüss."] },
          { q: "Wie geht es Ihnen?", a: "Danke, gut. Und Ihnen?", wrong: ["Ich heiße Anna.", "Ja, bitte.", "Ich komme aus Amerika."] },
          { q: "Woher kommen Sie?", a: "Ich komme aus Amerika.", wrong: ["Ich heiße Anna.", "Mir geht es gut.", "Auf Wiedersehen."] },
        ],
      },
    ],
  },
  {
    id: "u2",
    title: "Zahlen & Geld",
    titleEn: "Numbers & money",
    emoji: "🔢",
    lessons: [
      {
        id: "u2l1",
        title: "Numbers 0–10",
        items: [
          w("null", "0"), w("eins", "1"), w("zwei", "2"), w("drei", "3"), w("vier", "4"), w("fünf", "5"),
          w("sechs", "6"), w("sieben", "7"), w("acht", "8"), w("neun", "9"), w("zehn", "10"),
        ],
        sentences: [w("Ich habe drei Katzen.", "I have three cats."), w("Das sind fünf Euro.", "That is five euros.")],
        digits: { kind: "number", lo: 0, hi: 10, count: 4 },
      },
      {
        id: "u2l2",
        title: "Numbers 11–20",
        items: [
          w("elf", "11"), w("zwölf", "12"), w("dreizehn", "13"), w("vierzehn", "14"), w("fünfzehn", "15"),
          w("sechzehn", "16", "sechs loses its final s"), w("siebzehn", "17", "sieben loses its -en"),
          w("achtzehn", "18"), w("neunzehn", "19"), w("zwanzig", "20"),
        ],
        sentences: [w("Ich bin zwanzig Jahre alt.", "I am twenty years old."), w("Es ist zwölf Uhr.", "It is twelve o'clock.")],
        digits: { kind: "number", lo: 11, hi: 20, count: 5 },
      },
      {
        id: "u2l3",
        title: "The tens",
        items: [
          w("zwanzig", "20"), w("dreißig", "30", "the ß sounds like 'ss'"), w("vierzig", "40"), w("fünfzig", "50"),
          w("sechzig", "60"), w("siebzig", "70"), w("achtzig", "80"), w("neunzig", "90"), w("hundert", "100"),
        ],
        sentences: [w("Das kostet fünfzig Euro.", "That costs fifty euros."), w("Ich habe hundert Euro.", "I have a hundred euros.")],
        digits: { kind: "number", lo: 20, hi: 100, count: 5, tensOnly: true },
      },
      {
        id: "u2l4",
        title: "Numbers 21–99",
        items: [
          w("einundzwanzig", "21", "'one-and-twenty': the small number comes FIRST"),
          w("zweiundzwanzig", "22"),
          w("dreiundzwanzig", "23"),
          w("fünfunddreißig", "35"),
          w("siebenundvierzig", "47", "'seven-and-forty'"),
          w("achtundfünfzig", "58"),
          w("neunundsechzig", "69"),
          w("vierundsiebzig", "74"),
          w("sechsundachtzig", "86"),
          w("neunundneunzig", "99"),
        ],
        sentences: [w("Ich bin siebenundzwanzig.", "I am twenty-seven."), w("Das Buch kostet vierundzwanzig Euro.", "The book costs twenty-four euros.")],
        digits: { kind: "number", lo: 21, hi: 99, count: 7 },
      },
      {
        id: "u2l5",
        title: "Prices & change",
        items: [
          w("der Euro", "the euro"),
          w("der Cent", "the cent"),
          w("Das macht drei Euro fünfzig", "That comes to 3.50 €"),
          w("das Wechselgeld", "the change (money back)"),
          w("Stimmt so", "Keep the change"),
          w("Bar oder mit Karte?", "Cash or card?"),
        ],
        sentences: [
          w("Wie viel kostet das?", "How much does that cost?"),
          w("Das kostet zwei Euro.", "That costs two euros."),
          w("Hier sind fünf Euro.", "Here is five euros."),
          w("Ich zahle bar.", "I'll pay cash."),
        ],
        digits: { kind: "price", count: 7 },
      },
      {
        id: "u2l6",
        title: "Big numbers 100–9999",
        items: [
          w("hundert", "100"),
          w("zweihundert", "200"),
          w("dreihundert", "300"),
          w("fünfhundert", "500"),
          w("tausend", "1000"),
          w("zweitausend", "2000"),
          w("dreihundertsiebenundvierzig", "347", "hundreds first, then the small-number-first rule"),
          w("tausendzweihundert", "1200"),
          w("zweitausendfünfhundert", "2500"),
        ],
        sentences: [
          w("Wir produzieren tausend Teile pro Tag.", "We produce a thousand parts per day."),
          w("Hier arbeiten zweihundert Mitarbeiter.", "Two hundred employees work here."),
        ],
        digits: { kind: "number", lo: 100, hi: 9999, count: 7, big: true },
      },
    ],
  },
  {
    id: "u3",
    title: "Im Café",
    titleEn: "At the café",
    emoji: "☕",
    lessons: [
      {
        id: "u3l1",
        title: "Drinks",
        items: [
          w("der Kaffee", "the coffee"), w("der Tee", "the tea"), w("das Wasser", "the water"),
          w("die Milch", "the milk"), w("der Zucker", "the sugar"), w("der Saft", "the juice"),
        ],
        sentences: [
          w("Ich möchte einen Kaffee.", "I would like a coffee."),
          w("Einen Tee, bitte.", "A tea, please."),
          w("Kaffee mit Milch und Zucker, bitte.", "Coffee with milk and sugar, please."),
          w("Ein Wasser, bitte.", "A water, please."),
        ],
      },
      {
        id: "u3l2",
        title: "Food",
        items: [
          w("das Brot", "the bread"), w("das Brötchen", "the bread roll"), w("der Kuchen", "the cake"),
          w("das Ei", "the egg"), w("der Käse", "the cheese"), w("der Apfel", "the apple"),
        ],
        sentences: [
          w("Ich hätte gern einen Kuchen.", "I would like a cake."),
          w("Was möchten Sie?", "What would you like?"),
          w("Sonst noch etwas?", "Anything else?"),
          w("Das ist alles.", "That's all."),
        ],
      },
      {
        id: "u3l3",
        title: "Ordering & paying",
        items: [
          w("Die Rechnung, bitte", "The bill, please"),
          w("Zum Mitnehmen", "To go"),
          w("Hier essen", "Eating here"),
          w("Ich hätte gern", "I would like (polite)"),
          w("Zahlen, bitte", "Pay, please (asking to pay)"),
          w("Stimmt so", "Keep the change"),
        ],
        sentences: [
          w("Zum Mitnehmen, bitte.", "To go, please."),
          w("Die Rechnung, bitte.", "The bill, please."),
          w("Das macht vier Euro.", "That comes to four euros."),
          w("Bar oder mit Karte?", "Cash or card?"),
        ],
        digits: { kind: "price", count: 4 },
      },
    ],
  },
  {
    id: "u4",
    title: "Über mich",
    titleEn: "About me",
    emoji: "🧑",
    lessons: [
      {
        id: "u4l1",
        title: "To be: sein",
        items: [
          w("ich bin", "I am"), w("du bist", "you are (informal)"), w("er ist", "he is"), w("sie ist", "she is"),
          w("wir sind", "we are"), w("ihr seid", "you all are"), w("sie sind", "they are"),
        ],
        sentences: [
          w("Ich bin müde.", "I am tired."),
          w("Du bist nett.", "You are nice."),
          w("Wir sind hier.", "We are here."),
          w("Sie ist Lehrerin.", "She is a teacher."),
        ],
      },
      {
        id: "u4l2",
        title: "To have: haben",
        items: [
          w("ich habe", "I have"), w("du hast", "you have"), w("er hat", "he has"),
          w("wir haben", "we have"), w("ihr habt", "you all have"), w("sie haben", "they have"),
        ],
        sentences: [
          w("Ich habe Hunger.", "I am hungry."),
          w("Hast du Durst?", "Are you thirsty?"),
          w("Sie hat einen Hund.", "She has a dog."),
          w("Wir haben Zeit.", "We have time."),
        ],
      },
      {
        id: "u4l3",
        title: "Family",
        items: [
          w("die Familie", "the family"), w("die Mutter", "the mother"), w("der Vater", "the father"),
          w("der Bruder", "the brother"), w("die Schwester", "the sister"), w("das Kind", "the child"),
        ],
        sentences: [
          w("Das ist meine Mutter.", "That is my mother."),
          w("Ich habe einen Bruder.", "I have a brother."),
          w("Meine Schwester heißt Anna.", "My sister is called Anna."),
          w("Mein Vater arbeitet hier.", "My father works here."),
        ],
      },
    ],
  },
  {
    id: "u5",
    title: "Unterwegs",
    titleEn: "Getting around",
    emoji: "🚉",
    lessons: [
      {
        id: "u5l1",
        title: "Places & directions",
        items: [
          w("der Bahnhof", "the train station"), w("die Straße", "the street"), w("das Hotel", "the hotel"),
          w("links", "left"), w("rechts", "right"), w("geradeaus", "straight ahead"),
        ],
        sentences: [
          w("Wo ist der Bahnhof?", "Where is the train station?"),
          w("Gehen Sie geradeaus.", "Go straight ahead."),
          w("Links und dann rechts.", "Left and then right."),
          w("Ist es weit?", "Is it far?"),
        ],
      },
      {
        id: "u5l2",
        title: "Time & days",
        items: [
          w("heute", "today"), w("morgen", "tomorrow"), w("gestern", "yesterday"),
          w("Montag", "Monday"), w("Dienstag", "Tuesday"), w("die Uhr", "the clock / o'clock"),
        ],
        sentences: [
          w("Wie spät ist es?", "What time is it?"),
          w("Es ist drei Uhr.", "It is three o'clock."),
          w("Heute ist Montag.", "Today is Monday."),
          w("Bis morgen!", "See you tomorrow!"),
        ],
        digits: { kind: "number", lo: 1, hi: 12, count: 3 },
      },
      {
        id: "u5l3",
        title: "Getting help",
        items: [
          w("Ich verstehe nicht", "I don't understand"),
          w("Sprechen Sie Englisch?", "Do you speak English?"),
          w("Langsamer, bitte", "Slower, please"),
          w("Noch einmal, bitte", "Once more, please"),
          w("Ich lerne Deutsch", "I am learning German"),
          w("Können Sie mir helfen?", "Can you help me?"),
        ],
        sentences: [
          w("Ich verstehe nicht.", "I don't understand."),
          w("Sprechen Sie Englisch?", "Do you speak English?"),
          w("Ich lerne Deutsch.", "I am learning German."),
          w("Können Sie das wiederholen?", "Can you repeat that?"),
        ],
      },
    ],
  },
  {
    id: "u6",
    title: "Werksbesuch: Sicherheit",
    titleEn: "Factory visit: safety",
    emoji: "🦺",
    lessons: [
      {
        id: "u6l1",
        title: "Safety gear",
        items: [
          w("der Schutzhelm", "the hard hat"),
          w("die Schutzbrille", "the safety glasses"),
          w("der Gehörschutz", "the ear protection"),
          w("die Warnweste", "the high-vis vest"),
          w("die Sicherheitsschuhe", "the safety shoes"),
          w("die Handschuhe", "the gloves"),
        ],
        sentences: [
          w("Bitte tragen Sie einen Schutzhelm.", "Please wear a hard hat."),
          w("Wo bekomme ich eine Schutzbrille?", "Where do I get safety glasses?"),
          w("Brauche ich einen Gehörschutz?", "Do I need ear protection?"),
          w("Sicherheit ist sehr wichtig.", "Safety is very important."),
        ],
        qa: [
          { q: "Bitte tragen Sie einen Schutzhelm.", a: "Natürlich. Wo bekomme ich einen?", wrong: ["Ich heiße Anna.", "Danke, ich möchte einen Kaffee.", "Das kostet zwei Euro."] },
          { q: "Brauche ich einen Gehörschutz?", a: "Ja, in der Halle ist es laut.", wrong: ["Nein, ich komme aus Amerika.", "Ja, ein Kaffee, bitte.", "Heute ist Montag."] },
        ],
      },
      {
        id: "u6l2",
        title: "Signs & rules",
        items: [
          w("Zutritt verboten", "No entry"),
          w("Vorsicht", "Caution"),
          w("der Notausgang", "the emergency exit"),
          w("Rauchen verboten", "No smoking"),
          w("Bitte nicht berühren", "Please do not touch"),
          w("Fotografieren verboten", "No photography"),
          w("der Sammelplatz", "the assembly point"),
        ],
        sentences: [
          w("Darf ich hier fotografieren?", "May I take photos here?"),
          w("Wo ist der Notausgang?", "Where is the emergency exit?"),
          w("Bitte bleiben Sie in der Gruppe.", "Please stay with the group."),
          w("Das ist nicht erlaubt.", "That is not allowed."),
        ],
        qa: [
          { q: "Darf ich hier fotografieren?", a: "Nein, Fotografieren ist hier verboten.", wrong: ["Ja, ich habe Hunger.", "Ich komme aus Berlin.", "Es ist drei Uhr."] },
          { q: "Wo ist der Notausgang?", a: "Dort links, neben der Tür.", wrong: ["Ich heiße Anna.", "Das kostet fünf Euro.", "Ja, bitte."] },
        ],
      },
      {
        id: "u6l3",
        title: "Arriving for the tour",
        items: [
          w("der Empfang", "the reception"),
          w("der Besucherausweis", "the visitor badge"),
          w("die Führung", "the guided tour"),
          w("die Werksführung", "the factory tour"),
          w("die Anmeldung", "the registration"),
          w("der Termin", "the appointment"),
        ],
        sentences: [
          w("Guten Tag, ich komme zur Werksführung.", "Good day, I am here for the factory tour."),
          w("Ich habe einen Termin um zehn Uhr.", "I have an appointment at ten o'clock."),
          w("Wo ist der Empfang?", "Where is the reception?"),
          w("Hier ist mein Besucherausweis.", "Here is my visitor badge."),
        ],
        qa: [
          { q: "Guten Tag! Wie kann ich Ihnen helfen?", a: "Guten Tag, ich komme zur Werksführung.", wrong: ["Ich möchte einen Kuchen.", "Mir geht es gut.", "Tschüss!"] },
          { q: "Haben Sie einen Termin?", a: "Ja, um zehn Uhr.", wrong: ["Nein, ich bin müde.", "Ja, ein Wasser, bitte.", "Ich habe einen Hund."] },
        ],
      },
    ],
  },
  {
    id: "u7",
    title: "Werksbesuch: Produktion",
    titleEn: "Factory visit: production",
    emoji: "🏭",
    lessons: [
      {
        id: "u7l1",
        title: "Places in a plant",
        items: [
          w("das Werk", "the plant / factory"),
          w("die Fabrik", "the factory"),
          w("die Halle", "the (production) hall"),
          w("das Lager", "the warehouse"),
          w("das Büro", "the office"),
          w("die Kantine", "the canteen"),
          w("die Werkstatt", "the workshop"),
          w("das Labor", "the laboratory"),
        ],
        sentences: [
          w("Willkommen im Werk.", "Welcome to the plant."),
          w("Die Kantine ist dort.", "The canteen is over there."),
          w("Wir gehen jetzt in die Halle.", "We are going into the hall now."),
          w("Das Lager ist sehr groß.", "The warehouse is very big."),
        ],
        qa: [
          { q: "Willkommen im Werk!", a: "Vielen Dank! Ich freue mich.", wrong: ["Ich habe einen Bruder.", "Nein, danke.", "Das macht vier Euro."] },
          { q: "Wo ist die Kantine?", a: "Die Kantine ist dort links.", wrong: ["Ich heiße Anna.", "Heute ist Montag.", "Ich bin zwanzig Jahre alt."] },
        ],
      },
      {
        id: "u7l2",
        title: "Production",
        items: [
          w("die Produktion", "the production"),
          w("die Fertigung", "the manufacturing"),
          w("die Montage", "the assembly"),
          w("die Maschine", "the machine"),
          w("das Fließband", "the assembly line"),
          w("der Roboter", "the robot"),
          w("das Produkt", "the product"),
          w("der Mitarbeiter", "the employee"),
          w("die Schicht", "the shift"),
          w("die Qualitätskontrolle", "the quality control"),
        ],
        sentences: [
          w("Hier ist die Montage.", "Here is the assembly."),
          w("Die Maschine läuft.", "The machine is running."),
          w("Wir stellen Autoteile her.", "We make car parts."),
          w("Der Roboter arbeitet sehr schnell.", "The robot works very fast."),
        ],
        qa: [
          { q: "Was wird hier hergestellt?", a: "Hier stellen wir Autoteile her.", wrong: ["Ich heiße Anna.", "Ja, bitte.", "Heute ist Dienstag."] },
          { q: "Wie viele Schichten gibt es?", a: "Es gibt drei Schichten pro Tag.", wrong: ["Ich möchte einen Tee.", "Nein, danke.", "Ich komme aus Amerika."] },
        ],
      },
      {
        id: "u7l3",
        title: "Materials & processes",
        items: [
          w("der Stahl", "the steel"),
          w("das Metall", "the metal"),
          w("der Kunststoff", "the plastic"),
          w("das Aluminium", "the aluminium"),
          w("das Holz", "the wood"),
          w("schweißen", "to weld"),
          w("gießen", "to cast (pour)"),
          w("lackieren", "to paint (lacquer)"),
          w("verpacken", "to pack"),
          w("prüfen", "to check / test"),
        ],
        sentences: [
          w("Wir verarbeiten Stahl.", "We process steel."),
          w("Das Teil ist aus Aluminium.", "The part is made of aluminium."),
          w("Wir prüfen jedes Teil.", "We check every part."),
          w("Hier werden die Teile lackiert.", "Here the parts are painted."),
        ],
        qa: [
          { q: "Woraus besteht das Teil?", a: "Das Teil ist aus Aluminium.", wrong: ["Das Teil ist müde.", "Ich habe Hunger.", "Es ist zwölf Uhr."] },
        ],
      },
      {
        id: "u7l4",
        title: "Quantities & units",
        items: [
          w("die Stückzahl", "the quantity (number of pieces)"),
          w("pro Stunde", "per hour"),
          w("pro Tag", "per day"),
          w("das Kilogramm", "the kilogram"),
          w("die Tonne", "the tonne"),
          w("der Meter", "the metre"),
          w("Prozent", "percent"),
        ],
        sentences: [
          w("Wir produzieren tausend Teile pro Tag.", "We produce a thousand parts per day."),
          w("Hier arbeiten zweihundert Mitarbeiter.", "Two hundred employees work here."),
          w("Wie viele Teile pro Stunde?", "How many parts per hour?"),
          w("Das wiegt fünfzig Kilogramm.", "That weighs fifty kilograms."),
        ],
        qa: [
          { q: "Wie viele Mitarbeiter arbeiten hier?", a: "Hier arbeiten fünfhundert Mitarbeiter.", wrong: ["Ich heiße Anna.", "Das macht vier Euro.", "Ich möchte einen Kaffee."] },
        ],
        digits: { kind: "number", lo: 100, hi: 2000, count: 4, big: true },
      },
      {
        id: "u7l5",
        title: "Asking the guide",
        items: [
          w("Was wird hier hergestellt?", "What is made here?"),
          w("Wie viele Mitarbeiter arbeiten hier?", "How many employees work here?"),
          w("Wie lange dauert die Produktion?", "How long does production take?"),
          w("Woher kommt das Material?", "Where does the material come from?"),
          w("Wie funktioniert die Maschine?", "How does the machine work?"),
          w("Können Sie das bitte erklären?", "Could you please explain that?"),
        ],
        sentences: [
          w("Das ist sehr interessant.", "That is very interesting."),
          w("Wie lange dauert die Führung?", "How long does the tour take?"),
          w("Können Sie das bitte wiederholen?", "Could you please repeat that?"),
          w("Vielen Dank für die Führung.", "Thank you very much for the tour."),
        ],
        qa: [
          { q: "Haben Sie noch Fragen?", a: "Ja, wie viele Mitarbeiter arbeiten hier?", wrong: ["Ich heiße Anna.", "Nein, ich bin Anna.", "Zwei Kaffee, bitte."] },
          { q: "Das Werk hat dreihundert Mitarbeiter.", a: "Das ist sehr interessant. Danke.", wrong: ["Ich habe Hunger.", "Ja, ein Wasser, bitte.", "Das ist mein Bruder."] },
        ],
      },
    ],
  },
  {
    id: "u8",
    title: "Mein iPhone auf Deutsch",
    titleEn: "My iPhone in German",
    emoji: "📱",
    lessons: [
      {
        id: "u8l1",
        title: "Settings",
        items: [
          w("die Einstellungen", "Settings"),
          w("Allgemein", "General"),
          w("WLAN", "Wi-Fi", "say: VEH-lahn"),
          w("Mobilfunk", "Cellular"),
          w("der Flugmodus", "Airplane mode"),
          w("Bluetooth", "Bluetooth"),
          w("die Batterie", "Battery"),
          w("die Lautstärke", "Volume"),
        ],
        sentences: [
          w("Öffne die Einstellungen.", "Open Settings."),
          w("Schalte das WLAN ein.", "Turn on Wi-Fi."),
          w("Der Flugmodus ist aus.", "Airplane mode is off."),
        ],
        qa: [
          { q: "Wie ist die Lautstärke?", a: "Sie ist zu laut.", wrong: ["Ich heiße Anna.", "Das macht drei Euro.", "Heute ist Montag."] },
        ],
      },
      {
        id: "u8l2",
        title: "Buttons & prompts",
        items: [
          w("Abbrechen", "Cancel"),
          w("Fertig", "Done"),
          w("Weiter", "Continue / Next"),
          w("Zurück", "Back"),
          w("Löschen", "Delete"),
          w("Teilen", "Share"),
          w("Bearbeiten", "Edit"),
          w("Erlauben", "Allow"),
          w("Nicht erlauben", "Don't allow"),
        ],
        sentences: [
          w("Möchten Sie fortfahren?", "Would you like to continue?"),
          w("Die App möchte Ihren Standort verwenden.", "The app wants to use your location."),
        ],
        qa: [
          { q: "Die App möchte Ihren Standort verwenden.", a: "Nein, nicht erlauben.", wrong: ["Ja, ein Kaffee, bitte.", "Ich habe Hunger.", "Ich heiße Anna."] },
        ],
      },
      {
        id: "u8l3",
        title: "Apps",
        items: [
          w("die Nachrichten", "Messages"),
          w("das Telefon", "Phone"),
          w("die Karten", "Maps"),
          w("die Kamera", "Camera"),
          w("die Fotos", "Photos"),
          w("der Kalender", "Calendar"),
          w("das Wetter", "Weather"),
          w("die Kontakte", "Contacts"),
        ],
        sentences: [
          w("Ich schreibe eine Nachricht.", "I am writing a message."),
          w("Ich mache ein Foto.", "I am taking a photo."),
          w("Wie ist das Wetter heute?", "What is the weather like today?"),
          w("Mein Akku ist leer.", "My battery is dead."),
        ],
        qa: [
          { q: "Wie ist das Wetter heute?", a: "Es ist sonnig und warm.", wrong: ["Ich heiße Anna.", "Das kostet zwei Euro.", "Ja, bitte."] },
        ],
      },
      {
        id: "u8l4",
        title: "Problems & messages",
        items: [
          w("das Passwort", "the password"),
          w("Erneut versuchen", "Try again"),
          w("Keine Verbindung", "No connection"),
          w("Anmelden", "Log in"),
          w("Aktualisieren", "Update / refresh"),
          w("der Fehler", "the error"),
        ],
        sentences: [
          w("Ich habe kein Netz.", "I have no signal."),
          w("Ich habe mein Passwort vergessen.", "I have forgotten my password."),
          w("Bitte versuchen Sie es erneut.", "Please try again."),
          w("Können Sie mir das WLAN-Passwort geben?", "Can you give me the Wi-Fi password?"),
        ],
        qa: [
          { q: "Haben Sie Internet?", a: "Nein, ich habe kein Netz.", wrong: ["Ja, ein Tee, bitte.", "Ich heiße Anna.", "Es ist zehn Uhr."] },
          { q: "Können Sie mir das WLAN-Passwort geben?", a: "Ja, natürlich. Hier bitte.", wrong: ["Ich habe einen Hund.", "Nein, ich bin Anna.", "Heute ist Montag."] },
        ],
      },
    ],
  },
];

// Emoji pictures for German-only mode (concrete words only).
const PICS = {
  "der Kaffee": "☕", "der Tee": "🍵", "das Wasser": "💧", "die Milch": "🥛", "der Saft": "🧃",
  "das Brot": "🍞", "das Brötchen": "🥖", "der Kuchen": "🍰", "das Ei": "🥚", "der Käse": "🧀", "der Apfel": "🍎",
  "der Bahnhof": "🚉", "das Hotel": "🏨", "die Uhr": "🕒", "die Familie": "👪", "das Kind": "🧒", "der Euro": "💶",
  "die Straße": "🛣️", "der Schutzhelm": "⛑️", "die Schutzbrille": "🥽", "der Gehörschutz": "🎧", "die Handschuhe": "🧤",
  "die Sicherheitsschuhe": "🥾", "der Notausgang": "🚪", "Rauchen verboten": "🚭", "der Empfang": "🛎️",
  "das Werk": "🏭", "die Fabrik": "🏭", "das Lager": "📦", "das Büro": "🏢", "die Kantine": "🍽️", "die Werkstatt": "🔧",
  "das Labor": "🔬", "die Maschine": "⚙️", "der Roboter": "🤖", "das Holz": "🪵", "schweißen": "🔥", "die Tonne": "⚖️",
  "WLAN": "📶", "der Flugmodus": "✈️", "die Batterie": "🔋", "die Lautstärke": "🔊", "die Nachrichten": "💬",
  "das Telefon": "📞", "die Karten": "🗺️", "die Kamera": "📷", "die Fotos": "🖼️", "der Kalender": "📅",
  "das Wetter": "🌤️", "das Passwort": "🔑", "Löschen": "🗑️",
};
lessonUnits.forEach((u) => u.lessons.forEach((l) => l.items.forEach((it) => PICS[it.de] && (it.pic = PICS[it.de]))));

export const allLessons = lessonUnits.flatMap((u) => u.lessons.map((l) => ({ ...l, unitId: u.id })));
export const getLesson = (id) => allLessons.find((l) => l.id === id);
export const allItems = allLessons.flatMap((l) => l.items);
