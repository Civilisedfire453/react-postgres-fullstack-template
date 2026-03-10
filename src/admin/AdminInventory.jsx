import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";

function AdminInventory() {
	const { authFetch } = useAuth();
	const [variants, setVariants] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [lowStockOnly, setLowStockOnly] = useState(false);
	const [adjustingId, setAdjustingId] = useState(null);
	const [adjustDelta, setAdjustDelta] = useState("");
	const [adjustReason, setAdjustReason] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const url = `/api/admin/inventory${lowStockOnly ? "?low_stock=true" : ""}`;
			const res = await authFetch(url);
			if (!res.ok) throw new Error(`API returned status: ${res.status}`);
			const data = await res.json();
			setVariants(data.variants ?? []);
		} catch (e) {
			console.error(e);
			setError("Error loading inventory");
		} finally {
			setLoading(false);
		}
	}, [authFetch, lowStockOnly]);

	useEffect(() => {
		load();
	}, [load]);

	const handleAdjust = async () => {
		if (!adjustingId || !adjustDelta || Number(adjustDelta) === 0) return;
		const delta = Number(adjustDelta);
		try {
			const res = await authFetch(`/api/admin/variants/${adjustingId}/adjust-inventory`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ delta, reason: adjustReason || null }),
			});
			if (!res.ok) throw new Error("Adjust failed");
			setAdjustingId(null);
			setAdjustDelta("");
			setAdjustReason("");
			load();
		} catch (e) {
			console.error(e);
			setError("Failed to adjust inventory");
		}
	};

	if (loading && variants.length === 0) {
		return (
			<div className="flex justify-center items-center py-10">
				<div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (error && variants.length === 0) {
		return <div className="text-red-600">{error}</div>;
	}

	return (
		<div className="card">
			<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
				<h2>Inventory</h2>
				<label className="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={lowStockOnly}
						onChange={(e) => setLowStockOnly(e.target.checked)}
						className="rounded border-gray-300"
					/>
					<span>Low stock only</span>
				</label>
			</div>
			<table className="data-table">
				<thead>
					<tr>
						<th>Product</th>
						<th>Variant</th>
						<th>SKU</th>
						<th>Stock</th>
						<th>Reorder at</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{variants.map((v) => {
						const isLow = v.stock_quantity <= v.reorder_threshold;
						const isOut = v.stock_quantity <= 0;
						const isAdjusting = adjustingId === v.id;
						return (
							<tr key={v.id} className={isOut ? "bg-red-50" : isLow ? "bg-amber-50" : ""}>
								<td>{v.product_name}</td>
								<td>{v.name}</td>
								<td className="font-mono text-sm">{v.sku}</td>
								<td className="font-semibold">{v.stock_quantity}</td>
								<td>{v.reorder_threshold}</td>
								<td>
									<span
										className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
											isOut
												? "bg-red-200 text-red-800"
												: isLow
													? "bg-amber-200 text-amber-800"
													: "bg-green-100 text-green-800"
										}`}
									>
										{isOut ? "Out" : isLow ? "Low" : "OK"}
									</span>
								</td>
								<td>
									{isAdjusting ? (
										<div className="flex items-center gap-2">
											<input
												type="number"
												placeholder="+/- qty"
												value={adjustDelta}
												onChange={(e) => setAdjustDelta(e.target.value)}
												className="w-20 px-2 py-1 text-sm border rounded"
											/>
											<input
												type="text"
												placeholder="Reason"
												value={adjustReason}
												onChange={(e) => setAdjustReason(e.target.value)}
												className="w-24 px-2 py-1 text-sm border rounded"
											/>
											<button
												onClick={handleAdjust}
												className="px-2 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700"
											>
												Apply
											</button>
											<button
												onClick={() => {
													setAdjustingId(null);
													setAdjustDelta("");
													setAdjustReason("");
												}}
												className="text-sm text-gray-500 hover:text-gray-700"
											>
												Cancel
											</button>
										</div>
									) : (
										<button
											onClick={() => setAdjustingId(v.id)}
											className="text-sm text-teal-600 hover:text-teal-800 font-medium"
										>
											Adjust
										</button>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{variants.length === 0 && (
				<p className="text-gray-500 mt-4">
					{lowStockOnly ? "No low-stock variants." : "No variants found."}
				</p>
			)}
		</div>
	);
}

export default AdminInventory;

