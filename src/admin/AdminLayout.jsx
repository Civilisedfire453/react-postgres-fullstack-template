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
				<div className="mt-auto pt-6 px-6">
					<div className="text-xs text-gray-900 mb-2">
						Signed in as {user.email}
					</div>
					<button
						type="button"
						className="btn w-full"
						onClick={logout}
					>
						Log out
					</button>
				</div>
			</aside>

			<main className="main-content">
				<div className="page-header">
					<h1>Admin dashboard</h1>
					<p className="text-gray-900">
						Manage products, inventory, and orders.
					</p>
				</div>
				<Routes>
					<Route path="/" element={<Navigate to="products" replace />} />
					<Route path="products" element={<AdminProducts />} />
					<Route path="inventory" element={<AdminInventory />} />
					<Route path="orders" element={<AdminOrders />} />
				</Routes>
			</main>
		</div>
	);
}

export default AdminLayout;

