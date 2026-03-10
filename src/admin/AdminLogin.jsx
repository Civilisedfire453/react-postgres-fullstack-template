import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../AuthContext.jsx";

function AdminLogin() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState("admin@example.com");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await login(email, password);
			navigate("/admin/products", { replace: true });
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="layout">
			<main className="main-content flex items-center justify-center">
				<div className="card max-w-md w-full">
					<h2>Admin login</h2>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<input
								type="email"
								className="w-full px-3 py-2 border border-gray-300 rounded-md"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<input
								type="password"
								className="w-full px-3 py-2 border border-gray-300 rounded-md"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						{error && (
							<div className="text-sm text-red-600">{error}</div>
						)}
						<button
							type="submit"
							className="btn-primary w-full"
							disabled={loading}
						>
							{loading ? "Signing in..." : "Sign in"}
						</button>
						<p className="text-xs text-gray-600 mt-2">
							Default admin user is <code>admin@example.com</code>. Set a
							secure password in production.
						</p>
					</form>
				</div>
			</main>
		</div>
	);
}

export default AdminLogin;

