import { Director, DirectorResponse } from './directors';

const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

function buildUserMessage(scenario: string, industry: string, pdfText?: string): string {
  let message = '';
  
  if (industry) {
    message += `Industry context: ${industry}\n\n`;
  }
  
  message += `Scenario:\n${scenario}`;
  
  if (pdfText) {
    message += `\n\nAdditional document provided:\n${pdfText}`;
  }
  
  return message;
}

function parseDirectorResponse(raw: string): DirectorResponse {
  // Curatam raspunsul de orice markdown accidental
  const cleaned = raw
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    
    // Validam verdictul
    if (!['PRO', 'CONTRA', 'NEUTRU'].includes(parsed.verdict)) {
      parsed.verdict = 'NEUTRU';
    }
    
    return parsed as DirectorResponse;
  } catch (e) {
    // Fallback daca JSON-ul e invalid
    return {
      verdict: 'NEUTRU',
      analysis: raw,
      recommendation: 'Unable to parse structured response.',
      main_risk: 'Response parsing error.',
    };
  }
}

export async function callDirector(
  director: Director,
  scenario: string,
  industry: string,
  pdfText?: string
): Promise<DirectorResponse> {
  const userMessage = buildUserMessage(scenario, industry, pdfText);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: director.systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error for ${director.role}: ${error.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  const rawText = data.content[0]?.text || '';
  
  return parseDirectorResponse(rawText);
}

export async function callAllDirectors(
  directors: Director[],
  scenario: string,
  industry: string,
  pdfText?: string,
  onDirectorComplete?: (directorId: number, response: DirectorResponse) => void
): Promise<Map<number, DirectorResponse>> {
  const results = new Map<number, DirectorResponse>();
  
  // Apelam toti directorii in paralel
  const promises = directors.map(async (director) => {
    try {
      const response = await callDirector(director, scenario, industry, pdfText);
      results.set(director.id, response);
      onDirectorComplete?.(director.id, response);
    } catch (error) {
      console.error(`Error calling ${director.role}:`, error);
      results.set(director.id, {
        verdict: 'NEUTRU',
        analysis: `Error retrieving analysis from ${director.role}.`,
        recommendation: 'Please try again.',
        main_risk: 'API call failed.',
      });
      onDirectorComplete?.(director.id, {
        verdict: 'NEUTRU',
        analysis: `Error retrieving analysis from ${director.role}.`,
        recommendation: 'Please try again.',
        main_risk: 'API call failed.',
      });
    }
  });
  
  await Promise.all(promises);
  return results;
}

export async function extractPdfText(file: File): Promise<string> {
  // Folosim PDF.js pentru extragerea textului
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Convertim la base64 pentru a trimite catre API
  let binary = '';
  uint8Array.forEach(byte => binary += String.fromCharCode(byte));
  const base64 = btoa(binary);
  
  // Trimitem PDF-ul direct catre Claude pentru extragere text
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Extract and return the full text content of this document. Return only the text, no commentary.',
            },
          ],
        },
      ],
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to extract PDF text');
  }
  
  const data = await response.json();
  return data.content[0]?.text || '';
}