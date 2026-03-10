import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import Breadcrumbs from "./components/Breadcrumbs.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ProductList from "./components/ProductList.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import CartDrawer from "./components/CartDrawer.jsx";

const ANON_KEY = "cart_anonymous_id";
function getOrCreateAnonId() {
	let id = localStorage.getItem(ANON_KEY);
	if (!id) {
		id = `anon_${crypto.randomUUID?.() || Date.now() + Math.random().toString(36).slice(2)}`;
		localStorage.setItem(ANON_KEY, id);
	}
	return id;
}

function App() {
	const navigate = useNavigate();
	const params = useParams();
	const [categories, setCategories] = useState([]);
	const [cartId, setCartId] = useState(null);
	const [cartCount, setCartCount] = useState(0);
	const [cartRefresh, setCartRefresh] = useState(0);
	const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
	const [anonId] = useState(getOrCreateAnonId);

	const { productId } = params;
	const { categoryId } = params;
	const activeCategory = categoryId ? decodeURIComponent(categoryId) : null;

	useEffect(() => {
		if (!cartId) {
			setCartCount(0);
			return;
		}
		let cancelled = false;
		fetch(`/api/cart/${cartId}`)
			.then((res) => (res.ok ? res.json() : { cart: null }))
			.then((data) => {
				if (!cancelled && data.cart?.items) {
					const total = data.cart.items.reduce((sum, i) => sum + i.quantity, 0);
					setCartCount(total);
				}
			})
			.catch(() => { if (!cancelled) setCartCount(0); });
		return () => { cancelled = true; };
	}, [cartId, cartRefresh]);

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
		setCartRefresh((r) => r + 1);
	};

	const handleCartCleared = () => {
		setCartId(null);
		setCartCount(0);
	};

	const headerTitle = activeCategory ? `${activeCategory} filters` : "Water filters";
	const headerSubtitle = activeCategory
		? `Browse our ${activeCategory.toLowerCase()} water filters`
		: "Clean water for every home";

	return (
		<div className="layout">
			<header className="fixed top-0 right-0 left-[280px] h-14 bg-white/95 backdrop-blur border-b border-slate-200/80 z-20 flex items-center justify-between px-6 transition-all duration-300">
				<Link to="/" className="font-serif text-lg font-semibold text-slate-800 hover:text-teal-600 transition-colors">
					PureFlow
				</Link>
				<div className="flex items-center gap-5 text-sm">
					<button
						type="button"
						onClick={() => setCartDrawerOpen(true)}
						className="relative p-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-teal-600 transition-colors"
						aria-label={`Cart, ${cartCount} items`}
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						{cartCount > 0 && (
							<span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-teal-500 text-white text-xs font-semibold">
								{cartCount > 99 ? "99+" : cartCount}
							</span>
						)}
					</button>
					<Link to="/admin/login" className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 transition-colors" aria-label="Admin">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span>Admin</span>
					</Link>
				</div>
			</header>
			<Sidebar
				genres={categories}
				activeGenre={activeCategory}
				onSelectGenre={handleSelectCategory}
				counts
				title="Filters"
			/>

			<main className="main-content pt-14">
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
					<p className="text-slate-600 text-lg">{headerSubtitle}</p>
				</div>

				{productId ? (
					<ProductDetail
						productId={productId}
						cartId={cartId}
						anonymousId={anonId}
						onCartUpdated={handleCartUpdated}
					/>
				) : (
					<ProductList activeCategory={activeCategory} />
				)}
			</main>

			<CartDrawer
				isOpen={cartDrawerOpen}
				onClose={() => setCartDrawerOpen(false)}
				cartId={cartId}
				onCartCleared={handleCartCleared}
				onCartRefresh={() => setCartRefresh((r) => r + 1)}
			/>
		</div>
	);
}

export default App;
