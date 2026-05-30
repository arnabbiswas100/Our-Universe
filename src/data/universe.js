/**
 * Universe Data — The emotional database
 * Each era = star system, each memory = planet, each photo set = moon
 */

export const UNIVERSE = {
  name: 'Our Universe',
  dedicatedTo: 'Kaushiki',

  // Global audio
  globalAudio: {
    galaxyAmbient: '/audio/overall.mp3',
  },

  eras: [
    // ═══════════════════════════════════════════════
    // ⭐ ERA 1 — CHILDHOOD: SCATTERED STARDUST
    // ═══════════════════════════════════════════════
    {
      id: 'era-1',
      index: 0,
      name: 'Childhood',
      subtitle: 'Scattered Stardust',
      fullName: 'Childhood — Scattered Stardust',
      timeline: '2007 – 2019',
      locked: false,

      description: [
        'Scattered memories throughout our childhood.',
        'Before we knew what any of it meant.',
        'Before friendship had a name, and before love had a direction.',
        'These are the fragments — the stardust that would one day form a universe.',
      ],

      colors: {
        primary: '#FFF8F0',     // warm white
        accent: '#E8A87C',      // soft orange
        nebula: '#D4956B',      // peach-gold haze
        starGlow: '#FFD700',    // warm yellow
        background: '#1A1209',  // warm dark brown
      },

      starConfig: {
        type: 'sun-like',
        baseColor: '#FFA500',
        coronaColor: '#FFD700',
        size: 5,
        temperature: 5778,
      },

      // Planet gradient for 2D display
      planetGradient: ['#FF9D4D', '#FFD700', '#FF6B00'],

      soundtrack: '/audio/era1.mp3',

      symbolism: {
        primary: 'paper-planes',
        secondary: 'scattered-dust',
        description: 'Innocence, childhood play, things thrown into the wind without knowing where they\'d land',
      },

      endingText: 'I love you now, see you in the next star!',

      planets: [
        // 🪐 Planet 1
        {
          id: 'era1-planet1',
          index: 0,
          name: 'We Used to Play Together',
          orbitPosition: 1,
          size: 2,
          moons: [],
          date: '~2007–2010',
          emotionalTags: ['innocence', 'play', 'regret'],

          visual: {
            type: 'rocky',
            baseColor: '#8B7355',
            accentColor: '#C4A882',
            atmosphereColor: '#D4A574',
            hasAtmosphere: false,
            hasRings: false,
            surfaceDetail: 'dusty',
          },

          story: `We were very small back then, we used to play in Sutirmath, the playground. I don't actually remember what we used to play — mostly we used to run around, climbing construction stone tilas, playing with sands left there for constructions.\n\nYou, me, and Kaustav — we used to play together. I should have treated you better. I remember I did not give you much attention back then.`,

          quote: 'I am really sorry I did not treat you better.',
          importance: 2,
        },

        // 🪐 Planet 2
        {
          id: 'era1-planet2',
          index: 1,
          name: 'You Cried for a Biscuit',
          orbitPosition: 2,
          size: 4,
          moons: [],
          date: '~2007–2010',
          emotionalTags: ['humor', 'innocence', 'tenderness'],

          visual: {
            type: 'rocky',
            baseColor: '#A8C4D4',
            accentColor: '#E8DCC8',
            atmosphereColor: '#B8D4E8',
            hasAtmosphere: true,
            hasRings: false,
            surfaceDetail: 'cloudy',
          },

          story: `I remember one day, you and Kaustav came to my home. My mother gave both of you a biscuit each. Kaustav ate the biscuit fully. You just took a bite from yours. Then Kaustav said that he'll tell at home that you ate outside your house — and your parents had asked you not to eat at strangers' homes.\n\nAnd you started crying.\n\nI don't know what my reaction was at that moment as I don't remember it clearly, but I suppose it is funny now.`,

          quote: 'I should have clicked your crying photo.',
          importance: 4,
        },

        // 🪐 Planet 3
        {
          id: 'era1-planet3',
          index: 2,
          name: 'Suddenly See You in Class 5',
          orbitPosition: 3,
          size: 3,
          moons: [],
          date: 'Class 5 (2013)',
          emotionalTags: ['surprise', 'fate', 'memory'],

          visual: {
            type: 'crystalline',
            baseColor: '#D4A84B',
            accentColor: '#F0D080',
            atmosphereColor: '#E8C860',
            hasAtmosphere: false,
            hasRings: false,
            surfaceDetail: 'glimmering',
          },

          story: `I was studying in the coaching center at the ground floor of my house, in class 5. All my friends were there. Suddenly the calling bell rang. I looked from the corridor door.\n\nI saw you.\n\nMy father said, "Kishor-da er meye Tusu eseche!"\n\nI saw you, but I did not think much of it back then. But somehow this memory stuck with me even now.`,

          quote: 'I wish I talked to you.',
          importance: 3,
        },

        // 🪐 Planet 4
        {
          id: 'era1-planet4',
          index: 3,
          name: "You Joined My Father's English Tuition",
          orbitPosition: 4,
          size: 5,
          moons: [],
          date: 'Class 6 (2014)',
          emotionalTags: ['friendship', 'beginning', 'warmth'],

          visual: {
            type: 'terrestrial',
            baseColor: '#6B8E4E',
            accentColor: '#D4884A',
            atmosphereColor: '#88B868',
            hasAtmosphere: true,
            hasRings: false,
            surfaceDetail: 'lush',
          },

          story: `In class 6, you joined my father's English tuition. Back then I used to watch Mighty Raju cartoon on Pogo. There was a character named Julie, who was the love interest of Raju.\n\nI found your hairstyle similar to Julie.`,

          quote: 'And thus you started being my best friend.',
          importance: 5,
        },

        // 🪐 Planet 5
        {
          id: 'era1-planet5',
          index: 4,
          name: 'History Became Our Story Time',
          orbitPosition: 5,
          size: 6,
          moons: [],
          date: 'Class 7 (~2015)',
          emotionalTags: ['bonding', 'stories', 'shyness'],

          visual: {
            type: 'gaseous',
            baseColor: '#7B5EA7',
            accentColor: '#A78BC0',
            atmosphereColor: '#9B7EC8',
            hasAtmosphere: true,
            hasRings: false,
            surfaceDetail: 'swirling',
          },

          story: `In class 7, I started studying History under your father, my Kaku. I used to hate history, but I loved listening to history as a story from Kaku.\n\nI also loved hearing and talking about "stories" with you. Remember — we used to call the gossip about other people's relationships as "Stories"? We were too shy to call that "valobasa".\n\nYou asked me if I have a story or not. I said I don't have one.\n\nAnd you said, "Amaro nei ekhono."`,

          quote: 'I loved your stories.',
          importance: 6,
        },

        // 🪐 Planet 6
        {
          id: 'era1-planet6',
          index: 5,
          name: 'The Almost Confession',
          orbitPosition: 6,
          size: 7,
          moons: [],
          date: 'Class 8 (~2016)',
          emotionalTags: ['love', 'nervousness', 'unspoken'],

          visual: {
            type: 'terrestrial',
            baseColor: '#C45B7C',
            accentColor: '#E88FA8',
            atmosphereColor: '#D87090',
            hasAtmosphere: true,
            hasRings: false,
            surfaceDetail: 'atmospheric',
          },

          story: `You almost confessed your love to me in class 8.\n\nIn our English tuition, in my home — from the room where we were studying, when my father went away from the room for some time — you asked me to come with you outside the room. You had something to say to me in private.\n\nBut when I went along with you, you just said:\n\n"Amar bondhura amake khela nai na."\n\nI don't remember what I replied. But I almost got the hint that you liked me, probably. And you were just about to say it — but got nervous.`,

          quote: 'I wish you could say what you wanted to say.',
          importance: 7,
        },

        // 🪐 Planet 7
        {
          id: 'era1-planet7',
          index: 6,
          name: 'The Forgotten Phase',
          orbitPosition: 7,
          size: 2,
          moons: [],
          date: 'Class 9 (~2017)',
          emotionalTags: ['loss', 'emptiness', 'longing'],

          visual: {
            type: 'rocky',
            baseColor: '#808080',
            accentColor: '#A0A0A0',
            atmosphereColor: '#909090',
            hasAtmosphere: false,
            hasRings: false,
            surfaceDetail: 'faded',
          },

          story: `I don't remember much about class 9.\n\nIf you remember anything in this phase, write it for me please. ❤️`,

          quote: 'I want to reclaim those memories.',
          importance: 2,
        },

        // 🪐 Planet 8
        {
          id: 'era1-planet8',
          index: 7,
          name: 'The Birthdays',
          orbitPosition: 8,
          size: 6,
          moons: [
            { id: 'moon-1', name: 'Birthday Moon 1', category: 'TBD', photos: [] },
            { id: 'moon-2', name: 'Birthday Moon 2', category: 'TBD', photos: [] },
            { id: 'moon-3', name: 'Birthday Moon 3', category: 'TBD', photos: [] },
            { id: 'moon-4', name: 'Birthday Moon 4', category: 'TBD', photos: [] },
            { id: 'moon-5', name: 'Birthday Moon 5', category: 'TBD', photos: [] },
          ],
          date: 'Throughout childhood',
          emotionalTags: ['celebration', 'joy', 'tenderness', 'humor'],

          visual: {
            type: 'gaseous',
            baseColor: '#D4A017',
            accentColor: '#C44040',
            atmosphereColor: '#E8B840',
            hasAtmosphere: true,
            hasRings: true,
            surfaceDetail: 'banded',
          },

          story: `I heard a story from you that one birthday of yours — we were small children — we gave you a toy ant as a gift. And I saw the toy and I cried a lot, asking why my father did not give a toy to me but was giving one to you.\n\nI was stupid, I know.\n\nAlso, I remember those times when you invited me to your birthdays. You cut the cake. You used to try to talk to me, but you were too shy for that, I guess.\n\nAlso, I remember you once trying to take pictures of me while I was eating at your birthday — and your mom, my Kakima, defended me and saved me from you!!\n\nThanks, Kakima.`,

          quote: 'I want to celebrate your birthday again.',
          importance: 6,
        },

        // 🪐 Planet 9
        {
          id: 'era1-planet9',
          index: 8,
          name: 'The Budding Love',
          orbitPosition: 9,
          size: 9,
          moons: [],
          date: 'Class 10 (2018)',
          emotionalTags: ['love', 'awakening', 'destiny', 'regret', 'growth'],

          visual: {
            type: 'terrestrial',
            baseColor: '#B83030',
            accentColor: '#D86040',
            atmosphereColor: '#D04848',
            hasAtmosphere: true,
            hasRings: false,
            surfaceDetail: 'volcanic',
          },

          story: `In class 10th, we had History, Maths, and Geography tuition together. This was the most memorable phase in our childhood. We also used to compete with each other for studies.\n\nI used to tease you all the time.\n\nYou always used to try to sit next to me. You used to clash and fight with others just to get the seat next to me. To be honest — I liked that.\n\nA rumor got circulated about us being in a relationship. I know you liked it. I did not mind — but it became an issue for me when it reached my parents.\n\nWe decided to act it out. We decided to show the world that the rumor is true, then act like we broke up — so the rumor would stop. I discussed this plan with you. You looked visibly happy, just by getting the chance of being with me.\n\nI was too cruel. I asked you to act just to break up later. It was too cruel of me. I did not realize it back then.\n\nI am really sorry for what I did.\n\nNow we are a real couple — with the agreements and blessings of our families as well.\n\n---\n\nRemember when we used to go to Pathfinder for mock tests before our Madhyamik exam? We used to return home together, in a toto. I loved returning with you.\n\nAnd in the Madhyamik exam — you and I, with our mothers, used to go to the center together as our exam center was the same!! I loved those experiences too.\n\nAnd remember the day we went to the cycle-taking programme? Two days. First day — when we were just put in a room — your school had 18 people and my school had 7 people, all together. Second day was the main day. I kept looking at you from time to time.\n\nThat was the day the rumor began.\n\nAnd that was also the day — probably — I started looking at you differently.`,

          quote: 'I love you now, see you in the next star!',
          importance: 9,
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // ⭐ ERAS 2–7 — LOCKED PLACEHOLDERS
    // ═══════════════════════════════════════════════
    {
      id: 'era-2', index: 1, name: 'Era 2', subtitle: 'Coming Soon',
      fullName: 'Coming Soon', timeline: 'TBD', locked: true,
      description: [], colors: { primary: '#CCCCCC', accent: '#999999', nebula: '#666666', starGlow: '#AAAAAA', background: '#111111' },
      starConfig: { type: 'blue-giant', baseColor: '#6688CC', coronaColor: '#88AAEE', size: 4, temperature: 10000 },
      planetGradient: ['#6688CC', '#88AAEE', '#4466AA'],
      soundtrack: null, symbolism: null, endingText: '', planets: [],
    },
    {
      id: 'era-3', index: 2, name: 'Era 3', subtitle: 'Coming Soon',
      fullName: 'Coming Soon', timeline: 'TBD', locked: true,
      description: [], colors: { primary: '#CCCCCC', accent: '#999999', nebula: '#666666', starGlow: '#AAAAAA', background: '#111111' },
      starConfig: { type: 'red-dwarf', baseColor: '#CC4444', coronaColor: '#EE6644', size: 3, temperature: 3500 },
      planetGradient: ['#CC4444', '#EE6644', '#AA2222'],
      soundtrack: null, symbolism: null, endingText: '', planets: [],
    },
    {
      id: 'era-4', index: 3, name: 'Era 4', subtitle: 'Coming Soon',
      fullName: 'Coming Soon', timeline: 'TBD', locked: true,
      description: [], colors: { primary: '#CCCCCC', accent: '#999999', nebula: '#666666', starGlow: '#AAAAAA', background: '#111111' },
      starConfig: { type: 'white-dwarf', baseColor: '#EEEEFF', coronaColor: '#FFFFFF', size: 2, temperature: 15000 },
      planetGradient: ['#DDDDFF', '#FFFFFF', '#BBBBEE'],
      soundtrack: null, symbolism: null, endingText: '', planets: [],
    },
    {
      id: 'era-5', index: 4, name: 'Era 5', subtitle: 'Coming Soon',
      fullName: 'Coming Soon', timeline: 'TBD', locked: true,
      description: [], colors: { primary: '#CCCCCC', accent: '#999999', nebula: '#666666', starGlow: '#AAAAAA', background: '#111111' },
      starConfig: { type: 'binary', baseColor: '#FFAA44', coronaColor: '#FFCC66', size: 4, temperature: 6000 },
      planetGradient: ['#FFAA44', '#FFCC66', '#DD8822'],
      soundtrack: null, symbolism: null, endingText: '', planets: [],
    },
    {
      id: 'era-6', index: 5, name: 'Era 6', subtitle: 'Coming Soon',
      fullName: 'Coming Soon', timeline: 'TBD', locked: true,
      description: [], colors: { primary: '#CCCCCC', accent: '#999999', nebula: '#666666', starGlow: '#AAAAAA', background: '#111111' },
      starConfig: { type: 'supergiant', baseColor: '#FF6644', coronaColor: '#FF8866', size: 8, temperature: 4000 },
      planetGradient: ['#FF6644', '#FF8866', '#DD4422'],
      soundtrack: null, symbolism: null, endingText: '', planets: [],
    },
    {
      id: 'era-7', index: 6, name: 'Era 7', subtitle: 'Coming Soon',
      fullName: 'Coming Soon', timeline: 'TBD', locked: true,
      description: [], colors: { primary: '#CCCCCC', accent: '#999999', nebula: '#666666', starGlow: '#AAAAAA', background: '#111111' },
      starConfig: { type: 'nebula-core', baseColor: '#AA88FF', coronaColor: '#CCAAFF', size: 6, temperature: 20000 },
      planetGradient: ['#AA88FF', '#CCAAFF', '#8866DD'],
      soundtrack: null, symbolism: null, endingText: '', planets: [],
    },
  ],
};

/**
 * 2D Era Map Layout — positions as percentage of viewport
 * Arranged in a winding path pattern (like level select)
 */
export const ERA_MAP_LAYOUT = [
  { eraIndex: 0, x: 18, y: 75, size: 90 },   // Bottom-left — Childhood (start)
  { eraIndex: 1, x: 42, y: 58, size: 75 },   // Mid-left
  { eraIndex: 2, x: 72, y: 72, size: 70 },   // Bottom-right
  { eraIndex: 3, x: 85, y: 40, size: 65 },   // Right-mid
  { eraIndex: 4, x: 55, y: 28, size: 70 },   // Center-top
  { eraIndex: 5, x: 28, y: 20, size: 75 },   // Left-top
  { eraIndex: 6, x: 60, y: 10, size: 65 },   // Top-right
];

/**
 * 2D Planet Map Layout — positions for planets within an era map
 * 9 planets in a winding path across the screen
 */
export const PLANET_MAP_LAYOUT = [
  { x: 12, y: 82, size: 55 },   // Planet 1 — bottom-left start
  { x: 32, y: 68, size: 60 },   // Planet 2
  { x: 55, y: 78, size: 50 },   // Planet 3
  { x: 75, y: 62, size: 65 },   // Planet 4
  { x: 52, y: 48, size: 70 },   // Planet 5 — center
  { x: 28, y: 38, size: 72 },   // Planet 6
  { x: 48, y: 22, size: 48 },   // Planet 7
  { x: 72, y: 30, size: 68 },   // Planet 8
  { x: 88, y: 14, size: 80 },   // Planet 9 — top-right end (biggest)
];

/** Helper: get an era by id */
export function getEra(id) {
  return UNIVERSE.eras.find(e => e.id === id);
}

/** Helper: get planet visual scale from size data (for CSS) */
export function getPlanetSizePx(size, baseSize = 60) {
  return baseSize + (size / 10) * baseSize;
}
