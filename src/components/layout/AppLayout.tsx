// src/components/layout/AppLayout.tsx

import { Outlet } from 'react-router-dom'; // 1. Importar Outlet
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 md:p-6">
          <Outlet />

        </main>
      </div>
    </div>
  );
};

export default AppLayout;