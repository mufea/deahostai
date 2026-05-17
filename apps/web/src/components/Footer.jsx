import React from 'react';
import { Link } from 'react-router-dom';
import { LogoHorizontal } from '@/components/Logo.jsx';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector.jsx';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t py-16 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          
          {/* Company Section */}
          <div className="flex flex-col items-start gap-6">
            <LogoHorizontal iconSize={24} />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The ultimate AI-powered content engine. Generate code, text, images, video, and music in seconds using the world's most advanced AI models.
            </p>
            <div className="flex items-center gap-6 mt-2">
              <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Legal Section */}
          <div className="md:justify-self-end">
            <h4 className="font-semibold mb-4 text-foreground">{t('legal.legal', 'Legal')}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('legal.privacy_policy', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('legal.terms_of_service', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('legal.cookie_policy', 'Cookie Policy')}
                </Link>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Copyright & Language */}
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} DEAHost AI Platform. All rights reserved.
          </p>
          <LanguageSelector />
        </div>
      </div>
    </footer>
  );
}