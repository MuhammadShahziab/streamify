import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="h-screen">
      <div className="flex">
        {showSidebar && <Sidebar></Sidebar>}
        <div className="flex flex-col flex-1">
          <Navbar></Navbar>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
