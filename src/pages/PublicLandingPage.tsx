/**
 * PublicLandingPage - Minimalist public landing page for aiduxcare.com
 * 
 * Professional, minimalist design with AiduxCare canonical colors
 * Subtle Canadian references without being explicit
 * English language for professional audience
 * 
 * ISO 27001 Compliant - No sensitive data exposure
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Building2, 
  Brain, 
  CheckCircle2, 
  ArrowRight, 
  MapPin,
  Lock,
  TrendingDown
} from 'lucide-react';

const PublicLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#F7F7F7]">
      {/* Minimal Navigation */}
      <nav className="bg-white/60 backdrop-blur-md border-b border-[#BDC3C7]/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-[#2C3E50] to-[#34495E] rounded-lg p-1.5">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-[#2C3E50] tracking-tight">AiDuxCare</span>
            </div>
            <div className="flex items-center gap-6">
              <Link 
                to="/hospital" 
                className="text-[#475569] hover:text-[#2C3E50] transition-colors text-sm font-medium"
              >
                Hospital Portal
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white rounded-lg hover:from-[#1B2631] hover:to-[#2C3E50] transition-all text-sm font-medium shadow-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Minimalist */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center mb-20">
          {/* Subtle Canadian reference - maple leaf colors in gradient */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#A8E6CF]/20 to-[#C4F1DE]/20 border border-[#A8E6CF]/30 rounded-full text-xs font-medium text-[#2C3E50] mb-8">
            <MapPin className="w-3.5 h-3.5" />
            <span>Canadian Infrastructure • PHIPA Compliant</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-light text-[#2C3E50] mb-6 tracking-tight leading-tight">
            Clinical Documentation
            <br />
            <span className="font-medium bg-gradient-to-r from-[#2C3E50] via-[#34495E] to-[#2C3E50] bg-clip-text text-transparent">
              Designed for Clinicians
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-[#475569] max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Reduce documentation time by 40% while maintaining full PHIPA compliance 
            with infrastructure hosted exclusively in Canada.
          </p>

          {/* Minimal Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-[#BDC3C7]/20">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#FF6F61]/10 to-[#FF8A7F]/10 rounded-full mx-auto mb-3">
                <TrendingDown className="w-5 h-5 text-[#FF6F61]" />
              </div>
              <div className="text-3xl font-light text-[#2C3E50] mb-1">73%</div>
              <div className="text-xs text-[#95A5A6] font-medium">Report burnout</div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-[#BDC3C7]/20">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#2C3E50]/10 to-[#34495E]/10 rounded-full mx-auto mb-3">
                <Brain className="w-5 h-5 text-[#2C3E50]" />
              </div>
              <div className="text-3xl font-light text-[#2C3E50] mb-1">40%</div>
              <div className="text-xs text-[#95A5A6] font-medium">Time reduction</div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-[#BDC3C7]/20">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[#5DA5A3]/10 to-[#7BB8B6]/10 rounded-full mx-auto mb-3">
                <Shield className="w-5 h-5 text-[#5DA5A3]" />
              </div>
              <div className="text-3xl font-light text-[#2C3E50] mb-1">100%</div>
              <div className="text-xs text-[#95A5A6] font-medium">PHIPA compliant</div>
            </div>
          </div>

          {/* Minimal CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/hospital')}
              className="px-8 py-3.5 bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white rounded-lg font-medium hover:from-[#1B2631] hover:to-[#2C3E50] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>Hospital Portal</span>
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-white text-[#2C3E50] border border-[#BDC3C7]/40 rounded-lg font-medium hover:bg-[#F7F7F7] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Request Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section - Minimalist */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-light text-[#2C3E50] mb-4 tracking-tight">
            Built for Canadian Healthcare
          </h2>
          <p className="text-[#475569] max-w-xl mx-auto font-light">
            The only platform designed specifically for Canadian physiotherapists
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Feature 1 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-[#BDC3C7]/20 hover:border-[#A8E6CF]/40 transition-all">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2C3E50]/5 to-[#34495E]/5 rounded-lg mb-6">
              <MapPin className="w-6 h-6 text-[#2C3E50]" />
            </div>
            <h3 className="text-lg font-medium text-[#2C3E50] mb-3">
              Canadian Infrastructure
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed mb-4 font-light">
              All data processed and stored exclusively on Canadian servers. 
              No cross-border data flows.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#5DA5A3]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PHIPA compliant</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-[#BDC3C7]/20 hover:border-[#A8E6CF]/40 transition-all">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2C3E50]/5 to-[#34495E]/5 rounded-lg mb-6">
              <Building2 className="w-6 h-6 text-[#2C3E50]" />
            </div>
            <h3 className="text-lg font-medium text-[#2C3E50] mb-3">
              Secure Hospital Portal
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed mb-4 font-light">
              Quick and secure access to clinical notes during hospital admissions. 
              Dual authentication, auto-delete, virtual transfer.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#5DA5A3]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ISO 27001 compliant</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-[#BDC3C7]/20 hover:border-[#A8E6CF]/40 transition-all">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2C3E50]/5 to-[#34495E]/5 rounded-lg mb-6">
              <Brain className="w-6 h-6 text-[#2C3E50]" />
            </div>
            <h3 className="text-lg font-medium text-[#2C3E50] mb-3">
              AI-Assisted Documentation
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed mb-4 font-light">
              Intelligent clinical documentation that reduces writing time by 40%, 
              allowing focus on what matters: patients.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#5DA5A3]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Proven burnout reduction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal CTA Section */}
      <section className="bg-gradient-to-r from-[#2C3E50] via-[#34495E] to-[#2C3E50] py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-light text-white mb-4 tracking-tight">
            Ready to reduce burnout and ensure compliance?
          </h2>
          <p className="text-white/80 mb-10 font-light">
            Join Canadian physiotherapists already using AiDuxCare
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/hospital')}
              className="px-8 py-3.5 bg-white text-[#2C3E50] rounded-lg font-medium hover:bg-[#F7F7F7] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>Hospital Portal</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-transparent text-white border-2 border-white/30 rounded-lg font-medium hover:border-white/50 transition-all flex items-center justify-center gap-2"
            >
              <span>Request Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-[#2C3E50] text-[#BDC3C7] py-12">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#A8E6CF]" />
                <span className="text-white font-medium">AiDuxCare</span>
              </div>
              <p className="text-xs text-[#95A5A6] leading-relaxed font-light">
                Clinical security platform for Canadian physiotherapists.
                100% PHIPA compliance guaranteed.
              </p>
            </div>
            
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/hospital" className="hover:text-white transition-colors font-light">
                    Hospital Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors font-light">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors font-light">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors font-light">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/compliance" className="hover:text-white transition-colors font-light">
                    PHIPA Compliance
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Contact</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="mailto:support@aiduxcare.com" className="hover:text-white transition-colors font-light">
                    support@aiduxcare.com
                  </a>
                </li>
                <li className="flex items-center gap-2 font-light">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Canada</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#34495E] pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-[#95A5A6] font-light">
              © {new Date().getFullYear()} AiDuxCare. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="flex items-center gap-2 text-xs text-[#95A5A6] font-light">
                <Lock className="w-3.5 h-3.5" />
                <span>100% Canadian data</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#95A5A6] font-light">
                <Shield className="w-3.5 h-3.5" />
                <span>PHIPA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
