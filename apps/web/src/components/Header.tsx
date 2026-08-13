import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} />
          Back to app
        </Link>
        <Link to="/" className="app-header-logo">
          <Logo size={18} />
        </Link>
      </div>
      <div className="app-header-right">{right}</div>
    </header>
  );
}
