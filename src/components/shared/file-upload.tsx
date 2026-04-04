"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  File,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

interface FileUploadProps {
  orgId: string;
  files: UploadedFile[];
  onUpload: (file: UploadedFile) => void;
  onRemove: (fileId: string) => void;
  readOnly?: boolean;
  accept?: string;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-purple-500" />;
  if (mime.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return <Presentation className="h-4 w-4 text-orange-500" />;
  return <File className="h-4 w-4 text-gray-500" />;
}

function fileExtBadge(name: string): string {
  const ext = name.split(".").pop()?.toUpperCase() || "";
  return ext;
}

export function FileUpload({ orgId, files, onUpload, onRemove, readOnly, accept, className }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("org_id", orgId);
      const res = await fetch("/api/files/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onUpload(data.file);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemoveFile(fileId: string) {
    await fetch("/api/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    onRemove(fileId);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 group hover:bg-muted/30 transition-colors">
              {fileIcon(f.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px] px-1.5">{fileExtBadge(f.name)}</Badge>
                  <span className="text-[10px] text-muted-foreground">{formatSize(f.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Preview for images and PDFs */}
                {(f.mimeType.startsWith("image/") || f.mimeType.includes("pdf")) && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewUrl(`/api/files/${f.id}`)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
                <a href={`/api/files/${f.id}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
                {!readOnly && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveFile(f.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {!readOnly && (
        <div>
          <input ref={inputRef} type="file" className="hidden" accept={accept || "*/*"} onChange={handleFile} />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Uploader un fichier
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1">PDF, PPTX, Excel, images — max 50 Mo</p>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-3 right-3 z-10">
              <Button size="sm" variant="secondary" onClick={() => setPreviewUrl(null)}>Fermer</Button>
            </div>
            <iframe src={previewUrl} className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
