
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            At EkagraZone, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
          </p>
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, update your profile, or use our services. This may include your name, email address, and study data.
          </p>
          <h2>2. How We Use Your Information</h2>
          <p>
            We use your information to provide, maintain, and improve our services, such as tracking your study progress, syncing your data across devices, and personalizing your experience.
          </p>
          <h2>3. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
          <h2>4. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@ekagrazone.com.
          </p>
        </div>
      </div>
    </div>
  );
};

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Please read these Terms of Service carefully before using EkagraZone.
          </p>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
          </p>
          <h2>2. Use of Service</h2>
          <p>
            You agree to use EkagraZone only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account and password.
          </p>
          <h2>3. Termination</h2>
          <p>
            We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
          <h2>4. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
          </p>
        </div>
      </div>
    </div>
  );
};
