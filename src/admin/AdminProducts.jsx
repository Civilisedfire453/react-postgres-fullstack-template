import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";

function AdminProducts() {
	const { authFetch } = useAuth();
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const load = async () => {
			try {
				const res = await authFetch("/api/products");
				if (!res.ok) {
					throw new Error(`API returned status: ${res.status}`);
				}
				const data = await res.json();
				setProducts(data.products ?? []);
			} catch (e) {
				console.error(e);
				setError("Error loading products");
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
			<h2>Products</h2>
			<table className="data-table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Brand</th>
						<th>Category</th>
						<th>Active</th>
						<th>Variants</th>
					</tr>
				</thead>
				<tbody>
					{products.map((p) => (
						<tr key={p.id}>
							<td>{p.name}</td>
							<td>{p.brand}</td>
							<td>{p.category}</td>
							<td>{p.is_active ? "Yes" : "No"}</td>
							<td>{p.variants?.length ?? 0}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default AdminProducts;

