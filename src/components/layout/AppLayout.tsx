import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
