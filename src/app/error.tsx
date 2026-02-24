"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h2 className="text-xl font-serif text-stone-800">Etwas ist schiefgelaufen</h2>
        <p className="text-stone-600 text-sm">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
        </p>
        <Button
          onClick={() => reset()}
          className="bg-mw-green hover:bg-mw-green-dark text-white"
        >
          Erneut versuchen
        </Button>
      </div>
    </div>
  );
}
