export interface Game {
  id: string;
  name: string;
  category: "Mobile" | "PC" | "Console";
  requiredAttributes: string[];
}

export const SUPPORTED_GAMES: Game[] = [
  {
    id: "mobile-legends",
    name: "Mobile Legends: Bang Bang",
    category: "Mobile",
    requiredAttributes: ["rank", "skinsCount", "heroesCount", "winRate"],
  },
  {
    id: "clash-of-clans",
    name: "Clash of Clans",
    category: "Mobile",
    requiredAttributes: ["townHall", "gems", "heroLevels"],
  },
  {
    id: "pubg-mobile",
    name: "PUBG Mobile",
    category: "Mobile",
    requiredAttributes: ["rank", "seasonLevel", "cosmetics", "kdRatio"],
  },
  {
    id: "valorant",
    name: "Valorant",
    category: "PC",
    requiredAttributes: ["rank", "agents", "skins", "hoursPlayed"],
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    category: "PC",
    requiredAttributes: ["rank", "inventoryValue", "hoursPlayed", "medals"],
  },
  {
    id: "fortnite",
    name: "Fortnite",
    category: "Console",
    requiredAttributes: ["battlePass", "skins", "vbucks", "wins"],
  },
  {
    id: "call-of-duty-mobile",
    name: "Call of Duty Mobile",
    category: "Mobile",
    requiredAttributes: ["rank", "weapons", "operatorSkins", "tier"],
  },
  {
    id: "league-of-legends",
    name: "League of Legends",
    category: "PC",
    requiredAttributes: ["rank", "champions", "skins", "hoursPlayed"],
  },
];
