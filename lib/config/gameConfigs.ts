export interface GameAttribute {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder: string;
  required: boolean;
  options?: string[];
}

export interface GameCredential {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  placeholder?: string;
  options?: string[];
}

export interface GameConfig {
  id: string;
  name: string;
  category: 'MOBILE' | 'PC' | 'CONSOLE';
  ranks: string[];
  attributes: GameAttribute[];
  credentials: GameCredential[];
  badges?: string[];
}

const UNBOUND_OPTIONS = ['Unbound (Clean)', 'Bound - Handing Over Login', 'Bound - Not Transferable'];

export const GAME_CONFIGS: Record<string, GameConfig> = {
  'mobile-legends': {
    id: 'mobile-legends',
    name: 'Mobile Legends: Bang Bang',
    category: 'MOBILE',
    ranks: ['Mythical Immortal', 'Mythical Glory', 'Mythical Honor', 'Mythic', 'Legend', 'Epic', 'Grandmaster', 'Master', 'Elite', 'Warrior'],
    attributes: [
      { key: 'rank', label: 'Rank', type: 'select', placeholder: 'Select rank...', required: true, options: ['Mythical Immortal', 'Mythical Glory', 'Mythical Honor', 'Mythic', 'Legend', 'Epic', 'Grandmaster', 'Master', 'Elite', 'Warrior'] },
      { key: 'skinsCount', label: 'In-Game Assets Count', type: 'number', placeholder: 'e.g. 85', required: true },
      { key: 'heroesCount', label: 'Skin Count', type: 'number', placeholder: 'e.g. 122', required: true },
      { key: 'winRate', label: 'Win Rate', type: 'text', placeholder: 'e.g. 62.4%', required: false },
      { key: 'featuredSkins', label: 'Featured Skins', type: 'text', placeholder: 'e.g. Granger - Star Guardian, Gusion - 11 11',  required: false },
      

    ],
    credentials: [
      { key: 'moontonStatus', label: 'Moonton Account Status', type: 'select', options: ['Clean Email (Handover Ready)', 'Bound - Email Change Available', 'Bound - Full Control'] },
      { key: 'emailChangeAvailability', label: 'Email Change Availability', type: 'select', options: ['Available', 'Not Available', 'Pending'] },
      { key: 'linkedSocials', label: 'Linked Socials', type: 'select', options: ['None', 'VK Only', 'Facebook Only', 'TikTok Only', 'Multiple'] },
    ],
    badges: ['Collector', 'Legend', 'PRIME', 'KOF', 'Aspirants', 'M-Series', 'Star Wars', 'STUN', '11.11', 'Kung-Fu Panda', 'Soul vessel', 'Street Fighters', 'Dawning', 'Transformer', 'Hunter X Hunter', 'Naruto',  'Attack on Titan', 'Jujutsu Kaisen'],
  },
};

export const getGameConfig = (gameId: string): GameConfig | undefined => {
  return GAME_CONFIGS[gameId];
};

export const getGameConfigById = getGameConfig;

export const allGameConfigs: GameConfig[] = Object.values(GAME_CONFIGS);