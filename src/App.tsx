import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MedicineList from "./pages/medicine/List";
import MedicineForm from "./pages/medicine/Form";
import InventoryList from "./pages/inventory/List";
import SalesList from "./pages/sales/List";
import NewSale from "./pages/sales/New";
import PromotionList from "./pages/promotions/List";
import SupplierList from "./pages/suppliers/List";
import Statistics from "./pages/Statistics";
import RestockSuggestion from "./pages/restock/Suggestion";
import PurchaseOrderList from "./pages/purchase/OrderList";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/medicines" element={<MedicineList />} />
            <Route path="/medicines/new" element={<MedicineForm />} />
            <Route path="/medicines/:id/edit" element={<MedicineForm />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/sales" element={<SalesList />} />
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/promotions" element={<PromotionList />} />
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/restock" element={<RestockSuggestion />} />
            <Route path="/purchase-orders" element={<PurchaseOrderList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
