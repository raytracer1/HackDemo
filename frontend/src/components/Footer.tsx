import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-gray-400 no-underline transition-colors hover:text-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-hack-primary text-xs font-bold text-white">
            HD
          </div>
          <span className="text-sm font-medium">HackDemo</span>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-6 text-sm text-gray-500">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gray-300">
            GitHub
          </a>
          <span className="text-gray-700">·</span>
          <a href="mailto:support@hackdemo.dev" className="transition-colors hover:text-gray-300">
            Contact
          </a>
          <span className="text-gray-700">·</span>
          <span>&copy; {new Date().getFullYear()} HackDemo</span>
        </nav>
      </div>
    </footer>
  );
}
