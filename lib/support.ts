import { getAdminFirestore } from "@/lib/firebase-admin";

export interface SupportTicket {
  userId: string;
  orderId?: string | null;
  subject: string;
  message: string;
  category: string;
  status: "open" | "under_review" | "resolved" | "action_required";
  priority: "low" | "medium" | "high" | "urgent";
  proofUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  isAppeal?: boolean;
  bannedUserEmail?: string | null;
  bannedUserName?: string | null;
  originalBanUid?: string | null;
}

export interface CreateTicketPayload {
  userId: string;
  orderId?: string | null;
  subject: string;
  message: string;
  category: string;
  proofUrls?: string[];
  isAppeal?: boolean;
  bannedUserEmail?: string;
  bannedUserName?: string;
  originalBanUid?: string;
}

export async function createSupportTicket(payload: CreateTicketPayload) {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  const now = new Date();
  const ticket: SupportTicket = {
    userId: payload.userId,
    ...(payload.orderId ? { orderId: payload.orderId } : { orderId: null }),
    subject: payload.subject,
    message: payload.message,
    category: payload.category,
    status: payload.isAppeal ? "under_review" : "open",
    priority: payload.isAppeal ? "high" : "medium",
    proofUrls: payload.proofUrls || [],
    createdAt: now,
    updatedAt: now,
    ...(payload.isAppeal ? { isAppeal: true } : {}),
    ...(payload.bannedUserEmail ? { bannedUserEmail: payload.bannedUserEmail } : { bannedUserEmail: null }),
    ...(payload.bannedUserName ? { bannedUserName: payload.bannedUserName } : { bannedUserName: null }),
    ...(payload.originalBanUid ? { originalBanUid: payload.originalBanUid } : { originalBanUid: null }),
  };

  const ticketRef = await adminDb.collection("supportTickets").add(ticket);
  return { id: ticketRef.id, ...ticket };
}

export async function getSupportTickets(userId: string) {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  const snapshot = await adminDb
    .collection("supportTickets")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (SupportTicket & { id: string })[];
}

export async function getTicketMessages(ticketId: string) {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  const snapshot = await adminDb
    .collection("supportTickets")
    .doc(ticketId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function addTicketMessage(ticketId: string, message: {
  senderId: string;
  senderName: string;
  text: string;
  isAdmin?: boolean;
  ticketUserId?: string;
}) {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  await adminDb
    .collection("supportTickets")
    .doc(ticketId)
    .collection("messages")
    .add({
      ...message,
      isAdmin: message.isAdmin ?? false,
      createdAt: new Date(),
    });

  await adminDb.collection("supportTickets").doc(ticketId).update({
    updatedAt: new Date(),
  });
}

export async function getUserOrders(userId: string) {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  const ordersSnapshot = await adminDb
    .collection("orders")
    .where("buyerId", "==", userId)
    .get();

  const sellerSnapshot = await adminDb
    .collection("orders")
    .where("sellerId", "==", userId)
    .get();

  const orders = [
    ...ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    ...sellerSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  ];

  const seen = new Set<string>();
  return orders.filter((order) => {
    const id = order.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
