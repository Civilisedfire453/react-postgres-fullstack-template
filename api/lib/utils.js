/**
 * Selects appropriate data source based on database availability
 * @param {object} c - Hono context
 * @param {function} dbLogic - Function to execute when DB is available
 * @param {function} mockLogic - Function to execute when using mock data
 * @returns {Response} API response
 */
export async function selectDataSource(c, dbLogic, mockLogic) {
	try {
		// Use mock data if database is not available
		if (!c.env.DB_AVAILABLE) {
			return await mockLogic(c);
		}

		// Use database if available
		return await dbLogic(c);
	} catch (e) {
		console.error("API Error:", e);
		return Response.json(
			{ error: e instanceof Error ? e.message : e },
			{ status: 500 },
		);
	}
}
