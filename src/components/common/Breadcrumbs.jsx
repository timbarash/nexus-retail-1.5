import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  '/': 'Command Center',
  '/locations': 'Store Performance',
  '/inventory': 'Inventory Analytics',
  '/brands': 'Brand Performance',
  '/customers': 'Customer Intelligence',
  '/agents': 'AI Agents',
  '/agents/connect': 'Inventory Agent',
  '/agents/pricing': 'Pricing & Margins',
  '/agents/marketing': 'Marketing Campaigns',
  '/agents/bridge': 'Dex',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ path: '/', label: 'Home' }];

  let accumulated = '';
  for (const seg of segments) {
    accumulated += '/' + seg;
    const label = ROUTE_LABELS[accumulated];
    if (label) {
      crumbs.push({ path: accumulated, label });
    }
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-4" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          {i === crumbs.length - 1 ? (
            <span className="text-text-secondary font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              {i === 0 && <Home className="w-3 h-3" />}
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
