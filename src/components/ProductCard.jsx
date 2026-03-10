function ProductCard({ product, onClick }) {
	const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
	const minPriceCents = product.variants?.length
		? Math.min(...product.variants.map((v) => v.price_cents))
		: null;

	return (
		<div className="book-card cursor-pointer" onClick={onClick}>
			<div className="book-card-image">
				{primaryImage ? (
					<img
						src={primaryImage.image_url}
						alt={product.name}
						className="w-full h-full object-contain transition-transform hover:scale-[1.03] duration-300"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
						No image
					</div>
				)}
			</div>
			<div className="book-card-content">
				<h3 className="text-lg font-serif mb-1 line-clamp-1">{product.name}</h3>
				{product.brand && (
					<p className="text-gray-900 text-sm mb-2">{product.brand}</p>
				)}
				<p className="text-gray-900 text-sm overflow-hidden line-clamp-3 mb-4">
					{product.description}
				</p>
				{minPriceCents != null && (
					<div className="text-gray-900 font-medium mb-2">
						From ${(minPriceCents / 100).toFixed(2)}
					</div>
				)}
				<button className="btn-primary w-full text-sm font-bold">
					View details
				</button>
			</div>
		</div>
	);
}

export default ProductCard;

