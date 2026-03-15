import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, X, ArrowRight, Loader2 } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { MKey } from "@/components/icons";

interface ApiKeyModalProps {
  onClose: () => void;
}

export function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();
  const { t } = useLang();
  const m = t.apiModal;

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/me/api-key", { apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: m.save });
      onClose();
    },
    onError: (e: any) => {
      const msg = e?.message || "Error";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!apiKey.trim().startsWith("sk-")) {
      toast({ title: "Key must start with sk-", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 relative"
        style={{
          background: "hsl(30, 58%, 97%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
        }}
      >
        <button
          onClick={onClose}
          data-testid="button-skip-api-key"
          className="absolute top-5 right-5 w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ background: "rgba(0,0,0,0.07)" }}
        >
          <X className="w-3.5 h-3.5" style={{ color: "#5a4a40" }} />
        </button>

        {/* Icon with subtle glow */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "rgba(249,109,28,0.12)" }}
        >
          <MKey size={20} style={{ color: "#F96D1C" }} />
        </div>

        {/* Title — casual, honest tone */}
        <h2
          className="text-xl font-bold mb-3"
          style={{ color: "#1a1a1a", fontFamily: "system-ui, -apple-system, sans-serif" }}
          data-testid="text-api-modal-title"
        >
          {m.title}
        </h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#8a7a70" }}>
          {m.desc}
        </p>

        {/* Input */}
        <div className="flex flex-col gap-3 mb-5">
          <input
            data-testid="input-openai-api-key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder={m.placeholder}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(249,109,28,0.07)",
              border: "1.5px solid rgba(249,109,28,0.15)",
              color: "#1a1a1a",
              fontFamily: "monospace",
            }}
            onFocus={e => (e.target.style.borderColor = "rgba(249,109,28,0.5)")}
            onBlur={e => (e.target.style.borderColor = "rgba(249,109,28,0.15)")}
          />

          <button
            data-testid="button-save-api-key"
            onClick={handleSave}
            disabled={saveMutation.isPending || !apiKey.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
            style={{
              background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)",
            }}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {m.save}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "#F96D1C" }}
            data-testid="link-get-api-key"
          >
            <ExternalLink className="w-3 h-3" />
            {m.getKey}
          </a>
          <a
            href="/api-key-guide"
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "#b0a090" }}
            data-testid="link-api-key-guide"
          >
            <ExternalLink className="w-3 h-3" />
            {m.guide}
          </a>
        </div>

        <p className="text-xs mt-4 leading-relaxed" style={{ color: "#b0a090" }}>
          {m.safeNote}
        </p>
      </div>
    </div>
  );
}
