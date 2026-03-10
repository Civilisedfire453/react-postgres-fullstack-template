import { Link, Routes, Route, Navigate, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Boxes, ClipboardList, LogOut, PackageSearch } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import AdminProducts from "./AdminProducts.jsx";
import AdminInventory from "./AdminInventory.jsx";
import AdminOrders from "./AdminOrders.jsx";

function AdminLayout() {
	const { user, logout } = useAuth();
	const location = useLocation();

	if (!user || user.role !== "admin") {
		return <Navigate to="/admin/login" replace />;
	}

	const isActive = (path) =>
		location.pathname.startsWith(path) ? "sidebar-link-active" : "sidebar-link";

	const mobileTabClass = (path) =>
		location.pathname.startsWith(path)
			? "px-3 py-1.5 rounded-full text-sm bg-teal-100 text-teal-800 border border-teal-200"
			: "px-3 py-1.5 rounded-full text-sm bg-white text-slate-600 border border-slate-200";

	return (
		<div className="layout app-shell">
			<aside className="sidebar">
				<div className="sidebar-title">Admin</div>
				<nav className="sidebar-nav">
					<Link to="/" className="block px-3 py-2.5 text-slate-500 hover:text-teal-600 text-sm rounded-xl hover:bg-teal-50 transition-colors">
						<span className="inline-flex items-center gap-2">
							<ArrowLeft className="w-4 h-4" strokeWidth={2} />
							Back to store
						</span>
					</Link>
					<div className="h-px bg-slate-200 my-2 mx-3" />
					<Link to="/admin/products" className={isActive("/admin/products")}>
						<span className="inline-flex items-center gap-2">
							<PackageSearch className="w-4 h-4" strokeWidth={1.9} />
							Products
						</span>
					</Link>
					<Link
						to="/admin/inventory"
						className={isActive("/admin/inventory")}
					>
						<span className="inline-flex items-center gap-2">
							<Boxes className="w-4 h-4" strokeWidth={1.9} />
							Inventory
						</span>
					</Link>
					<Link to="/admin/orders" className={isActive("/admin/orders")}>
						<span className="inline-flex items-center gap-2">
							<ClipboardList className="w-4 h-4" strokeWidth={1.9} />
							Orders
						</span>
					</Link>
				</nav>
			</aside>

			<div className="flex-1 flex flex-col ml-0 md:ml-[280px] min-h-screen min-w-0">
				<header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-200/80 bg-white/95 backdrop-blur shrink-0 gap-3">
					<div>
						<h1 className="text-base md:text-lg font-semibold text-slate-900">Admin dashboard</h1>
						<p className="text-[11px] md:text-xs text-slate-500">Manage products, inventory, and orders</p>
					</div>
					<div className="flex items-center gap-2 md:gap-3">
						<span className="hidden sm:inline text-sm text-slate-600">{user.email}</span>
						<button
							type="button"
							onClick={logout}
							className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs md:text-sm font-medium hover:bg-slate-100 hover:border-slate-400 transition-colors"
						>
							<LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
							<span className="hidden sm:inline">Log out</span>
						</button>
					</div>
				</header>

				<div className="md:hidden px-4 pt-3 pb-1 overflow-x-auto">
					<div className="flex items-center gap-2 min-w-max">
						<Link to="/admin/products" className={mobileTabClass("/admin/products")}>Products</Link>
						<Link to="/admin/inventory" className={mobileTabClass("/admin/inventory")}>Inventory</Link>
						<Link to="/admin/orders" className={mobileTabClass("/admin/orders")}>Orders</Link>
					</div>
				</div>

				<AnimatePresence mode="wait">
					<motion.main
						key={location.pathname}
						className="flex-1 py-5 md:py-8 px-4 md:px-10 min-w-0"
						initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
						transition={{ duration: 0.22, ease: "easeOut" }}
					>
						<Routes>
							<Route path="/" element={<Navigate to="products" replace />} />
							<Route path="products" element={<AdminProducts />} />
							<Route path="inventory" element={<AdminInventory />} />
							<Route path="orders" element={<AdminOrders />} />
						</Routes>
					</motion.main>
				</AnimatePresence>
			</div>
		</div>
	);
}

export default AdminLayout;

