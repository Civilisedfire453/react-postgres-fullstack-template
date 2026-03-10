const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

/**
 * Resolve a public/static asset URL with Vite's BASE_URL.
 * - Leaves absolute URLs (https:, data:, etc.) untouched.
 * - Supports paths with or without a leading slash.
 */
export function publicAssetUrl(input) {
	if (!input) return input;
	const url = String(input);
	if (ABSOLUTE_URL_RE.test(url)) return url;

	const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");
	const path = url.replace(/^\/+/, "");
	return `${base}${path}`;
}

