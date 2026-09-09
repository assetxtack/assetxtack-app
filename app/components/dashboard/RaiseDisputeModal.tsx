"use client";

import { useState, useRef } from "react";
import { ShieldAlert, X, AlertTriangle, Paperclip } from "lucide-react";

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details: string, imageUrl?: string) => void;
  isProcessing: boolean;
}

const DISPUTE_REASONS = [
  "Missing Items / Skins",
  "Invalid Credentials",
  "Account Banned / Suspended",
  "Details Not As Described",
  "Other",
];

export default function RaiseDisputeModal({ isOpen, onClose, onConfirm, isProcessing }: RaiseDisputeModalProps) {
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [disputeImageUrl, setDisputeImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const uploadToCloudinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "assetxtack_preset");

      const xhr = new XMLHttpRequest();
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "vqwtykcl";

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } catch {
            reject(new Error("Invalid response from Cloudinary"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/png") && !file.type.startsWith("image/jpeg")) {
      alert("Only PNG and JPG images are allowed.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadToCloudinary(file);
      setDisputeImageUrl(url);
    } catch (error) {
      console.error("Error uploading dispute image:", error);
      alert("Failed to upload image. Please try again.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = () => {
    if (!reason) return;
    if (reason === "Other" && !details.trim()) return;
    onConfirm(reason, details, disputeImageUrl || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" /> Raise Escrow Dispute
          </div>
          <button onClick={onClose} disabled={isProcessing} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Frivolous disputes, false claims, or altering account details prior to returning credentials violate AssetXtack policy and will result in buyer account suspension.</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Dispute Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {reason === "Other" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Custom Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe your dispute..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Screenshot / Evidence (Optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleImageSelect}
            />
            {previewUrl ? (
              <div className="flex items-center gap-3 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                <img src={previewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-800" />
                <div className="flex-1">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">{uploading ? `Uploading... ${uploadProgress}%` : "Uploaded"}</span>
                </div>
                {!uploading && (
                  <button type="button" onClick={() => { setPreviewUrl(null); setDisputeImageUrl(null); }} className="text-zinc-500 hover:text-zinc-300">
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || uploading}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 hover:text-[#FFB020] hover:border-[#FFB020]/40 transition disabled:opacity-50"
              >
                <Paperclip size={14} />
                Attach Screenshot
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || !reason || (reason === "Other" && !details.trim())}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 transition disabled:opacity-50"
            >
              {isProcessing ? "Submitting..." : "Raise Dispute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
