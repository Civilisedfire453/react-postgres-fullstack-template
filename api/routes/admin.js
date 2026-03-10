import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";
import { requireAdmin } from "../lib/auth.js";
import {
	asNonNegativeInt,
	asOptionalTrimmedString,
	asPositiveInt,
	asTrimmedString,
	badRequest,
	isPlainObject,
} from "../lib/validate.js";

const adminRouter = new Hono();

// GET /api/admin/products - list all products (including inactive) for admin
adminRouter.get("/products", async (c) => {
	const dbLogic = async (c) => {
		const adminOrResponse = requireAdmin(c);
		if (adminOrResponse instanceof Response) {
			return adminOrResponse;
		}
		const sql = c.env.SQL;

		const results = await sql`
      SELECT
        p.id,
        p.name,
        p.description,
        p.brand,
        p.category,
        p.is_active,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', v.id,
              'sku', v.sku,
              'name', v.name,
              'capacity_liters', v.capacity_liters,
              'pack_size', v.pack_size,
              'price_cents', v.price_cents,
              'stock_quantity', v.stock_quantity,
              'reorder_threshold', v.reorder_threshold
            )
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'
        ) AS variants
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id
      GROUP BY p.id
      ORDER BY p.name ASC
    `;

		return Response.json({ products: results });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Admin API requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// POST /api/admin/products - create product with optional variants
adminRouter.post("/products", async (c) => {
	const body = await c.req.json();
	const { product, variants } = body;

	const dbLogic = async (c) => {
		const adminOrResponse = requireAdmin(c);
		if (adminOrResponse instanceof Response) {
			return adminOrResponse;
		}
		const sql = c.env.SQL;

		if (!isPlainObject(product)) return badRequest("product is required");
		const name = asTrimmedString(product.name, { maxLen: 255 });
		if (!name) return badRequest("Product name is required");
		const description = asOptionalTrimmedString(product.description, { maxLen: 2000 });
		const brand = asOptionalTrimmedString(product.brand, { maxLen: 255 });
		const category = asOptionalTrimmedString(product.category, { maxLen: 255 });
		const isActive = typeof product.is_active === "boolean" ? product.is_active : true;

		if (!Array.isArray(variants) || variants.length < 1) {
			return badRequest("At least one variant is required");
		}
		if (variants.length > 50) return badRequest("Too many variants");

		const [createdProduct] = await sql`
      INSERT INTO products (name, description, brand, category, is_active)
      VALUES (
        ${name},
        ${description ?? null},
        ${brand ?? null},
        ${category ?? null},
        ${isActive}
      )
      RETURNING *
    `;

		const createdVariants = [];

		for (const v of variants) {
			if (!isPlainObject(v)) return badRequest("Invalid variant payload");
			const sku = asTrimmedString(v.sku, { maxLen: 80 });
			const vName = asTrimmedString(v.name, { maxLen: 255 });
			const priceCents = asPositiveInt(v.price_cents, { max: 50_000_000 });
			const packSize = asPositiveInt(v.pack_size ?? 1, { max: 10_000 }) ?? 1;
			const stockQty = asNonNegativeInt(v.stock_quantity ?? 0, { max: 1_000_000 }) ?? 0;
			const reorderThreshold =
				asNonNegativeInt(v.reorder_threshold ?? 0, { max: 1_000_000 }) ?? 0;

			if (!sku) return badRequest("Variant sku is required");
			if (!vName) return badRequest("Variant name is required");
			if (!priceCents) return badRequest("Variant price_cents must be a positive integer");

			const capacityLiters =
				v.capacity_liters == null
					? null
					: Number.isFinite(Number(v.capacity_liters))
						? Number(v.capacity_liters)
						: null;

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
            ${sku},
            ${vName},
            ${capacityLiters},
            ${packSize},
            ${priceCents},
            ${stockQty},
            ${reorderThreshold}
          )
          RETURNING *
        `;
			createdVariants.push(variant);
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
	const name = body?.name ?? null;
	const description = body?.description ?? null;
	const brand = body?.brand ?? null;
	const category = body?.category ?? null;
	const is_active = body?.is_active ?? null;

	const dbLogic = async (c) => {
		const adminOrResponse = requireAdmin(c);
		if (adminOrResponse instanceof Response) {
			return adminOrResponse;
		}
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
		const adminOrResponse = requireAdmin(c);
		if (adminOrResponse instanceof Response) {
			return adminOrResponse;
		}
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
		const adminOrResponse = requireAdmin(c);
		if (adminOrResponse instanceof Response) {
			return adminOrResponse;
		}
		const sql = c.env.SQL;

		let query = sql`
      SELECT
        v.*,
        p.name AS product_name,
        p.brand,
        p.category,
        p.is_active AS product_is_active
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
		const adminOrResponse = requireAdmin(c);
		if (adminOrResponse instanceof Response) {
			return adminOrResponse;
		}
		const sql = c.env.SQL;

		const orders = await sql`
      SELECT
        o.*,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', oi.id,
              'product_variant_id', oi.product_variant_id,
              'quantity', oi.quantity,
              'unit_price_cents', oi.unit_price_cents,
              'total_price_cents', oi.total_price_cents,
              'product_name', p.name,
              'variant_name', pv.name
            )
            ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id
      LEFT JOIN products p ON p.id = pv.product_id
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

