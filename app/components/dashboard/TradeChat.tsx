"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Send, Loader2, AlertTriangle, ShieldCheck, Paperclip, X, Lock } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface TradeChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystemMessage?: boolean;
  isRedacted?: boolean;
  imageUrl?: string | null;
  buyerId?: string | null;
  sellerId?: string | null;
  createdAt: string;
}

interface TradeChatProps {
  orderId: string;
  currentUserId: string;
  currentUserName: string;
  recipientId: string;
  orderStatus: "IN_ESCROW" | "AWAITING_CREDENTIALS" | "INSPECTION_PERIOD" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "CANCELLED" | "ADMIN_INTERVENTION" | "RETURNED_CREDENTIALS" | string;
  isBuyer: boolean;
  hasCredentials: boolean;
  isChatLocked?: boolean;
}

function parseTimestamp(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === "string" || typeof ts === "number") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof ts === "object" && ts !== null) {
    if ("toDate" in ts && typeof (ts as { toDate: () => Date }).toDate === "function") {
      try {
        return (ts as { toDate: () => Date }).toDate().toISOString();
      } catch {
        return new Date().toISOString();
      }
    }
    if ("toMillis" in ts && typeof (ts as { toMillis: () => number }).toMillis === "function") {
      return new Date((ts as { toMillis: () => number }).toMillis()).toISOString();
    }
  }
  return new Date().toISOString();
}

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60 * 1000) return "Just now";
    if (diffMs < 60 * 60 * 1000) {
      const mins = Math.floor(diffMs / (60 * 1000));
      return `${mins}m ago`;
    }
    if (diffMs < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatDateSeparator(dateString: string): string {
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function shouldShowDateSeparator(
  msg: TradeChatMessage,
  prevMsg: TradeChatMessage | null
): boolean {
  if (!prevMsg) return true;
  const msgDate = new Date(msg.createdAt).toDateString();
  const prevDate = new Date(prevMsg.createdAt).toDateString();
  return msgDate !== prevDate;
}

const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "vqwtykcl";

const SENSITIVE_INFO_NOTICE =
  "This message was automatically redacted because it may contain sensitive contact information (email, phone numbers, or social media links). Only the sender can view the original content.";

export default function TradeChat({
  orderId,
  currentUserId,
  currentUserName,
  recipientId,
  orderStatus,
  isBuyer,
  hasCredentials,
  isChatLocked = false,
}: TradeChatProps) {
  const [messages, setMessages] = useState<TradeChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const chatQuery = query(
      collection(db, "chats"),
      where("orderId", "==", orderId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      chatQuery,
       (snapshot) => {
        const docs: TradeChatMessage[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            orderId: String(d.orderId || orderId),
            senderId: String(d.senderId || ""),
            senderName: String(d.senderName || "User"),
            text: String(d.text || ""),
            isSystemMessage: Boolean(d.isSystemMessage),
            isRedacted: Boolean(d.isRedacted),
            imageUrl: d.imageUrl ? String(d.imageUrl) : null,
            buyerId: d.buyerId ? String(d.buyerId) : null,
            sellerId: d.sellerId ? String(d.sellerId) : null,
            createdAt: parseTimestamp(d.createdAt),
          };
        });

        console.log("[TradeChat] onSnapshot received:", docs.length, "messages for orderId:", String(orderId).slice(0, 8));
        setMessages(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Chat listener error:", err);
        setError("Unable to load messages. Please refresh the page.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleImageUploadSuccess = (result: unknown) => {
    const info = (result as { info?: { secure_url?: string } })?.info;
    const secureUrl = info?.secure_url;

    if (secureUrl) {
      setPendingImage(secureUrl);
      setCloudinaryError(null);
    } else {
      setCloudinaryError("Image upload failed. Please try again.");
    }
  };

  const handleImageError = (err: unknown) => {
    console.error("Cloudinary upload error:", err);
    setCloudinaryError("Image upload failed. Please try again.");
  };

  const removePendingImage = () => {
    setPendingImage(null);
  };

  const sendMessage = async () => {
    const hasText = newMessage.trim().length > 0;
    const hasImage = !!pendingImage;

    if (!hasText && !hasImage) return;
    if (!orderId || !currentUserId || sending) return;

    setSending(true);
    setError(null);
    setCloudinaryError(null);

    console.log("[TradeChat] Sending message:", {
      orderId,
      senderId: currentUserId,
      senderName: currentUserName,
      hasText: hasText,
      hasImage: hasImage,
      textPreview: hasText ? newMessage.trim().slice(0, 60) : "(empty)",
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          senderId: currentUserId,
          senderName: currentUserName,
          text: newMessage.trim(),
          imageUrl: pendingImage,
        }),
      });

      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch (parseErr) {
        const rawBody = await res.text();
        console.error("[TradeChat] Failed to parse response JSON:", parseErr, {
          status: res.status,
          statusText: res.statusText,
          rawBody: rawBody.slice(0, 500),
        });
        throw new Error(`Server returned ${res.status} ${res.statusText}: ${rawBody.slice(0, 200)}`);
      }

      console.log("[TradeChat] API response:", {
        success: data.success,
        messageId: data.messageId,
        redacted: data.redacted,
        error: data.error,
        details: data.details,
      });

      if (!res.ok || !data.success) {
        const errorDetail = (data.error as string) || "Failed to send message";
        const detailStr = data.details ? JSON.stringify(data.details) : "";
        throw new Error(`${errorDetail}${detailStr ? " — " + detailStr : ""}`);
      }

      if (data.redacted) {
        setError(SENSITIVE_INFO_NOTICE);
      }

      setNewMessage("");
      setPendingImage(null);
    } catch (err) {
      console.error("[TradeChat] Send message failed:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !sending && currentUserId) {
      const hasText = newMessage.trim().length > 0;
      const hasImage = !!pendingImage;
      if (hasText || hasImage) {
        e.preventDefault();
        sendMessage();
      }
    }
  };

  const isChatDisabled =
    orderStatus === "COMPLETED" ||
    orderStatus === "CANCELLED" ||
    !currentUserId ||
    isChatLocked;

  const hasPendingContent = !!pendingImage || newMessage.trim().length > 0;

  return (
    <div className="flex flex-col h-[560px] w-full bg-[#151922] border border-[#242938] rounded-2xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#242938] bg-[#0B0E14]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/20 flex items-center justify-center text-[#FFB020]">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#EDEFF2] uppercase tracking-wider">
              Trade Chat
            </p>
            <p className="text-[10px] text-[#8A93A3] font-mono">
              Order #{String(orderId).slice(0, 6)} · {isBuyer ? "Buyer" : "Seller"} view
            </p>
          </div>
        </div>
        {isChatLocked && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <Lock size={12} />
            Locked
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
        {isChatLocked && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <Lock size={12} className="shrink-0 mt-0.5" />
            <span>
              This chat has been locked because the dispute has been resolved.
              All sensitive credentials have been archived and purged.
            </span>
          </div>
        )}

        {loading && orderId ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-[#FFB020]" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShieldCheck size={24} className="text-[#8A93A3] mb-2" />
            <p className="text-xs text-[#8A93A3] max-w-xs">
              No messages yet. Keep all communication within this secure vault
              chat. Do not share credentials or contact details outside AssetXtack.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.senderId === currentUserId;
            const isSystem = Boolean(msg.isSystemMessage);
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDate = shouldShowDateSeparator(msg, prevMsg);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[10px] font-mono text-[#8A93A3] bg-[#0B0E14] px-2.5 py-1 rounded-full border border-[#242938]">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 ${
                    isSystem
                      ? "items-center"
                      : isOwnMessage
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  {!isOwnMessage && !isSystem && recipientId === msg.senderId && (
                    <span className="text-[9px] font-mono text-[#8A93A3] uppercase">
                      Counterparty
                    </span>
                  )}

                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                      isSystem
                        ? "bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#EDEFF2] rounded-t-none self-center max-w-[85%]"
                        : isOwnMessage
                        ? "bg-[#FFB020] text-[#0B0E14] rounded-tr-none font-medium"
                        : "bg-[#0B0E14] border border-[#242938] text-[#EDEFF2] rounded-tl-none"
                    }`}
                  >
                    {isSystem && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShieldCheck size={12} className="text-[#FFB020]" />
                        <span className="text-[9px] font-mono uppercase text-[#FFA500]">
                          {msg.senderName || "System Guard"}
                        </span>
                      </div>
                    )}

                    {msg.isRedacted && !isOwnMessage && (
                      <span className="flex items-center gap-1.5 text-[#8A93A3] italic">
                        <ShieldCheck size={12} />
                        {SENSITIVE_INFO_NOTICE}
                      </span>
                    )}

                    {msg.isRedacted && isOwnMessage && !isSystem && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={12} className="text-[#FFA500]" />
                          <span className="text-[9px] font-mono uppercase text-[#FFA500]">
                            Redacted — visible to you only
                          </span>
                        </div>
                        {msg.text && (
                          <div className="whitespace-pre-wrap break-words text-[#EDEFF2]">
                            {msg.text}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.imageUrl && !msg.isRedacted && (
                      <a
                        href={msg.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-lg overflow-hidden border mb-1.5 ${
                          isOwnMessage
                            ? "border-[#0B0E14]/30"
                            : "border-[#242938]"
                        }`}
                      >
                        <div className="relative w-full h-40">
                          <Image
                            src={msg.imageUrl}
                            alt="Attachment"
                            fill
                            sizes="220px"
                            className="object-cover"
                          />
                        </div>
                        <span
                          className={`block text-[10px] underline px-1 py-1 ${
                            isOwnMessage
                              ? "text-[#0B0E14]/70"
                              : "text-[#8A93A3] hover:text-[#EDEFF2]"
                          }`}
                        >
                          View image attachment
                        </span>
                      </a>
                    )}

                    {msg.text && !msg.isRedacted && !isSystem && (
                      <div className="whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                    )}

                    {isSystem && msg.text && (
                      <div className="whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                    )}

                    <div
                      className={`mt-1 text-[9px] ${
                        isSystem
                          ? "text-[#8A93A3]"
                          : isOwnMessage
                          ? "text-[#0B0E14]/60 text-right"
                          : "text-[#8A93A3]/60"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#242938] bg-[#0B0E14]/30">
        {isChatDisabled && (
          <div className="mb-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle size={12} />
            Chat is read-only because this order is {orderStatus.toLowerCase()}.
          </div>
        )}

        {isBuyer && orderStatus === "DISPUTED" && hasCredentials && (
          <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>
              The seller has 24 hours to verify account security. Share the
              current or reverted credentials in this chat to support your claim.
            </span>
          </div>
        )}

        {cloudinaryError && (
          <div className="mb-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle size={12} />
            {cloudinaryError}
          </div>
        )}

        {error && error.includes("redacted") && !sending && (
          <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {error && !error.includes("redacted") && (
          <div className="mb-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {pendingImage && (
          <div className="mb-2 flex items-end gap-2">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#242938]">
              <Image
                src={pendingImage}
                alt="Pending attachment"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={removePendingImage}
              disabled={isChatDisabled || sending}
              className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 disabled:opacity-50 transition-colors"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <CldUploadWidget
            uploadPreset="assetxtack_preset"
            options={{
              cloudName: CLOUDINARY_CLOUD_NAME,
              multiple: false,
              maxFiles: 1,
            }}
            onError={handleImageError as (error: unknown, widget: unknown) => void}
            onSuccess={handleImageUploadSuccess as (result: unknown, widget: unknown) => void}
          >
            {({ open, isLoading }) => (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCloudinaryError(null);
                  open();
                }}
                disabled={isChatDisabled || (isLoading ?? false) || sending || !currentUserId}
                className="p-2.5 rounded-xl bg-[#0B0E14] border border-[#242938] text-[#8A93A3] hover:text-[#FFB020] hover:border-[#FFB020]/40 disabled:opacity-50 transition-colors"
                aria-label="Attach image"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin text-[#FFB020]" />
                ) : (
                  <Paperclip size={16} />
                )}
              </button>
            )}
          </CldUploadWidget>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isChatDisabled ? "Chat is disabled..." : "Type a message..."}
            disabled={isChatDisabled || sending || !currentUserId}
            className="flex-1 bg-[#0B0E14] border border-[#242938] rounded-xl px-4 py-2.5 text-xs text-[#EDEFF2] placeholder-[#8A93A3] focus:outline-none focus:border-[#FFB020]/50 disabled:opacity-50 transition-colors"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={isChatDisabled || sending || !hasPendingContent || !currentUserId}
            className="p-2.5 rounded-xl bg-[#FFB020] text-[#0B0E14] hover:bg-[#e09b1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
