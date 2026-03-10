import { useEffect, useState } from "react";
import CheckoutModal from "./CheckoutModal.jsx";

function CartPage({ cartId, onCartCleared }) {
	const [cart, setCart] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [validation, setValidation] = useState(null);

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
				setError(null);
			} catch (e) {
				console.error("Error loading cart", e);
				setError("Error loading cart");
			} finally {
				setLoading(false);
			}
		};

		fetchCart();
	}, [cartId]);

	const handleCheckout = async () => {
		if (!cartId || !cart?.items?.length) return;
		setError(null);
		try {
			const validateRes = await fetch("/api/checkout/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cartId }),
			});
			if (!validateRes.ok) {
				const data = await validateRes.json().catch(() => ({}));
				throw new Error(data.error || "Validation failed");
			}
			const validateData = await validateRes.json();

			const configRes = await fetch("/api/checkout/config");
			const configData = configRes.ok ? await configRes.json() : {};

			setValidation({
				...validateData,
				fatZebraUsername: configData.fatZebraUsername,
			});
			setCheckoutOpen(true);
		} catch (e) {
			setError(e.message || "Could not start checkout");
		}
	};

	const handlePaymentSuccess = async (event) => {
		const gatewayRef = event?.response?.id ?? event?.data?.id ?? null;
		const res = await fetch("/api/checkout/complete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				cartId,
				gatewayReference: gatewayRef,
				amountCents: validation?.totalCents,
			}),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.error || "Order creation failed");
		}
		onCartCleared?.();
	};

	if (!cartId) {
		return (
			<div className="text-center py-12 px-6 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-slate-500">
				<p>Your cart is empty. Add items from the catalog above.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-20">
				<div className="h-10 w-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (!cart) {
		return (
			<div className="text-center py-20 text-slate-600">
				{error || "Cart not found"}
			</div>
		);
	}

	const subtotal = (cart.subtotalCents / 100).toFixed(2);

	return (
		<>
		<div className="card">
			<h2>Your Cart</h2>
			{error && (
				<div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
					{error}
				</div>
			)}
			{cart.items.length === 0 ? (
				<p className="text-slate-500">Your cart is empty. Add filters from the catalog above.</p>
			) : (
				<>
					<table className="data-table mb-6">
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
							{cart.items.map((item) => {
								const lowStock = item.availableStock < item.quantity;
								const outOfStock = item.availableStock <= 0;
								return (
									<tr key={item.id} className={outOfStock ? "bg-red-50" : lowStock ? "bg-amber-50" : ""}>
										<td className="font-medium text-slate-800">{item.productName}</td>
										<td className="text-slate-600">{item.variantName}</td>
										<td>{item.quantity}</td>
										<td>${(item.priceCents / 100).toFixed(2)}</td>
										<td className="font-medium">${(item.lineTotalCents / 100).toFixed(2)}</td>
										<td>
											<span
												className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
													outOfStock
														? "bg-red-200 text-red-800"
														: lowStock
															? "bg-amber-200 text-amber-800"
															: "bg-green-100 text-green-700"
												}`}
											>
												{outOfStock
													? "Out"
													: lowStock
														? `${item.availableStock} left`
														: item.availableStock}
											</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					<div className="flex flex-col sm:flex-row justify-end items-center gap-4">
						<span className="text-slate-600">Subtotal</span>
						<span className="text-xl font-semibold text-slate-900">${subtotal}</span>
						<button
							type="button"
							onClick={handleCheckout}
							className="btn-primary px-6 py-2.5 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
						>
							Checkout with Fat Zebra
						</button>
					</div>
				</>
			)}
		</div>

		<CheckoutModal
			isOpen={checkoutOpen}
			onClose={() => setCheckoutOpen(false)}
			cartId={cartId}
			validation={validation}
			onSuccess={handlePaymentSuccess}
		/>
	</>
	);
}

export default CartPage;

