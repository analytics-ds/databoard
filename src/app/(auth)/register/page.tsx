"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const organizationName = formData.get("organizationName") as string;
    const domain = formData.get("domain") as string;

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, organizationName, domain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création du compte");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-white">Créer un compte</CardTitle>
        <CardDescription className="text-blue-200/60">
          Inscrivez-vous sur Databoard
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300 border border-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="organizationName" className="text-blue-100/80">Nom de votre entreprise / société</Label>
            <Input
              id="organizationName"
              name="organizationName"
              placeholder="Ex: Quitoque"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain" className="text-blue-100/80">Domaine (optionnel)</Label>
            <Input
              id="domain"
              name="domain"
              placeholder="quitoque.fr"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-blue-100/80">Votre nom complet</Label>
            <Input
              id="name"
              name="name"
              placeholder="Pierre Gaudard"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-blue-100/80">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="pierre@datashake.fr"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-blue-100/80">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-blue-100/80">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-blue-500"
            />
          </div>
          {/* Turnstile captcha will be added here when TURNSTILE_SITE_KEY is configured */}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer mon compte
          </Button>
          <p className="text-center text-sm text-blue-200/40">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
