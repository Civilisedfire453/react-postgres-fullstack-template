import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/category/:categoryId" element={<App />} />
					<Route path="/product/:productId" element={<App />} />
					<Route path="/admin/login" element={<AdminLogin />} />
					<Route path="/admin/*" element={<AdminLayout />} />
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
