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
  Sparkles,
  X,
} from 'lucide-react';
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
    path: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Clientes',
    path: '/clientes',
    icon: <Users className="w-5 h-5" />,
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
    name: 'Citas',
    path: '/citas',
    icon: <Calendar className="w-5 h-5" />,
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
          'fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin transition-transform duration-300 z-50',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-3" onClick={onClose}>
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Beauty Salon
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sistema de Gestión
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                <span
                  className={cn(
                    isActive(item.path)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
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
