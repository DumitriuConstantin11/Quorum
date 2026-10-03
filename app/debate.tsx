"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Director, DirectorResponse } from "./directors";
import FollowUpSection from "./FollowUpSection";
import ReportModal from "./ReportModal";

interface DebateScreenProps {
  directors: Director[];
  responses: Map<number, DirectorResponse>;
  completedDirectors: Set<number>;
  onReset: () => void;
  scenario: string;
  industry: string;
}

const VERDICT_CONFIG = {
  PRO: {
    color: "#16a34a",
    bg: "rgba(22, 163, 74, 0.15)",
    icon: "✓",
    label: "PRO",
  },
  CONTRA: {
    color: "#dc2626",
    bg: "rgba(220, 38, 38, 0.15)",
    icon: "✗",
    label: "AGAINST",
  },
  NEUTRU: {
    color: "#ca8a04",
    bg: "rgba(202, 138, 4, 0.15)",
    icon: "!",
    label: "NEUTRAL",
  },
};

export default function DebateScreen({
  directors,
  responses,
  completedDirectors,
  onReset,
  scenario,
  industry,
}: DebateScreenProps) {
  const [activeDirector, setActiveDirector] = useState<number>(directors[0].id);
  const currentDirector = directors.find((d) => d.id === activeDirector)!;
  const currentResponse = responses.get(activeDirector);
  const verdictConfig = currentResponse
    ? VERDICT_CONFIG[currentResponse.verdict]
    : null;

  const chartData = currentResponse?.chart
    ? currentResponse.chart.labels.map((label, i) => ({
        name: label,
        value: currentResponse.chart!.values[i],
      }))
    : null;
  const [followUpHistory, setFollowUpHistory] = useState<
    Map<number, { question: string; answer: string }[]>
  >(new Map());

  const [secretaryHovered, setSecretaryHovered] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const allCompleted = completedDirectors.size === directors.length;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: 80,
      }}
    >
      {/* Directors Tab Bar */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 32,
          position: "relative",
          zIndex: 10,
        }}
      >
        {directors.map((d) => {
          const response = responses.get(d.id);
          const isCompleted = completedDirectors.has(d.id);
          const isActive = activeDirector === d.id;
          const vc = response ? VERDICT_CONFIG[response.verdict] : null;

          return (
            <div
              key={d.id}
              onClick={() => isCompleted && setActiveDirector(d.id)}
              style={{
                position: "relative",
                cursor: isCompleted ? "pointer" : "wait",
                opacity: isCompleted ? 1 : 0.5,
                transition: "all 0.2s",
                transform: isActive ? "scale(1.08)" : "scale(1)",
              }}
            >
              <img
                src={d.img}
                alt={d.role}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "none",
                  transition: "transform 0.3s ease",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                  display: "block",
                }}
              />
              {/* Verdict indicator */}
              {vc && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: vc.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "white",
                    border: "2px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {vc.icon}
                </div>
              )}
              {/* Loading spinner daca nu e gata */}
              {!isCompleted && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  ⏳
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content Card */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 37,
          boxShadow: "var(--shadow-card)",
          width: 900,
          padding: "48px 56px",
          minHeight: 500,
        }}
      >
        {/* Director Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <img
            src={currentDirector.img}
            alt={currentDirector.role}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontSize: 22,
                color: "white",
                marginBottom: 4,
              }}
            >
              {currentDirector.role}
            </h2>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {currentDirector.description}
            </p>
          </div>
          {/* Verdict Badge */}
          {verdictConfig && (
            <div
              style={{
                background: verdictConfig.bg,
                border: `2px solid ${verdictConfig.color}`,
                borderRadius: 12,
                padding: "10px 24px",
                fontFamily: "'Cinzel Decorative', serif",
                fontSize: 18,
                color: verdictConfig.color,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {verdictConfig.label}
            </div>
          )}
        </div>

        {/* Content */}
        {!currentResponse ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'Cinzel', serif",
            }}
          >
            Awaiting response...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Analysis */}
            {/* <div>
              <h3
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  fontSize: 14,
                  color: "var(--gold)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Analysis
              </h3>
              <p
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {currentResponse.analysis}
              </p>
            </div> */}
            {/* Analysis */}
            {/* <div>
              <h3
                style={{
                  fontFamily: "'Coolvetica', sans-serif",
                  fontSize: 14,
                  color: "var(--gold)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Analysis
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {currentResponse.analysis
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        padding: "16px 20px",
                        fontFamily: "'Coolvetica', sans-serif",
                        fontSize: 15,
                        color: "rgba(255,255,255,0.88)",
                        lineHeight: 1.75,
                        gridColumn:
                          paragraph.length > 400 ? "span 2" : "span 1",
                      }}
                    >
                      {paragraph}
                    </div>
                  ))}
              </div>
            </div> */}
            {/* Analysis */}
            <div>
              <h3
                style={{
                  fontFamily: "' Coolvetica', sans-serif",
                  fontSize: 14,
                  color: "var(--gold)",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
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
                Analysis
                <span
                  style={{
                    display: "inline-block",
                    flex: 1,
                    height: 1,
                    background: "rgba(212,175,55,0.2)",
                  }}
                />
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {currentResponse.analysis
                  .replace(
                    /([.!?])\s+([A-Z][A-Z\s&\/\-]{2,}[A-Z]:)/g,
                    "$1\n\n$2",
                  )
                  .replace(/^([A-Z][A-Z\s&\/\-]{2,}[A-Z]:)/gm, "\n\n$1")
                  .split(/\n+/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((paragraph, i) => {
                    // Detectam daca e o linie scurta (titlu/header informal)
                    const isShort = paragraph.length < 80;
                    // Alternăm accent colors pentru varietate vizuala
                    const accents = [
                      {
                        border: "#D4AF37",
                        num: "rgba(212,175,55,0.9)",
                        bg: "rgba(212,175,55,0.05)",
                      },
                      {
                        border: "#4ea8de",
                        num: "rgba(78,168,222,0.9)",
                        bg: "rgba(78,168,222,0.05)",
                      },
                      {
                        border: "#56c288",
                        num: "rgba(86,194,136,0.9)",
                        bg: "rgba(86,194,136,0.05)",
                      },
                      {
                        border: "#c084fc",
                        num: "rgba(192,132,252,0.9)",
                        bg: "rgba(192,132,252,0.05)",
                      },
                      {
                        border: "#fb923c",
                        num: "rgba(251,146,60,0.9)",
                        bg: "rgba(251,146,60,0.05)",
                      },
                    ];
                    const accent = accents[i % accents.length];

                    // Detectam pattern "SUBTITLU: text"
                    const headerMatch = paragraph.match(
                      /^([A-Z][A-Z\s&\/\-]{2,}[A-Z]):\s*(.+)/,
                    );

                    if (headerMatch) {
                      const [, header, body] = headerMatch;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 0,
                            marginBottom: 2,
                          }}
                        >
                          {/* Left accent bar */}
                          <div
                            style={{
                              width: 3,
                              background: `linear-gradient(to bottom, ${accent.border}, transparent)`,
                              borderRadius: 4,
                              flexShrink: 0,
                              marginRight: 16,
                              minHeight: "100%",
                            }}
                          />
                          {/* Number badge */}
                          <div
                            style={{
                              fontFamily: "'Coolvetica', sans-serif",
                              fontSize: 11,
                              color: accent.num,
                              flexShrink: 0,
                              marginRight: 14,
                              marginTop: 4,
                              minWidth: 20,
                              textAlign: "right",
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          {/* Text cu header evidentiat */}
                          <div
                            style={{
                              background: accent.bg,
                              borderRadius: "0 12px 12px 0",
                              padding: "14px 18px",
                              flex: 1,
                              fontFamily: "'Coolvetica', sans-serif",
                              fontSize: 15,
                              color: "rgba(255,255,255,0.88)",
                              lineHeight: 1.8,
                              marginBottom: 8,
                              borderTop: `1px solid ${accent.border}44`,
                            }}
                          >
                            {/* Header evidentiat */}
                            <span
                              style={{
                                fontFamily: "'Coolvetica', sans-serif",
                                fontSize: 11,
                                color: accent.border,
                                letterSpacing: 2,
                                textTransform: "uppercase",
                                display: "inline-block",
                                background: `${accent.border}22`,
                                border: `1px solid ${accent.border}55`,
                                borderRadius: 6,
                                padding: "2px 10px",
                                marginBottom: 8,
                                marginRight: 8,
                              }}
                            >
                              {header}
                            </span>
                            {/* Body text */}
                            <span>{body}</span>
                          </div>
                        </div>
                      );
                    }

                    if (isShort) {
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "18px 0 8px",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: accent.border,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Coolvetica', sans-serif",
                              fontSize: 16,
                              color: accent.border,
                              letterSpacing: 1,
                              fontWeight: 600,
                            }}
                          >
                            {paragraph}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              height: 1,
                              background: `${accent.border}33`,
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 0,
                          marginBottom: 2,
                        }}
                      >
                        <div
                          style={{
                            width: 3,
                            background: `linear-gradient(to bottom, ${accent.border}, transparent)`,
                            borderRadius: 4,
                            flexShrink: 0,
                            marginRight: 16,
                            minHeight: "100%",
                          }}
                        />
                        <div
                          style={{
                            fontFamily: "'Coolvetica', sans-serif",
                            fontSize: 11,
                            color: accent.num,
                            flexShrink: 0,
                            marginRight: 14,
                            marginTop: 4,
                            minWidth: 20,
                            textAlign: "right",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div
                          style={{
                            background: accent.bg,
                            borderRadius: "0 12px 12px 0",
                            padding: "14px 18px",
                            flex: 1,
                            fontFamily: "'Coolvetica', sans-serif",
                            fontSize: 15,
                            color: "rgba(255,255,255,0.88)",
                            lineHeight: 1.8,
                            marginBottom: 8,
                          }}
                        >
                          {paragraph}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            {/* Chart daca exista */}
            {chartData && currentResponse.chart && (
              <div>
                <h3
                  style={{
                    fontFamily: "'Coolvetica', sans-serif",
                    fontSize: 14,
                    color: "var(--gold)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  {currentResponse.chart.title}
                </h3>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {currentResponse.chart.type === "bar" ? (
                      <BarChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: "rgba(255,255,255,0.7)",
                            fontFamily: "Cinzel",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: "rgba(255,255,255,0.7)",
                            fontFamily: "Cinzel",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0b3237",
                            border: "1px solid var(--gold)",
                            borderRadius: 8,
                            fontFamily: "Cinzel",
                          }}
                          labelStyle={{ color: "var(--gold)" }}
                          itemStyle={{ color: "white" }}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--gold)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    ) : (
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: "rgba(255,255,255,0.7)",
                            fontFamily: "Cinzel",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: "rgba(255,255,255,0.7)",
                            fontFamily: "Cinzel",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0b3237",
                            border: "1px solid var(--gold)",
                            borderRadius: 8,
                            fontFamily: "Cinzel",
                          }}
                          labelStyle={{ color: "var(--gold)" }}
                          itemStyle={{ color: "white" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--gold)"
                          strokeWidth={2}
                          dot={{ fill: "var(--gold)" }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div
              style={{
                background: "rgba(22, 163, 74, 0.2)",
                border: "1px solid rgba(22, 163, 74, 0.6)",
                borderRadius: 16,
                padding: "20px 24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Coolvetica', sans-serif",
                  fontSize: 14,
                  color: "var(--gold)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Recommendation
              </h3>
              <p
                style={{
                  fontFamily: "'Coolvetica', sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.7,
                }}
              >
                {currentResponse.recommendation}
              </p>
            </div>

            {/* Main Risk */}
            <div
              style={{
                background: "rgba(220, 38, 38, 0.22)",
                border: "1px solid rgba(220, 38, 38, 0.7)",
                borderRadius: 16,
                padding: "20px 24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Coolvetica', sans-serif",
                  fontSize: 14,
                  color: "#ef4444",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Main Risk
              </h3>
              <p
                style={{
                  fontFamily: "'Coolvetica', sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.7,
                }}
              >
                {currentResponse.main_risk}
              </p>
            </div>
            {/* Follow-up Question */}
            <FollowUpSection
              director={currentDirector}
              scenario={scenario}
              industry={industry}
              previousAnalysis={currentResponse.analysis}
              previousRecommendation={currentResponse.recommendation}
              messages={followUpHistory.get(currentDirector.id) || []}
              onNewMessage={(q, a) => {
                setFollowUpHistory((prev) => {
                  const next = new Map(prev);
                  const existing = next.get(currentDirector.id) || [];
                  next.set(currentDirector.id, [
                    ...existing,
                    { question: q, answer: a },
                  ]);
                  return next;
                });
              }}
            />
          </div>
        )}
      </div>

      {/* Secretary — fixed right */}
      {/* Secretary — fixed right, same level as summary bar */}
      {/* Secretary — fixed right, same level as summary bar */}
      {allCompleted && (
        <div
          onMouseEnter={() => setSecretaryHovered(true)}
          onMouseLeave={() => setSecretaryHovered(false)}
          onClick={() => {
            if (
              window.confirm(
                "Generate the Final Board Report? This will analyze all director responses and follow-up conversations.",
              )
            ) {
              setShowReport(true);
            }
          }}
          style={{
            position: "fixed",
            bottom: 16,
            right: 48,
            zIndex: 60,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <img
            src="/secretary/secretary.png"
            alt="Secretary"
            style={{
              height: 110,
              width: "auto",
              objectFit: "contain",
              transition: "all 0.3s ease",
              transform: secretaryHovered ? "scale(1.08)" : "scale(1)",
              filter: secretaryHovered
                ? "drop-shadow(0 0 12px rgba(212,175,55,0.5))"
                : "none",
            }}
          />
          <span
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 10,
              color: secretaryHovered ? "var(--gold)" : "rgba(212,175,55,0.6)",
              letterSpacing: 2,
              transition: "color 0.2s",
              textAlign: "center",
            }}
          >
            {secretaryHovered ? "Final Report" : "Secretary"}
          </span>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          directors={directors}
          responses={responses}
          followUpHistory={followUpHistory}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Bottom Summary Bar */}
      {/* Bottom Summary Bar — floating central */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(11, 50, 55, 0.95)",
          borderRadius: 60,
          border: "1px solid rgba(212,175,55,0.35)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {directors.map((d) => {
          const response = responses.get(d.id);
          const vc = response ? VERDICT_CONFIG[response.verdict] : null;
          return (
            <div
              key={d.id}
              onClick={() =>
                completedDirectors.has(d.id) && setActiveDirector(d.id)
              }
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: completedDirectors.has(d.id) ? "pointer" : "default",
                opacity: completedDirectors.has(d.id) ? 1 : 0.4,
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={d.img}
                  alt={d.role}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "none",
                    transform:
                      activeDirector === d.id ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                />
                {vc && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: vc.color,
                      border: "1px solid white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      color: "white",
                      fontWeight: 700,
                    }}
                  >
                    {vc.icon}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 8,
                  color:
                    activeDirector === d.id
                      ? "var(--gold)"
                      : "rgba(255,255,255,0.5)",
                  textAlign: "center",
                  maxWidth: 60,
                  lineHeight: 1.2,
                }}
              >
                {d.role.split(" ").slice(-1)[0]}
              </span>
            </div>
          );
        })}

        {/* Divider */}
        <div
          style={{ width: 1, height: 40, background: "rgba(212,175,55,0.2)" }}
        />

        {/* Reset button */}
        <div
          onClick={onReset}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(212,175,55,0.15)",
              border: "1px solid rgba(212,175,55,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              transition: "all 0.2s",
            }}
          >
            ↺
          </div>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 8,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Reset
          </span>
        </div>
      </div>
    </div>
  );
}
