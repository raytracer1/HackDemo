import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-gray-600 no-underline transition-colors hover:text-gray-900">
          <img src="/img/normal.png" alt="HackDemo" className="h-7 w-7 rounded-md" />
          <span className="text-sm font-medium">HackDemo</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <Link to="/privacy" className="no-underline transition-colors hover:text-gray-900">Privacy</Link>
          <span>·</span>
          <Link to="/terms" className="no-underline transition-colors hover:text-gray-900">Terms</Link>
          <span>·</span>
          <a href="mailto:demoagenttest123@gmail.com" className="transition-colors hover:text-gray-900">Contact</a>
          <span>·</span>
          <span>&copy; {new Date().getFullYear()} HackDemo</span>
        </nav>
      </div>
    </footer>
  );
}
