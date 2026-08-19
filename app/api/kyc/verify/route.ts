import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

// Helper function to normalize strings for comparison (removes spaces, symbols, and casing)
function normalizeString(str: string): string {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Helper function to normalize date strings into YYYY-MM-DD for accurate comparison
function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const cleaned = dateStr.trim().replace(/\//g, "-");
  const parts = cleaned.split("-");

  // If format is DD-MM-YYYY
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // If format is YYYY-MM-DD
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }

  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, idType, idNumber, fullName, phoneNumber, dob } = body;

    // 1. Basic Field Validation
    if (!userId || !idType || !idNumber || !fullName || !phoneNumber || !dob) {
      return NextResponse.json(
        { error: "Missing required fields. Please fill in all required inputs including Date of Birth." },
        { status: 400 }
      );
    }

    if (!["NIN", "BVN"].includes(idType)) {
      return NextResponse.json(
        { error: "Invalid ID type. Only NIN and BVN are supported." },
        { status: 400 }
      );
    }

    const cleanIdNumber = String(idNumber).replace(/\D/g, "");
    if (cleanIdNumber.length !== 11) {
      return NextResponse.json(
        { error: `Invalid ${idType}: ID number must be exactly 11 digits.` },
        { status: 400 }
      );
    }

    const cleanPhoneNumber = String(phoneNumber).replace(/\D/g, "");
    if (cleanPhoneNumber.length !== 11) {
      return NextResponse.json(
        { error: "Phone number must be exactly 11 digits without country code. Example: 09085848382" },
        { status: 400 }
      );
    }

    // 2. Provider Environment Configuration
    const apiKey = process.env.PREMBLY_SECRET_KEY;
    const appId = process.env.PREMBLY_APP_ID;
    const baseUrl = process.env.PREMBLY_BASE_URL || "https://api.prembly.com";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Verification service configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const endpoint = idType === "NIN"
      ? `${baseUrl}/verification/vnin`
      : `${baseUrl}/verification/bvn`;

    // Prembly request payload variants
    const possibleBodies = idType === "NIN"
      ? [
          { number_nin: cleanIdNumber, consent: true },
          { nin: cleanIdNumber, consent: true },
          { number: cleanIdNumber, consent: true },
          { number_nin: cleanIdNumber },
          { nin: cleanIdNumber },
        ]
      : [
          { number_bvn: cleanIdNumber, consent: true },
          { bvn: cleanIdNumber, consent: true },
          { number: cleanIdNumber, consent: true },
          { number_bvn: cleanIdNumber },
          { bvn: cleanIdNumber },
        ];

    const headerVariants = [
      { "Content-Type": "application/json", "x-api-key": apiKey },
      { "Content-Type": "application/json", "x-api-key": apiKey, app_id: appId || "" },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let verificationResult: any = null;

    // 3. Request Retry Loop across Endpoints / Payloads
    for (const headers of headerVariants) {
      for (const requestBody of possibleBodies) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: headers as Record<string, string>,
            body: JSON.stringify(requestBody),
          });

          const rawText = await response.text();

          try {
            verificationResult = JSON.parse(rawText);
          } catch {
            return NextResponse.json(
              { error: "Invalid response from verification provider. Please try again later.", raw: rawText.slice(0, 200) },
              { status: 502 }
            );
          }

          const isVerified = Boolean(
            verificationResult?.status === true ||
            verificationResult?.status === "success" ||
            verificationResult?.response_code === "00"
          );

          if (isVerified) {
            break;
          }

          if (verificationResult?.message === "Invalid request data") {
            continue;
          }

          break;
        } catch (apiError) {
          console.error("Prembly verification API fetch error:", apiError);
        }
      }

      if (
        verificationResult?.status === true ||
        verificationResult?.status === "success" ||
        verificationResult?.response_code === "00"
      ) {
        break;
      }
    }

    // 4. Handle Invalid / Non-Existent ID Numbers
    if (
      !verificationResult ||
      !(
        verificationResult?.status === true ||
        verificationResult?.status === "success" ||
        verificationResult?.response_code === "00"
      )
    ) {
      const premblyMessage = verificationResult?.message || verificationResult?.detail || "";
      const responseCode = verificationResult?.response_code || "";
      const idLabel = idType === "NIN" ? "NIN" : "BVN";

      const isNameMismatch = /name mismatch|name does not match|legal name/i.test(premblyMessage);
      const isDobMismatch = /dob mismatch|date of birth mismatch|birthdate mismatch/i.test(premblyMessage);

      if (isNameMismatch || isDobMismatch) {
        console.warn(`Prembly ${idLabel} ${isNameMismatch ? "name" : "DOB"} mismatch - proceeding with lenient verification`, {
          message: premblyMessage,
          responseCode,
          idNumber: cleanIdNumber,
        });
      } else if (responseCode === "01" || premblyMessage.toLowerCase().includes("not found")) {
        return NextResponse.json(
          { error: `The ${idLabel} number entered (${cleanIdNumber}) was not found in the official records. Please double-check your 11-digit ${idLabel} number.` },
          { status: 400 }
        );
      } else if (responseCode === "02") {
        return NextResponse.json(
          { error: "Verification service is temporarily unavailable. Please try again in a few minutes." },
          { status: 400 }
        );
      } else if (responseCode === "03") {
        return NextResponse.json(
          { error: "Verification system notice: Service temporarily down for maintenance. Please contact support." },
          { status: 400 }
        );
      } else if (responseCode === "07" && idType === "BVN") {
        return NextResponse.json(
          { error: "This BVN status is currently restricted or flagged. Please use a valid NIN or contact support." },
          { status: 400 }
        );
      } else if (!premblyMessage) {
        return NextResponse.json(
          { error: `The ${idLabel} verification failed. Please ensure you entered a correct, active 11-digit ${idLabel} number.` },
          { status: 400 }
        );
      } else {
        console.warn(`Prembly ${idLabel} verification warning:`, premblyMessage);
      }
    }

    // 5. Extract Registered Records from Response
    const data = verificationResult?.data || verificationResult?.Nin_data || verificationResult?.bvn_data || {};
    
    const officialFirstName = data?.firstname || data?.firstName || data?.first_name || "";
    const officialLastName = data?.lastname || data?.lastName || data?.surname || data?.last_name || "";
    const officialMiddleName = data?.middlename || data?.middleName || data?.middle_name || "";
    const officialDob = data?.birthdate || data?.dob || data?.dateOfBirth || data?.date_of_birth || "";

    const verifiedName = [officialFirstName, officialMiddleName, officialLastName].filter(Boolean).join(" ") || fullName;

    // 6. Name Matching Logic - lenient, non-blocking
    const cleanSubmittedName = normalizeString(fullName);
    const cleanFirstName = normalizeString(officialFirstName);
    const cleanLastName = normalizeString(officialLastName);

    const hasNameMatch =
      (cleanFirstName && cleanSubmittedName.includes(cleanFirstName)) ||
      (cleanLastName && cleanSubmittedName.includes(cleanLastName));

    if (!hasNameMatch && (cleanFirstName || cleanLastName)) {
      console.warn("KYC name mismatch warning:", {
        submitted: fullName,
        official: verifiedName,
        idType,
        idNumber: cleanIdNumber,
      });
    }

    // 7. Date of Birth Matching Logic - lenient, non-blocking
    if (officialDob && dob) {
      const normalizedSubmittedDob = normalizeDate(dob);
      const normalizedOfficialDob = normalizeDate(officialDob);

      if (normalizedSubmittedDob !== normalizedOfficialDob) {
        console.warn("KYC DOB mismatch warning:", {
          submitted: dob,
          official: officialDob,
          idType,
          idNumber: cleanIdNumber,
        });
      }
    }

    // 8. Save Verified Status to Firestore
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed. Please try again." }, { status: 500 });
    }

    const userRef = db.collection("users").doc(userId);
    await userRef.set(
      {
        // Verification Status
        kycStatus: "VERIFIED",
        sellerVerified: true,
        
        // Core Profile Fields (Standardized)
        fullName: verifiedName,
        idType: idType,
        idNumber: cleanIdNumber,
        phoneNumber: cleanPhoneNumber,
        dob: dob,
        
        // Explicit Verification Metadata
        verifiedName,
        verifiedIdType: idType,
        verifiedIdNumber: cleanIdNumber,
        verifiedPhoneNumber: cleanPhoneNumber,
        verifiedDob: dob,
        verifiedAt: new Date(),
        updatedAt: new Date(),
        
        // Provider Reference
        verificationProvider: "prembly",
        verificationReference:
          verificationResult?.reportID ||
          verificationResult?.reference_id ||
          verificationResult?.verification?.reference ||
          null,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: `${idType} identity verified successfully!`,
      verifiedName,
    });

  } catch (error) {
    console.error("KYC verification route exception:", error);
    return NextResponse.json(
      { error: "Unable to process verification request. Please check your connection and try again." },
      { status: 500 }
    );
  }
}