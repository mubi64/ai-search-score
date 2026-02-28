import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      const response = await apiClient.functions.invoke('verifyAdminPassword', {
        password
      });

      if (response.data.success) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        navigate(createPageUrl("AdminDashboard"));
      } else {
        setError("Invalid password");
        setPassword("");
      }
    } catch (err) {
      setError("Failed to verify password");
      console.error('Admin login error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0] flex items-center justify-center">
      <div className="max-w-md w-full">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Start"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Start
        </Button>

        <Card className="border-0 shadow-2xl shadow-slate-200 backdrop-blur-xl bg-white">
          <CardHeader className="border-b border-slate-100 text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#df1d29] to-[#c51923] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#344547]">
              Admin Access
            </CardTitle>
            <p className="text-slate-500 mt-2">
              Enter admin password to continue
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  disabled={isVerifying}
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!password || isVerifying}
                className="w-full bg-[#df1d29] hover:bg-[#c51923] text-white"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}