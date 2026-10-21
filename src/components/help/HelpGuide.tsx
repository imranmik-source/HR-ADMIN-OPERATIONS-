import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Database,
  CloudUpload,
  Key,
  Users2,
  FileCheck2,
  Hotel,
  ScrollText,
  Zap,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export function HelpGuide() {
  const [activeSection, setActiveSection] = useState<'how_to_use' | 'admin_guide' | 'firebase_setup'>(
    'how_to_use'
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sampleFirebaseConfig = `// Sample firebaseConfig in your Firebase Console:
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "epcc-project-portal.firebaseapp.com",
  projectId: "epcc-project-portal",
  storageBucket: "epcc-project-portal.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};`;

  const sampleFirestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated project personnel can read and write operational documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Operations Manual &amp; Deployment Guide
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete user guide, Super Admin role assignment manual, and step-by-step instructions
            for publishing and Firebase cloud database provisioning.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('how_to_use')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'how_to_use'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            How to Use (User Guide)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('admin_guide')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'admin_guide'
                ? 'bg-white text-purple-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1-Page Admin Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('firebase_setup')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === 'firebase_setup'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Firebase &amp; Deployment Steps
          </button>
        </div>
      </div>

      {/* SECTION 1: HOW TO USE */}
      {activeSection === 'how_to_use' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">1. Master Data (WS-A &amp; WS-L)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add employees under <strong>TPL</strong> or <strong>Outsource</strong>. Exits
                automatically flip status from &quot;Active&quot; to &quot;Exited&quot;. Register
                vendors with mandatory 15-character GST numbers and 10-digit phone contacts.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">2. Invoice Settlement (WS-B)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admin Personnel can draft invoices. Clicking <strong>Submit</strong> locks the
                invoice and auto-generates a sequence (e.g. <code>INV-2026-0001</code>). Only Head HR
                can <strong>Approve</strong> or <strong>Reject</strong> (with mandatory remarks).
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Hotel className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">3. Accommodation Allotment (WS-C)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Works like a hotel management system. Shows only vacant rooms/beds. Strict rules
                enforced: cannot exceed room capacity, one active bed per employee, and check-out
                releases the bed immediately.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ScrollText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">4. Rent Agreements (WS-H)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All milestones are auto-calculated: tenure end date, locking period completion date,
                notice-to-serve date, and completed tenure. Amber flags appear 60 days before notice
                date; red flags trigger when overdue.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">5. Electricity (WS-I)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Units consumed are auto-calculated (<code>Present − Past</code>). The system blocks
                accidental entry if present reading is less than past reading, and highlights any
                bill with a <strong>&gt;= 30% consumption surge</strong>.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">6. Common Table Tools</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every table provides <strong>Export to Excel (.xlsx)</strong>,{' '}
                <strong>CSV</strong>, <strong>Downloadable Template</strong>,{' '}
                <strong>Import with preview</strong>, <strong>Print view</strong>, column filters, and
                sorting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ONE-PAGE ADMIN GUIDE */}
      {activeSection === 'admin_guide' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              One-Page Administrator Reference
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Managing User Roles &amp; Assigning Workspaces
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Follow this standardized protocol to provision new staff accounts and control data
              access.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-sm">
                Step 1: Open User Management Screen
              </p>
              <p>
                Log in as <strong>Super Admin (Head HR)</strong>. In the left navigation sidebar under{' '}
                <strong>Governance &amp; Administration</strong>, click on <strong>User Management</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-sm">
                Step 2: Click &quot;Add User Account&quot;
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>
                  Enter the user&apos;s full name (e.g., <em>Priya Patel</em>) and official email
                  (e.g., <em>priya.patel@epcc-infra.in</em>).
                </li>
                <li>
                  Select their system role from the dropdown:
                  <ul className="list-circle list-inside ml-4 mt-1 space-y-0.5">
                    <li>
                      <strong>Super Admin (Head HR):</strong> full unconstrained access to all modules,
                      invoice approvals, user management, and audit logs.
                    </li>
                    <li>
                      <strong>Admin Personnel:</strong> can add and edit records only in ticked
                      workspaces; can submit invoices; cannot approve invoices.
                    </li>
                    <li>
                      <strong>Viewer:</strong> read-only lookup in ticked workspaces.
                    </li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-sm">
                Step 3: Tick Assigned Workspaces
              </p>
              <p>
                For <em>Admin Personnel</em> and <em>Viewer</em>, tick only the checkboxes for the
                modules they are authorized to operate. For example:
              </p>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800">
                Camp Admin Staff &rarr; Tick WS-A (Staff/Vendors), WS-C (Accommodation), WS-D (Workmen Colony), WS-F (Sanitation), WS-G (Canteen)
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900 text-sm">
                Step 4: Immediate Enforcement &amp; Audit Logging
              </p>
              <p>
                Click <strong>Create User Account</strong>. When that user logs in, they will see{' '}
                <strong>only their assigned workspaces</strong> in the menu and dashboard. The
                creation event is automatically written to the <strong>Audit Trail</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: FIREBASE SETUP & DEPLOYMENT */}
      {activeSection === 'firebase_setup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Cloud Persistence &amp; Hosting
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              How to Publish / Deploy &amp; Connect Firebase
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your application is currently running with high-performance local storage and real-time
              multi-tab sync. Follow these steps to connect your Firebase cloud backend or publish to
              Cloud Run.
            </p>
          </div>

          <div className="space-y-6 text-xs text-slate-700">
            {/* Step A */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                Create a Firebase Project in Google Cloud
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 ml-7 text-slate-600">
                <li>
                  Go to the{' '}
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold"
                  >
                    Firebase Console
                  </a>{' '}
                  and click <strong>Add project</strong>.
                </li>
                <li>
                  Name your project (e.g. <code>epcc-hradmopts-portal</code>).
                </li>
                <li>
                  In the Firebase left sidebar, click <strong>Build &gt; Authentication</strong> &gt;{' '}
                  <strong>Get started</strong> &gt; enable <strong>Email/Password</strong> sign-in.
                </li>
                <li>
                  Click <strong>Build &gt; Firestore Database</strong> &gt;{' '}
                  <strong>Create database</strong> (choose your closest region, e.g. <code>asia-south1</code> for Mumbai).
                </li>
              </ol>
            </div>

            {/* Step B */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Configure Firestore Security Rules
              </h3>
              <p className="ml-7 text-slate-600">
                In Firebase Console &gt; <strong>Firestore Database</strong> &gt; <strong>Rules</strong>,
                paste the following rules and click <strong>Publish</strong>:
              </p>
              <div className="ml-7 relative">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {sampleFirestoreRules}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopy(sampleFirestoreRules, 'rules')}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-semibold flex items-center gap-1"
                >
                  {copiedCode === 'rules' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedCode === 'rules' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step C */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  3
                </span>
                Obtain Web Credentials &amp; Connect
              </h3>
              <p className="ml-7 text-slate-600">
                In Firebase Console Project Settings (gear icon) &gt; <strong>General</strong> &gt;{' '}
                <strong>Your apps</strong> &gt; click the <strong>Web (&lt;/&gt;)</strong> icon &gt; register app.
              </p>
              <div className="ml-7 relative">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {sampleFirebaseConfig}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopy(sampleFirebaseConfig, 'config')}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-semibold flex items-center gap-1"
                >
                  {copiedCode === 'config' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedCode === 'config' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step D */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  4
                </span>
                Deploying / Publishing the Applet
              </h3>
              <p className="ml-7 text-slate-600">
                Your app is pre-configured with Vite, React, and Express. To deploy in production:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-7 text-slate-600">
                <li>
                  Run <code>npm run build</code> to produce optimized production assets in <code>/dist</code>.
                </li>
                <li>
                  In Google AI Studio Build, click <strong>Deploy / Publish</strong> to launch live to Google Cloud Run!
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
