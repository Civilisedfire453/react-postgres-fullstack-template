import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Breadcrumbs from "./components/Breadcrumbs.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProductList from "./components/ProductList.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import CartPage from "./components/CartPage.jsx";

function App() {
	const navigate = useNavigate();
	const params = useParams();
	const [categories, setCategories] = useState([]);
	const [cartId, setCartId] = useState(null);

	const { productId } = params;
	const { categoryId } = params;
	const activeCategory = categoryId ? decodeURIComponent(categoryId) : null;

	useEffect(() => {
		const loadCategories = async () => {
			try {
				const res = await fetch("/api/products");
				if (!res.ok) {
					throw new Error(`API returned status: ${res.status}`);
				}
				const data = await res.json();
				const products = data.products ?? [];
				const byCategory = {};
				for (const p of products) {
					if (!p.category) continue;
					if (!byCategory[p.category]) byCategory[p.category] = 0;
					byCategory[p.category] += 1;
				}
				const cats = Object.entries(byCategory)
					.map(([name, count]) => ({ name, count }))
					.sort((a, b) => a.name.localeCompare(b.name));
				setCategories(cats);
			} catch (e) {
				console.error("Error loading categories", e);
			}
		};
		loadCategories();
	}, []);

	const handleSelectCategory = (category) => {
		if (category) {
			navigate(`/category/${encodeURIComponent(category)}`);
		} else {
			navigate("/");
		}
	};

	const handleCartUpdated = (newCartId) => {
		setCartId(newCartId);
	};

	const headerTitle = activeCategory ? `${activeCategory} filters` : "Water filters";
	const headerSubtitle = activeCategory
		? `Browse our ${activeCategory.toLowerCase()} water filters`
		: "High-quality water filters for every home";

	return (
		<div className="layout">
			<Sidebar
				genres={categories}
				activeGenre={activeCategory}
				onSelectGenre={handleSelectCategory}
				counts
				title="Filters"
			/>

			<main className="main-content">
				{!productId && (
					<Breadcrumbs
						items={[
							{ label: "All Filters", value: null },
							...(activeCategory
								? [{ label: activeCategory, value: activeCategory }]
								: []),
						]}
						onNavigate={(value) => {
							if (value === null) {
								handleSelectCategory(null);
							}
						}}
					/>
				)}

				<div className="page-header">
					<h1>{headerTitle}</h1>
					<p className="text-gray-900">{headerSubtitle}</p>
				</div>

				{productId ? (
					<ProductDetail
						productId={productId}
						onCartUpdated={handleCartUpdated}
					/>
				) : (
					<ProductList activeCategory={activeCategory} />
				)}

				<div className="mt-12">
					<CartPage cartId={cartId} />
				</div>
			</main>
		</div>
	);
}

export default App;
