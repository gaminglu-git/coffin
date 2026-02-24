"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin] Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h2 className="text-xl font-serif text-stone-800">Admin-Fehler</h2>
        <p className="text-stone-600 text-sm">
          Ein Fehler ist im Admin-Bereich aufgetreten. Bitte versuchen Sie es erneut oder kehren Sie zum Dashboard zurück.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-mw-green hover:bg-mw-green-dark text-white"
          >
            Erneut versuchen
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">Zum Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
