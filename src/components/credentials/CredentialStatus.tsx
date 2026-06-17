"use client";

export function CredentialStatus({ hasCredentials }: { hasCredentials: boolean }) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span
        className={`w-2 h-2 rounded-full ${
          hasCredentials ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <span>{hasCredentials ? "Credentials available" : "No credentials"}</span>
    </div>
  );
}
