import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";

const productsRouter = new Hono();

function getMockProducts() {
	const products = [
		{
			id: 1,
			name: "PureFlow Standard Pitcher",
			description:
				"Slim, everyday water filter pitcher ideal for apartments and small households.",
			brand: "PureFlow",
			category: "Pitcher Filters",
			is_active: true,
			variants: [
				{
					id: 11,
					sku: "PF-STD-3L",
					name: "PureFlow 3L Compact Pitcher",
					capacity_liters: 3.0,
					pack_size: 1,
					price_cents: 4999,
					stock_quantity: 40,
					reorder_threshold: 10,
				},
				{
					id: 12,
					sku: "PF-STD-5L",
					name: "PureFlow 5L Family Pitcher",
					capacity_liters: 5.0,
					pack_size: 1,
					price_cents: 5999,
					stock_quantity: 25,
					reorder_threshold: 5,
				},
			],
			images: [
				{
					id: 101,
					image_url: "/images/filters/pureflow-standard.jpg",
					is_primary: true,
				},
			],
		},
		{
			id: 2,
			name: "AquaMax Family Countertop",
			description:
				"High‑capacity countertop filter designed for busy family kitchens.",
			brand: "AquaMax",
			category: "Countertop Filters",
			is_active: true,
			variants: [
				{
					id: 21,
					sku: "AM-CT-8L",
					name: "AquaMax 8L Countertop Filter",
					capacity_liters: 8.0,
					pack_size: 1,
					price_cents: 11999,
					stock_quantity: 18,
					reorder_threshold: 5,
				},
				{
					id: 22,
					sku: "AM-CT-12L",
					name: "AquaMax 12L Countertop Filter",
					capacity_liters: 12.0,
					pack_size: 1,
					price_cents: 13999,
					stock_quantity: 10,
					reorder_threshold: 3,
				},
			],
			images: [
				{
					id: 102,
					image_url: "/images/filters/aquamax-family.jpg",
					is_primary: true,
				},
			],
		},
		{
			id: 3,
			name: "HydroGuard Whole‑House Filter",
			description:
				"Whole‑house sediment and carbon filtration to protect every tap in your home.",
			brand: "HydroGuard",
			category: "Whole‑House Systems",
			is_active: true,
			variants: [
				{
					id: 31,
					sku: "HG-WH-SED-CARB",
					name: "HydroGuard Whole‑House Sediment + Carbon",
					capacity_liters: null,
					pack_size: 1,
					price_cents: 24999,
					stock_quantity: 6,
					reorder_threshold: 2,
				},
			],
			images: [
				{
					id: 103,
					image_url: "/images/filters/hydroguard-whole-house.jpg",
					is_primary: true,
				},
			],
		},
	];

	return products;
}

// GET /api/products
productsRouter.get("/", async (c) => {
	const { category, brand, search, in_stock } = c.req.query();

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		let whereClauses = [];

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
			const whereFragment =
				whereClauses.length === 1
					? whereClauses[0]
					: whereClauses.reduce((acc, frag) => sql`${acc} AND ${frag}`);
			baseQuery = sql`${baseQuery} WHERE ${whereFragment}`;
		}

		const results = await sql`
      ${baseQuery}
      GROUP BY p.id
      ORDER BY p.name ASC
    `;

		return Response.json({ products: results, source: "database" });
	};

	const mockLogic = async () => {
		let products = getMockProducts();

		if (category) {
			products = products.filter((p) => p.category === category);
		}
		if (brand) {
			products = products.filter((p) => p.brand === brand);
		}
		if (search) {
			const lower = search.toLowerCase();
			products = products.filter(
				(p) =>
					p.name.toLowerCase().includes(lower) ||
					(p.description ?? "").toLowerCase().includes(lower),
			);
		}
		if (in_stock === "true") {
			products = products.filter((p) =>
				p.variants?.some((v) => v.stock_quantity > 0),
			);
		}

		return Response.json({ products, source: "mock" });
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
		const products = getMockProducts();
		const productId = parseInt(id, 10);
		const product = products.find((p) => p.id === productId);

		if (!product) {
			return Response.json({ error: "Product not found" }, { status: 404 });
		}

		return Response.json({ product, source: "mock" });
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

export default productsRouter;

