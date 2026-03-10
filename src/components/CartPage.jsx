import { useEffect, useState } from "react";

function CartPage({ cartId }) {
	const [cart, setCart] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!cartId) {
			setLoading(false);
			return;
		}

		const fetchCart = async () => {
			try {
				const res = await fetch(`/api/cart/${cartId}`);
				if (!res.ok) {
					throw new Error(`API returned status: ${res.status}`);
				}
				const data = await res.json();
				setCart(data.cart);
			} catch (e) {
				console.error("Error loading cart", e);
				setError("Error loading cart");
			} finally {
				setLoading(false);
			}
		};

		fetchCart();
	}, [cartId]);

	if (!cartId) {
		return (
			<div className="text-center py-20 text-gray-600">
				Your cart is empty.
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-20">
				<div className="h-10 w-10 border-2 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (!cart) {
		return (
			<div className="text-center py-20 text-gray-600">
				{error || "Cart not found"}
			</div>
		);
	}

	const subtotal = (cart.subtotalCents / 100).toFixed(2);

	return (
		<div className="card">
			<h2>Your Cart</h2>
			{cart.items.length === 0 ? (
				<p>Your cart is empty.</p>
			) : (
				<>
					<table className="data-table mb-4">
						<thead>
							<tr>
								<th>Product</th>
								<th>Variant</th>
								<th>Qty</th>
								<th>Price</th>
								<th>Total</th>
								<th>Stock</th>
							</tr>
						</thead>
						<tbody>
							{cart.items.map((item) => (
								<tr key={item.id}>
									<td>{item.productName}</td>
									<td>{item.variantName}</td>
									<td>{item.quantity}</td>
									<td>${(item.priceCents / 100).toFixed(2)}</td>
									<td>${(item.lineTotalCents / 100).toFixed(2)}</td>
									<td>{item.availableStock}</td>
								</tr>
							))}
						</tbody>
					</table>
					<div className="flex justify-end text-lg font-medium">
						Subtotal: ${subtotal}
					</div>
				</>
			)}
		</div>
	);
}

export default CartPage;

