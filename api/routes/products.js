import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";

const productsRouter = new Hono();

// GET /api/products
productsRouter.get("/", async (c) => {
	const { category, brand, search, in_stock } = c.req.query();

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		let whereClauses = [];
		let params = [];

		if (category) {
			whereClauses.push(sql`p.category = ${category}`);
		}
		if (brand) {
			whereClauses.push(sql`p.brand = ${brand}`);
		}
		if (search) {
			const pattern = `%${search}%`;
			whereClauses.push(
				sql`(p.name ILIKE ${pattern} OR p.description ILIKE ${pattern})`,
			);
		}
		if (in_stock === "true") {
			whereClauses.push(sql`v.stock_quantity > 0`);
		}

		let baseQuery = sql`
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
        ) AS variants,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', i.id,
              'image_url', i.image_url,
              'is_primary', i.is_primary
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id
      LEFT JOIN product_images i ON i.product_id = p.id
    `;

		if (whereClauses.length > 0) {
			baseQuery = sql`${baseQuery} WHERE ${sql.join(whereClauses, sql` AND `)}`;
		}

		const results = await sql`
      ${baseQuery}
      GROUP BY p.id
      ORDER BY p.name ASC
    `;

		return Response.json({ products: results, source: "database" });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Mock mode not implemented for products" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

// GET /api/products/:id
productsRouter.get("/:id", async (c) => {
	const id = c.req.param("id");

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		const rows = await sql`
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
        ) AS variants,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', i.id,
              'image_url', i.image_url,
              'is_primary', i.is_primary
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id
      LEFT JOIN product_images i ON i.product_id = p.id
      WHERE p.id = ${id}
      GROUP BY p.id
    `;

		if (rows.length === 0) {
			return Response.json({ error: "Product not found" }, { status: 404 });
		}

		return Response.json({ product: rows[0], source: "database" });
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Mock mode not implemented for products" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

export default productsRouter;

