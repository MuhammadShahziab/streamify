import type { PropsWithChildren } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  showSidebar?: boolean;
}

const Layout = ({
  children,
  showSidebar = false,
}: PropsWithChildren<LayoutProps>) => {
  return (
    <div className="h-full">
      <div className="flex">
        {showSidebar && <Sidebar />}
        <div className="flex flex-col flex-1">
          <Navbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
