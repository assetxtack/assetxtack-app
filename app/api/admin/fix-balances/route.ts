import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret } = body;

    if (!secret || secret !== process.env.FIX_BALANCES_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const usersSnapshot = await adminDb.collection("users").get();
    const fixedUsers: Array<{
      userId: string;
      previousAvailable: number;
      newAvailable: number;
      previousEscrow: number;
      newEscrow: number;
      previousLifetime: number;
      newLifetime: number;
    }> = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      const txSnapshot = await adminDb
        .collection("walletTransactions")
        .where("userId", "==", userId)
        .get();

      const transactions = txSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type || "",
            amount: Number(data.amount) || 0,
            metadata: data.metadata || {},
            createdAt: data.createdAt,
          };
        })
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || new Date(a.createdAt).getTime();
          const bTime = b.createdAt?.toDate?.()?.getTime() || new Date(b.createdAt).getTime();
          return aTime - bTime;
        });

      let availableBalance = 0;
      let escrowBalance = 0;
      let lifetimeSales = 0;

      for (const tx of transactions) {
        const amount = Number(tx.amount) || 0;

        switch (tx.type) {
          case "ESCROW_LOCK":
            escrowBalance += amount;
            break;
          case "ESCROW_RELEASE":
            availableBalance += amount;
            const grossAmount = Number(tx.metadata?.grossAmount) || amount;
            escrowBalance = Math.max(0, escrowBalance - grossAmount);
            lifetimeSales += grossAmount;
            break;
          case "WITHDRAWAL_COMPLETED":
            availableBalance -= amount;
            break;
          case "LISTING_SALE":
            availableBalance += amount;
            lifetimeSales += amount;
            break;
          case "PLATFORM_FEE":
            break;
          case "REFUND":
            availableBalance += amount;
            escrowBalance = Math.max(0, escrowBalance - amount);
            break;
          case "CREDIT":
            availableBalance += amount;
            break;
          default:
            break;
        }
      }

      const previousAvailable = Number(userData.walletBalance) || 0;
      const previousEscrow = Number(userData.escrowBalance) || 0;
      const previousLifetime = Number(userData.lifetimeSales) || 0;

      const newAvailable = Math.max(0, Math.round(availableBalance));
      const newEscrow = Math.max(0, Math.round(escrowBalance));
      const newLifetime = Math.max(0, Math.round(lifetimeSales));

      if (previousAvailable !== newAvailable || previousEscrow !== newEscrow || previousLifetime !== newLifetime) {
        await userDoc.ref.update({
          walletBalance: newAvailable,
          escrowBalance: newEscrow,
          lifetimeSales: newLifetime,
          updatedAt: new Date(),
        });

        fixedUsers.push({
          userId,
          previousAvailable,
          newAvailable,
          previousEscrow,
          newEscrow,
          previousLifetime,
          newLifetime,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedUsers.length} user balances`,
      fixedUsers,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fix balances:", errorMessage, error);
    return NextResponse.json({ error: `Failed to fix balances: ${errorMessage}` }, { status: 500 });
  }
}
