import { Link, Routes, Route, Navigate, useLocation } from "react-router";
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
		<div className="layout">
			<aside className="sidebar">
				<div className="sidebar-title">Admin</div>
				<nav className="sidebar-nav">
					<Link to="/" className="block px-3 py-2.5 text-slate-500 hover:text-teal-600 text-sm rounded-xl hover:bg-teal-50 transition-colors">
						← Back to store
					</Link>
					<div className="h-px bg-slate-200 my-2 mx-3" />
					<Link to="/admin/products" className={isActive("/admin/products")}>
						Products
					</Link>
					<Link
						to="/admin/inventory"
						className={isActive("/admin/inventory")}
					>
						Inventory
					</Link>
					<Link to="/admin/orders" className={isActive("/admin/orders")}>
						Orders
					</Link>
				</nav>
			</aside>

			<div className="flex-1 flex flex-col ml-[280px] min-h-screen">
				<header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
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
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							Log out
						</button>
					</div>
				</header>

				<main className="flex-1 py-8 px-6 md:px-10">
					<Routes>
						<Route path="/" element={<Navigate to="products" replace />} />
						<Route path="products" element={<AdminProducts />} />
						<Route path="inventory" element={<AdminInventory />} />
						<Route path="orders" element={<AdminOrders />} />
					</Routes>
				</main>
			</div>
		</div>
	);
}

export default AdminLayout;

