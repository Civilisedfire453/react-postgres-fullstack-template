import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2, ShoppingBag } from "lucide-react";
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
	const location = useLocation();
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
		<div className="layout app-shell">
			<header className="fixed top-0 right-0 left-[280px] h-14 bg-white/95 backdrop-blur border-b border-slate-200/80 z-20 flex items-center justify-between px-6 transition-all duration-300">
				<Link to="/" className="font-serif text-lg font-semibold text-slate-800 hover:text-teal-600 transition-colors">
					PureFlow
				</Link>
				<div className="flex items-center gap-5 text-sm">
					<motion.button
						type="button"
						onClick={() => setCartDrawerOpen(true)}
						className="relative p-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-teal-600 transition-colors"
						aria-label={`Cart, ${cartCount} items`}
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.97 }}
					>
						<ShoppingBag className="w-6 h-6" strokeWidth={1.8} />
						{cartCount > 0 && (
							<span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-teal-500 text-white text-xs font-semibold">
								{cartCount > 99 ? "99+" : cartCount}
							</span>
						)}
					</motion.button>
					<Link to="/admin/login" className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 transition-colors" aria-label="Admin">
						<Settings2 className="w-5 h-5" strokeWidth={1.8} />
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

			<AnimatePresence mode="wait">
				<motion.main
					key={location.pathname}
					className="main-content pt-14"
					initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
					transition={{ duration: 0.25, ease: "easeOut" }}
				>
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
				</motion.main>
			</AnimatePresence>

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
