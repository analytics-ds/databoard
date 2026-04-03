"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, ExternalLink, Settings2, Check, X, Copy, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const BACKLINK_STATUSES = {
  domain_to_validate: { label: "Domaine à valider", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  article_writing: { label: "Article en rédaction", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  article_validated: { label: "Article validé", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  published: { label: "Publié", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  domain_rejected: { label: "Domaine refusé", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

type BacklinkStatus = keyof typeof BACKLINK_STATUSES;

const DEMO_BACKLINKS = [
  { id: "1", keyword: "", domain: "consommactrice.com", da: 24, tf: 12, cf: 26, dr: 33, traffic: 280, status: "domain_to_validate" as BacklinkStatus, price: 500 },
  { id: "2", keyword: "menu de la semaine", domain: "les-calories.com", da: 42, tf: 15, cf: 44, dr: 345, traffic: 69718, status: "article_writing" as BacklinkStatus, price: 800 },
  { id: "3", keyword: "menu de la semaine", domain: "parisselectbook.com", da: 28, tf: 21, cf: 42, dr: 931, traffic: 38533, status: "domain_rejected" as BacklinkStatus, price: 1000 },
  { id: "4", keyword: "batch cooking", domain: "recettefacile.com", da: 34, tf: 39, cf: 36, dr: 94, traffic: 40842, status: "domain_rejected" as BacklinkStatus, price: 1100 },
  { id: "5", keyword: "batch cooking", domain: "trucmania.oue", da: 93, tf: 62, cf: 68, dr: 498, traffic: 44490, status: "article_validated" as BacklinkStatus, price: 1200 },
  { id: "6", keyword: "recettes faciles et r...", domain: "happypapilles.fr", da: 35, tf: 12, cf: 46, dr: 254, traffic: 8769, status: "domain_rejected" as BacklinkStatus, price: 800 },
  { id: "7", keyword: "recettes faciles et r...", domain: "recettehealthy.com", da: 33, tf: 14, cf: 42, dr: 170, traffic: 82573, status: "domain_to_validate" as BacklinkStatus, price: 1500 },
];

export default function NetlinkingPage() {
  const { organization } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backlinks"
        description={`${organization?.name || ""} (${organization?.domain || ""})`}
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Gérer les colonnes 10/21
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </PageHeader>

      {/* Bulk select */}
      <Button variant="outline" size="sm" className="gap-1.5 text-xs border-primary text-primary">
        Sélectionner tous les backlinks de la page
      </Button>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><ChevronDown className="h-3 w-3" /></TableHead>
                <TableHead className="w-8"><Checkbox /></TableHead>
                <TableHead className="w-[180px]">Mot clé</TableHead>
                <TableHead className="w-[180px]">Domaine</TableHead>
                <TableHead className="text-center w-14">DA</TableHead>
                <TableHead className="text-center w-14">TF</TableHead>
                <TableHead className="text-center w-14">CF</TableHead>
                <TableHead className="text-center w-14">DR</TableHead>
                <TableHead className="text-right w-20">Trafic</TableHead>
                <TableHead className="w-[160px]">Statut</TableHead>
                <TableHead className="text-right w-20">Prix</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_BACKLINKS.map((link) => {
                const statusConfig = BACKLINK_STATUSES[link.status];
                return (
                  <TableRow key={link.id} className="group">
                    <TableCell><ChevronDown className="h-3 w-3 text-muted-foreground" /></TableCell>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell className="text-sm">{link.keyword || "-"}</TableCell>
                    <TableCell>
                      <a href={`https://${link.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        {link.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">{link.da}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{link.tf}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{link.cf}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{link.dr}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{link.traffic.toLocaleString("fr-FR")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("h-2 w-2 rounded-full", statusConfig.dot)} />
                        <span className="text-xs">{statusConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{link.price.toLocaleString("fr-FR")} €</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(link.status === "domain_to_validate") && (
                          <>
                            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200" title="Valider">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200" title="En attente">
                              <span className="text-xs font-bold">?</span>
                            </button>
                            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200" title="Refuser">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground" title="Copier">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground" title="Supprimer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end gap-4 p-4 border-t text-sm text-muted-foreground">
          <span>Nombre de backlinks par page</span>
          <Select defaultValue="100">
            <SelectTrigger className="w-16 h-7"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>1 - 7</span>
          <span>Page 1</span>
        </div>
      </Card>
    </div>
  );
}
