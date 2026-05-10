"use client";

import { useMemo, useState } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  slug: string;
  siteUrl: string;
};

const IFRAME_WIDTH = 380;
const IFRAME_HEIGHT = 132;

export function EmbedSnippet({ slug, siteUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"iframe" | "json" | null>(null);

  const embedUrl = `${siteUrl}/embed/${slug}`;
  const apiUrl = `${siteUrl}/api/embed/${slug}`;

  const iframeCode = useMemo(
    () =>
      `<iframe src="${embedUrl}" width="${IFRAME_WIDTH}" height="${IFRAME_HEIGHT}" frameborder="0" loading="lazy" title="Ocena kursu — coursed.pl" style="border:0;max-width:100%"></iframe>`,
    [embedUrl],
  );

  const copy = async (value: string, kind: "iframe" | "json") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success("Skopiowano do schowka");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full",
        )}
      >
        <Code2 className="size-3.5" />
        Wstaw na swojej stronie
      </DialogTrigger>
      <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Wstaw widget z oceną</DialogTitle>
          <DialogDescription>
            Skopiuj kod i wklej go na swoją stronę. Widget pokazuje aktualną
            ocenę i linkuje do strony kursu w coursed.pl.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Podgląd
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-muted/30 p-3">
            <iframe
              src={embedUrl}
              width={IFRAME_WIDTH}
              height={IFRAME_HEIGHT}
              loading="lazy"
              title="Podgląd widgetu"
              style={{ border: 0, maxWidth: "100%" }}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Kod HTML (iframe)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => copy(iframeCode, "iframe")}
            >
              {copied === "iframe" ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Kopiuj
            </Button>
          </div>
          <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
            <code>{iframeCode}</code>
          </pre>
        </div>

        <details className="group min-w-0 rounded-md border border-border bg-muted/20">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground group-open:border-b group-open:border-border">
            JSON API (dla deweloperów)
          </summary>
          <div className="space-y-2 p-3">
            <p className="text-xs text-muted-foreground">
              GET na ten endpoint zwraca aktualne oceny w formacie JSON. CORS
              jest otwarte; cache 5 min na kliencie, 1 h na CDN.
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded border border-border bg-background px-2 py-1 text-xs">
                {apiUrl}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(apiUrl, "json")}
              >
                {copied === "json" ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </details>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
