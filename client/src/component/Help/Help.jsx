import React, { useEffect, useState } from 'react';
import './help.css';

const Help = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      number: '1',
      title: 'Present Your Case',
      description: 'Describe your legal situation in plain language with complete confidentiality and precision',
      icon: '⚖️',
      detail: 'Advanced encryption ensures your privacy'
    },
    {
      number: '2',
      title: 'AI Analysis',
      description: 'Our sophisticated system processes thousands of legal references and precedents instantly',
      icon: '🧠',
      detail: 'Powered by machine learning algorithms'
    },
    {
      number: '3',
      title: 'Receive Guidance',
      description: 'Get clear, actionable legal advice tailored to your specific circumstances and jurisdiction',
      icon: '📋',
      detail: 'Customized recommendations and next steps'
    },
    {
      number: '4',
      title: 'Expert Consultation',
      description: 'Connect with elite legal professionals when complex matters require specialized human expertise',
      icon: '👨‍💼',
      detail: 'Access to top-tier legal professionals'
    }
  ];

  return (
    <section className="luxury-process">
      {/* Enhanced Animated Background */}
      <div className="luxury-process-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="gradient-orb orb-4"></div>
        <div className="geometric-pattern"></div>
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>
      </div>

      <div className="luxury-process-container">
        {/* Premium Header */}
        <div className={`luxury-process-header ${isVisible ? 'visible' : ''}`}>
          <div className="luxury-badge">
            <span className="badge-icon">✨</span>
            <span className="badge-text">Premium Legal Process</span>
            <div className="badge-glow"></div>
          </div>
          <h2 className="luxury-process-title">
            The <span className="elite-text">Elite</span> Experience
          </h2>
          <div className="title-underline"></div>
          <p className="luxury-process-subtitle">
            Sophisticated legal solutions delivered through our refined methodology, 
            combining cutting-edge AI technology with unparalleled expertise.
          </p>
        </div>
        
        {/* Enhanced Process Steps */}
        <div className="luxury-process-steps">
          {steps.map((step, index) => (
            <div 
              className={`luxury-process-step ${activeStep === index ? 'active' : ''} ${isVisible ? 'visible' : ''}`} 
              key={index}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="luxury-process-step-number">
                <div className="step-number-outer-ring"></div>
                <div className="step-number-bg"></div>
                <span className="step-number-text">{step.number}</span>
                <div className="step-number-glow"></div>
                <div className="step-number-pulse"></div>
              </div>
              
              <div className="luxury-process-step-content">
                <div className="content-inner">
                  <div className="step-icon-wrapper">
                    <div className="step-icon">{step.icon}</div>
                    <div className="icon-glow"></div>
                  </div>
                  <div className="step-text">
                    <h3 className="luxury-process-step-title">{step.title}</h3>
                    <p className="luxury-process-step-description">{step.description}</p>
                    <div className="step-detail">{step.detail}</div>
                  </div>
                </div>
                <div className="step-shine"></div>
                <div className="content-border-glow"></div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="luxury-process-step-connector">
                  <div className="connector-line">
                    <div className="connector-progress"></div>
                  </div>
                  <div className="connector-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Help;