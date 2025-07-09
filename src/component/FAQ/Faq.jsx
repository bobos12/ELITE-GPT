import { useState } from 'react';
import "./faq.css";

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: 'Is ELITE AI a substitute for a lawyer?',
      answer: 'While our sophisticated AI provides highly accurate legal intelligence and comprehensive analysis, it serves as an advanced research and guidance tool rather than replacing personalized counsel from a licensed attorney for complex legal matters requiring professional representation.',
      icon: '⚖️'
    },
    {
      question: 'How is my confidential data protected?',
      answer: 'We implement military-grade encryption protocols, zero-knowledge architecture, and Swiss-level confidentiality standards. Your sensitive information is never shared, stored persistently, or utilized for system training without explicit written consent.',
      icon: '🔒'
    },
    {
      question: 'What jurisdictions does your system cover?',
      answer: 'Our comprehensive legal database encompasses all 50 U.S. states, federal regulations, major international legal frameworks including EU, UK, Canadian, and Australian systems, with continuous expansion into emerging markets.',
      icon: '🌍'
    },
    {
      question: 'Can I utilize this for corporate legal matters?',
      answer: 'Absolutely. Our platform excels in both individual and enterprise-level legal analysis, offering specialized modules for corporate governance, compliance, contract analysis, intellectual property, and regulatory affairs.',
      icon: '🏢'
    },
    {
      question: 'How current is your legal intelligence database?',
      answer: 'Our systems undergo real-time updates with continuous monitoring of case law developments, statutory changes, regulatory amendments, and judicial precedents. Updates are deployed within hours of official publication.',
      icon: '⚡'
    },
    {
      question: 'What makes ELITE AI different from other legal platforms?',
      answer: 'Our proprietary neural architecture combines advanced natural language processing with specialized legal reasoning models, trained on curated datasets and validated by top-tier legal professionals for unmatched accuracy and insight.',
      icon: '🧠'
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="luxury-faq">
      {/* Animated Background Elements */}
      <div className="luxury-faq-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="geometric-pattern"></div>
        <div className="floating-elements">
          <div className="float-element element-1">⚖️</div>
          <div className="float-element element-2">📚</div>
          <div className="float-element element-3">🎯</div>
          <div className="float-element element-4">✨</div>
        </div>
      </div>

      <div className="luxury-faq-container">
        {/* Enhanced Header */}
        <div className="luxury-faq-header">
          <div className="luxury-badge">
            <span className="badge-icon">💎</span>
            Frequently Asked Questions
          </div>
          <h2 className="luxury-faq-title">
            Refined <span className="elite-text">Inquiries</span>
          </h2>
          <p className="luxury-faq-subtitle">
            Comprehensive answers to the most sophisticated questions about our premium legal intelligence platform, 
            designed to address the concerns of discerning professionals who demand excellence.
          </p>
        </div>
        
        {/* Enhanced Accordion */}
        <div className="luxury-faq-accordion">
          {faqs.map((faq, index) => (
            <div 
              className={`luxury-faq-item ${activeIndex === index ? 'active' : ''}`} 
              key={index}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button 
                className="luxury-faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={activeIndex === index}
              >
                <div className="question-content">
                  <span className="question-icon">{faq.icon}</span>
                  <span className="luxury-faq-question-text">{faq.question}</span>
                </div>
                <div className="luxury-faq-toggle">
                  <div className="toggle-icon">
                    <span className="icon-line horizontal"></span>
                    <span className="icon-line vertical"></span>
                  </div>
                </div>
                <div className="question-shine"></div>
              </button>
              
              <div className="luxury-faq-answer">
                <div className="luxury-faq-answer-content">
                  <div className="answer-text">{faq.answer}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>      
    </section>
  );
};

export default FAQ;