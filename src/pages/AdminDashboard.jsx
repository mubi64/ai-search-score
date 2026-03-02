
import React, { useState, useEffect } from "react"; // Added useEffect
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import apiClient from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // Check authentication
  useEffect(() => { // Changed to useEffect
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
      navigate(createPageUrl("AdminLogin"));
    }
  }, [navigate]);

  const { data: adminData, isLoading, error } = useQuery({
    queryKey: ['adminData'],
    queryFn: async () => {
      const response = await apiClient.functions.invoke('getAdminData');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Error loading admin data: {error.message}</p>
              <Button onClick={() => navigate(createPageUrl("Start"))} className="mt-4">
                Back to Start
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { users = [], totalReports = 0 } = adminData || {};

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    navigate(createPageUrl("Start"));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f7f3f0]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#344547] mb-2">
              Admin Dashboard
            </h1>
            <p className="text-lg text-slate-600">
              Monitor user activity and system usage
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-[#344547]">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#df1d29] to-[#c51923] rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-[#344547]">{totalReports}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#df1d29] to-[#c51923] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-2xl text-[#344547]">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-[#344547]">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#344547]">Domain</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#344547]">Submissions</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#344547]">Last Submission</th>
                    <th className="text-left p-4 text-sm font-semibold text-[#344547]">First Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.email} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-4 text-sm text-[#344547]">{user.email}</td>
                      <td className="p-4 text-sm text-[#344547]">{user.domain || '-'}</td>
                      <td className="p-4 text-sm">
                        <Badge className="bg-blue-100 text-blue-700">
                          {user.submissionCount || 0}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {user.lastSubmission ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(user.lastSubmission), 'MMM d, yyyy h:mm a')}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {user.firstSubmission ? format(new Date(user.firstSubmission), 'MMM d, yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No user data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
