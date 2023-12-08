/* eslint-disable security/detect-object-injection */
export function calculateLevenshteinDistance(a: string, b: string) {
  // Ensure a and b are valid strings
  if (typeof a !== "string" || typeof b !== "string") {
    throw new Error("Invalid input. Both inputs must be strings.");
  }

  const m = a.length;
  const n = b.length;

  // Create a matrix with dimensions (m+1) x (n+1)
  const matrix = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    matrix[i] = new Array(n + 1);
    matrix[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  // The Levenshtein distance is the value in the bottom-right cell of the matrix
  return matrix[m][n];
}
