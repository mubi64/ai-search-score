
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, PlusCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home
  },
  {
    title: "New Analysis",
    url: createPageUrl("Start"),
    icon: PlusCircle
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('companyId');
    sessionStorage.removeItem('companyDomain');
    sessionStorage.removeItem('companyData');
    sessionStorage.removeItem('isNewUser');
    navigate(createPageUrl("Start"));
  };

  if (currentPageName === "AdminDashboard") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f7f3f0]">
      <style>{`
        :root {
          --primary: 223 29 41;
          --primary-foreground: 255 255 255;
          --secondary: 52 69 71;
          --secondary-foreground: 255 255 255;
          --accent: 223 29 41;
          --muted: 247 243 240;
          --muted-foreground: 52 69 71;
        }
      `}</style>
      
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eb1c48825883517ef92110/db02e8cbb_Untitleddesign10.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h2 className="font-bold text-[#344547] text-lg">AISearchScore</h2>
                <p className="text-xs text-slate-500">AI Visibility</p>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-2">
                {navigationItems.map((item) => (
                  <Link key={item.title} to={item.url}>
                    <Button
                      variant={location.pathname === item.url ? "default" : "ghost"}
                      className={`flex items-center gap-2 ${
                        location.pathname === item.url
                          ? "bg-[#df1d29] hover:bg-[#c51923] text-white shadow-lg shadow-red-500/30"
                          : "hover:bg-[#f7f3f0] hover:text-[#df1d29]"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="hidden md:inline">{item.title}</span>
                    </Button>
                  </Link>
                ))}
              </nav>

              <div className="h-8 w-px bg-slate-200"></div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline text-sm">Reset</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Company?</AlertDialogTitle>
                    <AlertDialogDescription className="text-black">
                      This will clear your current company data and return you to the email entry screen. 
                      You'll need to enter your company email again to start a new analysis.
                      <br /><br />
                      <strong>All your reports will be automatically saved and can be accessed again by logging in with your email.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Reset Company
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
