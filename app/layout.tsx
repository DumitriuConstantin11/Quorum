import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quorum",
  description: "AI Board of Directors",
};

const LOGO = '/logo.png';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#10444a',
          display: 'flex',
          justifyContent: 'flex-start',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Logo fix - mereu acelasi */}
          <img
            src={LOGO}
            alt="Quorum"
            style={{
              width: 440,
              // marginTop: -20,
              // marginBottom: 16,
              zIndex: 10,
              position: 'relative',
              flexShrink: 0,
            }}
          />
          {/* Continutul paginii */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}