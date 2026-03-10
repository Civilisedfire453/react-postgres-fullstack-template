import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";

const POLL_INTERVAL_MS = 15000;

function AdminOrders() {
	const { authFetch } = useAuth();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const load = useCallback(async () => {
		try {
			const res = await authFetch("/api/admin/orders");
			if (!res.ok) {
				throw new Error(`API returned status: ${res.status}`);
			}
			const data = await res.json();
			setOrders(data.orders ?? []);
			setError(null);
		} catch (e) {
			console.error(e);
			setError("Error loading orders");
		} finally {
			setLoading(false);
		}
	}, [authFetch]);

	useEffect(() => {
		load();
	}, [load]);

	useEffect(() => {
		if (!load) return;
		const interval = setInterval(load, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [load]);

	if (loading) {
		return (
			<div className="flex justify-center items-center py-10">
				<div className="h-8 w-8 border-2 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (error) {
		return <div className="text-red-600">{error}</div>;
	}

	const itemsList = (order) => {
		const list = Array.isArray(order.items) ? order.items : [];
		if (list.length === 0) return "—";
		return list
			.map(
				(i) =>
					`${i.product_name ?? "Product"}${i.variant_name ? ` (${i.variant_name})` : ""} × ${i.quantity}`
			)
			.join(", ");
	};

	return (
		<div className="card">
			<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
				<h2>Orders</h2>
				<span className="text-xs sm:text-sm text-slate-500">Auto-refreshes every 15s</span>
				<button type="button" onClick={load} className="btn text-sm w-full sm:w-auto">
					Refresh now
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="data-table min-w-[980px]">
					<thead>
						<tr>
							<th>ID</th>
							<th>Customer</th>
							<th>Email</th>
							<th>Phone</th>
							<th>Delivery</th>
							<th>Products</th>
							<th>Status</th>
							<th>Payment</th>
							<th>Total</th>
							<th>Created</th>
						</tr>
					</thead>
					<tbody>
						{orders.map((o) => (
							<tr key={o.id}>
								<td className="font-mono text-xs sm:text-sm">{o.public_order_id ?? o.id}</td>
								<td>{o.shipping_name ?? "-"}</td>
								<td>{o.customer_email ?? "-"}</td>
								<td>{o.customer_phone ?? "-"}</td>
								<td className="max-w-[180px] truncate" title={[o.shipping_address_line1, o.shipping_city, o.shipping_postcode].filter(Boolean).join(", ")}>
									{o.shipping_address_line1 ?? "-"}
									{o.shipping_city ? `, ${o.shipping_city}` : ""}
								</td>
								<td className="max-w-[220px]" title={itemsList(o)}>
									<span className="line-clamp-2">{itemsList(o)}</span>
								</td>
								<td>{o.status}</td>
								<td>{o.payment_status}</td>
								<td>${(o.total_cents / 100).toFixed(2)}</td>
								<td>{new Date(o.created_at).toLocaleString()}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default AdminOrders;

