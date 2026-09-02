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
      { key: 'heroesCount', label: 'Characters Count', type: 'number', placeholder: 'e.g. 122', required: true },
      { key: 'winRate', label: 'Win Rate', type: 'text', placeholder: 'e.g. 62.4%', required: false },
    ],
    credentials: [
      { key: 'moontonStatus', label: 'Moonton Account Status', type: 'select', options: ['Clean Email (Handover Ready)', 'Bound - Email Change Available', 'Bound - Full Control'] },
      { key: 'emailChangeAvailability', label: 'Email Change Availability', type: 'select', options: ['Available', 'Not Available', 'Pending'] },
      { key: 'linkedSocials', label: 'Linked Socials', type: 'select', options: ['None', 'VK Only', 'Facebook Only', 'TikTok Only', 'Multiple'] },
    ],
    badges: ['Collector', 'Legend', 'PRIME', 'KOF', 'Aspirants', 'M-Series', 'Zodiac', 'STUN', '11.11', '515'],
  },
  'clash-of-clans': {
    id: 'clash-of-clans',
    name: 'Clash of Clans',
    category: 'MOBILE',
    ranks: ['Town Hall 1', 'Town Hall 2', 'Town Hall 3', 'Town Hall 4', 'Town Hall 5', 'Town Hall 6', 'Town Hall 7', 'Town Hall 8', 'Town Hall 9', 'Town Hall 10', 'Town Hall 11', 'Town Hall 12', 'Town Hall 13', 'Town Hall 14', 'Town Hall 15', 'Town Hall 16', 'Town Hall 17'],
    attributes: [
      { key: 'rank', label: 'Town Hall Level', type: 'select', placeholder: 'Select TH level...', required: true, options: ['Town Hall 1', 'Town Hall 2', 'Town Hall 3', 'Town Hall 4', 'Town Hall 5', 'Town Hall 6', 'Town Hall 7', 'Town Hall 8', 'Town Hall 9', 'Town Hall 10', 'Town Hall 11', 'Town Hall 12', 'Town Hall 13', 'Town Hall 14', 'Town Hall 15', 'Town Hall 16', 'Town Hall 17'] },
      { key: 'gems', label: 'Gems Count', type: 'number', placeholder: 'e.g. 50000', required: true },
      { key: 'heroLevels', label: 'Hero Levels', type: 'text', placeholder: 'e.g. King: 80, Queen: 75', required: false },
    ],
    credentials: [
      { key: 'supercellIdStatus', label: 'Supercell ID Status', type: 'select', options: ['Bound - Handing Over', 'Unbound - New Owner Creates'] },
      { key: 'ownershipType', label: 'Account Ownership', type: 'select', options: ['Original Owner', 'Purchased Account', 'Developer Account'] },
    ],
    badges: ['Max Level Base', 'Legendary Troops', 'Rare Skins', 'Full Walls', 'Dragon Level', 'P.E.K.K.A', 'Magic Items'],
  },
  'pubg-mobile': {
    id: 'pubg-mobile',
    name: 'PUBG Mobile',
    category: 'MOBILE',
    ranks: ['Ace', 'Ace Master', 'Ace Dominator', 'Ace Challenger', 'Conqueror', 'Crown', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'],
    attributes: [
      { key: 'rank', label: 'Rank', type: 'select', placeholder: 'Select rank...', required: true, options: ['Ace', 'Ace Master', 'Ace Dominator', 'Ace Challenger', 'Conqueror', 'Crown', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'] },
      { key: 'seasonLevel', label: 'Season Level', type: 'number', placeholder: 'e.g. 45', required: true },
      { key: 'cosmetics', label: 'Cosmetics Count', type: 'number', placeholder: 'e.g. 120', required: false },
      { key: 'kdRatio', label: 'K/D Ratio', type: 'text', placeholder: 'e.g. 4.25', required: false },
    ],
    credentials: [
      { key: 'linkedAccount', label: 'Linked Account', type: 'select', options: ['None', 'Facebook', 'Google Play', 'Twitter', 'Multiple'] },
      { key: 'region', label: 'Region', type: 'select', options: ['Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Africa'] },
    ],
    badges: ['Maxed X-Suit', 'M416 Glacier (Max)', 'Mythic Fashion Title', 'Ultimate Set', 'Upgradable Vehicle'],
  },
  'valorant': {
    id: 'valorant',
    name: 'Valorant',
    category: 'PC',
    ranks: ['Radiant', 'Immortal', 'Ascendant', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Iron'],
    attributes: [
      { key: 'rank', label: 'Rank', type: 'select', placeholder: 'Select rank...', required: true, options: ['Radiant', 'Immortal', 'Ascendant', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Iron'] },
      { key: 'agents', label: 'Agents Unlocked', type: 'number', placeholder: 'e.g. 18', required: true },
      { key: 'skins', label: 'Skins Count', type: 'number', placeholder: 'e.g. 45', required: false },
      { key: 'hoursPlayed', label: 'Hours Played', type: 'number', placeholder: 'e.g. 1200', required: false },
    ],
    credentials: [
      { key: 'riotAccountStatus', label: 'Riot Account Status', type: 'select', options: ['Clean - Email Change Available', 'Bound - Original Email'] },
      { key: 'region', label: 'Region', type: 'select', options: ['NA', 'EU', 'APAC', 'LATAM', 'KR'] },
    ],
    badges: ['Champions 2021', 'Champions 2022', 'Champions 2023', 'VCT LOCK//IN', 'Elderflame', 'Radiant Entertainment System', 'Kuronami', 'Spectrum'],
  },
  'cs2': {
    id: 'cs2',
    name: 'Counter-Strike 2',
    category: 'PC',
    ranks: ['Premier Rating (Numerical)', 'Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Silver Elite', 'Silver Elite Master', 'Gold Nova I', 'Gold Nova II', 'Gold Nova III', 'Gold Nova IV', 'Master Guardian I', 'Master Guardian II', 'MGE', 'DMG', 'Legendary Eagle', 'Legendary Eagle Master', 'Supreme', 'The Global Elite'],
    attributes: [
      { key: 'rank', label: 'Rank', type: 'select', placeholder: 'Select rank...', required: true, options: ['Premier Rating (Numerical)', 'Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Silver Elite', 'Silver Elite Master', 'Gold Nova I', 'Gold Nova II', 'Gold Nova III', 'Gold Nova IV', 'Master Guardian I', 'Master Guardian II', 'MGE', 'DMG', 'Legendary Eagle', 'Legendary Eagle Master', 'Supreme', 'The Global Elite'] },
      { key: 'hoursPlayed', label: 'Hours Played', type: 'number', placeholder: 'e.g. 2500', required: true },
      { key: 'inventoryValue', label: 'Inventory Value ($/₦)', type: 'text', placeholder: 'e.g. $5000', required: false },
      { key: 'medals', label: 'Service Medals Count', type: 'number', placeholder: 'e.g. 5', required: false },
    ],
    credentials: [
      { key: 'steamStatus', label: 'Steam Account Status', type: 'select', options: ['Clean - Email Available', 'Bound - Original Email', 'Market Limited'] },
      { key: 'primeStatus', label: 'Prime Status', type: 'select', options: ['Active', 'Inactive', 'Pending'] },
    ],
    badges: ['Contraband (Howl)', 'Dragon Lore', 'Blue Gem (T1)', 'Doppler Gem', 'Katowice 2014 Holo', 'FN Crimson Web', '100% Fade'],
  },
  'fortnite': {
    id: 'fortnite',
    name: 'Fortnite',
    category: 'CONSOLE',
    ranks: ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Ultimate'],
    attributes: [
      { key: 'rank', label: 'Rank', type: 'select', placeholder: 'Select rank...', required: true, options: ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Ultimate'] },
      { key: 'battlePass', label: 'Battle Pass Level', type: 'number', placeholder: 'e.g. 100', required: true },
      { key: 'skins', label: 'Skins Count', type: 'number', placeholder: 'e.g. 85', required: false },
      { key: 'vbucks', label: 'V-Bucks Balance', type: 'number', placeholder: 'e.g. 10000', required: false },
      { key: 'wins', label: 'Total Wins', type: 'number', placeholder: 'e.g. 350', required: false },
    ],
    credentials: [
      { key: 'epicGamesStatus', label: 'Epic Games Status', type: 'select', options: ['Clean - Email Available', 'Bound - Original Email'] },
      { key: 'platform', label: 'Platform', type: 'select', options: ['PSN', 'Xbox', 'Nintendo Switch', 'PC', 'Mobile'] },
    ],
    badges: ['Renegade Raider', 'Aerial Assault Trooper', 'Black Knight', 'Pink Ghoul Trooper', 'Purple Skull Trooper', 'Galaxy', 'IKONIK', 'Travis Scott'],
  },
  'call-of-duty-mobile': {
    id: 'call-of-duty-mobile',
    name: 'Call of Duty Mobile',
    category: 'MOBILE',
    ranks: ['Legendary', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'],
    attributes: [
      { key: 'rank', label: 'Rank', type: 'select', placeholder: 'Select rank...', required: true, options: ['Legendary', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'] },
      { key: 'weapons', label: 'Weapons Unlocked', type: 'text', placeholder: 'e.g. 45 weapons', required: true },
      { key: 'operatorSkins', label: 'Operator Skins', type: 'text', placeholder: 'e.g. 12 skins', required: false },
      { key: 'tier', label: 'Tier', type: 'text', placeholder: 'e.g. Legendary', required: true },
    ],
    credentials: [
      { key: 'linkedAccount', label: 'Linked Account', type: 'select', options: ['None', 'Facebook', 'Google Play', 'Twitter', 'Multiple'] },
      { key: 'region', label: 'Region', type: 'select', options: ['NA', 'EU', 'APAC', 'LATAM'] },
    ],
    badges: ['Mythic Weapon (Max)', 'Mythic Operator', 'Legendary Operator', 'Prestige Weapon', 'Legacy Weapon', 'Legendary Vehicle'],
  },
  'league-of-legends': {
    id: 'league-of-legends',
    name: 'League of Legends',
    category: 'PC',
    ranks: ['Challenger', 'Grandmaster', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Iron'],
    attributes: [
      { key: 'rank', label: 'Rank', type: 'select', placeholder: 'Select rank...', required: true, options: ['Challenger', 'Grandmaster', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Iron'] },
      { key: 'champions', label: 'Champions Unlocked', type: 'number', placeholder: 'e.g. 80', required: true },
      { key: 'skins', label: 'Skins Count', type: 'number', placeholder: 'e.g. 120', required: false },
      { key: 'hoursPlayed', label: 'Hours Played', type: 'number', placeholder: 'e.g. 3000', required: false },
    ],
    credentials: [
      { key: 'riotAccountStatus', label: 'Riot Account Status', type: 'select', options: ['Clean - Email Change Available', 'Bound - Original Email'] },
      { key: 'region', label: 'Region', type: 'select', options: ['NA', 'EUW', 'EUNE', 'KR', 'CN', 'JP', 'OCE', 'LAN', 'LAS', 'TR', 'RU', 'BR'] },
    ],
    badges: ['PAX Skins', 'Black Alistar', 'Silver Kayle', 'UFO Corki', 'King Rammus', 'Ultimate Skin', 'Prestige Edition', 'Mythic/Hextech'],
  },
};

export const getGameConfig = (gameId: string): GameConfig | undefined => {
  return GAME_CONFIGS[gameId];
};

export const getGameConfigById = getGameConfig;

export const allGameConfigs: GameConfig[] = Object.values(GAME_CONFIGS);
