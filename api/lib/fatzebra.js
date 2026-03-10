const FATZEBRA_ENDPOINT =
	"https://gateway.sandbox.fatzebra.com.au/v1.0/purchases";

export async function createPurchase({
	username,
	token,
	amount_cents,
	reference,
	customer_ip,
	currency,
	card_token,
}) {
	if (!username || !token) {
		throw new Error("Fat Zebra credentials are not configured");
	}

	const authHeader = btoa(`${username}:${token}`);

	const body = {
		amount: amount_cents,
		reference,
		customer_ip,
		currency,
		card_token,
	};

	const res = await fetch(FATZEBRA_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Basic ${authHeader}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const json = await res.json();

	if (!res.ok || json.success === false) {
		const message =
			json.response?.message || json.errors?.join(", ") || "Payment failed";
		const error = new Error(message);
		error.gatewayResponse = json;
		throw error;
	}

	return json;
}

