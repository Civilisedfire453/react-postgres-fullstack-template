import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";
import bcrypt from "bcryptjs";
import { signUserToken, requireUser } from "../lib/auth.js";

const authRouter = new Hono();

// POST /api/auth/register
authRouter.post("/register", async (c) => {
	const body = await c.req.json();
	const { email, password, first_name, last_name } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		if (!email || !password) {
			return Response.json(
				{ error: "Email and password are required" },
				{ status: 400 },
			);
		}

		const hash = await bcrypt.hash(password, 10);

		try {
			const [user] = await sql`
        INSERT INTO users (email, password_hash, first_name, last_name)
        VALUES (${email}, ${hash}, ${first_name ?? null}, ${last_name ?? null})
        RETURNING id, email, first_name, last_name, role
      `;
			const token = signUserToken(c.env, user);
			return Response.json({ user, token });
		} catch (e) {
			return Response.json(
				{ error: "Email already registered" },
				{ status: 409 },
			);
		}
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Auth API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// POST /api/auth/login
authRouter.post("/login", async (c) => {
	const body = await c.req.json();
	const { email, password } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		const users = await sql`
      SELECT id, email, password_hash, first_name, last_name, role
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

		if (users.length === 0) {
			return Response.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		const user = users[0];
		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) {
			return Response.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		const token = signUserToken(c.env, user);

		delete user.password_hash;

		return Response.json({ user, token });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Auth API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

authRouter.get("/me", async (c) => {
	const dbLogic = async (c) => {
		const userOrResponse = requireUser(c);
		if (userOrResponse instanceof Response) {
			return userOrResponse;
		}
		return Response.json({ user: userOrResponse });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Auth API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

export default authRouter;

