import { useEffect, useRef, useState } from "react";

const FZ_SCRIPT = "https://cdn.pmnts-sandbox.io/sdk/v1/fatzebra.js";

function CheckoutModal({ isOpen, onClose, cartId, validation, customerInfo, onSuccess }) {
	const containerRef = useRef(null);
	const fzRef = useRef(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!isOpen || !validation || !validation.fatZebraUsername) {
			setLoading(false);
			return;
		}

		let cancelled = false;

		const init = async () => {
			setError(null);
			setLoading(true);

			if (!window.FatZebra) {
				await new Promise((resolve, reject) => {
					const script = document.createElement("script");
					script.src = FZ_SCRIPT;
					script.onload = resolve;
					script.onerror = () => reject(new Error("Failed to load Fat Zebra SDK"));
					document.head.appendChild(script);
				});
			}

			if (cancelled) return;

			try {
				const fz = new window.FatZebra({
					username: validation.fatZebraUsername,
				});
				fzRef.current = fz;

				fz.on("fz.payment.success", async (event) => {
					try {
						await onSuccess?.(event);
					} finally {
						onClose?.();
					}
				});

				fz.on("fz.payment.error", (event) => {
					setError(event?.errors?.join(", ") || "Payment failed");
				});

				fz.on("fz.validation.error", (event) => {
					setError(event?.errors?.join(", ") || "Validation error");
				});

				const nameParts = (customerInfo?.name || "Guest").trim().split(/\s+/);
				const firstName = nameParts[0] || "Customer";
				const lastName = nameParts.slice(1).join(" ") || "Guest";
				fz.renderPaymentsPage({
					containerId: "fz-checkout-container",
					customer: {
						firstName,
						lastName,
						email: customerInfo?.email || "guest@example.com",
						address: customerInfo?.addressLine1 || "",
						city: customerInfo?.city || "",
						postcode: customerInfo?.postcode || "",
						state: customerInfo?.state || "",
						country: customerInfo?.country || "AU",
					},
					paymentIntent: {
						payment: {
							amount: validation.totalCents,
							currency: validation.currency || "AUD",
							reference: `CART-${cartId}`,
						},
						verification: `ver-${cartId}-${Date.now()}`,
					},
					options: {
						hideButton: false,
						enableSca: false,
					},
				});
			} catch (e) {
				setError(e.message || "Failed to init payment");
			} finally {
				setLoading(false);
			}
		};

		init();
		return () => {
			cancelled = true;
		};
	}, [isOpen, validation, cartId, customerInfo]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={(e) => e.target === e.currentTarget && onClose?.()}
		>
			<div
				className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6 border-b border-slate-200 flex items-center justify-between">
					<h2 className="text-xl font-semibold text-slate-900">Checkout</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
						aria-label="Close"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{validation && (
					<div className="p-6 bg-slate-50 border-b border-slate-200">
						<div className="flex justify-between text-sm">
							<span className="text-slate-600">Subtotal</span>
							<span>${(validation.subtotalCents / 100).toFixed(2)}</span>
						</div>
						{validation.taxCents > 0 && (
							<div className="flex justify-between text-sm mt-1">
								<span className="text-slate-600">Tax</span>
								<span>${(validation.taxCents / 100).toFixed(2)}</span>
							</div>
						)}
						{validation.shippingCents > 0 && (
							<div className="flex justify-between text-sm mt-1">
								<span className="text-slate-600">Shipping</span>
								<span>${(validation.shippingCents / 100).toFixed(2)}</span>
							</div>
						)}
						<div className="flex justify-between font-semibold text-slate-900 mt-3 pt-3 border-t border-slate-200">
							<span>Total</span>
							<span>${(validation.totalCents / 100).toFixed(2)} {validation.currency}</span>
						</div>
					</div>
				)}

				<div className="p-6">
					{error && (
						<div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
							{error}
						</div>
					)}

					{!validation?.fatZebraUsername ? (
						<div className="space-y-4">
							<div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
								<p className="font-medium">Payment processing not configured</p>
								<p className="mt-1">
									Fat Zebra is not set up yet. Set <code className="bg-amber-100 px-1 rounded">FATZEBRA_USERNAME</code> and{" "}
									<code className="bg-amber-100 px-1 rounded">FATZEBRA_TOKEN</code> as Wrangler secrets to accept real payments.
								</p>
							</div>
							<div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-slate-700 text-sm">
								<p className="font-medium">Demo mode</p>
								<p className="mt-1">
									You can complete this order in demo mode. No payment will be taken. The order and customer details will be saved so you can test the full flow and view orders in the admin.
								</p>
							</div>
							<button
								type="button"
								onClick={async () => {
									await onSuccess?.({ response: { id: "demo-no-payment" } });
									onClose?.();
								}}
								className="btn-primary w-full py-3"
							>
								Complete order (demo – no payment)
							</button>
						</div>
					) : (
						<div className="relative min-h-[200px]">
							{loading && (
								<div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl z-10">
									<div className="h-10 w-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
								</div>
							)}
							<div id="fz-checkout-container" ref={containerRef} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default CheckoutModal;
