import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";

const adminRouter = new Hono();

// NOTE: Auth and RBAC will be added later; for now these endpoints are open.

// POST /api/admin/products - create product with optional variants
adminRouter.post("/products", async (c) => {
	const body = await c.req.json();
	const { product, variants } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		if (!product?.name) {
			return Response.json(
				{ error: "Product name is required" },
				{ status: 400 },
			);
		}

		const [createdProduct] = await sql`
      INSERT INTO products (name, description, brand, category, is_active)
      VALUES (
        ${product.name},
        ${product.description ?? null},
        ${product.brand ?? null},
        ${product.category ?? null},
        ${product.is_active ?? true}
      )
      RETURNING *
    `;

		const createdVariants = [];

		if (Array.isArray(variants)) {
			for (const v of variants) {
				const [variant] = await sql`
          INSERT INTO product_variants (
            product_id,
            sku,
            name,
            capacity_liters,
            pack_size,
            price_cents,
            stock_quantity,
            reorder_threshold
          )
          VALUES (
            ${createdProduct.id},
            ${v.sku},
            ${v.name},
            ${v.capacity_liters ?? null},
            ${v.pack_size ?? 1},
            ${v.price_cents},
            ${v.stock_quantity ?? 0},
            ${v.reorder_threshold ?? 0}
          )
          RETURNING *
        `;
				createdVariants.push(variant);
			}
		}

		return Response.json({ product: createdProduct, variants: createdVariants });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Admin API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// PUT /api/admin/products/:id - update product fields
adminRouter.put("/products/:id", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json();
	const { name, description, brand, category, is_active } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		const [updated] = await sql`
      UPDATE products
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        brand = COALESCE(${brand}, brand),
        category = COALESCE(${category}, category),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

		if (!updated) {
			return Response.json({ error: "Product not found" }, { status: 404 });
		}

		return Response.json({ product: updated });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Admin API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// POST /api/admin/variants/:id/adjust-inventory
adminRouter.post("/variants/:id/adjust-inventory", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json();
	const { delta, reason } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		if (!delta || delta === 0) {
			return Response.json(
				{ error: "Non-zero delta is required" },
				{ status: 400 },
			);
		}

		const [variant] = await sql`
      UPDATE product_variants
      SET stock_quantity = stock_quantity + ${delta},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

		if (!variant) {
			return Response.json({ error: "Variant not found" }, { status: 404 });
		}

		await sql`
      INSERT INTO inventory_adjustments (
        product_variant_id,
        delta,
        reason
      ) VALUES (
        ${id},
        ${delta},
        ${reason ?? null}
      )
    `;

		return Response.json({ variant });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Admin API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// GET /api/admin/inventory?low_stock=true
adminRouter.get("/inventory", async (c) => {
	const { low_stock } = c.req.query();

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		let query = sql`
      SELECT
        v.*,
        p.name AS product_name,
        p.brand,
        p.category
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
    `;

		if (low_stock === "true") {
			query = sql`${query} WHERE v.stock_quantity <= v.reorder_threshold`;
		}

		const variants = await query;
		return Response.json({ variants });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Admin API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// GET /api/admin/orders
adminRouter.get("/orders", async (c) => {
	const dbLogic = async (c) => {
		const sql = c.env.SQL;

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
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

		return Response.json({ orders });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Admin API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

export default adminRouter;

