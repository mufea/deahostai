import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer.jsx';
import { LogoFull } from '@/components/Logo.jsx';

export default function CookiePolicy() {
  const { t } = useTranslation();
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cookie Policy - DEAHost AI Tools",
    "description": "Information about how DEAHost AI Platform uses cookies and tracking technologies.",
    "publisher": {
      "@type": "Organization",
      "name": "DEAHost AI"
    }
  };

  return (
    <>
      <Helmet>
        <title>{`Cookie Policy - DEAHost AI Tools`}</title>
        <meta name="description" content="Read our Cookie Policy to understand how DEAHost AI uses cookies and tracking technologies to improve your experience." />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto max-w-7xl flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" asChild className="mr-4 text-muted-foreground hover:text-foreground">
              <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <LogoFull iconSize={24} />
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 border-b pb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-balance">{t('legal.cookie_policy', 'Cookie Policy')}</h1>
            <p className="text-lg text-muted-foreground">Effective Date: April 24, 2026</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary hover:prose-a:underline prose-td:border-border prose-th:border-border prose-th:bg-muted/50">
            
            <h2>1. What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>
            <p>Cookies set by the website owner (in this case, DEAHost AI) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., analytics, payment processing, interactive content).</p>

            <h2>2. Why Do We Use Cookies?</h2>
            <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our platform to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our platform. Third parties serve cookies through our platform for analytics and other purposes.</p>

            <h2>3. Types of Cookies We Use</h2>
            
            <h3>Essential Cookies</h3>
            <p>These cookies are strictly necessary to provide you with services available through our platform and to use some of its features, such as access to secure areas.</p>
            
            <h3>Performance and Functionality Cookies</h3>
            <p>These cookies are used to enhance the performance and functionality of our platform but are non-essential to their use. However, without these cookies, certain functionality (like video generators or persistent settings) may become unavailable.</p>

            <h3>Analytics and Customization Cookies</h3>
            <p>These cookies collect information that is used either in aggregate form to help us understand how our platform is being used or how effective our marketing campaigns are, or to help us customize our platform for you.</p>

            <h2>4. Specific Cookies in Use</h2>
            <div className="overflow-x-auto my-8">
              <table className="min-w-full border-collapse border rounded-lg">
                <thead>
                  <tr>
                    <th className="border p-3 text-left">Cookie Name</th>
                    <th className="border p-3 text-left">Provider</th>
                    <th className="border p-3 text-left">Purpose</th>
                    <th className="border p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3 font-mono text-sm">pb_auth</td>
                    <td className="border p-3">DEAHost AI</td>
                    <td className="border p-3">Maintains your authenticated session. Essential.</td>
                    <td className="border p-3">Session / 30 days</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-mono text-sm">app_language</td>
                    <td className="border p-3">DEAHost AI</td>
                    <td className="border p-3">Stores your preferred interface language. Functional.</td>
                    <td className="border p-3">1 year</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-mono text-sm">_stripe_mid</td>
                    <td className="border p-3">Stripe</td>
                    <td className="border p-3">Fraud prevention and payment routing. Essential.</td>
                    <td className="border p-3">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>5. How Can I Control Cookies?</h2>
            <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your web browser. The means by which you can refuse cookies through your web browser controls vary from browser to browser, so you should visit your browser's help menu for more information.</p>
            <p>If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website (such as logging in to your dashboard) will be severely restricted or broken entirely, as we rely on secure cookies for authentication.</p>

            <h2>6. Changes to This Cookie Policy</h2>
            <p>We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>

            <h2>7. Contact Us</h2>
            <p>If you have any questions about our use of cookies or other technologies, please email us at privacy@deahost.ai.</p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}