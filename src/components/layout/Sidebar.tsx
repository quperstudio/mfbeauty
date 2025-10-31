import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scissors,
  UserCog,
  Calendar,
  DollarSign,
  Wallet,
  TrendingUp,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { Logo } from '../shared/Logo';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Clientes',
    path: '/clientes',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Calendario',
    path: '/calendario',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    name: 'Servicios',
    path: '/servicios',
    icon: <Scissors className="w-5 h-5" />,
  },
  {
    name: 'Agentes',
    path: '/agentes',
    icon: <UserCog className="w-5 h-5" />,
  },
  {
    name: 'Finanzas',
    path: '/finanzas',
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    name: 'Caja',
    path: '/caja',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    name: 'Comisiones',
    path: '/comisiones',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    name: 'Reportes',
    path: '/reportes',
    icon: <FileText className="w-5 h-5" />,
    adminOnly: true,
  },
  {
    name: 'Usuarios',
    path: '/usuarios',
    icon: <Settings className="w-5 h-5" />,
    adminOnly: true,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'administrator'
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-background border-r border-border overflow-y-auto scrollbar-thin transition-transform duration-300 z-50',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center" onClick={onClose}>
            <Logo className="h-10 w-auto" />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 pb-6">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200',
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                <span
                  className={cn(
                    isActive(item.path)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.icon}
                </span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}