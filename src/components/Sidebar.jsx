import { Link } from "react-router";
import { Grid2X2, Layers3 } from "lucide-react";

function Sidebar({ genres, activeGenre, counts, title = "Filters" }) {
	return (
		<aside className="sidebar">
			<div className="sidebar-title">{title}</div>

			<nav className="sidebar-nav">
				<Link
					to="/"
					className={
						activeGenre === null ? "sidebar-link-active" : "sidebar-link"
					}
				>
					<span className="inline-flex items-center gap-2">
						<Grid2X2 className="w-4 h-4" strokeWidth={1.8} />
						All Filters
					</span>
				</Link>

				<div className="sidebar-section">
					<div className="sidebar-heading inline-flex items-center gap-2">
						<Layers3 className="w-3.5 h-3.5" strokeWidth={2} />
						Categories
					</div>
						{genres.map((genre) => (
						<Link
							key={genre.name}
							to={`/category/${encodeURIComponent(genre.name)}`}
							className={
								activeGenre === genre.name
									? "sidebar-link-active"
									: "sidebar-link"
							}
						>
							{genre.name}
							{counts && (
								<span className="ml-2 text-xs text-slate-400">
									({genre.count})
								</span>
							)}
						</Link>
					))}
				</div>
			</nav>

			<div className="mt-auto pt-6 px-6">
				<div className="text-xs text-slate-400">
					Powered by{" "}
					<a
						href="https://cloudflare.com"
						target="_blank"
						rel="noopener noreferrer"
						className="text-teal-600 hover:text-teal-700"
					>
						Cloudflare
					</a>
				</div>
			</div>
		</aside>
	);
}

export default Sidebar;
