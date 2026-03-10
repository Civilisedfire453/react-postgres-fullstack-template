import { Hono } from "hono";
import { selectDataSource } from "../lib/utils.js";
import { createPurchase } from "../lib/fatzebra.js";

const checkoutRouter = new Hono();

// POST /api/checkout/validate
checkoutRouter.post("/validate", async (c) => {
	const body = await c.req.json();
	const { cartId } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		if (!cartId) {
			return Response.json({ error: "cartId is required" }, { status: 400 });
		}

		const carts = await sql`SELECT * FROM carts WHERE id = ${cartId}`;
		if (carts.length === 0) {
			return Response.json({ error: "Cart not found" }, { status: 404 });
		}

		const items = await sql`
      SELECT
        ci.id,
        ci.quantity,
        v.id AS variant_id,
        v.sku,
        v.name AS variant_name,
        v.price_cents,
        v.stock_quantity,
        p.id AS product_id,
        p.name AS product_name
      FROM cart_items ci
      JOIN product_variants v ON v.id = ci.product_variant_id
      JOIN products p ON p.id = v.product_id
      WHERE ci.cart_id = ${cartId}
    `;

		if (items.length === 0) {
			return Response.json(
				{ error: "Cart is empty", code: "EMPTY_CART" },
				{ status: 400 },
			);
		}

		let subtotalCents = 0;
		const validationItems = [];
		const outOfStock = [];

		for (const row of items) {
			if (row.stock_quantity < row.quantity) {
				outOfStock.push({
					variantId: row.variant_id,
					requested: row.quantity,
					available: row.stock_quantity,
				});
			}
			const lineTotal = row.price_cents * row.quantity;
			subtotalCents += lineTotal;
			validationItems.push({
				variantId: row.variant_id,
				productId: row.product_id,
				productName: row.product_name,
				variantName: row.variant_name,
				priceCents: row.price_cents,
				quantity: row.quantity,
				lineTotalCents: lineTotal,
			});
		}

		if (outOfStock.length > 0) {
			return Response.json(
				{ error: "Insufficient stock for one or more items", outOfStock },
				{ status: 409 },
			);
		}

		const taxCents = Math.round(subtotalCents * 0.1);
		const shippingCents = subtotalCents > 10000 ? 0 : 1500;
		const totalCents = subtotalCents + taxCents + shippingCents;

		return Response.json({
			cartId,
			items: validationItems,
			subtotalCents,
			taxCents,
			shippingCents,
			totalCents,
			currency: "AUD",
		});
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Checkout requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

export default checkoutRouter;

// POST /api/checkout/pay
checkoutRouter.post("/pay", async (c) => {
	const body = await c.req.json();
	const { cartId, cardToken, customerIp, shipping } = body;

	const dbLogic = async (c) => {
		const sql = c.env.SQL;

		if (!cartId || !cardToken || !customerIp) {
			return Response.json(
				{ error: "cartId, cardToken and customerIp are required" },
				{ status: 400 },
			);
		}

		const result = await sql.begin(async (trx) => {
			const carts = await trx`SELECT * FROM carts WHERE id = ${cartId} FOR UPDATE`;
			if (carts.length === 0) {
				throw new Error("Cart not found");
			}

			const items = await trx`
        SELECT
          ci.id,
          ci.quantity,
          v.id AS variant_id,
          v.sku,
          v.name AS variant_name,
          v.price_cents,
          v.stock_quantity,
          p.id AS product_id,
          p.name AS product_name
        FROM cart_items ci
        JOIN product_variants v ON v.id = ci.product_variant_id
        JOIN products p ON p.id = v.product_id
        WHERE ci.cart_id = ${cartId}
        FOR UPDATE
      `;

			if (items.length === 0) {
				throw new Error("Cart is empty");
			}

			let subtotalCents = 0;
			for (const row of items) {
				if (row.stock_quantity < row.quantity) {
					throw new Error(
						`Insufficient stock for variant ${row.variant_id} (requested ${row.quantity}, available ${row.stock_quantity})`,
					);
				}
				subtotalCents += row.price_cents * row.quantity;
			}

			const taxCents = Math.round(subtotalCents * 0.1);
			const shippingCents = subtotalCents > 10000 ? 0 : 1500;
			const totalCents = subtotalCents + taxCents + shippingCents;

			const [order] = await trx`
        INSERT INTO orders (
          user_id,
          status,
          payment_status,
          subtotal_cents,
          tax_cents,
          shipping_cents,
          total_cents,
          currency,
          shipping_name,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_state,
          shipping_postcode,
          shipping_country
        ) VALUES (
          ${carts[0].user_id ?? null},
          'pending',
          'pending',
          ${subtotalCents},
          ${taxCents},
          ${shippingCents},
          ${totalCents},
          'AUD',
          ${shipping?.name ?? null},
          ${shipping?.addressLine1 ?? null},
          ${shipping?.addressLine2 ?? null},
          ${shipping?.city ?? null},
          ${shipping?.state ?? null},
          ${shipping?.postcode ?? null},
          ${shipping?.country ?? null}
        )
        RETURNING *
      `;

			for (const row of items) {
				const lineTotal = row.price_cents * row.quantity;
				await trx`
          INSERT INTO order_items (
            order_id,
            product_variant_id,
            quantity,
            unit_price_cents,
            total_price_cents
          ) VALUES (
            ${order.id},
            ${row.variant_id},
            ${row.quantity},
            ${row.price_cents},
            ${lineTotal}
          )
        `;

				await trx`
          UPDATE product_variants
          SET stock_quantity = stock_quantity - ${row.quantity},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${row.variant_id}
        `;

				await trx`
          INSERT INTO inventory_adjustments (
            product_variant_id,
            delta,
            reason,
            order_id
          ) VALUES (
            ${row.variant_id},
            ${-row.quantity},
            'order',
            ${order.id}
          )
        `;
			}

			await trx`
        UPDATE carts
        SET status = 'converted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${cartId}
      `;

			return { order, totalCents };
		});

		try {
			const paymentResult = await createPurchase({
				username: c.env.FATZEBRA_USERNAME,
				token: c.env.FATZEBRA_TOKEN,
				amount_cents: result.totalCents,
				reference: `ORDER-${result.order.id}`,
				customer_ip: customerIp,
				currency: "AUD",
				card_token: cardToken,
			});

			const sql = c.env.SQL;

			await sql.begin(async (trx) => {
				await trx`
          INSERT INTO payments (
            order_id,
            gateway_reference,
            amount_cents,
            currency,
            status,
            raw_response
          ) VALUES (
            ${result.order.id},
            ${paymentResult.response?.id ?? null},
            ${result.totalCents},
            'AUD',
            'succeeded',
            ${paymentResult}
          )
        `;

				await trx`
          UPDATE orders
          SET status = 'paid',
              payment_status = 'paid',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${result.order.id}
        `;
			});

			return Response.json({
				orderId: result.order.id,
				status: "paid",
			});
		} catch (err) {
			console.error("Payment error", err);
			const sql = c.env.SQL;

			await sql`
        UPDATE orders
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${result.order.id}
      `;

			await sql`
        INSERT INTO payments (
          order_id,
          gateway_reference,
          amount_cents,
          currency,
          status,
          raw_response
        ) VALUES (
          ${result.order.id},
          ${null},
          ${result.totalCents},
          'AUD',
          'failed',
          ${err.gatewayResponse ?? null}
        )
      `;

			return Response.json(
				{ error: err.message || "Payment failed" },
				{ status: 402 },
			);
		}
	};

	const mockLogic = async () => {
		return Response.json(
			{ error: "Checkout requires database connection" },
			{ status: 503 },
		);
	};

	return selectDataSource(c, dbLogic, mockLogic);
});

