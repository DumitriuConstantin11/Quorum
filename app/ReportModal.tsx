"use client";

import { useState, useEffect } from "react";
import { Director, DirectorResponse } from "./directors";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { createPortal } from "react-dom";

interface FollowUpMessage {
  question: string;
  answer: string;
}

interface ReportModalProps {
  directors: Director[];
  responses: Map<number, DirectorResponse>;
  followUpHistory: Map<number, FollowUpMessage[]>;
  onClose: () => void;
}

const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface ReportData {
  executive_summary: string;
  swot: SwotData;
  conflicts: {
    role1: string;
    role2: string;
    topic: string;
    description: string;
  }[];
  final_recommendation: string;
  director_scores: {
    role: string;
    financial: number;
    strategic: number;
    human: number;
    risk: number;
    market: number;
  }[];
}

const VERDICT_CONFIG = {
  PRO: {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    border: "rgba(74,222,128,0.45)",
    label: "PRO",
  },
  CONTRA: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.45)",
    label: "AGAINST",
  },
  NEUTRU: {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.45)",
    label: "NEUTRAL",
  },
};

const SWOT_CONFIG = {
  strengths: {
    label: "Strengths",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.07)",
    border: "rgba(74,222,128,0.2)",
    icon: "↑",
  },
  weaknesses: {
    label: "Weaknesses",
    color: "#f87171",
    bg: "rgba(248,113,113,0.07)",
    border: "rgba(248,113,113,0.2)",
    icon: "↓",
  },
  opportunities: {
    label: "Opportunities",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.07)",
    border: "rgba(96,165,250,0.2)",
    icon: "◆",
  },
  threats: {
    label: "Threats",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.07)",
    border: "rgba(251,146,60,0.2)",
    icon: "⚠",
  },
};

const PIE_COLORS = { PRO: "#4ade80", CONTRA: "#f87171", NEUTRU: "#fbbf24" };

const RADAR_COLOR = "#D4AF37";

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 32,
          height: 2,
          background: "var(--gold)",
        }}
      />
      <h3
        style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 13,
          color: "var(--gold)",
          letterSpacing: 3,
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {title}
      </h3>
      <span
        style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.2)" }}
      />
    </div>
  );
}

function SwotItem({
  text,
  color,
  index,
}: {
  text: string;
  color: string;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "8px 10px",
        borderRadius: 8,
        background: hovered ? `${color}15` : "transparent",
        transition: "background 0.2s",
        cursor: "default",
      }}
    >
      <span
        style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 9,
          color: color,
          marginTop: 4,
          flexShrink: 0,
          minWidth: 20,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <p
        style={{
          fontFamily: "'Coolvetica', sans-serif",
          fontSize: 14,
          color: hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.8)",
          lineHeight: 1.65,
          margin: 0,
          transition: "color 0.2s",
        }}
      >
        {text}
      </p>
    </div>
  );
}

const DIMENSION_DESCRIPTIONS: Record<string, string> = {
  Financial:
    "How critically the board evaluated financial viability, cash flow, and ROI implications.",
  Strategic:
    "Level of focus on long-term positioning, competitive advantage, and strategic fit.",
  Human:
    "Attention given to people, culture, talent, and organizational capacity.",
  Risk: "Depth of risk assessment, worst-case scenarios, and mitigation planning.",
  Market:
    "Focus on market dynamics, customer behavior, brand, and growth potential.",
};

export default function ReportModal({
  directors,
  responses,
  followUpHistory,
  onClose,
}: ReportModalProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConflict, setActiveConflict] = useState<number | null>(null);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    const allAnalyses = directors
      .map((d) => {
        const r = responses.get(d.id);
        const followUps = followUpHistory.get(d.id) || [];
        const followUpText =
          followUps.length > 0
            ? `\nFollow-up exchanges:\n${followUps.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`
            : "";
        return `${d.role}:
Verdict: ${r?.verdict}
Analysis: ${r?.analysis}
Recommendation: ${r?.recommendation}
Main Risk: ${r?.main_risk}${followUpText}`;
      })
      .join("\n\n---\n\n");

    const prompt = `You are the Board Secretary. Analyze all 5 board members' inputs and generate a final report as JSON:

${allAnalyses}

Return this exact JSON structure:
{
  "executive_summary": "3-4 sentence synthesis referencing specific perspectives",
  "swot": {
    "strengths": ["point 1", "point 2", "point 3"],
    "weaknesses": ["point 1", "point 2", "point 3"],
    "opportunities": ["point 1", "point 2"],
    "threats": ["point 1", "point 2", "point 3"]
  },
  "conflicts": [
    {
      "role1": "Chief Financial Officer",
      "role2": "Chief Marketing Officer", 
      "topic": "Budget Allocation",
      "description": "Detailed explanation of the disagreement"
    }
  ],
  "director_scores": [
    {
      "role": "Chief Executive Officer",
      "financial": 7,
      "strategic": 9,
      "human": 6,
      "risk": 5,
      "market": 8
    }
  ],
  "final_recommendation": "4-5 sentence actionable recommendation"
}

director_scores: rate each director's concern level (1-10) on each dimension based on their analysis. Higher = more concerned/focused on that dimension.
conflicts: name exact roles, give a short topic label, explain the disagreement.
Respond ONLY with valid JSON. No markdown. Same language as analyses.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const raw = data.content[0]?.text || "";
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      setReport(JSON.parse(cleaned));
    } catch (e) {
      console.error("Report generation error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const verdictCounts = directors.reduce(
    (acc, d) => {
      const v = responses.get(d.id)?.verdict || "NEUTRU";
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const pieData = Object.entries(verdictCounts).map(([verdict, count]) => ({
    name:
      VERDICT_CONFIG[verdict as keyof typeof VERDICT_CONFIG]?.label || verdict,
    value: count,
    color: PIE_COLORS[verdict as keyof typeof PIE_COLORS],
  }));

  // Radar data — average scores across all directors
  const radarData = report?.director_scores?.length
    ? ["financial", "strategic", "human", "risk", "market"].map((dim) => ({
        dimension: dim.charAt(0).toUpperCase() + dim.slice(1),
        value: Math.round(
          report.director_scores.reduce(
            (sum, d) => sum + (d[dim as keyof typeof d] as number),
            0,
          ) / report.director_scores.length,
        ),
      }))
    : [];

  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const buildEmailHTML = () => {
    const verdictsHTML = directors
      .map((d) => {
        const r = responses.get(d.id);
        const verdict = r?.verdict || "NEUTRU";
        const label =
          verdict === "CONTRA"
            ? "AGAINST"
            : verdict === "NEUTRU"
              ? "NEUTRAL"
              : verdict;
        const color =
          verdict === "PRO"
            ? "#4ade80"
            : verdict === "CONTRA"
              ? "#f87171"
              : "#fbbf24";
        return `
        <tr>
          <td style="padding: 10px 16px; font-family: Georgia, serif; font-size: 14px; color: rgba(255,255,255,0.8);">${d.role}</td>
          <td style="padding: 10px 16px; text-align: right;">
            <span style="background: ${color}; color: #0a1a1a; padding: 3px 14px; border-radius: 20px; font-weight: bold; font-size: 12px;">${label}</span>
          </td>
        </tr>
      `;
      })
      .join("");

    const swotHTML = (
      items: string[],
      color: string,
      icon: string,
      label: string,
    ) =>
      `<div style="background: ${color}15; border-top: 3px solid ${color}; border-radius: 0 0 8px 8px; padding: 16px 20px;">
        <div style="font-family: Georgia, serif; font-size: 11px; color: ${color}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">${icon} ${label}</div>
        ${items.map((item) => `<div style="font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.82); line-height: 1.65; margin: 6px 0; padding-left: 12px; border-left: 2px solid ${color}44;">${item}</div>`).join("")}
      </div>`;

    const conflictsHTML = (report?.conflicts || [])
      .map(
        (c) =>
          `<div style="background: rgba(251,146,60,0.08); border-left: 3px solid #fb923c; padding: 14px 18px; margin: 8px 0; border-radius: 0 8px 8px 0;">
        <div style="font-family: Georgia, serif; font-size: 13px; color: #fb923c; margin-bottom: 6px;">⚡ ${c.role1} vs ${c.role2} — ${c.topic}</div>
        <div style="font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.7;">${c.description}</div>
      </div>`,
      )
      .join("");

    const directorsHTML = directors
      .map((d) => {
        const r = responses.get(d.id);
        return `
        <div style="background: rgba(255,255,255,0.04); border-radius: 8px; padding: 16px 20px; margin: 10px 0;">
          <div style="font-family: Georgia, serif; font-size: 13px; color: #D4AF37; letter-spacing: 1px; margin-bottom: 10px;">${d.role}</div>
          <div style="font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 4px;">Recommendation:</div>
          <div style="font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.85); line-height: 1.7; margin-bottom: 12px;">${r?.recommendation || ""}</div>
          <div style="font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 4px;">Main Risk:</div>
          <div style="font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.85); line-height: 1.7;">${r?.main_risk || ""}</div>
        </div>
      `;
      })
      .join("");

    return `<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="background: #0d4a52; color: white; padding: 40px; margin: 0; font-family: Georgia, serif;">
  
    <h1 style="color: #D4AF37; font-size: 26px; border-bottom: 2px solid #D4AF37; padding-bottom: 12px; margin-bottom: 4px;">
      ⚖ QUORUM — Board Secretary Report
    </h1>
    <p style="color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 2px; margin-top: 4px;">
      FINAL SYNTHESIS · QUORUM COMPLETE · ${new Date().toLocaleDateString()}
    </p>
  
    <h2 style="color: #D4AF37; font-size: 15px; letter-spacing: 3px; text-transform: uppercase; margin-top: 36px;">Board Verdict</h2>
    <table style="width: 100%; border-collapse: collapse;">
      ${verdictsHTML}
    </table>
  
    <h2 style="color: #D4AF37; font-size: 15px; letter-spacing: 3px; text-transform: uppercase; margin-top: 36px;">Executive Summary</h2>
    <div style="border-left: 3px solid #D4AF37; padding-left: 20px; font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.88);">
      ${report?.executive_summary || ""}
    </div>
  
    <h2 style="color: #D4AF37; font-size: 15px; letter-spacing: 3px; text-transform: uppercase; margin-top: 36px;">SWOT Analysis</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px;">
      ${swotHTML(report?.swot?.strengths || [], "#4ade80", "↑", "Strengths")}
      ${swotHTML(report?.swot?.weaknesses || [], "#f87171", "↓", "Weaknesses")}
      ${swotHTML(report?.swot?.opportunities || [], "#60a5fa", "◆", "Opportunities")}
      ${swotHTML(report?.swot?.threats || [], "#fb923c", "⚠", "Threats")}
    </div>
  
    <h2 style="color: #D4AF37; font-size: 15px; letter-spacing: 3px; text-transform: uppercase; margin-top: 36px;">Board Conflicts</h2>
    ${conflictsHTML}
  
    <h2 style="color: #D4AF37; font-size: 15px; letter-spacing: 3px; text-transform: uppercase; margin-top: 36px;">Director Recommendations & Risks</h2>
    ${directorsHTML}
  
    <h2 style="color: #D4AF37; font-size: 15px; letter-spacing: 3px; text-transform: uppercase; margin-top: 36px;">Final Recommendation</h2>
    <div style="background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 20px 24px; font-size: 15px; line-height: 1.85; color: rgba(255,255,255,0.92);">
      ${report?.final_recommendation || ""}
    </div>
  
    <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid rgba(212,175,55,0.2); font-size: 11px; color: rgba(255,255,255,0.35); text-align: center;">
      Generated by Quorum · AI Board of Directors
    </div>
  
  </body>
  </html>`;
  };

  const handleSendEmail = async () => {
    console.log("handleSendEmail called", emailAddress);
    if (!emailAddress.trim() || !report) {
      console.log("Guard blocked — email:", emailAddress, "report:", !!report);
      return;
    }
    setEmailSending(true);

    const payload = {
      email: emailAddress.trim(),
      html_content: buildEmailHTML(),
      report: {
        executive_summary: report.executive_summary,
        final_recommendation: report.final_recommendation,
        swot: report.swot,
        conflicts: report.conflicts,
        director_scores: report.director_scores,
      },
      verdicts: directors.map((d) => ({
        role: d.role,
        verdict: responses.get(d.id)?.verdict || "NEUTRU",
        recommendation: responses.get(d.id)?.recommendation || "",
        main_risk: responses.get(d.id)?.main_risk || "",
      })),
      follow_ups: directors
        .map((d) => ({
          role: d.role,
          messages: followUpHistory.get(d.id) || [],
        }))
        .filter((d) => d.messages.length > 0),
      generated_at: new Date().toISOString(),
    };

    try {
      await fetch(
        "https://hook.eu2.make.com/lrt9q2ejr1i1iz774tjayqrtwwpfuldx",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      setEmailSent(true);
    } catch (error) {
      console.error("Email send error:", error);
      alert("Failed to send. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    if (showEmailPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showEmailPopup]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.88)",
          zIndex: 100,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflowY: "auto",
          padding: "40px 20px 120px",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(160deg, #0d4a52 0%, #0a3a40 100%)",
            border: "1px solid rgba(212,175,55,0.35)",
            borderRadius: 24,
            width: "100%",
            maxWidth: 920,
            padding: "48px 56px",
            position: "relative",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 20,
              right: 24,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%",
              width: 36,
              height: 36,
              color: "white",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 48,
            }}
          >
            <img
              src="/secretary/secretary.png"
              alt="Secretary"
              style={{ height: 120, width: "auto", objectFit: "contain" }}
            />
            <div>
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  fontSize: 26,
                  color: "var(--gold)",
                  marginBottom: 6,
                }}
              >
                Board Secretary Report
              </h2>
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: 3,
                }}
              >
                FINAL SYNTHESIS · QUORUM COMPLETE
              </p>
            </div>
          </div>

          {isLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--gold)",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <p
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Preparing the final report...
              </p>
              <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-8px);opacity:1}}`}</style>
            </div>
          ) : (
            report && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 48 }}
              >
                {/* SECTION 1 — Verdict + Pie */}
                <div>
                  <SectionHeader title="Board Verdict" />
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Director cards — compact */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        flex: 1,
                        minWidth: 300,
                      }}
                    >
                      {directors.map((d) => {
                        const r = responses.get(d.id);
                        const vc = r ? VERDICT_CONFIG[r.verdict] : null;
                        return (
                          <div
                            key={d.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              background: vc?.bg,
                              // border: `1px solid ${vc?.border}`,
                              // borderRadius: 12,
                              padding: "10px 16px",
                            }}
                          >
                            <img
                              src={d.img}
                              alt={d.role}
                              style={{
                                width: 70,
                                height: 70,
                                borderRadius: "50%",
                                objectFit: "cover",
                                flexShrink: 0,
                                //   border: `2px solid ${vc?.color}55`,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontFamily: "'Cinzel', serif",
                                  fontSize: 13,
                                  color: "rgba(255,255,255,0.65)",
                                  marginBottom: 2,
                                }}
                              >
                                {d.role}
                              </div>
                            </div>
                            {/* Verdict pill */}
                            <div
                              style={{
                                background: vc?.color,
                                borderRadius: 20,
                                padding: "3px 14px",
                                fontFamily: "'Cinzel Decorative', serif",
                                fontSize: 11,
                                color: "#0a1a1a",
                                fontWeight: 700,
                                letterSpacing: 1,
                                flexShrink: 0,
                              }}
                            >
                              {vc?.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pie */}
                    <div style={{ width: 240, height: 240, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={entry.color}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            wrapperStyle={{ zIndex: 9999 }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const entry = payload[0] as any;
                              const verdict = entry.name as string;
                              const count = entry.value as number;
                              const total = directors.length;
                              const percentage = Math.round(
                                (count / total) * 100,
                              );
                              const color = entry.payload?.color as string;
                              const descriptions: Record<string, string> = {
                                PRO: "Directors in favor of proceeding with the proposal.",
                                AGAINST:
                                  "Directors recommending against the proposal.",
                                NEUTRAL:
                                  "Directors with conditional or mixed positions.",
                              };
                              return (
                                <div
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #0d4a52, #0a3a40)",
                                    border: "1px solid rgba(212,175,55,0.5)",
                                    borderRadius: 12,
                                    padding: "14px 18px",
                                    maxWidth: 200,
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontFamily: "'Cinzel Decorative', serif",
                                      fontSize: 12,
                                      color: color || "var(--gold)",
                                      letterSpacing: 2,
                                      marginBottom: 6,
                                    }}
                                  >
                                    {verdict}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: "'Cinzel Decorative', serif",
                                      fontSize: 20,
                                      color: "white",
                                      marginBottom: 4,
                                    }}
                                  >
                                    {count}
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.4)",
                                      }}
                                    >
                                      {" "}
                                      / {total} directors
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: "'Coolvetica', sans-serif",
                                      fontSize: 13,
                                      color: "rgba(255,255,255,0.5)",
                                      marginBottom: 8,
                                    }}
                                  >
                                    {percentage}% of the board
                                  </div>
                                  <p
                                    style={{
                                      fontFamily: "'Coolvetica', sans-serif",
                                      fontSize: 12,
                                      color: "rgba(255,255,255,0.65)",
                                      lineHeight: 1.6,
                                      margin: 0,
                                    }}
                                  >
                                    {descriptions[verdict] || ""}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Legend
                            formatter={(value) => (
                              <span
                                style={{
                                  fontFamily: "Cinzel",
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.7)",
                                }}
                              >
                                {value}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — Executive Summary */}
                <div>
                  <SectionHeader title="Executive Summary" />
                  <p
                    style={{
                      fontFamily: "'Coolvetica', sans-serif",
                      fontSize: 16,
                      color: "rgba(255,255,255,0.88)",
                      lineHeight: 1.85,
                      borderLeft: "3px solid var(--gold)",
                      paddingLeft: 20,
                      margin: 0,
                    }}
                  >
                    {report.executive_summary}
                  </p>
                </div>

                {/* SECTION 3 — Radar Chart */}
                {radarData.length > 0 && (
                  <div>
                    <SectionHeader title="Board Focus Analysis" />
                    <div
                      style={{
                        display: "flex",
                        gap: 32,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ width: 320, height: 280, flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            data={radarData}
                            style={{ overflow: "visible" }}
                          >
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis
                              dataKey="dimension"
                              tick={{
                                fontFamily: "Cinzel",
                                fontSize: 11,
                                fill: "rgba(255,255,255,0.6)",
                              }}
                            />
                            <Radar
                              name="Board Focus"
                              dataKey="value"
                              stroke={RADAR_COLOR}
                              fill={RADAR_COLOR}
                              fillOpacity={0.25}
                              isAnimationActive={false}
                            />
                            <Tooltip
                              wrapperStyle={{
                                zIndex: 9999,
                                pointerEvents: "none",
                              }}
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const dim = payload[0]?.payload?.dimension;
                                const val = payload[0]?.value;
                                return (
                                  <div
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #0d4a52, #0a3a40)",
                                      border: "1px solid rgba(212,175,55,0.5)",
                                      borderRadius: 12,
                                      padding: "14px 18px",
                                      maxWidth: 220,
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                      pointerEvents: "none",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontFamily:
                                          "'Cinzel Decorative', serif",
                                        fontSize: 12,
                                        color: "var(--gold)",
                                        letterSpacing: 2,
                                        marginBottom: 6,
                                      }}
                                    >
                                      {dim}
                                    </div>
                                    <div
                                      style={{
                                        fontFamily:
                                          "'Cinzel Decorative', serif",
                                        fontSize: 20,
                                        color: "white",
                                        marginBottom: 8,
                                      }}
                                    >
                                      {val}
                                      <span
                                        style={{
                                          fontSize: 11,
                                          color: "rgba(255,255,255,0.4)",
                                        }}
                                      >
                                        /10
                                      </span>
                                    </div>
                                    <p
                                      style={{
                                        fontFamily: "'Coolvetica', sans-serif",
                                        fontSize: 13,
                                        color: "rgba(255,255,255,0.7)",
                                        lineHeight: 1.6,
                                        margin: 0,
                                      }}
                                    >
                                      {DIMENSION_DESCRIPTIONS[dim] || ""}
                                    </p>
                                  </div>
                                );
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {radarData.map((d, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: 12,
                                color: "rgba(255,255,255,0.6)",
                                minWidth: 80,
                              }}
                            >
                              {d.dimension}
                            </span>
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                background: "rgba(255,255,255,0.08)",
                                borderRadius: 3,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${d.value * 10}%`,
                                  height: "100%",
                                  background: `linear-gradient(90deg, ${RADAR_COLOR}, ${RADAR_COLOR}88)`,
                                  borderRadius: 3,
                                  transition: "width 1s ease",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: "'Cinzel Decorative', serif",
                                fontSize: 11,
                                color: RADAR_COLOR,
                                minWidth: 24,
                                textAlign: "right",
                              }}
                            >
                              {d.value}
                            </span>
                          </div>
                        ))}
                        <p
                          style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            marginTop: 8,
                            lineHeight: 1.6,
                          }}
                        >
                          Average concern level per dimension across all board
                          members (1–10)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 4 — SWOT */}
                <div>
                  <SectionHeader title="SWOT Analysis" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    {(Object.keys(SWOT_CONFIG) as (keyof SwotData)[]).map(
                      (key) => {
                        const config = SWOT_CONFIG[key];
                        const items = report.swot[key] || [];
                        return (
                          <div
                            key={key}
                            style={{
                              background: config.bg,
                              border: `1px solid ${config.border}`,
                              borderTop: `3px solid ${config.color}`,
                              borderRadius: "0 0 16px 16px",
                              padding: "18px 20px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 14,
                              }}
                            >
                              <span
                                style={{ fontSize: 16, color: config.color }}
                              >
                                {config.icon}
                              </span>
                              <h4
                                style={{
                                  fontFamily: "'Cinzel Decorative', serif",
                                  fontSize: 11,
                                  color: config.color,
                                  letterSpacing: 2,
                                  margin: 0,
                                }}
                              >
                                {config.label}
                              </h4>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                              }}
                            >
                              {items.map((item, i) => (
                                <SwotItem
                                  key={i}
                                  text={item}
                                  color={config.color}
                                  index={i}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* SECTION 5 — Conflicts interactive */}
                {report.conflicts?.length > 0 && (
                  <div>
                    <SectionHeader title="Board Conflicts" />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {report.conflicts.map((conflict, i) => (
                        <div
                          key={i}
                          onClick={() =>
                            setActiveConflict(activeConflict === i ? null : i)
                          }
                          style={{
                            cursor: "pointer",
                            border: "1px solid rgba(251,146,60,0.3)",
                            borderLeft: "3px solid #fb923c",
                            borderRadius: "0 12px 12px 0",
                            overflow: "hidden",
                            transition: "all 0.2s",
                          }}
                        >
                          {/* Conflict header — always visible */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                              padding: "16px 20px",
                              background:
                                activeConflict === i
                                  ? "rgba(251,146,60,0.1)"
                                  : "rgba(251,146,60,0.04)",
                              transition: "background 0.2s",
                            }}
                          >
                            <span style={{ fontSize: 16, flexShrink: 0 }}>
                              ⚡
                            </span>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  marginBottom: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    fontSize: 13,
                                    color: "#f87171",
                                    letterSpacing: 1,
                                  }}
                                >
                                  {conflict.role1}
                                </span>
                                <span
                                  style={{
                                    color: "rgba(255,255,255,0.3)",
                                    fontSize: 14,
                                  }}
                                >
                                  vs
                                </span>
                                <span
                                  style={{
                                    fontFamily: "'Cinzel Decorative', serif",
                                    fontSize: 13,
                                    color: "#60a5fa",
                                    letterSpacing: 1,
                                  }}
                                >
                                  {conflict.role2}
                                </span>
                              </div>
                              <span
                                style={{
                                  background: "rgba(251,146,60,0.15)",
                                  border: "1px solid rgba(251,146,60,0.35)",
                                  borderRadius: 20,
                                  padding: "4px 14px",
                                  fontFamily: "'Cinzel Decorative', serif",
                                  fontSize: 10,
                                  color: "#fb923c",
                                  letterSpacing: 1,
                                  display: "inline-block",
                                }}
                              >
                                {conflict.topic}
                              </span>
                            </div>
                            <span
                              style={{
                                color: "rgba(255,255,255,0.4)",
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              {activeConflict === i ? "▲" : "▼"}
                            </span>
                          </div>

                          {/* Expandable description */}
                          {activeConflict === i && (
                            <div
                              style={{
                                padding: "14px 18px 16px 46px",
                                background: "rgba(251,146,60,0.06)",
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: "'Coolvetica', sans-serif",
                                  fontSize: 14,
                                  color: "rgba(255,255,255,0.82)",
                                  lineHeight: 1.7,
                                  margin: 0,
                                }}
                              >
                                {conflict.description}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 6 — Final Recommendation */}
                <div>
                  <SectionHeader title="Final Recommendation" />
                  <div
                    style={{
                      background: "rgba(212,175,55,0.07)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      borderRadius: 16,
                      padding: "24px 28px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Coolvetica', sans-serif",
                        fontSize: 16,
                        color: "rgba(255,255,255,0.92)",
                        lineHeight: 1.85,
                        margin: 0,
                      }}
                    >
                      {report.final_recommendation}
                    </p>
                  </div>
                </div>

                {/* Send Email */}
                {/* Send Email Button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 8,
                  }}
                >
                  <button
                    onClick={() => setShowEmailPopup(true)}
                    style={{
                      background:
                        "linear-gradient(90deg, #FFCC00 0%, #D4AF37 50%, #996515 100%)",
                      border: "none",
                      borderRadius: 37,
                      padding: "18px 48px",
                      fontFamily: "'Cinzel Decorative', serif",
                      fontSize: 14,
                      color: "#111",
                      cursor: "pointer",
                      letterSpacing: 2,
                      boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
                      width: "100%",
                      maxWidth: 500,
                    }}
                  >
                    Send Full Report on Email
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
      {showEmailPopup &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(160deg, #0d4a52, #0a3a40)",
                border: "1px solid rgba(212,175,55,0.4)",
                borderRadius: 20,
                padding: "40px 48px",
                width: "100%",
                maxWidth: 460,
                position: "relative",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              }}
            >
              <button
                onClick={() => {
                  setShowEmailPopup(false);
                  setEmailSent(false);
                  setEmailAddress("");
                }}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 20,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: "white",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>

              {emailSent ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
                  <h3
                    style={{
                      fontFamily: "'Cinzel Decorative', serif",
                      fontSize: 18,
                      color: "var(--gold)",
                      marginBottom: 12,
                    }}
                  >
                    Report Sent
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Coolvetica', sans-serif",
                      fontSize: 15,
                      color: "rgba(255,255,255,0.7)",
                      lineHeight: 1.6,
                    }}
                  >
                    The full Quorum report has been sent to
                    <br />
                    <span style={{ color: "var(--gold)" }}>{emailAddress}</span>
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 28 }}>
                    <img
                      src="/secretary/secretary.png"
                      alt="Secretary"
                      style={{
                        height: 60,
                        width: "auto",
                        objectFit: "contain",
                        marginBottom: 16,
                      }}
                    />
                    <h3
                      style={{
                        fontFamily: "'Cinzel Decorative', serif",
                        fontSize: 18,
                        color: "var(--gold)",
                        marginBottom: 8,
                      }}
                    >
                      Send Full Report
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Coolvetica', sans-serif",
                        fontSize: 14,
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.6,
                      }}
                    >
                      The complete board analysis including SWOT, conflicts,
                      director verdicts, and recommendations will be sent as a
                      PDF to your email.
                    </p>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        fontFamily: "'Cinzel Decorative', serif",
                        fontSize: 11,
                        color: "var(--gold)",
                        letterSpacing: 2,
                        display: "block",
                        marginBottom: 10,
                      }}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(212,175,55,0.3)",
                        borderRadius: 12,
                        padding: "14px 18px",
                        fontFamily: "'Coolvetica', sans-serif",
                        fontSize: 15,
                        color: "white",
                        outline: "none",
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSendEmail}
                    disabled={!emailAddress.trim() || emailSending}
                    style={{
                      background:
                        emailAddress.trim() && !emailSending
                          ? "linear-gradient(90deg, #FFCC00 0%, #D4AF37 50%, #996515 100%)"
                          : "rgba(212,175,55,0.2)",
                      border: "none",
                      borderRadius: 37,
                      padding: "14px 32px",
                      fontFamily: "'Cinzel Decorative', serif",
                      fontSize: 13,
                      color:
                        emailAddress.trim() && !emailSending
                          ? "#111"
                          : "rgba(255,255,255,0.3)",
                      cursor:
                        emailAddress.trim() && !emailSending
                          ? "pointer"
                          : "not-allowed",
                      letterSpacing: 1,
                      width: "100%",
                      transition: "all 0.2s",
                    }}
                  >
                    {emailSending ? "Sending..." : "Send Report"}
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
