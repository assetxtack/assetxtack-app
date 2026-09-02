import type { Listing } from "../firestore-types";
import { getGameConfig } from "../config/gameConfigs";

export type ListingWithAttrs = Listing & {
  gameAttributes?: Record<string, string | number | boolean>;
  credentials?: Record<string, string | boolean>;
  rank?: string;
  skinsCount?: number;
  heroesCount?: number;
  winRate?: string;
  accountEmail?: string;
  accountPassword?: string;
  moontonStatus?: string;
  vkBoundStatus?: string;
  facebookBoundStatus?: string;
  tiktokBoundStatus?: string;
  googlePlayStatus?: string;
  appleIdStatus?: string;
  has2FA?: string;
  secondaryPassword?: string;
  twoFactorDetails?: string;
  loginProvider?: string;
  accountType?: string;
};

export type AttributeGetter = (key: string) => string | number | boolean | undefined;

export interface NormalizedListing {
  rank: string;
  skinsCount: number;
  heroesCount: number;
  winRate: string;
  hoursPlayed: number;
  inventoryValue: string;
  kdRatio: string;
  seasonLevel: number;
  cosmetics: number;
  battlePass: number;
  skins: number;
  vbucks: number;
  wins: number;
  townHall: number;
  gems: number;
  heroLevels: string;
  weapons: string;
  operatorSkins: string;
  tier: string;
  champions: number;
  agents: number;
  medals: number;
  gameAttributes: Record<string, string | number | boolean>;
  credentials: Record<string, string | boolean>;
  [key: string]: unknown;
}

export function getListingAttr(
  listing: ListingWithAttrs,
  key: string,
  fallbackKey?: string
): string | number | boolean | undefined {
  const rec = listing as unknown as Record<string, unknown>;
  if (listing.gameAttributes && Object.prototype.hasOwnProperty.call(listing.gameAttributes, key)) {
    return listing.gameAttributes[key];
  }
  if (listing.gameAttributes && fallbackKey && Object.prototype.hasOwnProperty.call(listing.gameAttributes, fallbackKey)) {
    return listing.gameAttributes[fallbackKey];
  }
  if (fallbackKey && typeof rec[fallbackKey] !== "undefined") {
    return rec[fallbackKey] as string | number | boolean;
  }
  if (typeof rec[key] !== "undefined") {
    return rec[key] as string | number | boolean;
  }
  return undefined;
}

export function getAllListingAttrs(listing: ListingWithAttrs): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  const seen = new Set<string>();

  if (listing.gameAttributes) {
    for (const [key, value] of Object.entries(listing.gameAttributes)) {
      result[key] = value;
      seen.add(key);
    }
  }

  const legacyKeys = [
    "rank", "skinsCount", "heroesCount", "winRate", "hoursPlayed",
    "inventoryValue", "kdRatio", "seasonLevel", "cosmetics", "battlePass",
    "skins", "vbucks", "wins", "townHall", "gems", "heroLevels",
    "weapons", "operatorSkins", "tier", "champions", "agents", "medals",
  ];

  for (const key of legacyKeys) {
    if (!seen.has(key)) {
      const legacyValue = (listing as unknown as Record<string, unknown>)[key];
      if (legacyValue !== undefined && legacyValue !== null && legacyValue !== "") {
        result[key] = legacyValue as string | number | boolean;
      }
    }
  }

  return result;
}

export function getCredential(
  listing: ListingWithAttrs,
  key: string,
  fallbackKey?: string
): string | boolean | undefined {
  const rec = listing as unknown as Record<string, unknown>;
  if (listing.credentials && Object.prototype.hasOwnProperty.call(listing.credentials, key)) {
    return listing.credentials[key];
  }
  if (listing.credentials && fallbackKey && Object.prototype.hasOwnProperty.call(listing.credentials, fallbackKey)) {
    return listing.credentials[fallbackKey];
  }
  if (fallbackKey && typeof rec[fallbackKey] !== "undefined") {
    return rec[fallbackKey] as string | boolean;
  }
  if (typeof rec[key] !== "undefined") {
    return rec[key] as string | boolean;
  }
  return undefined;
}

export function getAllCredentials(listing: ListingWithAttrs): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  const seen = new Set<string>();

  if (listing.credentials) {
    for (const [key, value] of Object.entries(listing.credentials)) {
      result[key] = value;
      seen.add(key);
    }
  }

  const legacyKeys = [
    "accountEmail", "accountPassword", "secondaryPassword", "has2FA",
    "twoFactorDetails", "moontonStatus", "vkBoundStatus", "facebookBoundStatus",
    "tiktokBoundStatus", "googlePlayStatus", "appleIdStatus",
  ];

  for (const key of legacyKeys) {
    if (!seen.has(key)) {
      const legacyValue = (listing as unknown as Record<string, unknown>)[key];
      if (legacyValue !== undefined && legacyValue !== null && legacyValue !== "") {
        result[key] = legacyValue as string | boolean;
      }
    }
  }

  return result;
}

export function buildListingPayload(
  gameId: string,
  formData: Record<string, unknown>,
  universalFields: Record<string, unknown> = {}
): Record<string, unknown> & {
  gameAttributes: Record<string, string | number | boolean>;
  credentials: Record<string, string | boolean>;
} {
  const gameAttributes: Record<string, string | number | boolean> = {};
  const credentials: Record<string, string | boolean> = {};

  const config = getGameConfig(gameId);
  if (!config) {
    return {
      gameAttributes,
      credentials,
      ...universalFields,
    } as unknown as Record<string, unknown> & {
      gameAttributes: Record<string, string | number | boolean>;
      credentials: Record<string, string | boolean>;
    };
  }

  if (config) {
    for (const attr of config.attributes) {
      const value = formData[attr.key];
      if (value !== undefined && value !== null && value !== "") {
        if (attr.type === "number") {
          const numVal = Number(value);
          if (!isNaN(numVal)) {
            gameAttributes[attr.key] = numVal;
          }
        } else {
          gameAttributes[attr.key] = value as string | number | boolean;
        }
      }
    }

    for (const cred of config.credentials) {
      const value = formData[cred.key];
      if (value !== undefined && value !== null && value !== "") {
        credentials[cred.key] = cred.type === "boolean"
          ? Boolean(value)
          : (value as string | boolean);
      }
    }
  }

  const universalCredentialKeys = [
    "accountEmail", "accountPassword", "secondaryPassword",
    "has2FA", "twoFactorDetails", "unboundConfirmation",
  ];

  for (const key of universalCredentialKeys) {
    const value = formData[key];
    if (value !== undefined && value !== null && value !== "") {
      credentials[key] = value as string | boolean;
    }
  }

  const mergedPayload: Record<string, unknown> = {
    ...universalFields,
    gameAttributes,
    credentials,
  };

  return mergedPayload as Record<string, unknown> & {
    gameAttributes: Record<string, string | number | boolean>;
    credentials: Record<string, string | boolean>;
  };
}
