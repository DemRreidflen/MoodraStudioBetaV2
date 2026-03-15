import { useLocation } from "wouter";
import { ArrowLeft, Key, CreditCard, Copy, CheckCircle, ExternalLink, Zap, Shield, Wallet } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/contexts/language-context";
import { LanguagePicker } from "@/components/language-picker";
import { SiteFooter } from "@/components/site-footer";

const STEP_LINKS = [
  "https://platform.openai.com/signup",
  "https://platform.openai.com/settings/billing/overview",
  "https://platform.openai.com/api-keys",
  "/settings",
];

const STEP_ICONS = [Key, CreditCard, Key, CheckCircle];
const FACT_ICONS = [Zap, Shield, Wallet];

function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "rgba(249,109,28,0.07)", border: "1px dashed rgba(249,109,28,0.25)" }}
    >
      <code className="flex-1 text-sm font-mono" style={{ color: "#2d1a0e" }}>{text}</code>
      <button
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="transition-opacity hover:opacity-70"
      >
        {copied
          ? <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />
          : <Copy className="w-4 h-4" style={{ color: "#F96D1C" }} />
        }
      </button>
    </div>
  );
}

export default function ApiKeyGuidePage() {
  const [, navigate] = useLocation();
  const { t } = useLang();
  const ag = t.apiGuide;

  return (
    <div className="min-h-screen" style={{ background: "hsl(30, 58%, 97%)" }}>
      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "#8a7a70" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {ag.backToSettings}
          </button>
          <LanguagePicker size="sm" />
        </div>

        {/* Hero */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: "rgba(249,109,28,0.10)", color: "#F96D1C" }}
          >
            <Key className="w-3 h-3" />
            {ag.badge}
          </div>
          <h1
            className="text-3xl font-bold leading-tight mb-4"
            style={{ color: "#1a0d06", fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {ag.heroTitle1}<br />{ag.heroTitle2}
          </h1>
          <p className="text-base leading-relaxed max-w-lg" style={{ color: "#7a5a44" }}>
            {ag.heroDesc}
          </p>
        </div>

        {/* Analogy */}
        <div
          className="rounded-3xl p-6 mb-10"
          style={{ background: "rgba(249,109,28,0.07)", border: "1px solid rgba(249,109,28,0.12)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#5a3a20" }}>
            <span className="font-semibold">{ag.analogyLabel} </span>
            {ag.analogy}
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-4 mb-12">
          <h2 className="text-lg font-bold" style={{ color: "#1a0d06", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {ag.stepsTitle}
          </h2>

          {ag.steps.map((step: { title: string; body: string; linkLabel: string }, idx: number) => {
            const Icon = STEP_ICONS[idx];
            const link = STEP_LINKS[idx];
            const isInternal = idx === 3;
            const num = String(idx + 1).padStart(2, "0");
            return (
              <div
                key={idx}
                className="rounded-2xl p-5"
                style={{ background: "hsl(30, 65%, 98.5%)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,109,28,0.10)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold" style={{ color: "#F96D1C" }}>{num}</span>
                      <span className="text-sm font-semibold" style={{ color: "#1a0d06" }}>{step.title}</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#7a5a44" }}>{step.body}</p>
                    {isInternal ? (
                      <button
                        onClick={() => navigate(link)}
                        className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                        style={{ color: "#F96D1C" }}
                      >
                        {step.linkLabel}
                      </button>
                    ) : (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                        style={{ color: "#F96D1C" }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {step.linkLabel}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key format hint */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a0d06" }}>
            {ag.keyFormatTitle}
          </h3>
          <CopyBox text="sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz..." />
          <p className="text-xs mt-2" style={{ color: "#a09080" }}>
            {ag.keyFormatHint}
          </p>
        </div>

        {/* Facts */}
        <div className="mb-12">
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1a0d06", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {ag.costsTitle}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {ag.facts.map((fact: { title: string; body: string }, idx: number) => {
              const Icon = FACT_ICONS[idx];
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-2xl p-4"
                  style={{ background: "hsl(30, 65%, 98.5%)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(249,109,28,0.09)" }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: "#F96D1C" }} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: "#1a0d06" }}>{fact.title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: "#7a5a44" }}>{fact.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div
          className="rounded-3xl p-7 text-center"
          style={{
            background: "linear-gradient(145deg, #fff3ea 0%, #fde8d4 100%)",
            border: "1px solid rgba(249,109,28,0.15)",
          }}
        >
          <h3 className="text-base font-bold mb-2" style={{ color: "#1a0d06" }}>
            {ag.ctaTitle}
          </h3>
          <p className="text-sm mb-5" style={{ color: "#7a5a44" }}>
            {ag.ctaDesc}
          </p>
          <button
            onClick={() => navigate("/settings")}
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white inline-flex items-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #F96D1C 0%, #FF9640 100%)" }}
          >
            <Key className="w-4 h-4" />
            {ag.ctaBtn}
          </button>
        </div>

      </div>
      <SiteFooter />
    </div>
  );
}
