import { Link } from 'react-router-dom';
import type { BreadcrumbItem } from '../../routes/route.types';

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-xs font-bold text-slate-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.to ? (
            <Link to={item.to} className="text-brand-700 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="px-1 text-slate-400">/</span>}
        </span>
      ))}
    </nav>
  );
}
