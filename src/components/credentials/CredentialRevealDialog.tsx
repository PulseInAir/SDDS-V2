"use client";

import { useState } from "react";
import { revealCredential } from "@/lib/actions/credentials";

export function CredentialRevealDialog({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await revealCredential(clientId);
      setCredentials(payload);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCredentials(null);
    setError(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        Reveal Credentials
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Reveal Credentials</h2>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!credentials && !error && (
          <p className="mb-4 text-sm text-gray-600">
            Revealing credentials will be logged in the audit trail. Are you sure you want to proceed?
          </p>
        )}

        {credentials && (
          <div className="p-4 mb-4 font-mono text-sm break-all bg-gray-100 rounded">
            <pre className="whitespace-pre-wrap">{JSON.stringify(credentials, null, 2)}</pre>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            Close
          </button>
          {!credentials && (
            <button
              onClick={handleReveal}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Revealing..." : "Confirm Reveal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
