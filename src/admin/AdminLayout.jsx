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

			<div className="flex-1 flex flex-col ml-[280px] min-h-screen">
				<header className="h-14 flex items-center justify-between px-6 border-b border-slate-200/80 bg-white/95 backdrop-blur shrink-0">
					<div>
						<h1 className="text-lg font-semibold text-slate-900">Admin dashboard</h1>
						<p className="text-xs text-slate-500">Manage products, inventory, and orders</p>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-sm text-slate-600">{user.email}</span>
						<button
							type="button"
							onClick={logout}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 hover:border-slate-400 transition-colors"
						>
							<LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
							Log out
						</button>
					</div>
				</header>

				<AnimatePresence mode="wait">
					<motion.main
						key={location.pathname}
						className="flex-1 py-8 px-6 md:px-10"
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

