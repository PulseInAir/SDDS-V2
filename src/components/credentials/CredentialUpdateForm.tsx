"use client";

import { useState } from "react";
import { updateCredential } from "@/lib/actions/credentials";

export function CredentialUpdateForm({ clientId }: { clientId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const recoveryPin = formData.get("recovery_pin") as string;

    if (!password) {
      setError("Password is required.");
      setIsLoading(false);
      return;
    }

    try {
      await updateCredential(clientId, { password, recovery_pin: recoveryPin });
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm">
      <h3 className="mb-4 text-md font-medium">Update Credentials</h3>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-green-600">Credentials updated successfully.</p>}

      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-700">Portal Password</label>
        <input
          type="password"
          name="password"
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-700">Recovery PIN (Optional)</label>
        <input
          type="text"
          name="recovery_pin"
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save Credentials"}
      </button>
    </form>
  );
}
