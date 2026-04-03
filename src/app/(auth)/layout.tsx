import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
          <Zap className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Databoard</h1>
          <p className="text-xs uppercase tracking-widest text-blue-300/60">by Datashake</p>
        </div>
      </div>
      {children}
    </div>
  );
}
