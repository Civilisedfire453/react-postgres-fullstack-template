import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";

function AdminOrders() {
	const { authFetch } = useAuth();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const load = async () => {
			try {
				const res = await authFetch("/api/admin/orders");
				if (!res.ok) {
					throw new Error(`API returned status: ${res.status}`);
				}
				const data = await res.json();
				setOrders(data.orders ?? []);
			} catch (e) {
				console.error(e);
				setError("Error loading orders");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [authFetch]);

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

	return (
		<div className="card">
			<h2>Orders</h2>
			<table className="data-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>User</th>
						<th>Status</th>
						<th>Payment</th>
						<th>Total</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{orders.map((o) => (
						<tr key={o.id}>
							<td>{o.id}</td>
							<td>{o.user_id ?? "-"}</td>
							<td>{o.status}</td>
							<td>{o.payment_status}</td>
							<td>${(o.total_cents / 100).toFixed(2)}</td>
							<td>{new Date(o.created_at).toLocaleString()}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default AdminOrders;

