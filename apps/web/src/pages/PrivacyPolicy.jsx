import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer.jsx';
import { LogoFull } from '@/components/Logo.jsx';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - DEAHost AI Tools",
    "description": "Privacy Policy and data protection details for DEAHost AI Platform.",
    "publisher": {
      "@type": "Organization",
      "name": "DEAHost AI"
    }
  };

  return (
    <>
      <Helmet>
        <title>{`Privacy Policy - DEAHost AI Tools`}</title>
        <meta name="description" content="Learn how DEAHost AI Platform collects, uses, and protects your personal data and privacy." />
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-balance">{t('legal.privacy_policy', 'Privacy Policy')}</h1>
            <p className="text-lg text-muted-foreground">Last Updated: April 24, 2026</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary hover:prose-a:underline">
            
            <h2>1. Introduction</h2>
            <p>Welcome to DEAHost AI Tools ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our AI generation services.</p>
            <p>By accessing or using our platform, you agree to the practices described in this policy. If you do not agree with our policies and practices, please do not use our services.</p>

            <h2>2. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect personally identifiable information that you voluntarily provide to us when registering for an account, expressing interest in obtaining information about us or our products, or otherwise contacting us. This includes:</p>
            <ul>
              <li>Name and email address</li>
              <li>Billing and payment information (processed securely via Stripe)</li>
              <li>Account credentials (passwords are stored encrypted)</li>
            </ul>

            <h3>Usage Data and Prompts</h3>
            <p>When you use our AI tools, we collect data related to your interactions, including:</p>
            <ul>
              <li>Text prompts, images, or documents you upload for AI processing</li>
              <li>Generated outputs (images, videos, text, code)</li>
              <li>Time, frequency, and duration of your activities</li>
              <li>Credits consumed per transaction</li>
            </ul>

            <h3>Device and Technical Information</h3>
            <p>We automatically collect technical information when you access the platform, such as your IP address, browser type, operating system, and access times. This information is used primarily to maintain the security and operation of our platform.</p>

            <h2>3. How We Use Your Information</h2>
            <p>We use personal information collected via our platform for a variety of business purposes described below:</p>
            <ul>
              <li><strong>To Provide Services:</strong> To facilitate account creation, authentication, and deliver the AI generation services you request.</li>
              <li><strong>To Process Payments:</strong> To fulfill and manage your orders, payments, and subscriptions securely.</li>
              <li><strong>To Improve Our Platform:</strong> To request feedback, monitor analytics, and identify usage trends to enhance user experience.</li>
              <li><strong>To Communicate:</strong> To send administrative information, service updates, security alerts, and promotional communications (which you can opt-out of).</li>
            </ul>
            <p><em>Note: We do not use your personal prompts or generated content to train our foundational AI models without your explicit consent.</em></p>

            <h2>4. Data Security</h2>
            <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. Data in transit is encrypted using TLS/SSL, and data at rest is secured in SOC-2 compliant data centers. However, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>

            <h2>5. Data Retention</h2>
            <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Policy, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). Upon account deletion, your personal data and generation history will be permanently deleted from our active systems within 30 days.</p>

            <h2>6. Your Data Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Access:</strong> Request copies of your personal data.</li>
              <li><strong>Rectification:</strong> Request that we correct any information you believe is inaccurate.</li>
              <li><strong>Erasure:</strong> Request that we erase your personal data under certain conditions.</li>
              <li><strong>Restrict Processing:</strong> Request that we restrict the processing of your personal data.</li>
              <li><strong>Data Portability:</strong> Request that we transfer the data that we have collected to another organization, or directly to you.</li>
            </ul>
            <p>To exercise these rights, please contact us using the details provided below or use the account management features in your dashboard.</p>

            <h2>7. Third-Party Services</h2>
            <p>We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf. These include:</p>
            <ul>
              <li><strong>Payment Processors:</strong> Stripe (for secure billing and subscription management).</li>
              <li><strong>AI Providers:</strong> OpenAI, Anthropic, Google, Fal AI, Deepseek (prompts are sent securely via API for processing. We have data processing agreements in place ensuring your data is not used for their model training when processed via our enterprise APIs).</li>
              <li><strong>Cloud Storage:</strong> AWS, Google Cloud (for secure file and generated media storage).</li>
            </ul>

            <h2>8. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to access or store information. Specific details about how we use such technologies and how you can refuse certain cookies are set out in our <Link to="/cookie-policy">Cookie Policy</Link>.</p>

            <h2>9. Children's Privacy</h2>
            <p>Our services are not intended for use by children under the age of 18. We do not knowingly solicit data from or market to children under 18. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records.</p>

            <h2>10. International Data Transfers</h2>
            <p>If you are accessing our platform from outside the region where our servers are located, please be aware that your information may be transferred to, stored, and processed in our facilities and by those third parties with whom we may share your personal information. We ensure appropriate safeguards are in place for such transfers.</p>

            <h2>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this Privacy Policy frequently to be informed of how we are protecting your information.</p>

            <h2>12. Contact Us</h2>
            <p>If you have questions or comments about this policy, you may email us at privacy@deahost.ai or by post to:</p>
            <address className="not-italic text-muted-foreground mt-2">
              DEAHost AI Platform<br />
              123 Innovation Drive<br />
              Tech District, SF 94105<br />
              United States
            </address>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}