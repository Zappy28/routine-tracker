import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="app-shell full-app">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default Layout;