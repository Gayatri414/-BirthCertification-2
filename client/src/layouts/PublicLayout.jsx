import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">DEMO PROJECT. Not affiliated with any government. Aadhaar and biometric verification are simulated.</div>
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
