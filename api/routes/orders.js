import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";
import { requireUser } from "../lib/auth.js";

const ordersRouter = new Hono();

// GET /api/orders - list current user's orders (admin sees all)
ordersRouter.get("/", async (c) => {
	const dbLogic = async (c) => {
		const sql = c.env.SQL;
		const userOrResponse = requireUser(c);
		if (userOrResponse instanceof Response) {
			return userOrResponse;
		}
		const user = userOrResponse;

		const whereClause =
			user.role === "admin"
				? sql``
				: sql`WHERE o.user_id = ${user.id}`;

		const orders = await sql`
      SELECT
        o.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', oi.id,
              'product_variant_id', oi.product_variant_id,
              'quantity', oi.quantity,
              'unit_price_cents', oi.unit_price_cents,
              'total_price_cents', oi.total_price_cents
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

		return Response.json({ orders });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Orders API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// GET /api/orders/:id
ordersRouter.get("/:id", async (c) => {
	const id = c.req.param("id");

	const dbLogic = async (c) => {
		const sql = c.env.SQL;
		const userOrResponse = requireUser(c);
		if (userOrResponse instanceof Response) {
			return userOrResponse;
		}
		const user = userOrResponse;

		const rows = await sql`
      SELECT
        o.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', oi.id,
              'product_variant_id', oi.product_variant_id,
              'quantity', oi.quantity,
              'unit_price_cents', oi.unit_price_cents,
              'total_price_cents', oi.total_price_cents
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ${id}
      GROUP BY o.id
    `;

		if (rows.length === 0) {
			return Response.json({ error: "Order not found" }, { status: 404 });
		}

		const order = rows[0];
		if (user.role !== "admin" && order.user_id !== user.id) {
			return Response.json({ error: "Forbidden" }, { status: 403 });
		}

		return Response.json({ order });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Orders API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

export default ordersRouter;

