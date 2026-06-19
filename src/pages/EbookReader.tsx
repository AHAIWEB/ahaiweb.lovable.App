import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { ReactReader } from "react-reader";

function extractPath(url: string | null | undefined, fallback?: string | null): string | null {
  if (fallback) return fallback;
  if (!url) return null;
  const m = url.match(/\/ebooks\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

const EbookReader = () => {
  const { id } = useParams();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | number>(0);

  const { data: book, isLoading } = useQuery({
    queryKey: ["ebook", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!book) return;
    const path = extractPath(book.pdf_url, (book as any).file_path);
    if (!path) return;
    supabase.storage.from("ebooks").createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setSignedUrl(data.signedUrl);
    });
  }, [book]);

  const isEpub = (book?.pdf_url || "").toLowerCase().endsWith(".epub") ||
                 ((book as any)?.file_path || "").toLowerCase().endsWith(".epub");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="border-b px-4 py-2 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/library"><ArrowLeft className="h-4 w-4 mr-1" /> লাইব্রেরি</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{book?.title || "..."}</p>
          {book?.author && <p className="text-xs text-muted-foreground truncate">{book.author}</p>}
        </div>
        {signedUrl && (
          <Button asChild size="sm" variant="outline">
            <a href={signedUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" /> ডাউনলোড
            </a>
          </Button>
        )}
      </div>
      <div className="flex-1 bg-muted" style={{ height: "calc(100vh - 160px)" }}>
        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</p>
        ) : !book ? (
          <p className="text-center py-12 text-muted-foreground">বই পাওয়া যায়নি</p>
        ) : !signedUrl ? (
          <p className="text-center py-12 text-muted-foreground">ফাইল লোড হচ্ছে...</p>
        ) : isEpub ? (
          <div style={{ height: "100%", position: "relative" }}>
            <ReactReader url={signedUrl} location={location} locationChanged={(l) => setLocation(l)} />
          </div>
        ) : (
          <iframe src={`${signedUrl}#toolbar=1&navpanes=1`} className="w-full h-full" title={book.title} />
        )}
      </div>
    </div>
  );
};

export default EbookReader;
