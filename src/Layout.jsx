import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, Package, Users, BarChart3, Menu, X, Settings, ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const productionItems = [
  { name: "Production Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "New Batch", icon: Package, page: "NewBatch" },
  { name: "Production Inventory", icon: Package, page: "Inventory" },
  { name: "Workers", icon: Users, page: "Workers" },
  { name: "Production Reports", icon: BarChart3, page: "Reports" }
];

const salesItems = [
  { name: "Sales Dashboard", icon: LayoutDashboard, page: "SalesDashboard" },
  { name: "SKU Manager", icon: Package, page: "SKUManager" },
  { name: "Orders", icon: Package, page: "Orders" },
  { name: "Returns", icon: Package, page: "Returns" },
  { name: "Stock Adjustments", icon: Package, page: "StockAdjustments" },
  { name: "Warehouses", icon: Package, page: "Warehouses" }
];

const settingsItems = [
  { name: "Settings", icon: Settings, page: "Settings" }
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:bg-slate-900">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">SOVIV Production</h1>
            <p className="text-slate-400 text-xs">Quality Control</p>
          </div>
        </div>
        <nav className="mt-6 px-3">
          {/* Production Section */}
          <div className="mb-4">
            <button
              onClick={() => setProductionOpen(!productionOpen)}
              className="flex items-center justify-between w-full px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold uppercase tracking-wider"
            >
              <span>Production</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${productionOpen ? 'rotate-180' : ''}`} />
            </button>
            {productionOpen && productionItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl mb-1 transition-all text-sm ${
                    isActive 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Sales & Inventory Section */}
          <div className="mb-4">
            <button
              onClick={() => setSalesOpen(!salesOpen)}
              className="flex items-center justify-between w-full px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold uppercase tracking-wider"
            >
              <span>Sales & Inventory</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${salesOpen ? 'rotate-180' : ''}`} />
            </button>
            {salesOpen && salesItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl mb-1 transition-all text-sm ${
                    isActive 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <div className="border-t border-slate-800 pt-4">
            {settingsItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl mb-1 transition-all text-sm ${
                    isActive 
                      ? "bg-slate-800 text-white" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-white font-bold">SOVIV Production</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/95 pt-16 overflow-y-auto">
          <nav className="p-4">
            <div className="mb-4">
              <p className="text-slate-500 text-xs font-semibold uppercase px-4 mb-2">Production</p>
              {productionItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                      isActive 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="mb-4">
              <p className="text-slate-500 text-xs font-semibold uppercase px-4 mb-2">Sales & Inventory</p>
              {salesItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                      isActive 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-slate-700 pt-4">
              {settingsItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                      isActive 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}