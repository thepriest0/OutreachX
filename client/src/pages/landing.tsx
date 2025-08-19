import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center">
                <i className="fas fa-rocket text-white text-2xl"></i>
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              OutreachX
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              AI-Powered Lead & Outreach Dashboard
            </p>
            <p className="text-lg text-gray-500 mb-8">
              Automate your design studio's lead outreach with intelligent email generation and comprehensive analytics
            </p>
            
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg font-medium shadow-lg"
            >
              Get Started
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-blue-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Lead Management
                </h3>
                <p className="text-gray-600">
                  Organize and track your leads with powerful search, filtering, and CSV import/export capabilities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-purple-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  AI Email Generation
                </h3>
                <p className="text-gray-600">
                  Generate personalized cold emails and follow-up sequences using Google Gemini AI with customizable tones.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-bar text-green-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Analytics & Insights
                </h3>
                <p className="text-gray-600">
                  Track email performance, response rates, and get AI-powered insights to optimize your outreach strategy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-envelope text-yellow-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Email Integration
                </h3>
                <p className="text-gray-600">
                  Connect with Gmail and Outlook to send emails directly from the dashboard with status tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-clock text-red-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Follow-up Automation
                </h3>
                <p className="text-gray-600">
                  Schedule up to 3 follow-up emails per lead with intelligent sequencing and automatic reply detection.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users-cog text-indigo-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Team Collaboration
                </h3>
                <p className="text-gray-600">
                  Role-based access for founders, strategists, and designers with collaborative lead management.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Outreach?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join design studios already using OutreachX to generate more leads and close more deals.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                size="lg"
                className="bg-white text-primary-700 hover:bg-gray-50 px-8 py-3 text-lg font-medium"
              >
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
