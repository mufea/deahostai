import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { LogoIcon } from './Logo.jsx';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const publicLinks = [
    { name: t('nav.home', 'Home'), path: '/' },
    { name: t('nav.pricing', 'Pricing'), path: '/pricing' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-4 md:px-6">
        {isAuthenticated && (
          <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
        
        <div className="flex items-center gap-2 mr-4 md:hidden">
          <Link to={isAuthenticated ? "/dashboard" : "/"}>
            <LogoIcon size={24} />
          </Link>
        </div>

        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6">
            {publicLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary border-b-2 border-primary py-5' : 'text-muted-foreground'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />
          <LanguageSelector />
          
          {!isAuthenticated ? (
            <>
              <Link to="/login">
                <Button variant="ghost" className="font-medium hidden sm:inline-flex">{t('nav.login', 'Log In')}</Button>
              </Link>
              <Link to="/signup">
                <Button className="font-medium">{t('nav.signup', 'Sign Up')}</Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                {currentUser?.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                {t('nav.logout', 'Log Out')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}