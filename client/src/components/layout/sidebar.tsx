import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: "fas fa-chart-line",
      current: location === "/",
    },
    {
      name: "Leads",
      href: "/leads",
      icon: "fas fa-users",
      current: location === "/leads",
      count: stats?.totalLeads,
    },
    {
      name: "Email Campaigns",
      href: "/campaigns",
      icon: "fas fa-envelope",
      current: location === "/campaigns",
    },
    {
      name: "AI Email Generator",
      href: "/campaigns",
      icon: "fas fa-robot",
      current: false,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: "fas fa-chart-bar",
      current: location === "/analytics",
    },
    {
      name: "Integrations",
      href: "/integrations",
      icon: "fas fa-plug",
      current: location === "/integrations",
    },
    {
      name: "Settings",
      href: "#",
      icon: "fas fa-cog",
      current: false,
    },
  ];

  const getUserInitials = (user: any) => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return (firstName[0] || "") + (lastName[0] || "");
  };

  const getUserRole = (user: any) => {
    if (!user?.role) return "User";
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo and Company Name */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-rocket text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">OutreachX</h1>
            <p className="text-xs text-gray-500">AI-Powered Outreach</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              item.current
                ? "bg-primary-50 text-primary-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <i className={`${item.icon} w-5`}></i>
            <span>{item.name}</span>
            {item.count && (
              <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {item.count.toLocaleString()}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-medium">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Loading..."}
            </p>
            <p className="text-xs text-gray-500">{getUserRole(user)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
            onClick={() => window.location.href = "/api/logout"}
          >
            <i className="fas fa-sign-out-alt"></i>
          </Button>
        </div>
      </div>
    </aside>
  );
}
