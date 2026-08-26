import { getAdminFirestore } from "@/lib/firebase-admin";

export type NotificationType =
  | "ESCROW_LOCKED"
  | "ESCROW_DELIVERED"
  | "NEW_MESSAGE"
  | "CHAT"
  | "DISPUTE_RAISED"
  | "DISPUTE"
  | "ORDER_COMPLETED"
  | "CREDENTIALS_DELIVERED"
  | "REVIEW_RECEIVED";

export interface NotificationPayload {
  userId: string;
  orderId: string;
  title: string;
  message: string;
  type: NotificationType;
}

export async function sendNotification({
  userId,
  orderId,
  title,
  message,
  type,
}: NotificationPayload): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  await adminDb.collection("notifications").add({
    userId,
    orderId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date(),
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    throw new Error("Firestore Admin is not initialized.");
  }

  await adminDb.collection("notifications").doc(notificationId).set(
    { read: true },
    { merge: true }
  );
}
