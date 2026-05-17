import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer.jsx';
import { LogoFull } from '@/components/Logo.jsx';

export default function TermsOfService() {
  const { t } = useTranslation();
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service - DEAHost AI Tools",
    "description": "Terms of Service and user agreements for DEAHost AI Platform.",
    "publisher": {
      "@type": "Organization",
      "name": "DEAHost AI"
    }
  };

  return (
    <>
      <Helmet>
        <title>{`Terms of Service - DEAHost AI Tools`}</title>
        <meta name="description" content="Read the Terms of Service and user agreement for accessing and using the DEAHost AI Platform." />
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-balance">{t('legal.terms_of_service', 'Terms of Service')}</h1>
            <p className="text-lg text-muted-foreground">Effective Date: April 24, 2026</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary hover:prose-a:underline">
            
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using the DEAHost AI Platform ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service. These terms apply to all visitors, users, and others who access or use the Service.</p>

            <h2>2. User Accounts</h2>
            <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

            <h2>3. Service and Credits</h2>
            <p>Our Service operates on a credit-based system. Credits are consumed when generating content using our AI tools. Different tools and models consume different amounts of credits.</p>
            <ul>
              <li>Free accounts receive a set monthly allocation of non-rolling credits.</li>
              <li>Paid subscriptions provide increased monthly limits and access to premium models.</li>
              <li>Purchased credit packs do not expire as long as your account remains active.</li>
              <li>Credits have no cash value and are non-transferable and non-refundable, except as required by law.</li>
            </ul>

            <h2>4. Acceptable Use Policy</h2>
            <p>You agree not to use the Service to generate, upload, or share content that:</p>
            <ul>
              <li>Is illegal, threatening, defamatory, abusive, harassing, or hateful.</li>
              <li>Promotes discrimination, bigotry, racism, hatred, harassment, or harm against any individual or group.</li>
              <li>Infringes on any patent, trademark, trade secret, copyright, or other proprietary rights of any party.</li>
              <li>Contains explicit sexual content or non-consensual intimate imagery.</li>
              <li>Involves the distribution of malware, viruses, or any other malicious code.</li>
              <li>Generates misleading, deceptive, or fraudulent content (including deepfakes used for malicious purposes).</li>
            </ul>
            <p>We reserve the right, at our sole discretion, to monitor generated content and terminate accounts that violate this policy without prior notice.</p>

            <h2>5. Intellectual Property Rights</h2>
            <p><strong>Your Content:</strong> You retain all ownership rights to the prompts you submit and the direct outputs generated by the Service based on your prompts, subject to the inherent limitations of AI-generated content copyrightability under applicable law.</p>
            <p><strong>Our Service:</strong> The Service and its original content (excluding user-generated content), features, and functionality are and will remain the exclusive property of DEAHost AI and its licensors. The Service is protected by copyright, trademark, and other laws.</p>

            <h2>6. Limitation of Liability</h2>
            <p>In no event shall DEAHost AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
            <ul>
              <li>Your access to or use of or inability to access or use the Service;</li>
              <li>Any conduct or content of any third party on the Service;</li>
              <li>Any content obtained from the Service; and</li>
              <li>Unauthorized access, use or alteration of your transmissions or content.</li>
            </ul>

            <h2>7. Disclaimer</h2>
            <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.</p>

            <h2>8. Indemnification</h2>
            <p>You agree to defend, indemnify and hold harmless DEAHost AI and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of a) your use and access of the Service, by you or any person using your account and password, or b) a breach of these Terms.</p>

            <h2>9. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>

            <h2>10. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.</p>

            <h2>11. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

            <h2>12. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at legal@deahost.ai.</p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}