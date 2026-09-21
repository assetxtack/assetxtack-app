export type ListingPlan = "standard" | "featured" | "shield" | "";
export type KYCStatus = "unverified" | "pending" | "VERIFIED" | "rejected";

export interface FeeCalculationParams {
  listingPlan: ListingPlan;
  hasShieldProtection: boolean;
  sellerVerified: boolean;
  kycStatus?: KYCStatus;
}

export interface FeeBreakdown {
  feePercentage: number;
  platformFee: number;
  sellerPayout: number;
  grossAmount: number;
  planType: "shield" | "featured" | "standard_verified" | "standard_unverified";
}

/**
 * Calculates the platform fee percentage based on listing plan and seller verification status.
 * 
 * Fee Structure:
 * - Shield/Featured plan or hasShieldProtection: 10%
 * - Standard plan with VERIFIED seller: 5%
 * - Standard plan with UNVERIFIED seller: 15%
 * 
 * @param params - Fee calculation parameters
 * @returns Fee breakdown with percentage and calculated amounts
 */
export function calculatePlatformFee(params: FeeCalculationParams): FeeBreakdown {
  const { listingPlan, hasShieldProtection, sellerVerified, kycStatus } = params;
  
  // Determine if seller is verified (check both sellerVerified boolean and kycStatus)
  const isVerified = sellerVerified === true || kycStatus === "VERIFIED";
  
  // Determine plan type and fee percentage
  let feePercentage: number;
  let planType: FeeBreakdown["planType"];
  
  if (listingPlan === "shield" || listingPlan === "featured" || hasShieldProtection) {
    feePercentage = 0.10; // 10%
    planType = listingPlan === "shield" ? "shield" : "featured";
  } else {
    // Standard plan
    if (isVerified) {
      feePercentage = 0.05; // 5%
      planType = "standard_verified";
    } else {
      feePercentage = 0.15; // 15% for unverified
      planType = "standard_unverified";
    }
  }
  
  return {
    feePercentage,
    platformFee: 0, // Will be calculated by caller with amount
    sellerPayout: 0, // Will be calculated by caller with amount
    grossAmount: 0, // Will be set by caller
    planType,
  };
}

/**
 * Calculates the complete fee breakdown for a given order amount.
 * 
 * @param amount - The gross order amount
 * @param params - Fee calculation parameters
 * @returns Complete fee breakdown with calculated amounts
 */
export function calculateFeeBreakdown(amount: number, params: FeeCalculationParams): FeeBreakdown {
  const base = calculatePlatformFee(params);
  const platformFee = Math.round(amount * base.feePercentage);
  const sellerPayout = amount - platformFee;
  
  return {
    ...base,
    platformFee,
    sellerPayout,
    grossAmount: amount,
  };
}

/**
 * Gets a human-readable description of the fee tier.
 * 
 * @param planType - The plan type from fee breakdown
 * @returns Human-readable fee tier description
 */
export function getFeeTierDescription(planType: FeeBreakdown["planType"]): string {
  switch (planType) {
    case "shield":
      return "Shield Protection (10%)";
    case "featured":
      return "Featured Listing (10%)";
    case "standard_verified":
      return "Standard Plan - Verified (5%)";
    case "standard_unverified":
      return "Standard Plan - Unverified (15%)";
    default:
      return "Standard Plan";
  }
}

/**
 * Gets the fee percentage for display purposes.
 * 
 * @param planType - The plan type from fee breakdown
 * @returns Fee percentage as a string (e.g., "5%", "10%", "15%")
 */
export function getFeePercentageString(planType: FeeBreakdown["planType"]): string {
  switch (planType) {
    case "shield":
    case "featured":
      return "10%";
    case "standard_verified":
      return "5%";
    case "standard_unverified":
      return "15%";
    default:
      return "5%";
  }
}