import jwt from "jsonwebtoken";

export function getJwtSecret(env) {
	return env.JWT_SECRET || "dev-secret-change-in-prod";
}

export function attachUserFromAuthHeader() {
	return async (c, next) => {
		const authHeader = c.req.header("Authorization");
		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.slice("Bearer ".length);
			try {
				const payload = jwt.verify(token, getJwtSecret(c.env));
				c.set("user", {
					id: payload.sub,
					role: payload.role,
				});
			} catch (e) {
				// Invalid token; treat as unauthenticated
				c.set("user", null);
			}
		}
		return next();
	};
}

export function requireUser(c) {
	const user = c.get("user");
	if (!user) {
		return Response.json({ error: "Authentication required" }, { status: 401 });
	}
	return user;
}

export function requireAdmin(c) {
	const user = requireUser(c);
	if (user instanceof Response) {
		return user;
	}
	if (user.role !== "admin") {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}
	return user;
}

export function signUserToken(env, user) {
	return jwt.sign(
		{ sub: user.id, role: user.role },
		getJwtSecret(env),
		{ expiresIn: "7d" },
	);
}

