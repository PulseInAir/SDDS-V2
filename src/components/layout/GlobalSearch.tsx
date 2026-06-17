"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, FileSearch, Receipt, Search, UserRound, XCircle } from "lucide-react";

import type { GlobalSearchResponse, GlobalSearchResult } from "@/lib/search/global";

const MIN_SEARCH_LENGTH = 2;

function getResultIcon(type: GlobalSearchResult["type"]) {
  switch (type) {
    case "client":
      return <UserRound className="h-4 w-4" aria-hidden="true" />;
    case "invoice":
      return <Receipt className="h-4 w-4" aria-hidden="true" />;
    case "filing_record":
      return <FileSearch className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Search className="h-4 w-4" aria-hidden="true" />;
  }
}

function getResultTypeLabel(type: GlobalSearchResult["type"]) {
  switch (type) {
    case "client":
      return "Client";
    case "invoice":
      return "Invoice";
    case "filing_record":
      return "Filing";
    default:
      return "Record";
  }
}

export function GlobalSearch() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GlobalSearchResponse>({
    query: "",
    supportedFields: ["Client name", "PAN", "Mobile", "Invoice number", "Acknowledgement number"],
    results: [],
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (deferredQuery.length < MIN_SEARCH_LENGTH) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetch(`/api/global-search?q=${encodeURIComponent(deferredQuery)}`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!result.ok) {
          throw new Error("Search results could not be loaded.");
        }

        const payload = (await result.json()) as GlobalSearchResponse;
        setResponse(payload);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Search results could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deferredQuery]);

  const groupedResults = useMemo(() => {
    return response.results.reduce<Record<GlobalSearchResult["type"], GlobalSearchResult[]>>(
      (groups, result) => {
        groups[result.type].push(result);
        return groups;
      },
      {
        client: [],
        invoice: [],
        filing_record: [],
      },
    );
  }, [response.results]);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 max-w-2xl">
      <label className="sr-only" htmlFor="global-search">
        Global search
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </div>
        <input
          id="global-search"
          type="search"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (nextQuery.trim().length < MIN_SEARCH_LENGTH) {
              setError(null);
              setIsLoading(false);
              setResponse((current) => ({ ...current, query: nextQuery.trim(), results: [] }));
            }
            setIsOpen(true);
          }}
          placeholder="Search clients, PAN, invoices, or acknowledgement numbers"
          className="block h-10 w-full rounded-[var(--radius-input)] border border-border-subtle bg-white py-2 pl-10 pr-10 text-sm text-text-primary shadow-sm outline-none placeholder:text-text-muted focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setError(null);
              setResponse((current) => ({ ...current, query: "", results: [] }));
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted transition-colors hover:text-text-secondary"
            aria-label="Clear search"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-[var(--radius-panel)] border border-border-subtle bg-surface-panel shadow-lg">
          <div className="border-b border-border-subtle bg-surface-muted px-4 py-3 text-xs text-text-secondary">
            Search scope: {response.supportedFields.join(", ")}.
          </div>

          {deferredQuery.length < MIN_SEARCH_LENGTH ? (
            <div className="px-4 py-5 text-sm text-text-secondary">
              Type at least {MIN_SEARCH_LENGTH} characters to search approved indexed fields only.
            </div>
          ) : null}

          {deferredQuery.length >= MIN_SEARCH_LENGTH && isLoading ? (
            <div className="px-4 py-5 text-sm text-text-secondary">Searching across workspace records...</div>
          ) : null}

          {deferredQuery.length >= MIN_SEARCH_LENGTH && error ? (
            <div className="px-4 py-5 text-sm text-red-700">{error}</div>
          ) : null}

          {deferredQuery.length >= MIN_SEARCH_LENGTH && !isLoading && !error ? (
            response.results.length > 0 ? (
              <div className="max-h-[420px] overflow-y-auto">
                {(["client", "invoice", "filing_record"] as const).map((groupKey) =>
                  groupedResults[groupKey].length > 0 ? (
                    <div key={groupKey} className="border-t border-border-subtle first:border-t-0">
                      <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                        {getResultTypeLabel(groupKey)}
                      </div>
                      <div className="pb-2">
                        {groupedResults[groupKey].map((result) => (
                          <Link
                            key={result.id}
                            href={result.destination}
                            onClick={() => setIsOpen(false)}
                            className="mx-2 flex items-start gap-3 rounded-[var(--radius-input)] px-3 py-3 transition-colors hover:bg-surface-hover"
                          >
                            <div className="mt-0.5 rounded-full bg-surface-muted p-2 text-text-secondary">
                              {getResultIcon(result.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-semibold text-text-primary">{result.title}</p>
                                <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                                  {getResultTypeLabel(result.type)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-medium text-text-secondary">{result.identifier}</p>
                              <p className="mt-1 text-xs text-text-muted">{result.context}</p>
                            </div>
                            <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-text-secondary">
                No results found in the supported search fields for &quot;{response.query}&quot;.
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
