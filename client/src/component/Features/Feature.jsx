
import "./feature.css"
const Features = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Instant Analysis',
      description: 'Receive comprehensive legal assessments in seconds, not hours. Our advanced AI processes complex legal documents with unmatched speed and precision.'
    },
    {
      icon: '🔒',
      title: 'Confidential & Secure',
      description: 'Military-grade encryption protects all your sensitive information. Your legal matters remain completely private and secure at all times.'
    },
    {
      icon: '🌐',
      title: '24/7 Global Access',
      description: 'Available worldwide with round-the-clock support. Access premium legal intelligence whenever and wherever you need it most.'
    },
    {
      icon: '⚖️',
      title: 'Multi-Jurisdictional',
      description: 'Comprehensive coverage across all major legal systems and jurisdictions. Navigate complex international legal landscapes with confidence.'
    },
    {
      icon: '🎯',
      title: 'Precision Targeting',
      description: 'Laser-focused analysis tailored to your specific legal requirements. Every insight is customized for maximum relevance and impact.'
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Deep insights powered by cutting-edge AI algorithms. Transform raw legal data into actionable intelligence and strategic advantages.'
    }
  ];

  return (
    <section className="luxury-features">
      <div className="luxury-features-bg">
        <div className="gradient-orb features-orb-1"></div>
        <div className="gradient-orb features-orb-2"></div>
        <div className="gradient-orb features-orb-3"></div>
        <div className="geometric-pattern"></div>
      </div>
      
      <div className="luxury-features-container">
        <div className="luxury-features-header">
          <div className="luxury-badge">
            <span className="badge-icon">✨</span>
            Premium Features
          </div>
          <h2 className="luxury-features-title">
            <span className="title-line">
              <span className="elite-text">Unparalleled</span>
              <span className="main-text">Legal Intelligence</span>
            </span>
            <span className="accent-text">Engineered for Excellence</span>
          </h2>
          <p className="luxury-features-subtitle">
            Experience the gold standard in AI-powered legal consultation with features designed for the most demanding professionals
          </p>
        </div>

        <div className="luxury-features-grid">
          {features.map((feature, index) => (
            <div key={index} className="luxury-feature-card" style={{animationDelay: `${index * 0.2}s`}}>
              <div className="card-glow"></div>
              <div className="luxury-feature-icon">
                <span className="icon-glow">{feature.icon}</span>
              </div>
              <h3 className="luxury-feature-title">{feature.title}</h3>
              <p className="luxury-feature-description">{feature.description}</p>
              <div className="card-border"></div>
            </div>
          ))}
        </div>

        <div className="features-cta">
          <button className="luxury-cta-button">
            <span className="btn-shine"></span>
            Experience Premium Features
          </button>
          <button className="luxury-secondary-button">
            Learn More
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div> 
    </section>
  );
};

export default Features;