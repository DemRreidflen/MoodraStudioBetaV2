import { createContext, useContext, useState } from "react";
import { AiErrorModal, type AiErrorType, type FeatureCtx } from "@/components/ai-error-modal";
import { useLang } from "@/contexts/language-context";

interface AiErrorContextValue {
  showAiError: (type: AiErrorType, featureCtx?: FeatureCtx) => void;
  handleAiError: (e: any, featureCtx?: FeatureCtx) => boolean;
}

const AiErrorContext = createContext<AiErrorContextValue>({
  showAiError: () => {},
  handleAiError: () => false,
});

export function useAiError() {
  return useContext(AiErrorContext);
}

function extractAiErrorType(e: any): AiErrorType | null {
  const message = typeof e === "string" ? e : (e?.message || "");
  let code = e?.code || "";
  let errorText = message;

  const jsonMatch = message.match(/^\d+: (\{.+\})$/s);
  if (jsonMatch) {
    try {
      const body = JSON.parse(jsonMatch[1]);
      code = body.code || code;
      errorText = body.error || message;
    } catch {}
  }

  if (!code) {
    const codeMatch = message.match(/"code"\s*:\s*"([^"]+)"/);
    if (codeMatch) code = codeMatch[1];
  }

  if (code === "no_api_key" || errorText.includes("не настроен") || errorText.includes("no_api_key")) return "no_key";
  if (code === "invalid_key" || e?.status === 401 || errorText.includes("Неверный") || errorText.includes("invalid")) return "invalid_key";
  if (code === "quota_exceeded" || errorText.includes("исчерпан") || errorText.includes("quota")) return "quota";
  if (message.startsWith("402:")) return "no_key";
  return null;
}

interface ErrorState {
  type: AiErrorType;
  featureCtx: FeatureCtx;
}

export function AiErrorProvider({ children }: { children: React.ReactNode }) {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const { lang } = useLang();

  const showAiError = (type: AiErrorType, featureCtx: FeatureCtx = "general") => {
    setErrorState({ type, featureCtx });
  };

  const handleAiError = (e: any, featureCtx: FeatureCtx = "general"): boolean => {
    const type = extractAiErrorType(e);
    if (type) {
      setErrorState({ type, featureCtx });
      return true;
    }
    return false;
  };

  return (
    <AiErrorContext.Provider value={{ showAiError, handleAiError }}>
      {children}
      {errorState && (
        <AiErrorModal
          type={errorState.type}
          lang={lang}
          featureCtx={errorState.featureCtx}
          onClose={() => setErrorState(null)}
        />
      )}
    </AiErrorContext.Provider>
  );
}
