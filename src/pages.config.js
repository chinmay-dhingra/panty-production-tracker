import Dashboard from './pages/Dashboard';
import NewBatch from './pages/NewBatch';
import BatchDetails from './pages/BatchDetails';
import Workers from './pages/Workers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import LabelPrinting from './pages/LabelPrinting';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NewBatch": NewBatch,
    "BatchDetails": BatchDetails,
    "Workers": Workers,
    "Reports": Reports,
    "Settings": Settings,
    "Inventory": Inventory,
    "LabelPrinting": LabelPrinting,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};