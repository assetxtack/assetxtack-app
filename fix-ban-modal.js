const fs = require('fs');
const filePath = 'app/admin/users/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Get the exact section from the file
const startIdx = content.indexOf('      {/* Ban Confirmation Modal */}');
const endIdx = content.indexOf('    </div>\n  );', startIdx) + 12;
const oldSection = content.substring(startIdx, endIdx);

console.log('Found section length:', oldSection.length);
console.log('First 200 chars:', oldSection.substring(0, 200));

const newSection = `      {/* Ban Confirmation Modal */}
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
}`;

content = content.substring(0, startIdx) + newSection + content.substring(endIdx);
fs.writeFileSync(filePath, content);
console.log('Successfully updated ban modal');