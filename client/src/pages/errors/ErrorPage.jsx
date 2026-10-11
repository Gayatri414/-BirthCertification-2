import { Link } from 'react-router-dom';
import Button from '../../components/Button';

export default function ErrorPage({ code, title, message, embedded = false }) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 text-center ${embedded ? 'py-16' : 'min-h-screen bg-slate-50'}`}>
      <p className="text-6xl font-extrabold text-indigo-600 sm:text-7xl">{code}</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-slate-500">{message}</p>
      <Link to="/" className="mt-6"><Button>Back to home</Button></Link>
    </div>
  );
}
