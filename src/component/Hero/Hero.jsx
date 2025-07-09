import  { useState, useRef } from 'react';
import './hero.css';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm ELITE, your Egyptian legal assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

 

  const suggestedQuestions = [
    "What are the legal requirements for marriage in Egypt?",
    "How can I get an Egyptian birth certificate?",
  ];

  const getBotResponse = (userMessage) => {
    const responses = {
      'business': "According to Egyptian Company Law No. 159 of 1981, you'll need to register with the Commercial Registry, obtain tax registration, and comply with specific capital requirements...",
      'marriage': "Under Egyptian Personal Status Law, marriage requirements include valid identification, medical certificates, and registration with the Ministry of Justice...",
      'divorce': "Egyptian divorce law provides several pathways including Khula, Mubarat, and court dissolution. Each has specific procedures and requirements...",
      'property': "Egyptian property law distinguishes between freehold and usufruct rights. Foreign ownership has specific restrictions and procedures...",
      'default': "I understand you're asking about Egyptian law. Could you please be more specific about your legal question? I can help with business law, family law, property law, and more."
    };

    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('business') || lowerMessage.includes('company')) return responses.business;
    if (lowerMessage.includes('marriage') || lowerMessage.includes('marry')) return responses.marriage;
    if (lowerMessage.includes('divorce') || lowerMessage.includes('separation')) return responses.divorce;
    if (lowerMessage.includes('property') || lowerMessage.includes('real estate')) return responses.property;
    return responses.default;
  };

  const handleSendMessage = async (messageText = null) => {
    const messageToSend = messageText || inputMessage.trim();
    if (!messageToSend) return;

    const userMessage = {
      id: messages.length + 1,
      text: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(messageToSend),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section className="luxury-hero">
      {/* Animated background elements */}
      <div className="luxury-hero-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      {/* Geometric pattern overlay */}
      <div className="geometric-pattern"></div>
      
      {/* Main content */}
      <div className="luxury-hero-content">
        <div className="luxury-hero-text">
          <div className="luxury-badge">
            <span className="badge-icon">⚖</span>
            <span>Premium Legal Intelligence</span>
          </div>
          
          <h1 className="luxury-hero-title">
            <span className="title-line">
              <span className="elite-text">ELITE</span>
              <span className="main-text">Legal Assistant</span>
            </span>
            <span className="title-line">
              <span className="accent-text">Your Smart Legal Assistant for Egyptian Law</span>
            </span>
          </h1>
          
          <p className="luxury-hero-subtitle">
            Ask legal questions, get accurate answers in seconds — powered by AI and Egyptian legal data.
          </p>
          
          <div className="luxury-hero-buttons">
            <button
                className="luxury-hero-cta"
                onClick={() => navigate('/chat')}
            >
                <span className="btn-text">Start Chatting Now</span>
                <div className="btn-shine"></div>
            </button> 
          </div>
          <div className="trust-items">
            <div className="trust-item">
              <div className="trust-icon-1">●</div>
              <span>Available 24/7</span>
            </div>
            <div className="trust-item">
              <div className="trust-icon-2">●</div>
              <span>Secure & Confidential</span>
            </div>
            <div className="trust-item">
              <div className="trust-icon-3">●</div>
              <span>Egyptian Law Expert</span>
            </div>
          </div>
        </div>
        

        {/* Interactive Chat Window */}
        <div className={`chat-widget ${isChatMinimized ? 'minimized' : ''}`}>
          <div className="chat-header">
            <div className="chat-avatar">
              <span className="avatar-text">E</span>
            </div>
            <div className="chat-info">
              <div className="chat-title">ELITE Legal Assistant</div>
              <div className="chat-status">Online • Egyptian Law Expert</div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  {message.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-suggestions">
            <div className="suggestions-label">Try asking:</div>
            <div className="suggestions-list">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  className="suggestion-button"
                  onClick={() => handleSendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about Egyptian law..."
              className="chat-input"
            />
            <button 
              className="chat-send"
              onClick={() => navigate('/chat')}
              disabled={!inputMessage.trim()}
            >
              Ask ELITE
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;