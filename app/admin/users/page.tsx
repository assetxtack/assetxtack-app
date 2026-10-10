"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  Search,
  X,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  BadgeX,
  Eye,
  User,
  Mail,
  Phone,
  Wallet,
  TrendingUp,
  Star,
  MessageCircle,
  CreditCard,
  Building2,
  FileDigit,
  Loader2,
  ArrowLeft,
  Award,
  Ban,
  Shield,
} from "lucide-react";

interface AdminUser {
  uid: string;
  fullName?: string;
  email?: string;
  kycStatus?: "unverified" | "pending" | "VERIFIED" | "rejected";
  sellerVerified?: boolean;
  walletBalance?: number;
  escrowBalance?: number;
  lifetimeSales?: number;
  averageRating?: number;
  totalReviews?: number;
  phoneNumber?: string;
  bankAccount?: { bankName?: string; accountNumber?: string; accountName?: string };
  verificationProvider?: string;
  createdAt?: string | Date;
  status?: "active" | "banned";
  bannedAt?: string | Date | null;
  bannedBy?: string | null;
  banCategory?: string | null;
  banReason?: string | null;
  walletStatus?: { isFrozen?: boolean };
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(timestamp?: string | Date) {
  if (!timestamp) return "N/A";
  const ts = timestamp as { toDate?: () => Date };
  const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(timestamp as string);
  return date.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

function AdminUsersContent() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banActionLoading, setBanActionLoading] = useState(false);
  const [banWarning, setBanWarning] = useState<{
    hasActiveOrders: boolean;
    hasFunds: boolean;
    walletBalance: number;
    activeOrderCount: number;
  } | null>(null);
  const [banCategory, setBanCategory] = useState("");
  const [banReason, setBanReason] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.fullName?.toLowerCase().includes(q) ?? false) ||
        (u.email?.toLowerCase().includes(q) ?? false)
    );
  }, [users, search]);

  const openDrawer = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedUser(null);
  }, []);

  const openBanModal = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setBanModalOpen(true);
    setBanWarning(null);
  }, []);

  const closeBanModal = useCallback(() => {
    setBanModalOpen(false);
    setBanWarning(null);
    setBanCategory("");
    setBanReason("");
  }, []);

  const handleBanClick = useCallback(async (user: AdminUser) => {
    try {
      setBanActionLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "ban", reason: "Violated platform terms", banCategory, banReason }),
      });

      const data = await res.json();

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === user.uid
              ? {
                  ...u,
                  status: "banned",
                  bannedAt: new Date(),
                  bannedBy: currentUser.uid,
                  banCategory,
                  banReason: banReason || "Violated platform terms",
                  walletStatus: { isFrozen: true },
                }
              : u
          )
        );
        if (selectedUser && selectedUser.uid === user.uid) {
          setSelectedUser((prev) =>
            prev
              ? {
                  ...prev,
                  status: "banned",
                  bannedAt: new Date(),
                  bannedBy: currentUser.uid,
                  banCategory,
                  banReason: banReason || "Violated platform terms",
                  walletStatus: { isFrozen: true },
                }
              : prev
          );
        }
        closeBanModal();
      } else if (data.requiresConfirmation) {
        setBanWarning(data.details);
      }
    } catch (err) {
      console.error("Failed to ban user:", err);
    } finally {
      setBanActionLoading(false);
    }
  }, [selectedUser, closeBanModal, banCategory, banReason]);

  const handleForceBan = useCallback(async (user: AdminUser) => {
    try {
      setBanActionLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "ban", reason: "Violated platform terms", banCategory, banReason, force: true }),
      });

      const data = await res.json();

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === user.uid
              ? {
                  ...u,
                  status: "banned",
                  bannedAt: new Date(),
                  bannedBy: currentUser.uid,
                  banCategory,
                  banReason: banReason || "Violated platform terms",
                  walletStatus: { isFrozen: true },
                }
              : u
          )
        );
        if (selectedUser && selectedUser.uid === user.uid) {
          setSelectedUser((prev) =>
            prev
              ? {
                  ...prev,
                  status: "banned",
                  bannedAt: new Date(),
                  bannedBy: currentUser.uid,
                  banCategory,
                  banReason: banReason || "Violated platform terms",
                  walletStatus: { isFrozen: true },
                }
              : prev
          );
        }
        closeBanModal();
      }
    } catch (err) {
      console.error("Failed to force ban user:", err);
    } finally {
      setBanActionLoading(false);
    }
  }, [selectedUser, closeBanModal, banCategory, banReason]);

  const handleUnban = useCallback(async (user: AdminUser) => {
    try {
      setBanActionLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "unban" }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === user.uid
              ? {
                  ...u,
                  status: "active",
                  bannedAt: null,
                  bannedBy: null,
                  banReason: null,
                  banCategory: null,
                  walletStatus: { isFrozen: false },
                }
              : u
          )
        );
        if (selectedUser && selectedUser.uid === user.uid) {
          setSelectedUser((prev) =>
            prev
              ? {
                  ...prev,
                  status: "active",
                  bannedAt: null,
                  bannedBy: null,
                  banReason: null,
                  banCategory: null,
                  walletStatus: { isFrozen: false },
                }
              : prev
          );
        }
      }
    } catch (err) {
      console.error("Failed to unban user:", err);
    } finally {
      setBanActionLoading(false);
    }
  }, [selectedUser]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] font-extrabold text-2xl md:text-3xl text-[#EDEFF2]">
            User Management
          </h1>
          <p className="text-xs md:text-sm text-[#8A93A3] mt-1">
            View and inspect all registered users on the platform.
          </p>
        </div>
        <div className="text-sm text-[#8A93A3] font-medium">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A93A3]" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#151922] border border-[#242938] text-[#EDEFF2] placeholder-[#8A93A3] focus:border-[#FFB020]/40 focus:outline-none focus:ring-1 focus:ring-[#FFB020]/20 transition text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A93A3] hover:text-[#EDEFF2] transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#242938]">
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">User</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Verification</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Financials</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">Activity</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#8A93A3] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242938]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 size={28} className="animate-spin text-[#FFB020] mx-auto" />
                    <p className="text-sm text-[#8A93A3] mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-base font-semibold text-[#8A93A3]">No users found</p>
                    <p className="text-xs text-[#8A93A3] mt-1">
                      {search ? "Try a different search term" : "No users registered yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-[#0B0E14]/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB020]/20 to-[#7C5CFC]/20 flex items-center justify-center text-sm font-bold text-[#FFB020] shrink-0">
                          {(u.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#EDEFF2] truncate">{u.fullName || "Unknown"}</div>
                          <div className="text-xs text-[#8A93A3] truncate">{u.email || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        {u.status === "banned" && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                              <Ban size={12} />
                              Banned
                            </span>
                            {u.banCategory && <span className="text-[11px] text-rose-300/80">{u.banCategory}</span>}
                          </>
                        )}
                        {u.status !== "banned" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                            <ShieldCheck size={12} />
                            Active
                          </span>
                        )}
                        {u.walletStatus?.isFrozen && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
                            <Wallet size={12} />
                            Frozen
                          </span>
                        )}
                        {u.kycStatus ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold w-fit ${
                              u.kycStatus === "VERIFIED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : u.kycStatus === "pending"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : u.kycStatus === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}
                          >
                            {u.kycStatus === "VERIFIED" ? <BadgeCheck size={12} /> : <BadgeX size={12} />}
                            {u.kycStatus}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 w-fit">
                            Unverified
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold w-fit ${
                            u.sellerVerified
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {u.sellerVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          {u.sellerVerified ? "Seller Verified" : "Unverified"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-mono text-[#EDEFF2]">{formatNaira(u.walletBalance || 0)}</div>
                        <div className="text-xs text-[#8A93A3]">
                          Escrow:{" "}
                          <span className="text-[#FFB020] font-mono font-semibold">{formatNaira(u.escrowBalance || 0)}</span>
                        </div>
                        <div className="text-xs text-[#8A93A3]">
                          Lifetime:{" "}
                          <span className="text-emerald-400 font-mono font-semibold">{formatNaira(u.lifetimeSales || 0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Star size={12} className="text-[#FFB020]" fill="#FFB020" />
                          <span className="text-[#EDEFF2] font-semibold">{u.averageRating?.toFixed(1) ?? "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                          <MessageCircle size={12} />
                          <span>{u.totalReviews?.toLocaleString() ?? "0"} reviews</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDrawer(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20 hover:bg-[#7C5CFC]/20 transition"
                      >
                        <Eye size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-md bg-[#151922] border-l border-[#242938] h-full overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-[#242938] bg-[#151922]">
              <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2]">User Details</h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 rounded-lg text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2] transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-[#242938]">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFB020]/20 to-[#7C5CFC]/20 flex items-center justify-center text-xl font-bold text-[#FFB020]">
                  {(selectedUser.fullName || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-base font-bold text-[#EDEFF2]">{selectedUser.fullName || "Unknown"}</div>
                  <div className="text-xs text-[#8A93A3]">{selectedUser.email || "N/A"}</div>
                  <div className="text-xs text-[#8A93A3] font-mono">UID: {selectedUser.uid}</div>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">User Info</h3>
                <div className="bg-[#0B0E14] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-[#7C5CFC] shrink-0" />
                    <div>
                      <div className="text-xs text-[#8A93A3]">Full Name</div>
                      <div className="text-sm font-semibold text-[#EDEFF2]">{selectedUser.fullName || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[#7C5CFC] shrink-0" />
                    <div>
                      <div className="text-xs text-[#8A93A3]">Email</div>
                      <div className="text-sm font-semibold text-[#EDEFF2]">{selectedUser.email || "N/A"}</div>
                    </div>
                  </div>
                  {selectedUser.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Phone</div>
                        <div className="text-sm font-semibold text-[#EDEFF2]">{selectedUser.phoneNumber}</div>
                      </div>
                    </div>
                  )}
                  {selectedUser.createdAt && (
                    <div className="flex items-center gap-3">
                      <Award size={16} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Joined</div>
                        <div className="text-sm font-semibold text-[#EDEFF2]">{formatDate(selectedUser.createdAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">Verification</h3>
                <div className="bg-[#0B0E14] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8A93A3]">KYC Status</span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        selectedUser.kycStatus === "VERIFIED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : selectedUser.kycStatus === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : selectedUser.kycStatus === "rejected"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {selectedUser.kycStatus || "unverified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8A93A3]">Seller Verified</span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        selectedUser.sellerVerified
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {selectedUser.sellerVerified ? "Yes" : "No"}
                    </span>
                  </div>
                  {selectedUser.verificationProvider && (
                    <div className="flex items-center gap-3 pt-2 border-t border-[#242938]">
                      <CreditCard size={16} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Provider</div>
                        <div className="text-sm font-semibold text-[#EDEFF2]">{selectedUser.verificationProvider}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financials */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">Financials</h3>
                <div className="bg-[#0B0E14] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-emerald-400" />
                      <span className="text-sm text-[#8A93A3]">Wallet Balance</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#EDEFF2]">{formatNaira(selectedUser.walletBalance || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-[#FFB020]" />
                      <span className="text-sm text-[#8A93A3]">Escrow Balance</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#EDEFF2]">{formatNaira(selectedUser.escrowBalance || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BadgeCheck size={16} className="text-emerald-400" />
                      <span className="text-sm text-[#8A93A3]">Lifetime Sales</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#EDEFF2]">{formatNaira(selectedUser.lifetimeSales || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Bank Account */}
              {selectedUser.bankAccount && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">Bank Account</h3>
                  <div className="bg-[#0B0E14] rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Bank Name</div>
                        <div className="text-sm font-semibold text-[#EDEFF2]">{selectedUser.bankAccount.bankName || "N/A"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileDigit size={16} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Account Number</div>
                        <div className="text-sm font-semibold text-[#EDEFF2] font-mono">{selectedUser.bankAccount.accountNumber || "N/A"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-[#7C5CFC] shrink-0" />
                      <div>
                        <div className="text-xs text-[#8A93A3]">Account Name</div>
                        <div className="text-sm font-semibold text-[#EDEFF2]">{selectedUser.bankAccount.accountName || "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">Activity</h3>
                <div className="bg-[#0B0E14] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-[#FFB020]" fill="#FFB020" />
                      <span className="text-sm text-[#8A93A3]">Average Rating</span>
                    </div>
                    <span className="text-sm font-bold text-[#EDEFF2]">{selectedUser.averageRating?.toFixed(1) ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} className="text-[#7C5CFC]" />
                      <span className="text-sm text-[#8A93A3]">Total Reviews</span>
                    </div>
                    <span className="text-sm font-bold text-[#EDEFF2]">{selectedUser.totalReviews?.toLocaleString() ?? "0"}</span>
                  </div>
                </div>
              </div>

              {/* Ban Actions */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-[var(--font-mono)]">Account Status</h3>
                <div className="bg-[#0B0E14] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8A93A3]">Current Status</span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        selectedUser.status === "banned"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {selectedUser.status === "banned" ? "Banned" : "Active"}
                    </span>
                  </div>
                  {selectedUser.walletStatus?.isFrozen && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#8A93A3]">Wallet Status</span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Wallet size={12} className="inline mr-1" />
                        Frozen
                      </span>
                    </div>
                  )}
                  {selectedUser.banReason && (
                    <div className="pt-2 border-t border-[#242938]">
                      <span className="text-xs text-[#8A93A3]">Ban Reason</span>
                      <p className="text-sm text-[#EDEFF2] mt-1">{selectedUser.banReason}</p>
                    </div>
                  )}
                  {selectedUser.banCategory && (
                    <div className="pt-2 border-t border-[#242938]">
                      <span className="text-xs text-[#8A93A3]">Ban Category</span>
                      <p className="text-sm text-[#EDEFF2] mt-1">{selectedUser.banCategory}</p>
                    </div>
                  )}
                  <div className="pt-3 flex gap-2">
                    {selectedUser.status === "banned" ? (
                      <button
                        type="button"
                        onClick={() => handleUnban(selectedUser)}
                        disabled={banActionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShieldCheck size={16} />
                        {banActionLoading ? "Processing..." : "Unban / Reinstate User"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openBanModal(selectedUser)}
                        disabled={banActionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Ban size={16} />
                        {banActionLoading ? "Processing..." : "Permanently Ban User"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {banModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeBanModal}
          />
          <div className="relative w-full max-w-lg bg-[#151922] border border-[#242938] rounded-2xl shadow-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#242938]">
              <h2 className="font-[var(--font-display)] font-bold text-lg text-[#EDEFF2] flex items-center gap-2.5">
                <Ban size={18} className="text-rose-400" />
                Confirm User Ban
              </h2>
              <button
                type="button"
                onClick={closeBanModal}
                className="p-2 rounded-lg text-[#8A93A3] hover:bg-[#0B0E14] hover:text-[#EDEFF2] transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {!banWarning ? (
                <>
                  <p className="text-sm text-[#8A93A3]">
                    You are about to permanently ban <span className="text-[#EDEFF2] font-semibold">{selectedUser.fullName || selectedUser.email}</span>. This will:
                  </p>
                  <ul className="space-y-2 text-sm text-[#EDEFF2]">
                    <li className="flex items-start gap-2">
                      <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      Disable their Firebase Auth account immediately
                    </li>
                    <li className="flex items-start gap-2">
                      <Wallet size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      Freeze their wallet balance (withdrawals blocked)
                    </li>
                    <li className="flex items-start gap-2">
                      <Ban size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      Set their account status to "banned"
                    </li>
                  </ul>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">Ban Category <span className="text-rose-400">*</span></label>
                      <select
                        value={banCategory}
                        onChange={(e) => setBanCategory(e.target.value)}
                        required
                        className="w-full rounded-lg bg-[#0B0E14] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                      >
                        <option value="">Select ban category</option>
                        <option value="Fraud / Scam Attempt">Fraud / Scam Attempt</option>
                        <option value="Fake Listing Credentials">Fake Listing Credentials</option>
                        <option value="Terms of Service Violation">Terms of Service Violation</option>
                        <option value="Abusive Dispute Behavior">Abusive Dispute Behavior</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">Additional Notes (optional)</label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        rows={3}
                        placeholder="Additional context for the ban..."
                        className="w-full rounded-lg bg-[#0B0E14] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeBanModal}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#8A93A3] hover:bg-[#0B0E14] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBanClick(selectedUser)}
                      disabled={banActionLoading || !banCategory}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500 text-[#FFFFFF] hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {banActionLoading ? "Banning..." : "Confirm Ban"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={20} className="text-amber-400" />
                      <h3 className="text-sm font-bold text-amber-400">Warning: Active Account Detected</h3>
                    </div>
                    <p className="text-xs text-[#8A93A3]">
                      This user has outstanding platform activity. Banning will freeze all associated funds and escrow.
                    </p>
                    <div className="space-y-2 pt-2">
                      {banWarning.hasActiveOrders && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#8A93A3]">Active Orders</span>
                          <span className="text-[#EDEFF2] font-semibold">{banWarning.activeOrderCount}</span>
                        </div>
                      )}
                      {banWarning.hasFunds && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#8A93A3]">Wallet Balance</span>
                          <span className="text-[#EDEFF2] font-semibold">{formatNaira(banWarning.walletBalance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">Ban Category <span className="text-rose-400">*</span></label>
                      <select
                        value={banCategory}
                        onChange={(e) => setBanCategory(e.target.value)}
                        required
                        className="w-full rounded-lg bg-[#0B0E14] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                      >
                        <option value="">Select ban category</option>
                        <option value="Fraud / Scam Attempt">Fraud / Scam Attempt</option>
                        <option value="Fake Listing Credentials">Fake Listing Credentials</option>
                        <option value="Terms of Service Violation">Terms of Service Violation</option>
                        <option value="Abusive Dispute Behavior">Abusive Dispute Behavior</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8A93A3] mb-1.5">Additional Notes (optional)</label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        rows={3}
                        placeholder="Additional context for the ban..."
                        className="w-full rounded-lg bg-[#0B0E14] px-4 py-3 text-sm text-white border border-slate-800 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeBanModal}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#8A93A3] hover:bg-[#0B0E14] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForceBan(selectedUser)}
                      disabled={banActionLoading || !banCategory}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500 text-[#FFFFFF] hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {banActionLoading ? "Force Banning..." : "Force Ban & Freeze Wallet/Escrow"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return <AdminUsersContent />;
}
