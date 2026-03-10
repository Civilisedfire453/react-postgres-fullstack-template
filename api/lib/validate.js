const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AU_POSTCODE_REGEX = /^\d{4}$/;

export function isPlainObject(value) {
	return value != null && typeof value === "object" && !Array.isArray(value);
}

export function asTrimmedString(value, { maxLen = 255 } = {}) {
	if (typeof value !== "string") return null;
	const s = value.trim();
	if (!s) return null;
	if (s.length > maxLen) return null;
	return s;
}

export function asOptionalTrimmedString(value, opts) {
	if (value == null) return null;
	return asTrimmedString(value, opts);
}

export function asPositiveInt(value, { max = 1_000_000 } = {}) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isInteger(n)) return null;
	if (n <= 0 || n > max) return null;
	return n;
}

export function asNonNegativeInt(value, { max = 1_000_000 } = {}) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isInteger(n)) return null;
	if (n < 0 || n > max) return null;
	return n;
}

export function asEmail(value) {
	const s = asTrimmedString(value, { maxLen: 255 });
	if (!s) return null;
	if (!EMAIL_REGEX.test(s)) return null;
	return s;
}

export function asPhoneAU(value) {
	// Keep this permissive: allow +, spaces, parentheses, hyphens. Store normalized digits if desired later.
	const s = asTrimmedString(value, { maxLen: 50 });
	if (!s) return null;
	const ok = /^[0-9+()\-\s]{6,50}$/.test(s);
	return ok ? s : null;
}

export function asAUState(value) {
	const s = asTrimmedString(value, { maxLen: 10 });
	if (!s) return null;
	const up = s.toUpperCase();
	const allowed = new Set(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);
	return allowed.has(up) ? up : null;
}

export function asAUPostcode(value) {
	const s = asTrimmedString(value, { maxLen: 10 });
	if (!s) return null;
	return AU_POSTCODE_REGEX.test(s) ? s : null;
}

export function badRequest(message) {
	return Response.json({ error: message }, { status: 400 });
}

