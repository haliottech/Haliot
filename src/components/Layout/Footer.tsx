import { Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-accent/10 rounded">
                <FlaskConical className="h-5 w-5 text-accent" />
              </div>
              <span className="text-lg font-bold text-foreground">Haliot Research</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting researchers and fostering collaboration in the scientific community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-accent transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link to="/create" className="hover:text-accent transition-colors">
                  Create Post
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-accent transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Haliot Research. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
