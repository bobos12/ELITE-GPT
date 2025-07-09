import { useState, useRef, useEffect } from 'react';
import { Send, Scale, Crown, User } from 'lucide-react';

const EliteChat = () => {
  const conversation = [
    { question: 'ما هو العقد القانوني؟', answer: 'العقد هو اتفاق مُلزِم بين طرفين أو أكثر ينشئ التزامات قانونية لكل طرف.' },
    { question: 'ما الفرق بين الجنحة والجناية؟', answer: 'الجنحة جريمة بسيطة عقوبتها أخف، أما الجناية فهي جريمة خطيرة قد تصل عقوبتها للسجن المؤبد أو الإعدام.' },
    { question: 'كيف أحمي علامتي التجارية؟', answer: 'يمكنك تسجيل علامتك التجارية لدى الجهة المختصة لحمايتها قانونيًا ومنع الآخرين من استخدامها.' },
    { question: 'ما هي الملكية الفكرية؟', answer: 'هي الحقوق القانونية التي تحمي الابتكارات والإبداعات الفكرية مثل الكتب، الاختراعات، العلامات التجارية، وبراءات الاختراع.' },
    { question: 'كيف أرفع قضية طلاق؟', answer: 'تبدأ الإجراءات بتقديم طلب رسمي في محكمة الأحوال الشخصية مرفقًا بالمستندات الداعمة وأسباب الطلاق.' },
    { question: 'ما هي الوصية القانونية؟', answer: 'الوصية هي مستند قانوني يحدد كيفية توزيع ممتلكات الشخص بعد وفاته وفقًا لرغبته.' },
    { question: 'هل يمكن الطعن في حكم المحكمة؟', answer: 'نعم، يمكن الطعن في الحكم أمام محكمة أعلى خلال المدة القانونية المحددة للطعن.' },
    { question: 'ما المقصود بالحضانة؟', answer: 'هي حق رعاية وتربية الطفل من قبل أحد الأبوين بعد الطلاق أو الانفصال وفقًا لأحكام القانون.' },
    { question: 'ما الفرق بين الدعوى المدنية والدعوى الجنائية؟', answer: 'الدعوى المدنية تتعلق بالنزاعات الخاصة بين الأفراد مثل التعويضات، بينما الدعوى الجنائية تخص الأفعال التي يعاقب عليها القانون لحماية المجتمع.' },
  ];

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'مرحبًا بك في Elite Legal AI. أنا مساعدك القانوني الذكي. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date()
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || currentIndex >= conversation.length) return;

    const { question, answer } = conversation[currentIndex];
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: answer,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      setCurrentIndex(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="elite-chat-container">
      {/* Luxury Background Elements */}
      <div className="luxury-bg">
        <div className="marble-pattern"></div>
        <div className="gold-veins"></div>
        <div className="legal-symbols">
          <div className="symbol symbol-1">⚖</div>
          <div className="symbol symbol-2">§</div>
          <div className="symbol symbol-3">⚖</div>
          <div className="symbol symbol-4">§</div>
        </div>
      </div>

      {/* Header */}
      <header className="elite-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-wrapper">
              <Crown className="crown-icon" size={32} />
              <div className="logo-glow"></div>
            </div>
            <div className="title-section">
              <h1 className="elite-title">ELITE</h1>
              <p className="elite-subtitle">Legal AI Advisor</p>
            </div>
          </div>
          <div className="status-badge">
            <div className="status-dot"></div>
            <span>Premium Active</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="chat-main">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message-wrapper ${message.type}`}>
              <div className="message-content">
                <div className="message-bubble">
                  <div className="message-header">
                    <div className="avatar">
                      {message.type === 'assistant' ? <Scale size={20} /> : <User size={20} />}
                    </div>
                    <div className="message-meta">
                      <span className="sender-name">
                        {message.type === 'assistant' ? 'Elite Legal AI' : 'أنت'}
                      </span>
                      <span className="timestamp">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                  <div className="message-body">
                    <p>{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-wrapper assistant">
              <div className="message-content">
                <div className="message-bubble">
                  <div className="message-header">
                    <div className="avatar">
                      <Scale size={20} />
                    </div>
                    <div className="message-meta">
                      <span className="sender-name">Elite Legal AI</span>
                    </div>
                  </div>
                  <div className="message-body">
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="chat-footer">
        <div className="input-container">
          <div className="input-form">
            <div className="input-wrapper">
              <textarea
                value={
                  currentIndex < conversation.length
                    ? conversation[currentIndex].question
                    : 'انتهت الأسئلة.'
                }
                readOnly
                className="message-input"
                rows={1}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || currentIndex >= conversation.length}
                className="send-button"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <div className="input-footer">
            <p className="disclaimer">
              Elite Legal AI يقدم معلومات عامة فقط. استشر محاميًا مختصًا قبل اتخاذ أي قرار قانوني.
            </p>
          </div>
        </div>
      </footer>
      
      <style jsx>{`
        .elite-chat-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .luxury-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .marble-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, rgba(20, 15, 5, 0.9) 0%, rgba(10, 8, 2, 0.95) 50%, rgba(0, 0, 0, 1) 100%);
          opacity: 0.8;
        }

        .gold-veins {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            linear-gradient(45deg, transparent 48%, rgba(255, 215, 0, 0.03) 49%, rgba(255, 215, 0, 0.05) 50%, rgba(255, 215, 0, 0.03) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(255, 215, 0, 0.02) 49%, rgba(255, 215, 0, 0.04) 50%, rgba(255, 215, 0, 0.02) 51%, transparent 52%);
          background-size: 200px 200px, 150px 150px;
          animation: subtle-flow 20s linear infinite;
        }

        @keyframes subtle-flow {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 200px 200px, -150px 150px; }
        }

        .legal-symbols {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.03;
        }

        .symbol {
          position: absolute;
          font-size: 8rem;
          color: #ffd700;
          font-weight: 300;
          user-select: none;
          animation: float 15s ease-in-out infinite;
        }

        .symbol-1 { top: 20%; left: 15%; animation-delay: 0s; }
        .symbol-2 { top: 60%; right: 20%; animation-delay: 5s; }
        .symbol-3 { bottom: 25%; left: 25%; animation-delay: 10s; }
        .symbol-4 { top: 40%; right: 35%; animation-delay: 7s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        .elite-header {
          background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(20,15,5,0.9) 100%);
          border-bottom: 2px solid rgba(255, 215, 0, 0.3);
          backdrop-filter: blur(20px);
          padding: 1.5rem 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .logo-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
        }

        .crown-icon {
          color: #ffd700;
          z-index: 2;
          position: relative;
          filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
        }

        .logo-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse-glow 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        .title-section {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .elite-title {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: 0.15em;
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }

        .elite-subtitle {
          color: rgba(255, 215, 0, 0.8);
          font-size: 0.95rem;
          font-weight: 500;
          margin: 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 215, 0, 0.15);
          border: 2px solid rgba(255, 215, 0, 0.4);
          border-radius: 25px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #ffd700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
        }

        .status-dot {
          width: 10px;
          height: 10px;
          background: #00ff88;
          border-radius: 50%;
          animation: pulse 2s infinite;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chat-main {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem 0;
        }

        .message-wrapper {
          padding: 1.5rem 0;
          display: flex;
        }

        .message-wrapper.assistant {
          justify-content: flex-start;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message-content {
          max-width: 75%;
          padding: 0 3rem;
        }

        .message-bubble {
          border-radius: 20px;
          padding: 1.75rem 2rem;
          position: relative;
          backdrop-filter: blur(15px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          border: 2px solid transparent;
        }

        .assistant .message-bubble {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 215, 0, 0.08) 100%);
          border-image: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 0.2)) 1;
          border-bottom-left-radius: 8px;
          position: relative;
        }

        .assistant .message-bubble::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 0.2));
          border-radius: 20px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: subtract;
          z-index: -1;
        }

        .user .message-bubble {
          background: linear-gradient(135deg, rgba(120, 120, 120, 0.25) 0%, rgba(80, 80, 80, 0.35) 100%);
          border-image: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15)) 1;
          border-bottom-right-radius: 8px;
          position: relative;
        }

        .user .message-bubble::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15));
          border-radius: 20px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: subtract;
          z-index: -1;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .assistant .avatar {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          color: #000;
        }

        .user .avatar {
          background: linear-gradient(135deg, #888 0%, #aaa 100%);
          color: #ffd700;
        }

        .message-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .sender-name {
          font-weight: 700;
          font-size: 0.85rem;
          color: #ffd700;
          text-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
        }

        .user .sender-name {
          color: rgba(255, 255, 255, 0.9);
          text-shadow: none;
        }

        .timestamp {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        .message-body p {
          line-height: 1.7;
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
          font-size: 1rem;
          font-weight: 400;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 0;
        }

        .typing-dots {
          display: flex;
          gap: 0.4rem;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #ffd700;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
          box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
        }

        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        .chat-footer {
          background: linear-gradient(180deg, rgba(20,15,5,0.9) 0%, rgba(0,0,0,0.95) 100%);
          border-top: 2px solid rgba(255, 215, 0, 0.3);
          padding: 2rem;
          backdrop-filter: blur(20px);
          position: relative;
          z-index: 100;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
        }

        .input-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .input-form {
          margin-bottom: 1rem;
        }

        .input-wrapper {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          background: linear-gradient(135deg, rgba(40, 30, 10, 0.7) 0%, rgba(20, 15, 5, 0.9) 100%);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 16px;
          padding: 1.5rem 2rem;
          color: #fff;
          font-size: 1.1rem;
          line-height: 1.6;
          resize: none;
          min-height: 60px;
          max-height: 150px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .message-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .message-input:focus {
          outline: none;
          border-color: #ffd700;
          box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.4);
          background: linear-gradient(135deg, rgba(40, 30, 10, 0.8) 0%, rgba(20, 15, 5, 0.95) 100%);
        }

        .send-button {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          border: none;
          border-radius: 14px;
          color: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5);
        }

        .send-button:disabled {
          background: linear-gradient(135deg, #555 0%, #777 100%);
          color: #999;
          cursor: not-allowed;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .input-footer {
          text-align: center;
        }

        .disclaimer {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          line-height: 1.5;
          font-weight: 400;
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(255, 215, 0, 0.05);
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.3);
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.5);
        }

        @media (max-width: 768px) {
          .elite-header {
            padding: 1rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .elite-title {
            font-size: 2rem;
          }

          .message-content {
            padding: 0 1rem;
            max-width: 90%;
          }

          .message-bubble {
            padding: 1.5rem 1.5rem;
          }

          .chat-footer {
            padding: 1rem;
          }

          .input-wrapper {
            gap: 0.75rem;
          }

          .send-button {
            width: 50px;
            height: 50px;
            border-radius: 12px;
          }

          .message-input {
            padding: 1.25rem 1.5rem;
            font-size: 1rem;
          }

          .symbol {
            font-size: 4rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EliteChat;