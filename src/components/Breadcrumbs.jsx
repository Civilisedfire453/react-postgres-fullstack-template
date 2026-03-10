import { Link } from "react-router";

function Breadcrumbs({ items, onNavigate }) {
	return (
		<nav className="breadcrumbs">
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				const isClickable = !isLast && onNavigate;
				const linkTo = !isLast && item.href ? item.href : null;

				return (
					<div key={index} className="breadcrumb-item">
						{isLast ? (
							<span className="breadcrumb-current">{item.label}</span>
						) : (
							<>
								{isClickable ? (
									<span
										className="breadcrumb-link"
										onClick={() => onNavigate && onNavigate(item.value)}
									>
										{item.label}
									</span>
								) : linkTo ? (
									<Link to={linkTo} className="breadcrumb-link">
										{item.label}
									</Link>
								) : (
									<span className="breadcrumb-link">{item.label}</span>
								)}
								<span className="breadcrumb-separator">&gt;</span>
							</>
						)}
					</div>
				);
			})}
		</nav>
	);
}

export default Breadcrumbs;
