'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Search, User, Ticket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative w-32 h-16 transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Klix"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors relative group ${
                  isScrolled ? 'text-gray-700 hover:text-[#EB7D30]' : 'text-white hover:text-white/80'
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#EB7D30] transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className={isScrolled ? 'text-gray-700 hover:text-[#EB7D30]' : 'text-white hover:text-white/80'}
            >
              <Search className="h-5 w-5" />
            </Button>

            {isAuthenticated ? (
              <>
                <Link href="/dashboard/tickets">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isScrolled ? 'text-gray-700 hover:text-[#EB7D30]' : 'text-white hover:text-white/80'}
                  >
                    <Ticket className="h-5 w-5" />
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className={isScrolled ? 'text-gray-700 hover:text-[#EB7D30]' : 'text-white hover:text-white/80'}
                  >
                    <User className="h-5 w-5 mr-2" />
                    {user?.first_name || 'Dashboard'}
                  </Button>
                </Link>

                <Button
                  onClick={() => logout()}
                  variant="outline"
                  className="border-[#EB7D30] text-[#EB7D30] hover:bg-[#EB7D30] hover:text-white"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-[#EB7D30] text-[#EB7D30] hover:bg-[#EB7D30] hover:text-white">
                    Login
                  </Button>
                </Link>

                <Link href="/register">
                  <Button className="bg-[#EB7D30] hover:bg-[#d16a1f] text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden ${isScrolled ? 'text-gray-700 hover:text-[#EB7D30]' : 'text-white hover:text-white/80'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white shadow-xl border-t animate-fade-in-up">
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-gray-700 hover:text-[#EB7D30] font-medium py-2 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t space-y-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="block">
                      <Button variant="outline" className="w-full border-[#EB7D30] text-[#EB7D30]">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-[#EB7D30] hover:bg-[#d16a1f] text-white"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full border-[#EB7D30] text-[#EB7D30]">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" className="block">
                      <Button className="w-full bg-[#EB7D30] hover:bg-[#d16a1f] text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}