import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const footerSections = [
    { title: 'Product', links: ['Features', 'Pricing', 'Blog'] },
    { title: 'Company', links: ['About', 'Contact', 'Careers'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Disclaimer'] },
  ];

  return (
    <footer className="theme-footer relative mt-16 overflow-hidden border-t">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-10 top-0 h-40 w-40 rounded-full bg-[#8ef7c7]/10 blur-3xl" />
        <div className="absolute right-10 top-8 h-36 w-36 rounded-full bg-[#ffb5d3]/10 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="theme-footer-brand text-xl font-bold">FitNova AI</h3>
            <p className="theme-footer-copy text-sm">AI-powered fitness coaching with a richer, more cinematic command-center feel.</p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="theme-footer-title mb-4 font-semibold">{section.title}</h4>
              <ul className="theme-footer-copy space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="theme-footer-link transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="theme-footer-divider flex flex-col items-center justify-between border-t pt-8 md:flex-row">
          <p className="theme-footer-meta text-sm">Copyright {currentYear} FitNova AI. All rights reserved.</p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <a href="#" className="theme-footer-social transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="theme-footer-social transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.092-.937.349-1.546.636-1.903-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.270.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817a9.54 9.54 0 012.503.336c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
