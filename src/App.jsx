import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets, ShieldCheck, Sparkles, Truck, Settings2, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
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
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
	const [anonId] = useState(getOrCreateAnonId);

	const { productId } = params;
	const { categoryId } = params;
	const activeCategory = categoryId ? decodeURIComponent(categoryId) : null;
	const isHome = !activeCategory && !productId;

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
		let cancelled = false;

		const loadCategories = async (attempt = 0) => {
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
				if (!cancelled) {
					setCategories(cats);
				}
			} catch (e) {
				console.error("Error loading categories", e);
				// Retry a few times for local/dev cold starts.
				if (!cancelled && attempt < 2) {
					setTimeout(() => {
						void loadCategories(attempt + 1);
					}, 800 * (attempt + 1));
				}
			}
		};
		void loadCategories();

		return () => {
			cancelled = true;
		};
	}, []);

	const visibleCategories = useMemo(() => {
		if (categories.length > 0) return categories;
		if (!activeCategory) return categories;
		return [{ name: activeCategory, count: 0 }];
	}, [categories, activeCategory]);

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

	const categoryMentionsFilters = useMemo(() => {
		if (!activeCategory) return false;
		return /\bfilters?\b\s*$/i.test(activeCategory.trim());
	}, [activeCategory]);

	const headerTitle = useMemo(() => {
		if (activeCategory) {
			return categoryMentionsFilters ? activeCategory : `${activeCategory} filters`;
		}
		return "Water filters";
	}, [activeCategory, categoryMentionsFilters]);

	const headerSubtitle = useMemo(() => {
		if (activeCategory) {
			const categoryText = activeCategory.toLowerCase();
			return categoryMentionsFilters
				? `Browse our ${categoryText}`
				: `Browse our ${categoryText} water filters`;
		}
		return "Clean water for every home";
	}, [activeCategory, categoryMentionsFilters]);

	const scrollToProducts = () => {
		const el = document.getElementById("products");
		el?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<div className="layout app-shell">
			<header className="fixed top-0 right-0 left-0 md:left-[280px] h-14 bg-white/95 backdrop-blur border-b border-slate-200/80 z-20 flex items-center justify-between px-4 md:px-6 transition-all duration-300">
				<div className="flex items-center gap-2.5">
					<button
						type="button"
						onClick={() => setMobileFiltersOpen(true)}
						className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white"
					>
						<SlidersHorizontal className="w-4 h-4" strokeWidth={1.8} />
						<span className="text-sm font-medium">Filters</span>
					</button>
					<Link to="/" className="font-serif text-lg font-semibold text-slate-800 hover:text-teal-600 transition-colors">
						PureFlow
					</Link>
				</div>
				<div className="flex items-center gap-3 sm:gap-5 text-sm">
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
						<span className="hidden sm:inline">Admin</span>
					</Link>
				</div>
			</header>
			<Sidebar
				genres={visibleCategories}
				activeGenre={activeCategory}
				onSelectGenre={handleSelectCategory}
				counts
				title="Filters"
			/>

			<AnimatePresence mode="wait">
				<motion.main
					key={location.pathname}
					className="main-content pt-16 md:pt-14"
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

					{isHome ? (
						<section className="hero">
							<div className="hero-inner">
								<div className="hero-eyebrow">
									<Sparkles className="w-4 h-4" strokeWidth={2} />
									<span>PureFlow water filters</span>
								</div>
								<h1 className="hero-title">
									Clean, great‑tasting water
									<br />
									<span className="hero-title-accent">in minutes</span>
								</h1>
								<p className="hero-subtitle">
									Shop countertop, under‑sink, and whole‑home filters—built for
									clarity, performance, and peace of mind.
								</p>

								<div className="hero-actions">
									<button type="button" className="btn-primary" onClick={scrollToProducts}>
										Shop filters
									</button>
									<button
										type="button"
										className="btn"
										onClick={() => setCartDrawerOpen(true)}
									>
										Open cart
									</button>
								</div>

								<div className="hero-badges">
									<div className="hero-badge">
										<ShieldCheck className="w-4 h-4" strokeWidth={2} />
										<span>Quality‑checked</span>
									</div>
									<div className="hero-badge">
										<Truck className="w-4 h-4" strokeWidth={2} />
										<span>Fast dispatch</span>
									</div>
									<div className="hero-badge">
										<Droplets className="w-4 h-4" strokeWidth={2} />
										<span>Better taste</span>
									</div>
								</div>
							</div>
						</section>
					) : (
						<div className="page-header">
							<h1>{headerTitle}</h1>
							<p className="text-slate-600 text-lg">{headerSubtitle}</p>
						</div>
					)}

					{productId ? (
						<ProductDetail
							productId={productId}
							cartId={cartId}
							anonymousId={anonId}
							onCartUpdated={handleCartUpdated}
						/>
					) : (
						<div id="products" className="scroll-mt-24">
							<ProductList activeCategory={activeCategory} />
						</div>
					)}
				</motion.main>
			</AnimatePresence>

			<AnimatePresence>
				{mobileFiltersOpen && (
					<>
						<motion.div
							className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm md:hidden"
							onClick={() => setMobileFiltersOpen(false)}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.18 }}
						/>
						<motion.aside
							className="fixed top-0 left-0 bottom-0 z-50 w-[86vw] max-w-[340px] bg-white border-r border-slate-200 shadow-xl md:hidden flex flex-col"
							initial={{ x: -24, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							exit={{ x: -20, opacity: 0 }}
							transition={{ type: "spring", stiffness: 420, damping: 36 }}
						>
							<div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
								<div className="font-serif text-2xl font-semibold text-slate-800">Filters</div>
								<button
									type="button"
									onClick={() => setMobileFiltersOpen(false)}
									className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
									aria-label="Close filters"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							<nav className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
								<button
									type="button"
									onClick={() => {
										handleSelectCategory(null);
										setMobileFiltersOpen(false);
									}}
									className={
										activeCategory === null
											? "w-full text-left px-4 py-3 rounded-xl bg-teal-50 text-teal-800 font-medium"
											: "w-full text-left px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50"
									}
								>
									All Filters
								</button>

								<div className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
									Categories
								</div>

								{visibleCategories.map((category) => (
									<button
										key={category.name}
										type="button"
										onClick={() => {
											handleSelectCategory(category.name);
											setMobileFiltersOpen(false);
										}}
										className={
											activeCategory === category.name
												? "w-full text-left px-4 py-3 rounded-xl bg-teal-50 text-teal-800 font-medium"
												: "w-full text-left px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50"
										}
									>
										{category.name}
										<span className="ml-2 text-xs text-slate-400">({category.count})</span>
									</button>
								))}
							</nav>

							<div className="px-5 py-4 border-t border-slate-200 text-xs text-slate-400">
								Powered by <span className="text-teal-600">Cloudflare</span>
							</div>
						</motion.aside>
					</>
				)}
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
