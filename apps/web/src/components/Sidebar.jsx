import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Wand2,
  Volume2,
  FileText,
  CreditCard,
  Settings,
  History,
  X,
  Clapperboard,
  Scissors,
  ImagePlus,
  ScanSearch,
  Code2,
  Grid,
  LifeBuoy,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/Logo.jsx';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const isRtl = i18n.language === 'ar';

  const navigation = [
    // Main Navigation
    { name: t('nav.dashboard', 'Dashboard'), href: '/dashboard', icon: LayoutDashboard, section: 'Main Navigation' },
    { name: t('nav.all_tools', 'All Tools'), href: '/dashboard#tools', icon: Grid, section: 'Main Navigation' },
    
    // Tools
    { name: t('tools.text_generator', 'Text Generator'), href: '/text-generator', icon: MessageSquare, section: 'Tools' },
    { name: t('tools.image_generator', 'Image Generator'), href: '/image-generator', icon: Wand2, section: 'Tools' },
    { name: t('tools.video_generator', 'Video Generator'), href: '/video-generator', icon: Clapperboard, section: 'Tools' },
    { name: t('tools.code_generator', 'Code Generator'), href: '/code-generator', icon: Code2, section: 'Tools' },
    { name: t('tools.tts', 'Text-to-Speech'), href: '/text-to-speech', icon: Volume2, section: 'Tools' },
    { name: t('tools.pdf_analyzer', 'PDF Analyzer'), href: '/pdf-chat', icon: FileText, section: 'Tools' },
    { name: t('tools.image_analyzer', 'Image Analyzer'), href: '/image-analyzer', icon: ScanSearch, section: 'Tools' },
    { name: t('tools.video_editor', 'Video Editor'), href: '/video-editor', icon: Scissors, section: 'Tools' },
    { name: t('tools.image_editor', 'Image Editor'), href: '/image-editor', icon: ImagePlus, section: 'Tools' },
    
    // Account
    { name: t('nav.history', 'Usage History'), href: '/usage-history', icon: History, section: 'Account' },
    { name: t('nav.settings', 'Settings'), href: '/settings', icon: Settings, section: 'Account' },
    
    // Billing & Support
    { name: t('nav.billing', 'Billing'), href: '/subscription', icon: CreditCard, section: 'Billing & Support' },
    { name: t('nav.support', 'Support'), href: '/support', icon: LifeBuoy, section: 'Billing & Support' },
    { name: t('nav.logout', 'Logout'), action: 'logout', icon: LogOut, section: 'Billing & Support' },
  ];

  const groupedNav = navigation.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 z-50 h-full w-64 bg-card text-card-foreground border-border shadow-2xl md:shadow-none transition-transform duration-300 overflow-y-auto custom-scrollbar flex flex-col',
          isRtl ? 'right-0 border-l' : 'left-0 border-r',
          isOpen 
            ? 'translate-x-0' 
            : (isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b sticky top-0 bg-card z-10 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 group transition-opacity hover:opacity-80">
            <LogoIcon size={26} />
            <span className="font-bold tracking-tight text-lg">DEAHost AI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-6 p-4 flex-1">
          {Object.entries(groupedNav).map(([section, items]) => (
            <div key={section}>
              <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section}
              </h4>
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  if (item.action === 'logout') {
                    return (
                      <button
                        key={item.name}
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full text-left"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  }

                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}