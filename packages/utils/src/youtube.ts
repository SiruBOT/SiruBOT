import { fetch } from "undici";

/**
 * Autocomplete API response type
 */
export interface YouTubeSuggestion {
  query: string;
  type: number;
  relevance?: number[];
}

/**
 * Autocomplete API full response type
 */
export interface YouTubeSuggestionsResponse {
  query: string;
  suggestions: YouTubeSuggestion[];
  metadata?: {
    sessionId: string;
    experimentId: number;
    query: string;
  };
}

/**
 * Get suggestions
 * @param query Search query
 * @param locale Language setting (default: 'ko')
 * @param region Region setting (default: 'kr')
 * @returns Search suggestions
 */
export async function getYouTubeSuggestions(
  query: string,
  locale: string = "ko",
  region: string = "kr",
): Promise<YouTubeSuggestionsResponse> {
  try {
    const baseUrl =
      "https://suggestqueries-clients6.youtube.com/complete/search";
    const params = new URLSearchParams({
      ds: "yt",
      hl: locale,
      gl: region,
      client: "youtube",
      gs_ri: "youtube",
      q: query,
    });

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01",
        Referer: "https://www.youtube.com/",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch suggestions: ${response.status} ${response.statusText}`,
      );
    }

    const text = await response.text();

    const jsonpMatch = text.match(/window\.google\.ac\.h\((\[.*\])\)/);
    if (!jsonpMatch) {
      throw new Error("Failed to parse suggestions");
    }

    const data = JSON.parse(jsonpMatch[1]);
    const [originalQuery, suggestionsArray, metadata] = data;

    const suggestions: YouTubeSuggestion[] = suggestionsArray.map(
      (item: any[]) => ({
        query: item[0],
        type: item[1],
        relevance: item[2] || undefined,
      }),
    );

    return {
      query: originalQuery,
      suggestions,
      metadata: metadata
        ? {
            sessionId: metadata.j || "",
            experimentId: metadata.k || 0,
            query: metadata.q || "",
          }
        : undefined,
    };
  } catch (error) {
    throw new Error(
      `Failed to get suggestions: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Filter and sort suggestions
 * @param suggestions Original suggestions
 * @param maxResults Maximum results (default: 10)
 * @param filterDuplicates Filter duplicates (default: true)
 * @returns Filtered suggestions array
 */
export function filterYouTubeSuggestions(
  suggestions: YouTubeSuggestion[],
  maxResults: number = 10,
  filterDuplicates: boolean = true,
): string[] {
  let filtered = suggestions;

  // Remove duplicates
  if (filterDuplicates) {
    const seen = new Set<string>();
    filtered = suggestions.filter((suggestion) => {
      const query = suggestion.query.toLowerCase().trim();
      if (seen.has(query)) {
        return false;
      }
      seen.add(query);
      return true;
    });
  }

  // Sort by relevance if it exists
  filtered.sort((a, b) => {
    if (
      a.relevance &&
      b.relevance &&
      a.relevance[0] !== undefined &&
      b.relevance[0] !== undefined
    ) {
      return b.relevance[0] - a.relevance[0];
    }
    return 0;
  });

  return filtered.slice(0, maxResults).map((s) => s.query);
}

/**
 * Get simple suggestions
 * @param query Search query
 * @param maxResults Maximum results (default: 10)
 * @returns Suggestions array
 */
export async function getSimpleYouTubeSuggestions(
  query: string,
  maxResults: number = 10,
): Promise<string[]> {
  try {
    const response = await getYouTubeSuggestions(query);
    return filterYouTubeSuggestions(response.suggestions, maxResults);
  } catch (error) {
    return [];
  }
}
