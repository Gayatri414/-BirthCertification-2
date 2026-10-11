import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 py-8 sm:py-12">
      <Logo />
      <div className="mt-8 w-full max-w-md sm:max-w-xl"><Outlet /></div>
    </div>
  );
}
