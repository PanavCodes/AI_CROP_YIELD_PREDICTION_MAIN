import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Sprout, 
  BarChart3, 
  Users, 
  ChevronRight, 
  Menu,
  X,
  ArrowRight,
  Leaf,
  TrendingUp,
  Shield,
  Bot,
  MapPin,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from '../utils/userUtils';

const Landing: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <CloudSun className="w-8 h-8 text-blue-600" />,
      title: "Weather & Soil Analysis",
      description: "Advanced analysis of weather patterns and soil conditions using real-time data and satellite imagery"
    },
    {
      icon: <Bot className="w-8 h-8 text-green-600" />,
      title: "AI-Powered Predictions",
      description: "Machine learning models provide accurate yield predictions and crop recommendations"
    },
    {
      icon: <MapPin className="w-8 h-8 text-purple-600" />,
      title: "Location Intelligence",
      description: "GPS-based field mapping with integrated location services and regional data"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
      title: "Smart Optimization",
      description: "Personalized suggestions for irrigation, fertilizers, and pest management strategies"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Setup Your Farm Profile",
      description: "Input your field details, soil conditions, and farming practices through our intuitive interface"
    },
    {
      number: "02", 
      title: "AI Analysis",
      description: "Our advanced algorithms analyze weather, soil, and regional data to generate insights"
    },
    {
      number: "03",
      title: "Get Smart Recommendations",
      description: "Receive personalized crop suggestions, yield predictions, and optimization strategies"
    }
  ];

  const stats = [
    { number: "25%", label: "Higher Yield", icon: <TrendingUp className="w-6 h-6" /> },
    { number: "10,000+", label: "Active Farmers", icon: <Users className="w-6 h-6" /> },
    { number: "98%", label: "Accuracy Rate", icon: <Shield className="w-6 h-6" /> },
    { number: "100+", label: "Crop Varieties", icon: <Leaf className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-100" style={{backgroundColor: '#F0F4FA'}}>
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Sprout className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">CropPredict AI</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-green-600 transition-colors">How it Works</a>
              <a href="#stats" className="text-gray-700 hover:text-green-600 transition-colors">Impact</a>
              {isAuthenticated() ? (
                <Link to="/dashboard" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link to="/signup" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">Features</a>
                <a href="#how-it-works" className="text-gray-700 hover:text-green-600 transition-colors">How it Works</a>
                <a href="#stats" className="text-gray-700 hover:text-green-600 transition-colors">Impact</a>
                {isAuthenticated() ? (
                  <Link to="/dashboard" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-center">
                    Dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link to="/login" className="text-gray-700 hover:text-green-600 transition-colors text-center font-medium">
                      Sign In
                    </Link>
                    <Link to="/signup" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-center font-medium">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Farming with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> AI Precision</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Revolutionize your agricultural practices with AI-powered crop predictions, weather analysis, and personalized farming recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isAuthenticated() && (
                <>
                  <Link 
                    to="/signup"
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <span>Sign Up Free</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link 
                    to="/login"
                    className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 flex items-center space-x-2"
                  >
                    <span>Sign In</span>
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </>
              )}
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-green-600 hover:text-green-600 transition-all duration-300 flex items-center space-x-2">
                <span>Watch Demo</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Farming
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of AI-powered tools helps you make data-driven decisions for maximum crop yield and profitability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20"
              >
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with our simple three-step process and transform your farming operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Proven Results
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Join thousands of farmers who have already transformed their agricultural practices with our AI-powered platform.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                  <div className="text-white mb-4 flex justify-center">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-green-100">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join the agricultural revolution and start making data-driven decisions for better yields and profitability.
          </p>
          {!isAuthenticated() && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/signup"
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-10 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
              >
                <span>Sign Up Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/login"
                className="border-2 border-green-600 text-green-600 px-10 py-4 rounded-xl font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 inline-flex items-center space-x-2"
              >
                <span>Already have an account? Sign In</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Sprout className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold">CropPredict AI</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Empowering farmers with AI-driven insights for sustainable and profitable agriculture.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#stats" className="hover:text-white transition-colors">Results</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CropPredict AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
