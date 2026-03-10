import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";

function AdminInventory() {
	const { authFetch } = useAuth();
	const [variants, setVariants] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const load = async () => {
			try {
				const res = await authFetch("/api/admin/inventory?low_stock=true");
				if (!res.ok) {
					throw new Error(`API returned status: ${res.status}`);
				}
				const data = await res.json();
				setVariants(data.variants ?? []);
			} catch (e) {
				console.error(e);
				setError("Error loading inventory");
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
			<h2>Low stock variants</h2>
			<table className="data-table">
				<thead>
					<tr>
						<th>Product</th>
						<th>Variant</th>
						<th>SKU</th>
						<th>Stock</th>
						<th>Reorder at</th>
					</tr>
				</thead>
				<tbody>
					{variants.map((v) => (
						<tr key={v.id}>
							<td>{v.product_name}</td>
							<td>{v.name}</td>
							<td>{v.sku}</td>
							<td>{v.stock_quantity}</td>
							<td>{v.reorder_threshold}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default AdminInventory;

