import { Web3Provider } from "@/context/Web3Context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import "@/app/globals.css";

export const metadata = {
  title: "CertVerify — Blockchain Certificate Verification",
  description: "Issue and verify digital certificates on the Ethereum blockchain. Fraud-proof. Transparent. Secure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            {/* Animated background orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />

            <Web3Provider>
              {/* Premium glassmorphism navbar */}
              <nav className="nav-blur fixed top-0 left-0 right-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    <a href="/" className="flex items-center space-x-2 group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <span className="text-lg font-bold gradient-text">CertVerify</span>
                    </a>

                    <div className="flex items-center space-x-2">
                      <a href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition-all font-medium">
                        Verify
                      </a>
                      <a href="/dashboard" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition-all font-medium">
                        Student
                      </a>
                      <a href="/admin/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition-all font-medium">
                        Admin
                      </a>
                      
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </nav>

              <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 min-h-screen">
                {children}
              </main>
            </Web3Provider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
