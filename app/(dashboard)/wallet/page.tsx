"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building2, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Loader2,
  X,
  CreditCard
} from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";

type BankAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
};

type Transaction = {
  id: string;
  type: "ESCROW_LOCK" | "ESCROW_RELEASE" | "WITHDRAWAL_INITIATED" | "WITHDRAWAL_COMPLETED" | "WITHDRAWAL_FAILED" | "LISTING_SALE" | "PLATFORM_FEE" | "REFUND" | "CREDIT";
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt?: any;
  description: string;
  currency?: string;
  metadata?: Record<string, unknown>;
};

type NGNBank = {
  name: string;
  code: string;
};

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Balances
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowVault, setEscrowVault] = useState(0);
  const [lifetimeSales, setLifetimeSales] = useState(0);
  
  // User Bank & Transactions
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Bank Resolution Modal States
  const [bankList, setBankList] = useState<NGNBank[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Load Banks List for Paystack Verification
  useEffect(() => {
    async function fetchBanks() {
      try {
        const res = await fetch("https://api.paystack.co/bank");
        const data = await res.json();
        if (data.status) {
          setBankList(data.data);
        }
      } catch (err) {
        console.error("Failed to load bank list", err);
      }
    }
    fetchBanks();
  }, []);

  // Sync Real-Time Data from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    // 1. Fetch User Balance & Saved Payout Bank
    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setWalletBalance(Number(data?.walletBalance) || 0);
        setLifetimeSales(Number(data?.lifetimeSales) || 0);
        if (data?.bankAccount) {
          setBankAccount(data.bankAccount);
        }
      }
    }, (error) => {
      console.error("Wallet user listener error:", error);
    });

    // 2. Fetch Active Escrow Vault Balance
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", user.uid),
      where("status", "in", ["IN_ESCROW", "DELIVERED"])
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        total += Number(doc.data()?.amount) || 0;
      });
      setEscrowVault(total);
    }, (error) => {
      console.error("Wallet orders listener error:", error);
    });

    // 3. Fetch Unified Transaction History from walletTransactions
    const transactionsQuery = query(
      collection(db, "walletTransactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          type: d.type || "CREDIT",
          amount: Number(d.amount) || 0,
          status: d.status || "pending",
          description: d.description || "",
          createdAt: d.createdAt,
          currency: d.currency,
          metadata: d.metadata,
        };
      }) as Transaction[];
      setTransactions(docs);
    }, (error) => {
      console.error("Wallet transactions listener error:", error);
      if (error.message?.includes("requires an index")) {
        console.warn("Firestore index required for walletTransactions query. Create it here:", error.message);
      }
    });

    setLoading(false);

    return () => {
      unsubscribeUser();
      unsubscribeOrders();
      unsubscribeTransactions();
    };
  }, [user?.uid]);

  // Paystack NUBAN Account Lookup Verification
  const verifyNuban = async () => {
    if (accountNumberInput.length !== 10 || !selectedBankCode) return;
    setVerifyingAccount(true);
    setResolvedAccountName("");
    setVerifyError(null);
    
    try {
      const res = await fetch(
        `/api/wallet/verify-bank?account_number=${encodeURIComponent(accountNumberInput)}&bank_code=${encodeURIComponent(selectedBankCode)}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setResolvedAccountName(data.account_name || "");
      } else {
        setVerifyError(data.error || "Account verification failed. Check account number and selected bank.");
      }
    } catch (err) {
      console.error(err);
      setVerifyError("Unable to verify account details.");
    } finally {
      setVerifyingAccount(false);
    }
  };

  // Save Bank Details to User Profile
  const handleSaveBank = async () => {
    if (!user?.uid || !resolvedAccountName || !selectedBankCode) return;
    setSavingBank(true);
    setVerifyError(null);
    try {
      const selectedBankObj = bankList.find((b) => b.code === selectedBankCode);
      const bankData: BankAccount = {
        accountNumber: accountNumberInput,
        accountName: resolvedAccountName,
        bankName: selectedBankObj?.name || "Bank",
        bankCode: selectedBankCode,
      };

      const res = await fetch("/api/wallet/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, bankAccount: bankData }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to save bank account");
      }

      setBankAccount(bankData);
      setShowBankModal(false);
      setAccountNumberInput("");
      setResolvedAccountName("");
      setSelectedBankCode("");
      setBankSearch("");
      setVerifyError(null);
    } catch (err) {
      console.error("Error saving bank account:", err);
      alert(err instanceof Error ? err.message : "Failed to save bank account.");
    } finally {
      setSavingBank(false);
    }
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "ESCROW_LOCK":
        return { icon: <ArrowDownLeft size={16} />, className: "bg-amber-500/10 border-amber-500/20 text-amber-400" };
      case "ESCROW_RELEASE":
        return { icon: <ArrowUpRight size={16} />, className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
      case "WITHDRAWAL_INITIATED":
        return { icon: <ArrowUpRight size={16} />, className: "bg-rose-500/10 border-rose-500/20 text-rose-400" };
      case "WITHDRAWAL_COMPLETED":
        return { icon: <CheckCircle2 size={16} />, className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
      case "WITHDRAWAL_FAILED":
        return { icon: <AlertCircle size={16} />, className: "bg-rose-500/10 border-rose-500/20 text-rose-400" };
      case "LISTING_SALE":
        return { icon: <ArrowDownLeft size={16} />, className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
      case "PLATFORM_FEE":
        return { icon: <AlertCircle size={16} />, className: "bg-rose-500/10 border-rose-500/20 text-rose-400" };
      case "REFUND":
        return { icon: <ArrowDownLeft size={16} />, className: "bg-blue-500/10 border-blue-500/20 text-blue-400" };
      case "CREDIT":
      default:
        return { icon: <ArrowDownLeft size={16} />, className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
    }
  };

  const getTransactionLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "ESCROW_LOCK":
        return "Escrow Locked";
      case "ESCROW_RELEASE":
        return "Escrow Released";
      case "WITHDRAWAL_INITIATED":
        return "Withdrawal Requested";
      case "WITHDRAWAL_COMPLETED":
        return "Withdrawal Paid";
      case "WITHDRAWAL_FAILED":
        return "Withdrawal Failed";
      case "LISTING_SALE":
        return "Listing Sale";
      case "PLATFORM_FEE":
        return "Platform Fee";
      case "REFUND":
        return "Refund";
      case "CREDIT":
      default:
        return "Credit";
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleWithdraw = async () => {
    if (!user?.uid || !withdrawAmount) return;
    if (!bankAccount) {
      alert("Please link a verified bank account first.");
      setShowBankModal(true);
      return;
    }

    const amount = Number(withdrawAmount);
    if (amount <= 0 || amount > walletBalance) {
      alert("Invalid withdrawal amount or insufficient balance.");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          amount,
          bankAccount,
          reason: "Wallet withdrawal request",
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Withdrawal request failed");
      }

      alert("Withdrawal request submitted! Admin will process payout shortly.");
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert(error instanceof Error ? error.message : "Withdrawal request failed. Try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-[#FFB020]" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151922] p-6 rounded-2xl border border-[#242938]">
          <div>
            <h1 className="text-2xl font-bold text-[#EDEFF2] font-display flex items-center gap-2">
              <Wallet className="text-[#FFB020]" size={24} /> Wallet & Payouts
            </h1>
            <p className="text-xs text-[#8A93A3] mt-1">
              Manage payout accounts, track escrow locks, and request direct bank withdrawals.
            </p>
          </div>
        </div>

        {/* Dynamic 3-Card Balance Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Available Wallet Balance */}
          <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-mono">
                Available Balance
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EDEFF2] font-mono">{formatNaira(walletBalance)}</div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> Ready for payout
              </p>
            </div>
          </div>

          {/* Locked Escrow Vault */}
          <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-mono">
                Escrow Vault
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FFB020]/10 border border-[#FFB020]/20 text-[#FFB020] flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EDEFF2] font-mono">{formatNaira(escrowVault)}</div>
              <p className="text-[11px] text-[#FFB020] mt-1 flex items-center gap-1 font-medium">
                <Clock size={12} /> Pending buyer release
              </p>
            </div>
          </div>

          {/* Lifetime Sales */}
          <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider font-mono">
                Lifetime Sales
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#EDEFF2] font-mono">{formatNaira(lifetimeSales)}</div>
              <p className="text-[11px] text-[#8A93A3] mt-1 font-medium">Total revenue processed</p>
            </div>
          </div>
        </div>

        {/* Actions Grid: Withdraw Form + Linked Bank Account */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Withdraw Form Card */}
          <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-5">
            <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
              <ArrowUpRight size={16} className="text-[#FFB020]" /> Withdraw Funds
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                  Amount (NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#8A93A3]">₦</span>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl pl-8 pr-4 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]/50 font-mono"
                  />
                </div>
                <span className="text-[10px] text-[#8A93A3] mt-1 block font-mono">
                  Available: {formatNaira(walletBalance)}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-[#8A93A3] block mb-1 font-medium">
                  Destination Bank Account
                </label>
                {bankAccount ? (
                  <div className="p-3 bg-[#0B0E14] border border-[#242938] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#151922] rounded-lg text-emerald-400">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#EDEFF2] block">{bankAccount.bankName}</span>
                        <span className="text-[10px] text-[#8A93A3] font-mono">
                          {bankAccount.accountNumber} • {bankAccount.accountName}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold">
                      VERIFIED
                    </span>
                  </div>
                ) : (
                  <div 
                    onClick={() => setShowBankModal(true)}
                    className="p-3 bg-[#0B0E14] border border-dashed border-[#242938] hover:border-[#FFB020]/50 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#151922] rounded-lg text-[#FFB020]">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#EDEFF2] block">No Bank Linked</span>
                        <span className="text-[10px] text-[#8A93A3]">Tap to link your Nigerian bank account</span>
                      </div>
                    </div>
                    <Plus size={14} className="text-[#8A93A3]" />
                  </div>
                )}
              </div>

              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) > walletBalance}
                className="w-full bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? "Processing Request..." : "Request Withdrawal"}
              </button>
            </div>
          </div>

          {/* Bank Account Details Card */}
          <div className="bg-[#151922] border border-[#242938] p-6 rounded-2xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#EDEFF2] flex items-center gap-2">
                  <Building2 size={16} className="text-[#FFB020]" /> Payout Accounts
                </h2>
                <button 
                  onClick={() => setShowBankModal(true)}
                  className="text-xs text-[#FFB020] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus size={14} /> {bankAccount ? "Change Bank" : "Add Bank"}
                </button>
              </div>

              <p className="text-xs text-[#8A93A3]">
                Payouts are transferred directly to verified Nigerian bank accounts via Paystack.
              </p>

              {bankAccount ? (
                <div className="p-4 bg-[#0B0E14] border border-[#242938] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#151922] rounded-lg text-[#FFB020]">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#EDEFF2] block">{bankAccount.bankName}</span>
                      <span className="text-[10px] text-[#8A93A3] font-mono">
                        ****{bankAccount.accountNumber.slice(-4)} • {bankAccount.accountName}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#0B0E14] border border-[#242938] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#151922] rounded-lg text-[#8A93A3]">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#EDEFF2] block">No bank linked</span>
                      <span className="text-[10px] text-[#8A93A3]">Link a bank to receive payouts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-[#0B0E14]/60 border border-[#242938] rounded-xl flex items-center gap-2.5 text-xs text-[#8A93A3]">
              <AlertCircle size={16} className="text-[#FFB020] shrink-0" />
              <span>Withdrawal requests are reviewed by admin prior to payout disbursement.</span>
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-[#151922] border border-[#242938] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#242938] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#EDEFF2]">Transaction & Payout Ledger</h2>
            <span className="text-xs text-[#8A93A3]">Recent activity</span>
          </div>

          <div className="divide-y divide-[#242938]">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8A93A3]">
                No payout transactions recorded yet.
              </div>
            ) : (
              transactions.map((tx) => {
                const iconStyle = getTransactionIcon(tx.type);
                const label = getTransactionLabel(tx.type);
                const isDebit = ["WITHDRAWAL_INITIATED", "WITHDRAWAL_COMPLETED", "PLATFORM_FEE"].includes(tx.type);
                const amountColor = isDebit ? "text-rose-400" : "text-emerald-400";
                const amountPrefix = isDebit ? "-" : "+";

                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#0B0E14]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${iconStyle.className}`}>
                        {iconStyle.icon}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#EDEFF2] block">{label}</span>
                        <span className="text-[10px] text-[#8A93A3] block mt-0.5">{tx.description}</span>
                        <span className="text-[10px] text-[#8A93A3] font-mono">Ref: #{tx.id}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold font-mono block ${amountColor}`}>
                        {amountPrefix}₦{tx.amount.toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        tx.status === "completed" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : tx.status === "pending"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bank Resolution Modal */}
        {showBankModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151922] border border-[#242938] rounded-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-[#242938] pb-3">
                <h3 className="text-sm font-bold text-[#EDEFF2]">Link Nigerian Bank Account</h3>
                <button onClick={() => setShowBankModal(false)} className="text-[#8A93A3] hover:text-[#EDEFF2]">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#8A93A3] block mb-1">Search Bank</label>
                  <input
                    type="text"
                    placeholder="Search banks..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8A93A3] block mb-1">Select Bank</label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => {
                      setSelectedBankCode(e.target.value);
                      setVerifyError(null);
                    }}
                    className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2.5 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020]"
                  >
                    <option value="">-- Choose Bank --</option>
                    {bankList
                      .filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                      .map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8A93A3] block mb-1">10-Digit NUBAN Account Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="0123456789"
                      value={accountNumberInput}
                      onChange={(e) => setAccountNumberInput(e.target.value)}
                      className="w-full bg-[#0B0E14] border border-[#242938] rounded-xl px-3 py-2 text-xs text-[#EDEFF2] focus:outline-none focus:border-[#FFB020] font-mono"
                    />
                    <button
                      onClick={verifyNuban}
                      disabled={accountNumberInput.length !== 10 || !selectedBankCode || verifyingAccount}
                      className="bg-[#242938] hover:bg-[#2e3548] text-[#EDEFF2] px-3 py-2 rounded-xl text-xs font-semibold shrink-0 disabled:opacity-50"
                    >
                      {verifyingAccount ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
                    </button>
                  </div>
                </div>

                {resolvedAccountName && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="text-[10px] text-emerald-400 block font-mono">ACCOUNT NAME FOUND</span>
                    <span className="text-xs font-bold text-[#EDEFF2]">{resolvedAccountName}</span>
                  </div>
                )}

                {verifyError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <span className="text-[10px] text-rose-400 block font-mono">VERIFICATION FAILED</span>
                    <span className="text-xs font-bold text-rose-300">{verifyError}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveBank}
                disabled={!resolvedAccountName || savingBank}
                className="w-full bg-[#FFB020] hover:bg-[#e09b1c] text-[#0B0E14] font-bold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {savingBank ? "Saving..." : "Save Bank Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}