import BatchDetails from './pages/BatchDetails';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import LabelPrinting from './pages/LabelPrinting';
import NewBatch from './pages/NewBatch';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Workers from './pages/Workers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BatchDetails": BatchDetails,
    "Dashboard": Dashboard,
    "Home": Home,
    "Inventory": Inventory,
    "LabelPrinting": LabelPrinting,
    "NewBatch": NewBatch,
    "Reports": Reports,
    "Settings": Settings,
    "Workers": Workers,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};