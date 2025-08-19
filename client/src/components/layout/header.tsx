import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          {/* AI Insights Toggle */}
          <Button variant="outline" className="border-gray-300">
            <i className="fas fa-brain mr-2 text-secondary-500"></i>
            AI Insights
          </Button>
          
          {/* Email Integration Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Gmail Connected</span>
          </div>
          
          {/* Quick Actions */}
          {action || (
            <Button className="bg-primary-500 hover:bg-primary-600">
              <i className="fas fa-plus mr-2"></i>
              Add Lead
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
