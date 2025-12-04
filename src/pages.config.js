import Dashboard from './pages/Dashboard';
import NewBatch from './pages/NewBatch';
import BatchDetails from './pages/BatchDetails';
import Workers from './pages/Workers';
import Reports from './pages/Reports';


export const PAGES = {
    "Dashboard": Dashboard,
    "NewBatch": NewBatch,
    "BatchDetails": BatchDetails,
    "Workers": Workers,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};