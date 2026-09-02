import { GameConfig, GAME_CONFIGS } from "../config/gameConfigs";

export interface Game {
  id: string;
  name: string;
  category: "Mobile" | "PC" | "Console";
  requiredAttributes: string[];
  ranks?: string[];
  badges?: string[];
}

const categoryMap: Record<GameConfig["category"], "Mobile" | "PC" | "Console"> = {
  MOBILE: "Mobile",
  PC: "PC",
  CONSOLE: "Console",
};

export const SUPPORTED_GAMES: Game[] = (Object.values(GAME_CONFIGS) as GameConfig[]).map(
  (config: GameConfig): Game => ({
    id: config.id,
    name: config.name,
    category: categoryMap[config.category],
    requiredAttributes: config.attributes.map((attr) => attr.key),
    ranks: config.ranks,
    badges: config.badges,
  })
);

export type { GameConfig };
export { GAME_CONFIGS, getGameConfig, getGameConfigById, allGameConfigs } from "../config/gameConfigs";
