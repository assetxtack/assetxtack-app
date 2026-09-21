export interface GameAttribute {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder: string;
  required: boolean;
  options?: string[];
}

export interface GameCredential {
  key: string;
  label: string;
  type: "text" | "select" | "boolean";
  placeholder?: string;
  options?: string[];
}

export interface GameConfig {
  id: string;
  name: string;
  category: "MOBILE" | "PC" | "CONSOLE";
  ranks: string[];
  attributes: GameAttribute[];
  credentials: GameCredential[];
  badges?: string[];
}

const deviceTypeAttribute: GameAttribute = {
  key: "deviceType",
  label: "Device Type",
  type: "select",
  placeholder: "Select device...",
  required: true,
  options: ["iOS", "Android"],
};

const serverRegionAttribute: GameAttribute = {
  key: "serverRegion",
  label: "Server / Region",
  type: "text",
  placeholder: "e.g. Asia, NA, Europe, Server 123",
  required: true,
};

const rankAttribute: GameAttribute = {
  key: "rank",
  label: "Rank / Level",
  type: "text",
  placeholder: "e.g. Mythic, Level 85, Town Hall 15",
  required: true,
};

export const notableAssetsAttribute: GameAttribute = {
  key: "notableAssets",
  label: "Notable In-Game Assets",
  type: "text",
  placeholder: "e.g. rare skins, maxed heroes, valuable items",
  required: true,
};

export const universalAttributes: GameAttribute[] = [
  serverRegionAttribute,
  deviceTypeAttribute,
  rankAttribute,
];

export const universalAttributeKeys = universalAttributes.map((a) => a.key);

const numberAttribute = (
  key: string,
  label: string,
  placeholder: string,
  required = false
): GameAttribute => ({
  key,
  label,
  type: "number",
  placeholder,
  required,
});

const textAttribute = (
  key: string,
  label: string,
  placeholder: string,
  required = false
): GameAttribute => ({
  key,
  label,
  type: "text",
  placeholder,
  required,
});

export const GAME_CONFIGS: Record<string, GameConfig> = {
  "mobile-legends": {
    id: "mobile-legends",
    name: "Mobile Legends: Bang Bang",
    category: "MOBILE",
    ranks: [
      "Mythical Immortal",
      "Mythical Glory",
      "Mythical Honor",
      "Mythic",
      "Legend",
      "Epic",
      "Grandmaster",
      "Master",
      "Elite",
      "Warrior",
    ],
    attributes: [
      ...universalAttributes,
      numberAttribute("skinsCount", "Skin Count", "e.g. 85", true),
      numberAttribute("heroesCount", "Hero Count", "e.g. 122", true),
      textAttribute("winRate", "Win Rate", "e.g. 62.4%"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: [
      "Collector",
      "Legend",
      "PRIME",
      "KOF",
      "Aspirants",
      "M-Series",
      "Star Wars",
      "STUN",
      "11.11",
      "Kung-Fu Panda",
      "Soul Vessel",
      "JJK",
      "Street Fighters",
      "Dawning",
      "Transformer",
      "Eternal Mythic",
      "Eternal Mythical Glory",
      "Eternal Mythical Immortal",
    ],
  },
  "call-of-duty-mobile": {
    id: "call-of-duty-mobile",
    name: "Call of Duty Mobile",
    category: "MOBILE",
    ranks: ["Legendary", "Master", "Diamond", "Platinum", "Gold", "Silver", "Bronze"],
    attributes: [
      ...universalAttributes,
      numberAttribute("level", "Account Level", "e.g. 150", true),
      textAttribute("weapons", "Weapons Unlocked", "e.g. 45 weapons", true),
      textAttribute("operatorSkins", "Operator Skins", "e.g. 12 operator skins"),
      textAttribute("kdRatio", "K/D Ratio", "e.g. 4.25"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: [
      "Mythic Weapon (Max)",
      "Mythic Operator",
      "Legendary Operator",
      "Prestige Weapon",
      "Legacy Weapon",
      "Legendary Vehicle",
    ],
  },
  "pubg-mobile": {
    id: "pubg-mobile",
    name: "PUBG Mobile",
    category: "MOBILE",
    ranks: [
      "Ace",
      "Ace Master",
      "Ace Dominator",
      "Ace Challenger",
      "Conqueror",
      "Crown",
      "Diamond",
      "Platinum",
      "Gold",
      "Silver",
      "Bronze",
    ],
    attributes: [
      ...universalAttributes,
      numberAttribute("level", "Account Level", "e.g. 85", true),
      textAttribute("kdRatio", "K/D Ratio", "e.g. 4.25"),
      numberAttribute("cosmeticsCount", "Cosmetics Count", "e.g. 120"),
      numberAttribute("ucBalance", "UC Balance", "e.g. 2500"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: [
      "Maxed X-Suit",
      "M416 Glacier (Max)",
      "Mythic Fashion Title",
      "Ultimate Set",
      "Upgradable Vehicle",
    ],
  },
  "blood-strike": {
    id: "blood-strike",
    name: "Blood Strike",
    category: "MOBILE",
    ranks: ["Master", "Diamond", "Platinum", "Gold", "Silver", "Bronze"],
    attributes: [
      ...universalAttributes,
      numberAttribute("level", "Account Level", "e.g. 80", true),
      textAttribute("kdRatio", "K/D Ratio", "e.g. 3.80"),
      textAttribute("weapons", "Favorite Weapons", "e.g. M4, AK, AWM"),
      numberAttribute("skinsCount", "Weapon Skin Count", "e.g. 35"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: ["Mythic Weapon", "Legendary Operator", "Elite Skin", "Battle Pass Max"],
  },
  "honor-of-kings": {
    id: "honor-of-kings",
    name: "Honor of Kings",
    category: "MOBILE",
    ranks: ["King", "Master", "Diamond", "Platinum", "Gold", "Silver", "Bronze"],
    attributes: [
      ...universalAttributes,
      numberAttribute("level", "Account Level", "e.g. 30", true),
      numberAttribute("heroesCount", "Hero Count", "e.g. 80", true),
      numberAttribute("skinsCount", "Skin Count", "e.g. 120", true),
      textAttribute("winRate", "Win Rate", "e.g. 58.5%"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: ["Legendary Skin", "Limited Skin", "MVP", "Collector", "Ranked King"],
  },
  "free-fire": {
    id: "free-fire",
    name: "Free Fire",
    category: "MOBILE",
    ranks: ["Grandmaster", "Heroic", "Diamond", "Platinum", "Gold", "Silver", "Bronze"],
    attributes: [
      ...universalAttributes,
      numberAttribute("level", "Account Level", "e.g. 75", true),
      numberAttribute("booyahs", "Booyahs", "e.g. 1200", true),
      textAttribute("characters", "Characters Unlocked", "e.g. Alok, K, Chrono", true),
      numberAttribute("skinsCount", "Skin Count", "e.g. 65"),
      textAttribute("petLevels", "Pet Levels", "e.g. Dreki Lv. 7, Rockie Lv. 5"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: ["Rare Bundle", "Gun Skin", "Emote", "Pet Max", "Booyah Pass"],
  },
  "clash-of-clans": {
    id: "clash-of-clans",
    name: "Clash of Clans",
    category: "MOBILE",
    ranks: [
      "Town Hall 1",
      "Town Hall 2",
      "Town Hall 3",
      "Town Hall 4",
      "Town Hall 5",
      "Town Hall 6",
      "Town Hall 7",
      "Town Hall 8",
      "Town Hall 9",
      "Town Hall 10",
      "Town Hall 11",
      "Town Hall 12",
      "Town Hall 13",
      "Town Hall 14",
      "Town Hall 15",
      "Town Hall 16",
      "Town Hall 17",
    ],
    attributes: [
      ...universalAttributes,
      numberAttribute("gems", "Gems Count", "e.g. 50000", true),
      textAttribute("heroLevels", "Hero Levels", "e.g. King 80, Queen 75"),
      textAttribute("troopLevels", "Troop Levels", "e.g. Dragons Lv. 9"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: [
      "Max Level Base",
      "Legendary Troops",
      "Rare Skins",
      "Full Walls",
      "Dragon Level",
      "P.E.K.K.A",
      "Magic Items",
    ],
  },
  "rise-of-kingdoms": {
    id: "rise-of-kingdoms",
    name: "Rise of Kingdoms",
    category: "MOBILE",
    ranks: ["Governor Level 1", "Governor Level 50", "Governor Level 100", "Governor Level 150"],
    attributes: [
      ...universalAttributes,
      numberAttribute("power", "Power", "e.g. 25000000", true),
      textAttribute("commanders", "Commanders", "e.g. Scipio, Saladin, Minamoto", true),
      textAttribute("resources", "Resource Stockpile", "e.g. 10M food, 8M wood"),
      textAttribute("kingdomAge", "Kingdom Age", "e.g. 450 days"),
      notableAssetsAttribute,
    ],
    credentials: [],
    badges: ["Legendary Commander", "Sun Tzu", "Neville", "Elite Troops", "City Skin"],
  },
};

export const getGameConfig = (gameId: string): GameConfig | undefined => {
  return GAME_CONFIGS[gameId];
};

export const getGameConfigById = getGameConfig;

export const getAttributeLabel = (gameId: string, key: string): string | undefined => {
  const config = getGameConfig(gameId);
  if (!config) return undefined;
  return config.attributes.find((a) => a.key === key)?.label;
};

export const allGameConfigs: GameConfig[] = Object.values(GAME_CONFIGS);
