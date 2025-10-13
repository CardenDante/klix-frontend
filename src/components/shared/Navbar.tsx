'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, User, Home, Search, Ticket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/events', label: 'Events' },
    { href: '/about', label: 'About Us' },
    { href: '/become-organizer', label: 'For Organizers' },
    { href: '/become-promoter', label: 'For Promoters' },
    { href: '/contact', label: 'Contact' },
  ];

  const mobileBottomNavLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Explore', icon: Search },
    { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
    { href: '/dashboard', label: 'Account', icon: User },
  ];
  
  // Conditional classes for navbar styling
  const navClasses = isScrolled 
    ? 'bg-white/95 backdrop-blur-md shadow-lg' 
    : 'bg-black/20';
  const linkClasses = isScrolled 
    ? 'text-gray-700 hover:text-primary' 
    : 'text-white hover:text-white/80';
  const logoSrc = isScrolled ? '/logo.png' : '/logo-white.png';

  return (
    <>
      {/* --- Top Navigation (All Screens) --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navClasses}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo (Left) */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center group">
                <div className="relative w-28 h-14 transition-transform group-hover:scale-105">
                  <Image
                    src={logoSrc}
                    alt="Klix"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation (Center) */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`font-medium transition-colors relative group ${linkClasses}`}>
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center">
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center space-x-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" className={linkClasses}>
                        <User className="h-5 w-5 mr-2" />
                        {user?.first_name || 'Dashboard'}
                      </Button>
                    </Link>
                    <Button onClick={() => logout()} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="bg-primary hover:bg-primary/90 text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              
              {/* Mobile Menu Button (Right) */}
              <div className="md:hidden">
                <button
                  className={linkClasses}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Mobile Slide-Down Menu Panel --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 w-full bg-white shadow-xl border-t z-40 animate-fade-in-up">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-700 hover:text-primary font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t space-y-3">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="block">
                    <Button variant="outline" className="w-full border-primary text-primary">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full border-primary text-primary">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Mobile Bottom Navigation --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        <div className="grid h-full grid-cols-4">
          {mobileBottomNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = (pathname === link.href) || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className="flex flex-col items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-primary transition-colors">
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}