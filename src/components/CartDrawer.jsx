import { useEffect, useRef, useState } from "react";
import CheckoutModal from "./CheckoutModal.jsx";
import DeliveryFormModal from "./DeliveryFormModal.jsx";

function CartDrawer({ isOpen, onClose, cartId, onCartCleared, onCartRefresh }) {
	const [cart, setCart] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [deliveryFormOpen, setDeliveryFormOpen] = useState(false);
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [validation, setValidation] = useState(null);
	const [customerInfo, setCustomerInfo] = useState(null);
	const [orderSuccess, setOrderSuccess] = useState(null); // { orderId }
	const onCartRefreshRef = useRef(onCartRefresh);
	onCartRefreshRef.current = onCartRefresh;

	useEffect(() => {
		if (!isOpen || !cartId) {
			setCart(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		fetch(`/api/cart/${cartId}`)
			.then((res) => {
				if (!res.ok) throw new Error("Could not load cart");
				return res.json();
			})
			.then((data) => {
				setCart(data.cart);
				onCartRefreshRef.current?.();
			})
			.catch((e) => {
				setError(e.message);
				setCart(null);
			})
			.finally(() => setLoading(false));
	}, [isOpen, cartId]);

	const handleCheckout = async () => {
		if (!cartId || !cart?.items?.length) return;
		setError(null);
		try {
			const [validateRes, configRes] = await Promise.all([
				fetch("/api/checkout/validate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ cartId }),
				}),
				fetch("/api/checkout/config"),
			]);
			if (!validateRes.ok) {
				const data = await validateRes.json().catch(() => ({}));
				throw new Error(data.error || "Validation failed");
			}
			const validateData = await validateRes.json();
			const configData = configRes.ok ? await configRes.json() : {};
			setValidation({
				...validateData,
				fatZebraUsername: configData.fatZebraUsername,
			});
			setDeliveryFormOpen(true);
		} catch (e) {
			setError(e.message || "Could not start checkout");
		}
	};

	const handleDeliverySubmit = (info) => {
		setCustomerInfo(info);
		setDeliveryFormOpen(false);
		setCheckoutOpen(true);
	};

	const handlePaymentSuccess = async (event) => {
		const gatewayRef = event?.response?.id ?? event?.data?.id ?? null;
		const shipping = customerInfo
			? {
					name: customerInfo.name,
					addressLine1: customerInfo.addressLine1,
					addressLine2: customerInfo.addressLine2,
					city: customerInfo.city,
					state: customerInfo.state,
					postcode: customerInfo.postcode,
					country: customerInfo.country,
				}
			: undefined;
		const res = await fetch("/api/checkout/complete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				cartId,
				gatewayReference: gatewayRef,
				amountCents: validation?.totalCents,
				shipping,
				customerEmail: customerInfo?.email ?? null,
				customerPhone: customerInfo?.phone ?? null,
			}),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.error || "Order creation failed");
		}
		const data = await res.json().catch(() => ({}));
		setCustomerInfo(null);
		setOrderSuccess({ orderId: data.orderId ?? null });
		onCartCleared?.();
		setCheckoutOpen(false);
	};

	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
				onClick={onClose}
				aria-hidden="true"
			/>
			<aside
				className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-right duration-300"
				aria-modal="true"
				aria-label="Cart"
			>
				<div className="flex items-center justify-between p-4 border-b border-slate-200">
					<h2 className="text-lg font-semibold text-slate-900">Cart</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
						aria-label="Close cart"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					{error && (
						<div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
							{error}
						</div>
					)}

					{!cartId ? (
						<p className="text-slate-500 text-center py-8">Your cart is empty.</p>
					) : loading ? (
						<div className="flex justify-center py-12">
							<div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
						</div>
					) : !cart || cart.items.length === 0 ? (
						<p className="text-slate-500 text-center py-8">Your cart is empty. Add items from the store.</p>
					) : (
						<div className="space-y-4">
							{cart.items.map((item) => {
								const lowStock = item.availableStock < item.quantity;
								const outOfStock = item.availableStock <= 0;
								return (
									<div
										key={item.id}
										className={`flex gap-3 p-3 rounded-xl border ${
											outOfStock ? "border-red-200 bg-red-50/50" : lowStock ? "border-amber-200 bg-amber-50/50" : "border-slate-200"
										}`}
									>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-slate-900 truncate">{item.productName}</p>
											<p className="text-sm text-slate-500 truncate">{item.variantName}</p>
											<p className="text-sm text-slate-600 mt-1">
												{item.quantity} × ${(item.priceCents / 100).toFixed(2)}
											</p>
										</div>
										<div className="text-right font-medium text-slate-900">
											${(item.lineTotalCents / 100).toFixed(2)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{cart?.items?.length > 0 && (
					<div className="border-t border-slate-200 p-4 bg-slate-50/80">
						<div className="flex justify-between text-slate-600 text-sm mb-3">
							<span>Subtotal</span>
							<span className="font-semibold text-slate-900">${(cart.subtotalCents / 100).toFixed(2)}</span>
						</div>
						<button
							type="button"
							onClick={handleCheckout}
							className="btn-primary w-full py-3 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
						>
							Checkout
						</button>
					</div>
				)}
			</aside>

			<DeliveryFormModal
				isOpen={deliveryFormOpen}
				onClose={() => setDeliveryFormOpen(false)}
				onSubmit={handleDeliverySubmit}
				validation={validation}
			/>

			<CheckoutModal
				isOpen={checkoutOpen}
				onClose={() => setCheckoutOpen(false)}
				cartId={cartId}
				validation={validation}
				customerInfo={customerInfo}
				onSuccess={handlePaymentSuccess}
			/>

			{orderSuccess && (
				<div
					className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
					onClick={(e) => e.target === e.currentTarget && setOrderSuccess(null)}
				>
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
						<div className="p-6 border-b border-slate-200 flex items-center justify-between">
							<h3 className="text-lg font-semibold text-slate-900">Order placed</h3>
							<button
								type="button"
								onClick={() => setOrderSuccess(null)}
								className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
								aria-label="Close"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="p-6">
							<p className="text-slate-700">
								Thanks{customerInfo?.name ? `, ${customerInfo.name}` : ""}! Your order has been created.
							</p>
							{orderSuccess.orderId && (
								<p className="text-sm text-slate-500 mt-2">
									Order ID: <span className="font-medium text-slate-700">{orderSuccess.orderId}</span>
								</p>
							)}
							<div className="mt-5 flex gap-3">
								<button type="button" className="btn flex-1" onClick={() => { setOrderSuccess(null); onClose?.(); }}>
									Close
								</button>
								<button
									type="button"
									className="btn-primary flex-1"
									onClick={() => {
										setOrderSuccess(null);
									}}
								>
									Continue shopping
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default CartDrawer;
