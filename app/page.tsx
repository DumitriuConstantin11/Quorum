"use client";
import { DIRECTORS } from "./directors";
import { callAllDirectors, extractPdfText } from "./api-client";
import type { DirectorResponse } from "./directors";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import DebateScreen from "./debate";
// const DIRECTORS = [
//   {
//     id: 1,
//     role: "Chief Executive Officer",
//     description:
//       "Drives overall strategy and long-term vision. Balances risk and opportunity at the highest level.",
//     img: "https://www.figma.com/api/mcp/asset/93f137be-1831-49c7-acea-6b451aede478",
//   },
//   {
//     id: 2,
//     role: "Chief Financial Officer",
//     description:
//       "Guards financial health. Scrutinizes costs, margins, and ROI before any major commitment.",
//     img: "https://www.figma.com/api/mcp/asset/5d7d4745-3172-4750-ab81-fe9b1d154647",
//   },
//   {
//     id: 3,
//     role: "Human Resources Director",
//     description:
//       "Champions people, culture, and organizational capability. Assesses human impact of every decision.",
//     img: "https://www.figma.com/api/mcp/asset/c085b549-9f0e-47ea-bc8f-135cb81e5416",
//   },
//   {
//     id: 4,
//     role: "Chief Marketing Officer",
//     description:
//       "Focuses on growth, brand, and market positioning. Pushes for bold moves that expand reach.",
//     img: "https://www.figma.com/api/mcp/asset/275820f9-a52c-4b1f-b3ae-4fa0bf5a0c01",
//   },
//   {
//     id: 5,
//     role: "Risk Manager",
//     description:
//       "Identifies threats and worst-case scenarios. Ensures no decision is made without a contingency plan.",
//     img: "https://www.figma.com/api/mcp/asset/977054e0-9225-4232-ad43-4b71fc684d72",
//   },
// ];

// const LOGO =
//   "https://www.figma.com/api/mcp/asset/e588b98a-3bc1-4433-9d4d-77f9d0619e89";
// const LOADING_IMG =
//   "https://www.figma.com/api/mcp/asset/37144a22-4569-45f4-aeae-f35089e9acd0";

type Screen = "landing" | "loading" | "debate";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [industry, setIndustry] = useState("");
  const [scenario, setScenario] = useState("");
  const [fileName, setFileName] = useState("");
  const [hoveredDirector, setHoveredDirector] = useState<number | null>(null);
  const [loadingImgIndex, setLoadingImgIndex] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [responses, setResponses] = useState<Map<number, DirectorResponse>>(
    new Map(),
  );
  const [completedDirectors, setCompletedDirectors] = useState<Set<number>>(
    new Set(),
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const LOADING_IMAGES = [
    "/loading/board1.png",
    "/loading/board2.png",
    "/loading/board3.png",
  ];

  useEffect(() => {
    if (screen !== "loading") return;
    const interval = setInterval(() => {
      setLoadingImgIndex((prev) => (prev + 1) % LOADING_IMAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [screen]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setPdfFile(file);
    }
  };

  const handleSummon = async () => {
    if (!scenario.trim()) return;
    setScreen("loading");
    setResponses(new Map());
    setCompletedDirectors(new Set());

    try {
      let pdfText: string | undefined;
      if (pdfFile) {
        pdfText = await extractPdfText(pdfFile);
      }

      await callAllDirectors(
        DIRECTORS,
        scenario,
        industry,
        pdfText,
        (directorId, response) => {
          setResponses((prev) => new Map(prev).set(directorId, response));
          setCompletedDirectors((prev) => new Set(prev).add(directorId));
        },
      );

      setScreen("debate");
    } catch (error) {
      console.error("Error summoning quorum:", error);
      setScreen("landing");
      alert("Error summoning the quorum. Please try again.");
    }
  };

  if (screen === "loading") {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 37,
            boxShadow: "18px 17px 4px 0px #1e1e1e",
            width: 663,
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <p
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 20,
              color: "white",
              textAlign: "center",
            }}
          >
            the quorum is thinking
          </p>
          <p
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
            }}
          >
            please wait....
          </p>
          <div
            style={{
              position: "relative",
              width: 320,
              height: 320,
              marginTop: 16,
            }}
          >
            {LOADING_IMAGES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Quorum thinking"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 16,
                  opacity: i === loadingImgIndex ? 1 : 0,
                  transition: "opacity 0.8s ease-in-out",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (screen === "debate") {
    return (
      <DebateScreen
        directors={DIRECTORS}
        responses={responses}
        completedDirectors={completedDirectors}
        onReset={() => {
          setScreen("landing");
          setResponses(new Map());
          setCompletedDirectors(new Set());
          setScenario("");
          setIndustry("");
          setFileName("");
          setPdfFile(null);
        }}
        scenario={scenario}
        industry={industry}
      />
    );
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#10444a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: 60,
      }}
    >
      {/* Directors Row */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 40,
          position: "relative",
          zIndex: 10,
        }}
      >
        {DIRECTORS.map((d) => (
          <div
            key={d.id}
            style={{ position: "relative", cursor: "pointer" }}
            onMouseEnter={() => setHoveredDirector(d.id)}
            onMouseLeave={() => setHoveredDirector(null)}
          >
            <img
              src={d.img}
              alt={d.role}
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                objectFit: "cover",
                border: "none",
                transition: "transform 0.2s",
                transform:
                  hoveredDirector === d.id ? "scale(1.08)" : "scale(1)",
                display: "block",
              }}
            />
            {/* Hover tooltip */}
            {hoveredDirector === d.id && (
              <div
                style={{
                  position: "absolute",
                  bottom: -90,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(11, 50, 55, 0.97)",
                  color: "white",
                  borderRadius: 12,
                  padding: "10px 16px",
                  width: 220,
                  fontFamily: "'Cinzel', serif",
                  fontSize: 12,
                  textAlign: "center",
                  zIndex: 100,
                  border: "1px solid var(--gold)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--gold)",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {d.role}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 11,
                    maxWidth: 200,
                    whiteSpace: "normal",
                    lineHeight: 1.4,
                  }}
                >
                  {d.description}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 37,
          boxShadow: "18px 17px 4px 0px var(--shadow)",
          width: 774,
          padding: "40px 40px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Industry + Upload Row */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontSize: 16,
                color: "white",
                display: "block",
                marginBottom: 8,
              }}
            >
              Industry
            </label>
            <input
              type="text"
              placeholder="e.g Finance, Healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-input)",
                border: "3px solid var(--border-glow)",
                borderRadius: 37,
                padding: "14px 20px",
                fontFamily: "'Cinzel', serif",
                fontSize: 14,
                color: "rgba(0,0,0,0.6)",
                outline: "none",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontSize: 16,
                color: "white",
                display: "block",
                marginBottom: 8,
              }}
            >
              Upload PDF
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%",
                background: "var(--bg-input)",
                border: "3px solid var(--border-glow)",
                borderRadius: 37,
                padding: "14px 20px",
                fontFamily: "'Cinzel', serif",
                fontSize: 14,
                color: "rgba(0,0,0,0.6)",
                cursor: "pointer",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fileName || "Select File"}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Scenario Textarea */}
        <div>
          <label
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 20,
              color: "white",
              display: "block",
              marginBottom: 12,
            }}
          >
            Enter your Scenario
          </label>
          <textarea
            placeholder="Describe the situation and the decision you face..."
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={10}
            style={{
              width: "100%",
              background: "var(--bg-input)",
              border: "3px solid var(--border-glow)",
              borderRadius: 37,
              padding: "20px 24px",
              fontFamily: "'Cinzel', serif",
              fontSize: 15,
              color: "rgba(0,0,0,0.7)",
              outline: "none",
              resize: "none",
              boxShadow: "inset 0px 4px 4px rgba(0,0,0,0.52)",
            }}
          />
        </div>

        {/* Summon Button */}
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
        >
          <button
            onClick={handleSummon}
            disabled={!scenario.trim()}
            style={{
              background: scenario.trim()
                ? "linear-gradient(90deg, #FFCC00 0%, #D4AF37 23%, #B8860B 64%, #996515 100%)"
                : "rgba(255,204,0,0.3)",
              border: "none",
              borderRadius: 37,
              padding: "16px 48px",
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 20,
              color: scenario.trim() ? "var(--text-dark)" : "rgba(0,0,0,0.4)",
              cursor: scenario.trim() ? "pointer" : "not-allowed",
              boxShadow: scenario.trim()
                ? "inset 0px 4px 4px rgba(0,0,0,0.52)"
                : "none",
              transition: "all 0.2s",
              letterSpacing: 1,
            }}
          >
            summon the quorum
          </button>
        </div>
      </div>
    </div>
  );
}
