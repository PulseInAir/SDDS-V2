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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [response, setResponse] = useState<GlobalSearchResponse>({
    query: "",
    supportedFields: ["Client name", "PAN", "Mobile", "Invoice number", "Acknowledgement number"],
    results: [],
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
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
        setActiveIndex(payload.results.length > 0 ? 0 : -1);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setActiveIndex(-1);
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
  const resultIndexMap = useMemo(() => {
    return new Map(response.results.map((result, index) => [result.id, index]));
  }, [response.results]);

  const resultsListId = "global-search-results";
  const activeDescendantId = activeIndex >= 0 ? `${resultsListId}-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-2xl flex-1">
      <label className="sr-only" htmlFor="global-search">
        Global search
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-white/30" aria-hidden="true" />
        </div>
        <input
          id="global-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={resultsListId}
          aria-expanded={isOpen}
          aria-activedescendant={activeDescendantId}
          value={query}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (!isOpen || response.results.length === 0) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => (current + 1) % response.results.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => (current <= 0 ? response.results.length - 1 : current - 1));
            } else if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              window.location.assign(response.results[activeIndex].destination);
            }
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setActiveIndex(-1);

            if (nextQuery.trim().length < MIN_SEARCH_LENGTH) {
              setError(null);
              setIsLoading(false);
              setResponse((current) => ({ ...current, query: nextQuery.trim(), results: [] }));
            }

            setIsOpen(true);
          }}
          placeholder="Search clients, PAN, invoices, or acknowledgement numbers"
          className="block h-10 w-full rounded-[var(--radius-input)] border border-white/5 bg-white/[0.02] py-2 pl-10 pr-10 text-sm text-white/80 shadow-sm outline-none placeholder:text-white/30 focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setError(null);
              setActiveIndex(-1);
              setResponse((current) => ({ ...current, query: "", results: [] }));
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/30 transition-colors hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            aria-label="Clear search"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          id={resultsListId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-[var(--radius-panel)] border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        >
          <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-white/40 font-mono uppercase tracking-wider">
            Search scope: {response.supportedFields.join(", ")}.
          </div>

          {deferredQuery.length < MIN_SEARCH_LENGTH ? (
            <div className="px-4 py-5 text-sm text-white/40">
              Type at least {MIN_SEARCH_LENGTH} characters to search approved indexed fields only.
            </div>
          ) : null}

          {deferredQuery.length >= MIN_SEARCH_LENGTH && isLoading ? (
            <div className="px-4 py-5 text-sm text-white/40" aria-live="polite">
              Searching across workspace records...
            </div>
          ) : null}

          {deferredQuery.length >= MIN_SEARCH_LENGTH && error ? (
            <div className="px-4 py-5 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          {deferredQuery.length >= MIN_SEARCH_LENGTH && !isLoading && !error ? (
            response.results.length > 0 ? (
              <div className="max-h-[420px] overflow-y-auto">
                {(["client", "invoice", "filing_record"] as const).map((groupKey) =>
                  groupedResults[groupKey].length > 0 ? (
                    <div key={groupKey} className="border-t border-white/5 first:border-t-0">
                      <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">
                        {getResultTypeLabel(groupKey)}
                      </div>
                      <div className="pb-2">
                        {groupedResults[groupKey].map((result) => {
                          const resultIndex = resultIndexMap.get(result.id) ?? -1;
                          const isActive = resultIndex === activeIndex;

                          return (
                            <Link
                              key={result.id}
                              id={`${resultsListId}-${resultIndex}`}
                              role="option"
                              aria-selected={isActive}
                              href={result.destination}
                              onMouseEnter={() => setActiveIndex(resultIndex)}
                              onClick={() => {
                                setIsOpen(false);
                                setActiveIndex(-1);
                              }}
                              className={`mx-2 flex items-start gap-3 rounded-[var(--radius-input)] px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                                isActive ? "bg-white/[0.05]" : "hover:bg-white/[0.02]"
                              }`}
                            >
                              <div className="mt-0.5 rounded-full bg-white/[0.03] border border-white/5 p-2 text-white/50">
                                {getResultIcon(result.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-semibold text-white/90">{result.title}</p>
                                  <span className="rounded-full bg-white/[0.03] border border-white/5 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-white/50">
                                    {getResultTypeLabel(result.type)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-medium text-white/60">{result.identifier}</p>
                                <p className="mt-1 text-xs text-white/40">{result.context}</p>
                              </div>
                              <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 text-white/20" aria-hidden="true" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-white/40" aria-live="polite">
                No results found in the supported search fields for &quot;{response.query}&quot;.
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
