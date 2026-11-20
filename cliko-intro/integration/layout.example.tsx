// Exemple : app/layout.tsx de cliko.be avec l'intro (seules les lignes marquées ★ sont à ajouter).
import ClikoIntro, { CLIKO_INTRO_PREPAINT } from "@/components/ClikoIntro"; // ★

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CLIKO_INTRO_PREPAINT }} /> {/* ★ */}
      </head>
      <body className="min-h-full flex flex-col bg-night text-text antialiased">
        {children}
        <ClikoIntro /> {/* ★ */}
      </body>
    </html>
  );
}
