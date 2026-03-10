import { Link } from "react-router";

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
					All Filters
				</Link>

				<div className="sidebar-section">
					<div className="sidebar-heading">Categories</div>
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
