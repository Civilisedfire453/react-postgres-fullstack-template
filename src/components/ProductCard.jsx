import { ArrowRight, ImageOff } from "lucide-react";
import { publicAssetUrl } from "../lib/publicAssetUrl.js";

function ProductCard({ product, onClick }) {
	const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
	const fallbackSeed = encodeURIComponent(String(product.id ?? product.name ?? "product"));
	const fallbackImageUrl = `https://picsum.photos/seed/${fallbackSeed}/1200/800`;
	const imageUrl = publicAssetUrl(primaryImage?.image_url || fallbackImageUrl);
	const minPriceCents = product.variants?.length
		? Math.min(...product.variants.map((v) => v.price_cents))
		: null;
	const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0) ?? 0;
	const hasStock = totalStock > 0;
	const isLowStock = hasStock && product.variants?.some((v) => v.stock_quantity > 0 && v.stock_quantity <= (v.reorder_threshold ?? 5));

	return (
		<div className="product-card cursor-pointer group hover-lift" onClick={onClick}>
			<div className="product-card-image relative">
				{!hasStock && (
					<span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-800/90 text-white text-xs font-medium z-10">
						Out of stock
					</span>
				)}
				{hasStock && isLowStock && (
					<span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500/90 text-white text-xs font-medium z-10">
						Only {totalStock} left
					</span>
				)}
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={product.name}
						className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-slate-400">
						<ImageOff className="w-14 h-14" strokeWidth={1.5} />
					</div>
				)}
			</div>
			<div className="product-card-content">
				{product.brand && (
					<p className="text-teal-600 text-xs font-medium uppercase tracking-wide mb-1">{product.brand}</p>
				)}
				<h3 className="text-lg font-serif font-semibold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
				<p className="text-slate-500 text-sm overflow-hidden line-clamp-2 mb-3">
					{product.description}
				</p>
				{minPriceCents != null && (
					<div className="text-slate-900 font-semibold mb-3">
						From ${(minPriceCents / 100).toFixed(2)}
					</div>
				)}
				<button
					className="btn-primary w-full text-sm font-medium inline-flex items-center justify-center gap-2"
					onClick={(e) => { e.preventDefault(); onClick?.(); }}
				>
					{hasStock ? "View details" : "Check back later"}
					{hasStock && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
				</button>
			</div>
		</div>
	);
}

export default ProductCard;

