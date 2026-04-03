import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-white">Databoard</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Votre plateforme SEO<br />tout-en-un
          </h2>
          <p className="text-lg text-blue-200/70 max-w-md">
            Suivi de positions, trafic, netlinking, gestion de projet et rédaction de contenu , tout au même endroit.
          </p>
          <div className="flex flex-col gap-3 text-sm text-blue-300/60">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Suivi de mots-clés en temps réel
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Dashboards Google Search Console & GA4
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Gestion de campagnes netlinking
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Rédaction SEO avec scoring intelligent
            </div>
          </div>
        </div>

        <p className="text-xs text-blue-300/30">
          by datashake
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Databoard</span>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
