"use client";

import { useState, useEffect } from "react";
import { Send, ShieldAlert, Lock } from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  isSystemMessage: boolean;
  isRedacted?: boolean;
  createdAt: unknown;
}

interface TradeChatProps {
  orderId: string;
  currentUserId: string;
  currentUserName: string;
  recipientId: string;
  orderStatus: string;
}

export default function TradeChat({
  orderId,
  currentUserId,
  currentUserName,
  recipientId,
  orderStatus,
}: TradeChatProps) {
  // recipientId and orderStatus are part of the public props interface
  void recipientId;
  void orderStatus;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Firestore Real-Time Subscription Listener
  useEffect(() => {
    if (!orderId) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("orderId", "==", orderId),
      orderBy("createdAt", "asc")
    );

    // Listen for real-time changes instantly without HTTP polling
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const loadedMessages: Message[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Message, "id">),
        }));
        setMessages(loadedMessages);
      },
      (error) => {
        console.error("Firestore Chat Listener Error:", error);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  // Sentinel Regex Filter
  const sanitizeMessage = (text: string) => {
    const phoneRegex =
      /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b(070|080|081|090|091)\d{8}\b/g;

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const socialRegex =
      /\b(whatsapp|telegram|instagram|ig|discord|facebook|twitter|x|tiktok|skype|line|wechat|snapchat|call|text|phone|number|email|dm me|whatsapp me|reach me on|message me on|hit me up|contact me)\b/gi;

    const hasPhone = phoneRegex.test(text);
    const hasEmail = emailRegex.test(text);
    const hasSocial = socialRegex.test(text);

    if (hasPhone || hasEmail || hasSocial) {
      return {
        flagged: true,
        redactedText:
          "[REDACTED BY SENTINEL ESCROW SECURITY - OFF-SITE CONTACT PROHIBITED]",
      };
    }

    return { flagged: false, redactedText: text };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !orderId) return;

    const textToSend = newMessage;
    setNewMessage("");

    const { flagged, redactedText } = sanitizeMessage(textToSend);

    if (flagged) {
      setWarningMessage(
        "Sentinel Escrow Guard: Sharing phone numbers, emails, or off-site messaging links is strictly prohibited to prevent fraud."
      );
      setTimeout(() => setWarningMessage(null), 6000);
    }

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          senderId: currentUserId,
          senderName: currentUserName,
          text: redactedText,
          isSystemMessage: false,
          isRedacted: flagged,
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Escrow Trade Log & Chat
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
          ORDER: #{orderId}
        </span>
      </div>

      {/* Warning Banner */}
      {warningMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 p-3 flex items-start gap-2.5 text-xs text-rose-300 transition-all">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {/* Default Escrow System Message */}
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400">
            <Lock className="w-3.5 h-3.5" /> Logical Escrow Active
          </div>
          <p className="text-[11px] text-zinc-400">
            Funds are locked safely inside AssetXtack Vault. Do not release funds
            until you inspect and verify the account credentials.
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;

          if (msg.isSystemMessage) {
            return (
              <div
                key={msg.id}
                className="my-3 flex items-center justify-center w-full"
              >
                <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium text-center shadow-sm backdrop-blur-sm max-w-[90%]">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isMe ? "items-end" : "items-start"
              }`}
            >
              <span className="text-[10px] text-zinc-500 mb-1 px-1">
                {isMe ? "You" : msg.senderName}
              </span>

              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.isRedacted
                    ? "bg-rose-950/40 border border-rose-800/50 text-rose-300 italic"
                    : isMe
                    ? "bg-amber-500 text-zinc-950 font-medium rounded-tr-none"
                    : "bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message or exchange details safely..."
          className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="p-3 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}