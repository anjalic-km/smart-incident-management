import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center">
          <img
            src={logo}
            alt="ServicePulse Logo"
            className="h-15 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-700">
          <a href="#features" className="hover:text-blue-600">
            Features
          </a>
          <a href="#workflow" className="hover:text-blue-600">
            Workflow
          </a>
          <a href="#contact" className="hover:text-blue-600">
            Contact Us
          </a>

        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Login
          </Link>

          {/* <Link
            to="/register"
            className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Register
          </Link> */}
        </div>

      </div>
    </header>
  );
}
