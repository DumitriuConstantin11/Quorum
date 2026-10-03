"use client";

import { useState } from "react";
import { Director } from "./directors";

interface FollowUpMessage {
  question: string;
  answer: string;
}

interface FollowUpSectionProps {
  director: Director;
  scenario: string;
  industry: string;
  previousAnalysis: string;
  previousRecommendation: string;
  messages: FollowUpMessage[];
  onNewMessage: (question: string, answer: string) => void;
}

const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

const ACCENTS = ["#D4AF37", "#4ea8de", "#56c288", "#c084fc", "#fb923c"];

function ThinkingBubbles() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "16px 22px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px 16px 16px 4px",
        alignSelf: "flex-start",
        width: "fit-content",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--gold)",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function AnswerBubble({ answer, role }: { answer: string; role: string }) {
  const processedLines = answer
    .replace(/([.!?])\s+([A-Z][A-Z\s&\/\-]{2,}[A-Z]:)/g, "$1\n\n$2")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Grupam in sectiuni
  const sections: { header?: string; color: string; paragraphs: string[] }[] =
    [];
  let currentSection: { header?: string; color: string; paragraphs: string[] } =
    {
      color: ACCENTS[0],
      paragraphs: [],
    };

  processedLines.forEach((line) => {
    const headerMatch = line.match(/^([A-Z][A-Z\s&\/\-]{2,}[A-Z]):\s*(.+)/);
    if (headerMatch) {
      if (currentSection.paragraphs.length > 0 || currentSection.header) {
        sections.push(currentSection);
      }
      currentSection = {
        header: headerMatch[1],
        color: ACCENTS[sections.length % ACCENTS.length],
        paragraphs: [headerMatch[2]],
      };
    } else {
      currentSection.paragraphs.push(line);
    }
  });
  if (currentSection.paragraphs.length > 0 || currentSection.header) {
    sections.push(currentSection);
  }

  // Daca nu exista headere, splitam paragrafele in carduri vizuale automat
  const hasHeaders = sections.some((s) => s.header);
  const displaySections = hasHeaders
    ? sections
    : processedLines.map((p, i) => ({
        header: undefined,
        color: ACCENTS[i % ACCENTS.length],
        paragraphs: [p],
      }));

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {/* Accent strip */}
      <div
        style={{
          width: 3,
          borderRadius: 4,
          background: "linear-gradient(to bottom, var(--gold), transparent)",
          alignSelf: "stretch",
          flexShrink: 0,
          minHeight: 40,
        }}
      />

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* Role badge */}
        <span
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 10,
            color: "var(--gold)",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {role}
        </span>

        {/* Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {displaySections.map((section, i) => {
            const text = section.paragraphs.join(" ");
            const isShort = text.length < 120;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 0,
                }}
              >
                {/* Colored left bar */}
                <div
                  style={{
                    width: 3,
                    background: `linear-gradient(to bottom, ${section.color}, transparent)`,
                    borderRadius: 4,
                    flexShrink: 0,
                    marginRight: 14,
                  }}
                />

                {/* Number */}
                <div
                  style={{
                    fontFamily: "'Cinzel Decorative', serif",
                    fontSize: 10,
                    color: `${section.color}99`,
                    flexShrink: 0,
                    marginRight: 12,
                    marginTop: 3,
                    minWidth: 20,
                    textAlign: "right",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Content */}
                <div
                  style={{
                    background: `${section.color}0d`,
                    borderRadius: "0 10px 10px 0",
                    padding: isShort ? "10px 14px" : "14px 16px",
                    flex: 1,
                    borderTop: `1px solid ${section.color}33`,
                  }}
                >
                  {section.header && (
                    <span
                      style={{
                        fontFamily: "'Cinzel Decorative', serif",
                        fontSize: 9,
                        color: section.color,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        display: "inline-block",
                        background: `${section.color}22`,
                        border: `1px solid ${section.color}44`,
                        borderRadius: 5,
                        padding: "2px 8px",
                        marginBottom: 8,
                      }}
                    >
                      {section.header}
                    </span>
                  )}
                  {section.paragraphs.map((p, j) => (
                    <p
                      key={j}
                      style={{
                        fontFamily: "'Coolvetica', sans-serif",
                        fontSize: 14,
                        color: "rgba(255,255,255,0.85)",
                        lineHeight: 1.75,
                        margin: 0,
                        marginTop: j > 0 ? 8 : 0,
                      }}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default function FollowUpSection({
  director,
  scenario,
  industry,
  previousAnalysis,
  previousRecommendation,
  messages,
  onNewMessage,
}: FollowUpSectionProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
    const currentQuestion = question.trim();
    setQuestion("");
    setIsLoading(true);

    try {
      const conversationContext = messages
        .map((m) => `User asked: ${m.question}\nYou answered: ${m.answer}`)
        .join("\n\n");

      const userMessage = `
Original scenario (${industry}):
${scenario}

Your previous analysis:
${previousAnalysis}

Your previous recommendation:
${previousRecommendation}

${conversationContext ? `Previous follow-up exchanges:\n${conversationContext}\n\n` : ""}
The board member now asks you directly:
"${currentQuestion}"

Respond in character as the ${director.role}. Be direct, specific, and stay true to your personality and perspective. Reference concrete details from the scenario and your previous analysis where relevant. Do not use markdown formatting. Respond in the same language as the question.
      `.trim();

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
          max_tokens: 350,
          system:
            director.systemPrompt +
            "\n\nIMPORTANT OVERRIDE FOR THIS INTERACTION: You are now in a live board meeting conversation. Someone just asked you a direct question. Respond like a real executive would in a face-to-face discussion — concise, sharp, and to the point. Maximum 3-4 sentences or 2 short paragraphs. No long speeches. No exhaustive analysis. Just your honest, direct reaction as your character. Do NOT return JSON. Do NOT use markdown. Respond in the same language as the question.",
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      const data = await response.json();
      const answer = data.content[0]?.text || "No response received.";
      onNewMessage(currentQuestion, answer);
    } catch (error) {
      console.error("Follow-up error:", error);
      onNewMessage(
        currentQuestion,
        "Error retrieving response. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <span
          style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.2)" }}
        />
        <span
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 12,
            color: "var(--gold)",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Direct Question
        </span>
        <span
          style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.2)" }}
        />
      </div>

      {/* Message history — fara scroll, lungeste pagina */}
      {(messages.length > 0 || isLoading) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            marginBottom: 32,
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Question — aliniat dreapta */}
              <div
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "70%",
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: "16px 16px 4px 16px",
                  padding: "14px 20px",
                  fontFamily: "'Coolvetica', sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.65,
                }}
              >
                {msg.question}
              </div>

              {/* Answer — aliniat stanga cu design editorial */}
              <AnswerBubble answer={msg.answer} role={director.role} />

              {/* Separator intre exchanges */}
              {i < messages.length - 1 && (
                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.06)",
                    margin: "4px 0",
                  }}
                />
              )}
            </div>
          ))}

          {isLoading && <ThinkingBubbles />}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
          placeholder={`Ask the ${director.role} a follow-up question...`}
          rows={2}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 16,
            padding: "14px 18px",
            fontFamily: "'Coolvetica', sans-serif",
            fontSize: 14,
            color: "white",
            outline: "none",
            resize: "none",
            lineHeight: 1.6,
          }}
        />
        <button
          onClick={handleAsk}
          disabled={!question.trim() || isLoading}
          style={{
            background:
              question.trim() && !isLoading
                ? "linear-gradient(90deg, #FFCC00 0%, #D4AF37 50%, #996515 100%)"
                : "rgba(212,175,55,0.2)",
            border: "none",
            borderRadius: 16,
            padding: "14px 28px",
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 12,
            color:
              question.trim() && !isLoading ? "#111" : "rgba(255,255,255,0.3)",
            cursor: question.trim() && !isLoading ? "pointer" : "not-allowed",
            letterSpacing: 1,
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            minWidth: 100,
          }}
        >
          {isLoading ? "..." : "Ask"}
        </button>
      </div>
      <p
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 11,
          color: "rgba(255,255,255,0.3)",
          marginTop: 8,
          textAlign: "right",
        }}
      >
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
