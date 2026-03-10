import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import ProductCard from "./ProductCard.jsx";

function useProducts(filters) {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const params = new URLSearchParams();
				if (filters.category) params.append("category", filters.category);
				if (filters.brand) params.append("brand", filters.brand);
				if (filters.inStock) params.append("in_stock", "true");
				if (filters.search) params.append("search", filters.search);

				const url = `/api/products${params.toString() ? `?${params.toString()}` : ""}`;
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error(`API returned status: ${response.status}`);
				}

				const data = await response.json();
				setProducts(data.products ?? []);
			} catch (error) {
				console.error("Error loading products:", error);
				setProducts([]);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, [filters.category, filters.brand, filters.inStock, filters.search]);

	return { products, loading };
}

function ProductList({ activeCategory }) {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const [inStockOnly, setInStockOnly] = useState(false);
	const { products, loading } = useProducts({
		category: activeCategory,
		inStock: inStockOnly,
		search,
	});

	const handleProductSelect = (productId) => {
		navigate(`/product/${productId}`);
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-20">
				<div className="h-10 w-10 border-2 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
				<input
					type="text"
					placeholder="Search filters..."
					className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-1/2"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<label className="inline-flex items-center space-x-2 text-sm text-gray-700">
					<input
						type="checkbox"
						className="mr-1"
						checked={inStockOnly}
						onChange={(e) => setInStockOnly(e.target.checked)}
					/>
					<span>Show in-stock only</span>
				</label>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{products.map((product) => (
					<ProductCard
						key={product.id}
						product={product}
						onClick={() => handleProductSelect(product.id)}
					/>
				))}
			</div>
		</div>
	);
}

export default ProductList;

