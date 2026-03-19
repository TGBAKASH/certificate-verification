import { Web3Provider } from "@/context/Web3Context";
import "@/app/globals.css";

export const metadata = {
  title: "Blockchain Certificate Verification",
  description: "Verify digital certificates transparently on Ethereum Blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-slate-900 font-sans">
        <Web3Provider>
          <nav className="w-full bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="flex-shrink-0 flex items-center font-bold text-xl tracking-tight text-blue-600">
                    CertVerify
                  </a>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <a href="/" className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">Verify</a>
                    <a href="/admin/dashboard" className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">Admin</a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
