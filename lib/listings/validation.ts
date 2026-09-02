import { z } from "zod";
import { type GameConfig, getGameConfig } from "../config/gameConfigs";

export const ListingDataPayloadSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  gameId: z.string().min(1, "Game ID is required"),
  title: z.string().min(1, "Listing title is required"),
  price: z.number().positive("Price must be a positive number"),
  accountType: z.enum(["Full Account Transfer"]),
  gameAttributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]).optional()),
  credentials: z.record(z.string(), z.union([z.string(), z.boolean()]).optional()),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ListingDataPayload = z.infer<typeof ListingDataPayloadSchema>;

export const createListingFormSchema = (gameId: string, currentStep?: number) => {
  const config: GameConfig | undefined = getGameConfig(gameId);

  const attributeFields: Record<string, z.ZodTypeAny> = {};
  if (config) {
    for (const attr of config.attributes) {
      if (attr.type === "number") {
        const base = z.coerce
          .number({ message: `${attr.label} must be a number` })
          .positive(`${attr.label} must be a positive number`);
        attributeFields[attr.key] = attr.required ? base : base.optional();
      } else if (attr.type === "select") {
        const base = z.enum(attr.options as [string, ...string[]], {
          message: `${attr.label} is required`,
        });
        attributeFields[attr.key] = attr.required ? base : z.string().optional();
      } else {
        const base = z.string().min(1, `${attr.label} is required`);
        attributeFields[attr.key] = attr.required ? base : z.string().optional();
      }
    }
  }

  // IMPORTANT: All credential fields are ALWAYS optional, regardless of config
  const credentialFields: Record<string, z.ZodTypeAny> = {};
  if (config) {
    for (const cred of config.credentials) {
      if (cred.type === "boolean") {
        credentialFields[cred.key] = z.boolean().optional();
      } else if (cred.type === "select") {
        credentialFields[cred.key] = z.string().optional();
      } else {
        credentialFields[cred.key] = z.string().optional();
      }
    }
  }

  // STEP 1: Game Selection & Listing Details (Title, Price, Attributes, Description)
  // Only validate listing-related fields, no credentials
  if (currentStep === 1) {
    return z.object({
      gameId: z.string().min(1, "Please select a game."),
      title: z.string().min(1, "Please enter a listing title."),
      price: z.string()
        .min(1, "Please enter a valid selling price.")
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number."),
      description: z.string().min(1, "Please describe the account features and in-game assets."),
      accountType: z.string().optional(),
      ...attributeFields,
    }).partial().required({ gameId: true, title: true, price: true, description: true });
  }

  // STEP 2: Screenshot Proof Upload
  // No specific validation required for step 2 (screenshots handled separately)
  if (currentStep === 2) {
    return z.object({
      screenshots: z.array(z.unknown()).optional(),
    });
  }

  // STEP 3: Account Transferability & Unbind Confirmation
  // Validate unbind confirmation only; credentials (email, password) are collected post-payment via escrow
  if (currentStep === 3) {
    return z.object({
      unboundConfirmation: z.boolean().refine((val) => val === true, {
        message: "You must confirm that all linked third-party accounts are unbound before proceeding.",
      }),
      ...credentialFields,
    });
  }

  // STEP 4: Listing Plan & Fee Selection
  // Validate listing plan choice
  if (currentStep === 4) {
    return z.object({
      listingPlan: z.enum(["standard", "shield"]).optional(),
    });
  }

  // Default: Allow all fields as optional for validation without step context
  return z.object({
    gameId: z.string().min(1, "Game ID is required.").optional(),
    title: z.string().min(1, "Please enter a listing title.").optional(),
    price: z.string()
      .min(1, "Please enter a valid selling price.")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number.")
      .optional(),
    description: z.string().min(1, "Please describe the account features and in-game assets.").optional(),
    accountType: z.string().optional(),
    accountEmail: z.string().email("Please enter a valid primary account email.").optional(),
    accountPassword: z.string().min(6, "Password must be at least 6 characters.").optional(),
    unboundConfirmation: z.boolean().optional(),
    gameAttributes: z.record(z.string(), z.unknown()).optional(),
    credentials: z.record(z.string(), z.unknown()).optional(),
    ...attributeFields,
    ...credentialFields,
  });
};

const getFirstErrorMessage = (error: z.ZodError): string => {
  const issue = error.issues[0];
  return issue ? issue.message : "Validation failed";
};

export const validateListingForm = (
  gameId: string,
  data: Record<string, unknown>,
  currentStep?: number
) => {
  const schema = createListingFormSchema(gameId, currentStep);
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false as const, errors: result.error.issues, message: getFirstErrorMessage(result.error) };
  }
  return { success: true as const, data: result.data };
};

export const validateListingPayload = (payload: unknown) => {
  const result = ListingDataPayloadSchema.safeParse(payload);
  if (!result.success) {
    return { success: false as const, errors: result.error.issues, message: getFirstErrorMessage(result.error) };
  }
  return { success: true as const, data: result.data };
};
