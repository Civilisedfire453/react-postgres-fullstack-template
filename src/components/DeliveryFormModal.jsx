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
	const country = "AU";
	const [error, setError] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");
		const trimmedName = name.trim();
		const trimmedEmail = email.trim();
		const phoneDigits = phone.replace(/\D/g, "");
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
		if (!/^\d{10}$/.test(phoneDigits)) {
			setError("Phone number must be exactly 10 digits");
			return;
		}
		if (!addressLine1.trim()) {
			setError("Delivery address is required");
			return;
		}
		if (!state.trim()) {
			setError("State is required");
			return;
		}
		const pc = postcode.trim();
		if (!pc) {
			setError("Postcode is required");
			return;
		}
		if (!/^\d{4}$/.test(pc)) {
			setError("Postcode must be 4 digits");
			return;
		}
		onSubmit({
			name: trimmedName,
			email: trimmedEmail,
			phone: phoneDigits,
			addressLine1: addressLine1.trim(),
			addressLine2: addressLine2.trim() || null,
			city: city.trim() || null,
			state: state.trim() || null,
			postcode: pc,
			country,
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
				className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6"
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
						<label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
							className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
							placeholder="0400123456"
							inputMode="numeric"
							maxLength={10}
							required
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

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
							<select
								value={state}
								onChange={(e) => setState(e.target.value)}
								className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
								required
							>
								<option value="">Select…</option>
								<option value="ACT">ACT</option>
								<option value="NSW">NSW</option>
								<option value="NT">NT</option>
								<option value="QLD">QLD</option>
								<option value="SA">SA</option>
								<option value="TAS">TAS</option>
								<option value="VIC">VIC</option>
								<option value="WA">WA</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-slate-700 mb-1">Postcode</label>
							<input
								type="text"
								value={postcode}
								onChange={(e) => setPostcode(e.target.value)}
								className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none"
								placeholder="2000"
								inputMode="numeric"
								maxLength={4}
								required
							/>
						</div>
					</div>

					<div className="text-xs text-slate-500 pt-1">Shipping country: Australia</div>

					<div className="flex flex-col sm:flex-row gap-3 pt-2">
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
