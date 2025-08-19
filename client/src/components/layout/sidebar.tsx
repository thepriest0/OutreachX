import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  BarChart3, 
  Settings,
  Zap,
  TrendingUp,
  Send,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview & insights"
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Users,
    description: "Manage contacts"
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Mail,
    description: "Email outreach"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance data"
  },
  {
    name: "Integrations",
    href: "/integrations",
    icon: Settings,
    description: "Email & tools"
  }
];

const quickActions = [
  {
    name: "Generate Email",
    icon: Zap,
    description: "AI-powered email",
    badge: "AI"
  },
  {
    name: "Schedule Follow-up",
    icon: Calendar,
    description: "Automated sequences"
  },
  {
    name: "Send Campaign",
    icon: Send,
    description: "Bulk outreach"
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 relative",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">OutreachX</h2>
                <p className="text-xs text-muted-foreground">Lead Generation</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 shrink-0"
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground"
                )}
                data-testid={`link-nav-${item.name.toLowerCase()}`}
              >
                <Icon className={cn(
                  "shrink-0 transition-transform duration-200",
                  collapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                  "group-hover:scale-110"
                )} />
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-75 truncate">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <>
            <Separator className="mx-4 my-4" />
            
            {/* Quick Actions */}
            <div className="px-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  
                  return (
                    <button
                      key={action.name}
                      className={cn(
                        "w-full group flex items-center rounded-lg px-3 py-2 text-sm",
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "text-left"
                      )}
                      data-testid={`button-quick-${action.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="h-4 w-4 mr-3 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{action.name}</span>
                          {action.badge && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="mx-4 my-4" />
            
            {/* Status */}
            <div className="px-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}