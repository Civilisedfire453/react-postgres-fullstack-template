import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);

	useEffect(() => {
		const stored = window.localStorage.getItem("auth");
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setUser(parsed.user ?? null);
				setToken(parsed.token ?? null);
			} catch {
				window.localStorage.removeItem("auth");
			}
		}
	}, []);

	const login = async (email, password) => {
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.error || "Login failed");
		}
		const data = await res.json();
		setUser(data.user);
		setToken(data.token);
		window.localStorage.setItem(
			"auth",
			JSON.stringify({ user: data.user, token: data.token }),
		);
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		window.localStorage.removeItem("auth");
	};

	const authFetch = async (url, options = {}) => {
		const headers = new Headers(options.headers || {});
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return fetch(url, { ...options, headers });
	};

	return (
		<AuthContext.Provider
			value={{ user, token, login, logout, authFetch }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
}

