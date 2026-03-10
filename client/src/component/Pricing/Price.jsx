import { useState } from 'react';
import './price.css';

const Price = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      icon: '⭐',
      description: 'Perfect for individuals getting started',
      monthlyPrice: 29,
      yearlyPrice: 290,
      originalYearlyPrice: 348,
      features: [
        'Up to 5 projects',
        'Basic analytics',
        'Email support',
        '10GB storage',
        'Standard templates',
        'Mobile app access'
      ],
      badge: null,
      buttonText: 'Get Started',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      icon: '🏆',
      description: 'For growing businesses and teams',
      monthlyPrice: 79,
      yearlyPrice: 790,
      originalYearlyPrice: 948,
      features: [
        'Unlimited projects',
        'Advanced analytics',
        'Priority support',
        '100GB storage',
        'Premium templates',
        'Team collaboration',
        'Custom integrations',
        'Advanced reporting'
      ],
      badge: 'Most Popular',
      buttonText: 'Upgrade Now',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: '👑',
      description: 'For large organizations with custom needs',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      originalYearlyPrice: 2388,
      features: [
        'Everything in Professional',
        'Unlimited storage',
        'Dedicated account manager',
        'Custom development',
        'SLA guarantee',
        'Advanced security',
        'API access',
        'White-label options',
        'Priority implementation'
      ],
      badge: 'Enterprise',
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  const calculateSavings = (monthly, yearly) => {
    const monthlyCost = monthly * 12;
    const savings = ((monthlyCost - yearly) / monthlyCost * 100).toFixed(0);
    return savings;
  };

  return (
    <div className="luxury-pricing-container">
      <div className="luxury-pricing-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="geometric-pattern"></div>

      <div className="luxury-pricing-content">
        <div className="pricing-header">
          <div className="luxury-badge">
            <span className="badge-icon">🛡️</span>
            Premium Plans
          </div>

          <h1 className="pricing-title">
            <span className="title-line main-text">Choose Your</span>
            <span className="title-line elite-text">Elite Package</span>
          </h1>

          <p className="pricing-subtitle">
            Unlock premium features and take your business to the next level with our carefully crafted plans
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="billing-toggle-container">
          <div className="billing-toggle">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}
            >
              Yearly
              <span className="savings-badge">Save 20%</span>
            </button>
            <div className={`billing-slider ${billingCycle === 'yearly' ? 'yearly' : 'monthly'}`}></div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-cards">
          {plans.map((plan, index) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const originalPrice = billingCycle === 'yearly' ? plan.originalYearlyPrice : null;
            const savings = billingCycle === 'yearly' ? calculateSavings(plan.monthlyPrice, plan.yearlyPrice) : null;

            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.popular ? 'popular' : ''} ${hoveredPlan === plan.id ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {(plan.popular || hoveredPlan === plan.id) && <div className="card-glow"></div>}

                <div className="card-content">
                  {plan.badge && <div className="plan-badge">{plan.badge}</div>}

                  <div className="card-header">
                    <div className={`plan-icon ${plan.popular ? 'popular-icon' : ''}`}>
                      {plan.icon}
                    </div>
                    <h3 className="plan-name">{plan.name}</h3>
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <div className="pricing-section">
                    <div className="price-container">
                      <span className="price">${price}</span>
                      <span className="period">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                    </div>

                    {originalPrice && billingCycle === 'yearly' && (
                      <div className="original-price">
                        <span className="crossed-price">${originalPrice}/year</span>
                        <span className="savings">Save {savings}%</span>
                      </div>
                    )}
                  </div>

                  <ul className="features-list">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="feature-item">
                        <span className="check-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button className={`cta-button ${plan.popular ? 'popular-button' : ''}`}>
                    <span className="btn-shine"></span>
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="trust-section">
          <div className="trust-indicators">
            <div className="trust-item">
              <span className="trust-icon-1">🔒</span>
              <span>SSL Secured</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon-2">📞</span>
              <span>24/7 Support</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon-3">💯</span>
              <span>Money Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Price;
