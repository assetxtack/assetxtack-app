import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get("account_number");
    const bankCode = searchParams.get("bank_code");

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { success: false, error: "account_number and bank_code are required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Payment gateway not configured" }, { status: 500 });
    }

    const isTestMode = secretKey.startsWith("sk_test_");
    const effectiveBankCode = isTestMode ? "001" : bankCode;

    let response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(effectiveBankCode)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    let data = await response.json();

    if (!response.ok || !data.status) {
      const message = data.message || "Account verification failed";
      const isTestLimitError = isTestMode && message.includes("daily limit");
      
      if (isTestLimitError && effectiveBankCode !== "001") {
        response = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=001`,
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
            },
          }
        );
        data = await response.json();
      }

      if (!response.ok || !data.status) {
        const fallbackMessage = isTestMode
          ? "Test mode limit reached. Using test bank 001. Please try again or switch to live mode."
          : data.message || "Account verification failed";
        return NextResponse.json(
          { success: false, error: fallbackMessage },
          { status: response.status || 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      account_name: data.data?.account_name,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unable to verify account details";
    console.error("Bank verification error:", errorMessage, error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
