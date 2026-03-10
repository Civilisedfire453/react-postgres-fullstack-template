import { useState } from "react";

function DeliveryFormModal({ isOpen, onClose, onSubmit, validation }) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [addressLine1, setAddressLine1] = useState("");
	const [addressLine2, setAddressLine2] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [postcode, setPostcode] = useState("");
	const [country, setCountry] = useState("AU");
	const [error, setError] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");
		const trimmedName = name.trim();
		const trimmedEmail = email.trim();
		if (!trimmedName) {
			setError("Name is required");
			return;
		}
		if (!trimmedEmail) {
			setError("Email is required");
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmedEmail)) {
			setError("Please enter a valid email address");
			return;
		}
		if (!addressLine1.trim()) {
			setError("Delivery address is required");
			return;
		}
		onSubmit({
			name: trimmedName,
			email: trimmedEmail,
			phone: phone.trim() || null,
			addressLine1: addressLine1.trim(),
			addressLine2: addressLine2.trim() || null,
			city: city.trim() || null,
			state: state.trim() || null,
			postcode: postcode.trim() || null,
			country: country.trim() || "AU",
		});
		onClose();
	}

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-slate-900">Delivery & contact</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
						aria-label="Close"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{validation && (
					<p className="text-sm text-slate-500 mb-4">
						Total: ${(validation.totalCents / 100).toFixed(2)} {validation.currency}
					</p>
				)}

				<form onSubmit={handleSubmit} className="space-y-3">
					{error && (
						<div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Full name *</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
							placeholder="John Smith"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
							placeholder="john@example.com"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
							placeholder="0400 000 000"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Address line 1 *</label>
						<input
							type="text"
							value={addressLine1}
							onChange={(e) => setAddressLine1(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
							placeholder="123 Main St"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Address line 2</label>
						<input
							type="text"
							value={addressLine2}
							onChange={(e) => setAddressLine2(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
							placeholder="Unit 4 (optional)"
						/>
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">City</label>
							<input
								type="text"
								value={city}
								onChange={(e) => setCity(e.target.value)}
								className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
								placeholder="Sydney"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">State</label>
							<input
								type="text"
								value={state}
								onChange={(e) => setState(e.target.value)}
								className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
								placeholder="NSW"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
							<input
								type="text"
								value={postcode}
								onChange={(e) => setPostcode(e.target.value)}
								className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
								placeholder="2000"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
						<select
							value={country}
							onChange={(e) => setCountry(e.target.value)}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
						>
							<option value="AU">Australia</option>
							<option value="NZ">New Zealand</option>
							<option value="US">United States</option>
							<option value="GB">United Kingdom</option>
							<option value="OTHER">Other</option>
						</select>
					</div>

					<div className="flex gap-3 pt-2">
						<button type="button" onClick={onClose} className="btn flex-1">
							Cancel
						</button>
						<button type="submit" className="btn-primary flex-1">
							Continue to payment
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default DeliveryFormModal;
