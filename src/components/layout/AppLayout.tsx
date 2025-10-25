import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
// <--- CAMBIO AQUÍ: Importación de Toaster eliminada

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <Topbar onMenuClick={toggleSidebar} />
      <main className="lg:ml-64 mt-16 p-4 sm:p-6 transition-all duration-300">
        <div className="container-custom">
          {children}
        </div>
      </main>
    </div>
  );
}