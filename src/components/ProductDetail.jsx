import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Breadcrumbs from "./Breadcrumbs.jsx";

function ProductDetail({ productId, onCartUpdated }) {
	const navigate = useNavigate();
	const [product, setProduct] = useState(null);
	const [selectedVariantId, setSelectedVariantId] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const res = await fetch(`/api/products/${productId}`);
				if (!res.ok) {
					throw new Error(`API returned status: ${res.status}`);
				}
				const data = await res.json();
				setProduct(data.product);
				if (data.product?.variants?.length) {
					setSelectedVariantId(data.product.variants[0].id);
				}
			} catch (e) {
				console.error("Error loading product", e);
				setError("Error loading product");
			} finally {
				setLoading(false);
			}
		};

		fetchProduct();
	}, [productId]);

	if (loading) {
		return (
			<div className="flex justify-center items-center py-20">
				<div className="h-10 w-10 border-2 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (!product) {
		return (
			<div className="text-center py-20 text-gray-600">
				{error || "Product not found"}
			</div>
		);
	}

	const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
	const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);

	const breadcrumbItems = [{ label: "All Filters", value: null }];
	if (product.category) {
		breadcrumbItems.push({ label: product.category, value: product.category });
	}
	breadcrumbItems.push({ label: product.name, value: "product" });

	const handleBreadcrumbNavigate = (value) => {
		if (value === null) {
			navigate("/");
		} else if (value !== "product") {
			navigate(`/category/${encodeURIComponent(value)}`);
		}
	};

	const handleAddToCart = async () => {
		if (!selectedVariant) return;
		setSaving(true);
		setError(null);
		try {
			const res = await fetch("/api/cart", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: [
						{
							productVariantId: selectedVariant.id,
							quantity: quantity,
						},
					],
				}),
			});

			if (!res.ok) {
				throw new Error(`API returned status: ${res.status}`);
			}
			const data = await res.json();
			onCartUpdated?.(data.cartId);
		} catch (e) {
			console.error("Error adding to cart", e);
			setError("Could not add to cart");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div>
			<Breadcrumbs items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />

			<div className="space-y-12 mt-6">
				<div className="card">
					<div className="md:flex gap-10">
						<div className="md:w-1/3 lg:w-1/4 flex-shrink-0 mb-8 md:mb-0">
							{primaryImage ? (
								<img
									src={primaryImage.image_url}
									alt={product.name}
									className="w-full h-full object-contain rounded-md border border-gray-200"
								/>
							) : (
								<div className="w-full h-48 flex items-center justify-center border border-gray-200 rounded-md text-gray-400">
									No image
								</div>
							)}
						</div>
						<div className="md:w-2/3 lg:w-3/4 space-y-4">
							<h1 className="mb-1">{product.name}</h1>
							{product.brand && (
								<h2 className="text-xl text-gray-900 mb-4 font-serif font-normal">
									by {product.brand}
								</h2>
							)}

							<p className="text-gray-900 leading-relaxed">
								{product.description}
							</p>

							{product.variants?.length > 0 && (
								<div className="mt-4 space-y-2">
									<div className="text-sm font-medium text-gray-700">
										Choose a variant
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{product.variants.map((variant) => {
											const isSelected = variant.id === selectedVariantId;
											const price = (variant.price_cents / 100).toFixed(2);
											const outOfStock = variant.stock_quantity <= 0;
											return (
												<button
													key={variant.id}
													type="button"
													className={`border rounded-lg p-3 text-left text-sm ${
														isSelected
															? "border-blue-800 bg-blue-50"
															: "border-gray-200 hover:border-blue-300"
													} ${outOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
													onClick={() =>
														!outOfStock &&
														setSelectedVariantId(variant.id)
													}
												>
													<div className="font-medium text-gray-900">
														{variant.name}
													</div>
													<div className="text-gray-700">
														${price}{" "}
														{variant.pack_size > 1 &&
															` • Pack of ${variant.pack_size}`}
													</div>
													<div className="text-xs text-gray-600 mt-1">
														{outOfStock
															? "Out of stock"
															: `In stock: ${variant.stock_quantity}`}
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							<div className="mt-6 flex items-center gap-4">
								<label className="text-sm text-gray-700">
									Quantity
									<input
										type="number"
										min="1"
										value={quantity}
										onChange={(e) =>
											setQuantity(Math.max(1, Number(e.target.value) || 1))
										}
										className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded-md"
									/>
								</label>
								<button
									type="button"
									className="btn-primary"
									onClick={handleAddToCart}
									disabled={saving || !selectedVariant}
								>
									{saving ? "Adding..." : "Add to cart"}
								</button>
								{error && (
									<div className="text-sm text-red-600">{error}</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ProductDetail;

