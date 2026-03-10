import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";

function AdminProducts() {
	const { authFetch } = useAuth();
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [addOpen, setAddOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState(null);
	const [togglingId, setTogglingId] = useState(null);
	const [showInactive, setShowInactive] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [brand, setBrand] = useState("");
	const [category, setCategory] = useState("");
	const [sku, setSku] = useState("");
	const [variantName, setVariantName] = useState("");
	const [priceCents, setPriceCents] = useState("");
	const [stockQuantity, setStockQuantity] = useState("0");
	const [reorderThreshold, setReorderThreshold] = useState("0");

	const load = useCallback(async () => {
		try {
			const res = await authFetch("/api/admin/products");
			if (!res.ok) throw new Error(`API returned status: ${res.status}`);
			const data = await res.json();
			setProducts(data.products ?? []);
			setError(null);
		} catch (e) {
			console.error(e);
			setError("Error loading products");
		} finally {
			setLoading(false);
		}
	}, [authFetch]);

	const toggleActive = async (productId, nextActive) => {
		setTogglingId(productId);
		setError(null);
		try {
			const res = await authFetch(`/api/admin/products/${productId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ is_active: nextActive }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || "Failed to update product");
			}
			setProducts((prev) =>
				prev.map((p) => (p.id === productId ? { ...p, is_active: nextActive } : p)),
			);
			// If we just archived something, show archived items so it doesn't "disappear"
			if (!nextActive) setShowInactive(true);
		} catch (e) {
			setError(e.message || "Failed to update product");
		} finally {
			setTogglingId(null);
		}
	};

	const visibleProducts = showInactive
		? products
		: (products ?? []).filter((p) => p.is_active);

	useEffect(() => {
		load();
	}, [load]);

	const categories = Array.from(
		new Set(
			(products ?? [])
				.map((p) => (p?.category ?? "").trim())
				.filter(Boolean),
		),
	).sort((a, b) => a.localeCompare(b));

	const existingCategoryKeys = new Set(
		categories.map((c) => c.trim().toLowerCase()),
	);

	const openAdd = () => {
		setName("");
		setDescription("");
		setBrand("");
		setCategory("");
		setSku("");
		setVariantName("");
		setPriceCents("");
		setStockQuantity("0");
		setReorderThreshold("0");
		setFormError(null);
		setAddOpen(true);
	};

	const handleAddProduct = async (e) => {
		e.preventDefault();
		setFormError(null);
		if (!name.trim()) {
			setFormError("Product name is required");
			return;
		}
		if (category.trim()) {
			const key = category.trim().toLowerCase();
			if (existingCategoryKeys.has(key) && !categories.includes(category.trim())) {
				setFormError(
					`Category already exists. Please select "${categories.find((c) => c.trim().toLowerCase() === key)}" from the dropdown.`,
				);
				return;
			}
		}
		const skuVal = sku.trim() || `SKU-${Date.now()}`;
		const variantNameVal = variantName.trim() || name.trim();
		const price = Math.round(parseFloat(priceCents) * 100) || 0;
		if (price <= 0) {
			setFormError("Price must be greater than 0 (e.g. 29.99)");
			return;
		}
		setSaving(true);
		try {
			const res = await authFetch("/api/admin/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					product: {
						name: name.trim(),
						description: description.trim() || null,
						brand: brand.trim() || null,
						category: category.trim() || null,
						is_active: true,
					},
					variants: [
						{
							sku: skuVal,
							name: variantNameVal,
							pack_size: 1,
							price_cents: price,
							stock_quantity: parseInt(stockQuantity, 10) || 0,
							reorder_threshold: parseInt(reorderThreshold, 10) || 0,
						},
					],
				}),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || "Failed to create product");
			}
			setAddOpen(false);
			load();
		} catch (e) {
			setFormError(e.message || "Failed to add product");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-10">
				<div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (error) {
		return <div className="text-red-600">{error}</div>;
	}

	return (
		<div className="card">
			<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
				<div className="space-y-1">
					<h2>Products</h2>
					<label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={showInactive}
							onChange={(e) => setShowInactive(e.target.checked)}
							className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
						/>
						<span>Show inactive (archived)</span>
					</label>
				</div>
				<button
					type="button"
					onClick={openAdd}
					className="btn-primary inline-flex items-center gap-2"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Add product
				</button>
			</div>

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
					{visibleProducts.map((p) => (
						<tr key={p.id} className={!p.is_active ? "opacity-70" : ""}>
							<td>{p.name}</td>
							<td>{p.brand ?? "—"}</td>
							<td>{p.category ?? "—"}</td>
							<td>
								<button
									type="button"
									disabled={togglingId === p.id}
									onClick={() => toggleActive(p.id, !p.is_active)}
									className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
										p.is_active
											? "bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
											: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
									} ${togglingId === p.id ? "opacity-60 cursor-not-allowed" : ""}`}
									title={p.is_active ? "Archive product (hide from store)" : "Restore product (show in store)"}
								>
									<span
										className={`h-2.5 w-2.5 rounded-full ${
											p.is_active ? "bg-green-500" : "bg-slate-400"
										}`}
									/>
									{p.is_active ? "Active" : "Archived"}
								</button>
							</td>
							<td>{p.variants?.length ?? 0}</td>
						</tr>
					))}
				</tbody>
			</table>

			{addOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
					onClick={() => !saving && setAddOpen(false)}
				>
					<div
						className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-semibold text-slate-900">Add product</h3>
							<button
								type="button"
								onClick={() => !saving && setAddOpen(false)}
								className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
								aria-label="Close"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<p className="text-sm text-slate-500 mb-4">
							New products are saved to your Neon (PostgreSQL) database and will appear in the store and in Inventory.
						</p>

						<form onSubmit={handleAddProduct} className="space-y-4">
							{formError && (
								<div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
									{formError}
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Product name *</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
									placeholder="e.g. PureFlow Standard Pitcher"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={2}
									className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
									placeholder="Short description for the store"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
									<input
										type="text"
										value={brand}
										onChange={(e) => setBrand(e.target.value)}
										className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
										placeholder="e.g. PureFlow"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
									<div className="flex gap-2">
										<select
											value={category}
											onChange={(e) => setCategory(e.target.value)}
											className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
										>
											<option value="">Select a category…</option>
											{categories.map((c) => (
												<option key={c} value={c}>
													{c}
												</option>
											))}
										</select>
									</div>
									<p className="text-xs text-slate-500 mt-1">
										Don’t see it? You can type a new one below.
									</p>
									<input
										type="text"
										value={category}
										onChange={(e) => setCategory(e.target.value)}
										className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
										placeholder="Or type a new category (optional)"
									/>
								</div>
							</div>

							<div className="border-t border-slate-200 pt-4 mt-4">
								<h4 className="text-sm font-medium text-slate-700 mb-3">First variant (required)</h4>
								<div className="space-y-3">
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>
											<input
												type="text"
												value={sku}
												onChange={(e) => setSku(e.target.value)}
												className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
												placeholder="e.g. PF-STD-5L"
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-slate-500 mb-1">Variant name</label>
											<input
												type="text"
												value={variantName}
												onChange={(e) => setVariantName(e.target.value)}
												className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
												placeholder="e.g. 5L Family"
											/>
										</div>
									</div>
									<div className="grid grid-cols-3 gap-3">
										<div>
											<label className="block text-xs font-medium text-slate-500 mb-1">Price (AUD)</label>
											<input
												type="number"
												step="0.01"
												min="0"
												value={priceCents}
												onChange={(e) => setPriceCents(e.target.value)}
												className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
												placeholder="29.99"
												required
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-slate-500 mb-1">Stock</label>
											<input
												type="number"
												min="0"
												value={stockQuantity}
												onChange={(e) => setStockQuantity(e.target.value)}
												className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
											/>
										</div>
										<div>
											<label className="block text-xs font-medium text-slate-500 mb-1">Reorder at</label>
											<input
												type="number"
												min="0"
												value={reorderThreshold}
												onChange={(e) => setReorderThreshold(e.target.value)}
												className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="flex gap-3 pt-4">
								<button
									type="button"
									onClick={() => !saving && setAddOpen(false)}
									className="btn flex-1"
								>
									Cancel
								</button>
								<button type="submit" className="btn-primary flex-1" disabled={saving}>
									{saving ? "Saving…" : "Add product"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default AdminProducts;

