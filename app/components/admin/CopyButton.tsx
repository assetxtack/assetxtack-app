import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

interface CopyButtonProps {
  text: string;
  title?: string;
}

export default function CopyButton({ text, title = "Copy to clipboard" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-[#8A93A3] hover:text-[#EDEFF2] transition"
      title={title}
    >
      {copied ? (
        <CheckCircle2 size={12} className="text-emerald-400" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}
