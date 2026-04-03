"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, User, Key, Globe, BarChart3, Search, Satellite } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Param\u00e8tres" description="Configuration de votre compte et int\u00e9grations" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />Profil</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Key className="h-4 w-4" />Int\u00e9grations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Mettez \u00e0 jour vos informations de profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input defaultValue="Pierre Gaudard" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="pierre@datashake.fr" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>R\u00f4le</Label>
                <Input defaultValue="Administrateur" disabled />
              </div>
              <Button className="gap-2"><Save className="h-4 w-4" />Sauvegarder</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>Mettez \u00e0 jour votre mot de passe de connexion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input type="password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmer</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button variant="outline" className="gap-2"><Key className="h-4 w-4" />Mettre \u00e0 jour</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Google Search Console
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bient\u00f4t</Badge>
                  </CardTitle>
                  <CardDescription>Connectez vos propri\u00e9t\u00e9s GSC pour suivre les performances</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>Connecter Google Search Console</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Globe className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Google Analytics 4
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bient\u00f4t</Badge>
                  </CardTitle>
                  <CardDescription>Connectez GA4 pour suivre le trafic et les conversions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>Connecter Google Analytics 4</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Search className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Haloscan API
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bient\u00f4t</Badge>
                  </CardTitle>
                  <CardDescription>Recherche de mots-cl\u00e9s avanc\u00e9e avec Haloscan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Cl\u00e9 API</Label>
                <Input placeholder="Votre cl\u00e9 API Haloscan" disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Satellite className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Meteoria API (GEO Monitoring)
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Bient\u00f4t</Badge>
                  </CardTitle>
                  <CardDescription>Monitoring de la visibilit\u00e9 dans les r\u00e9ponses g\u00e9n\u00e9ratives (GEO)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Cl\u00e9 API</Label>
                <Input placeholder="Votre cl\u00e9 API Meteoria" disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
