import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Lightbulb, MessageSquare, ShieldAlert, Cpu } from 'lucide-react';
import { Card, Button, PillTag, Eyebrow } from '../UiComponents';
import { 
  explainPredictionInSimpleLanguage, 
  getAssistantResponse, 
  getSuggestedQuestionsForPrediction 
} from '../../services/agent/aiBatteryAgent';
import { useBattery } from '../../context/BatteryContext';

export function AiBatteryAssistantChat({ prediction }) {
  const { telemetry, alerts, history } = useBattery();

  const [messages, setMessages] = useState(() => {
    const explanation = explainPredictionInSimpleLanguage(prediction);
    return [{
      sender: 'bot',
      topic: explanation.levelTitle || 'AI Grounded Diagnostics Assistant',
      text: `${explanation.plainExplanation}\n\n**Primary Assessment**: ${explanation.mainDetectedReason}\n**Recommended Procedure**: ${explanation.recommendedAction}\n\n*Select any question below or type your inquiry. All responses are strictly grounded in live telemetry, threshold alerts, and validated model inferences.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }];
  });

  const [inputValue, setInputValue] = useState('');
  const chatBottomRef = useRef(null);
  const prevRiskRef = useRef(prediction?.riskLevel);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (queryText) => {
    const text = queryText || inputValue;
    if (!text.trim()) return;

    const userMessage = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Evaluate response with full context
    const context = {
      telemetry,
      alerts,
      history,
    };

    const botResponseData = getAssistantResponse(text, prediction, context);
    const botMessage = {
      sender: 'bot',
      topic: botResponseData.topic,
      text: botResponseData.answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    if (!queryText) setInputValue('');
  };

  const suggestedQuestions = getSuggestedQuestionsForPrediction();

  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '560px',
        borderTop: '4px solid var(--color-iris)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eyebrow color="violet">AI-GENERATED EXPLANATION · CAN TELEMETRY</Eyebrow>
            <PillTag variant="purple" pulse>
              GROUNDED LLM INTERPRETER
            </PillTag>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-zinc-900)', margin: '2px 0 0' }}>
            Grounded Conversational Battery Assistant (CAN Bus BMS)
          </h3>
        </div>

        <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
          ANTI-HALLUCINATION SAFEGUARD ACTIVE
        </span>
      </div>

      {/* Suggested 5 Mandated Questions Toolbar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Lightbulb size={13} color="var(--color-iris)" />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-500)', textTransform: 'uppercase' }}>
            MANDATORY DIAGNOSTIC QUERIES:
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-iris-wash)',
                border: '1px solid rgba(106, 94, 217, 0.25)',
                color: 'var(--color-iris)',
                fontSize: '11.5px',
                fontFamily: 'var(--font-inter-variable)',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.16s ease',
              }}
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          maxHeight: '360px',
          padding: '12px', 
          backgroundColor: 'var(--color-zinc-50)', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-zinc-200)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        {messages.map((m, idx) => {
          const isBot = m.sender === 'bot';
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isBot ? 'flex-start' : 'flex-end',
                animation: 'pageFadeSlide 0.2s ease',
              }}
            >
              {/* Sender & Timestamp Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11px', fontFamily: 'var(--font-dm-mono)', color: 'var(--color-zinc-400)' }}>
                {isBot && <Bot size={13} color="var(--color-iris)" />}
                <span>{isBot ? (m.topic || 'AI Diagnostics Assistant') : 'Operator'}</span>
                <span>·</span>
                <span>{m.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div 
                style={{
                  maxWidth: '88%',
                  padding: '12px 16px',
                  borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  backgroundColor: isBot ? '#ffffff' : 'var(--color-iris)',
                  color: isBot ? 'var(--color-zinc-800)' : '#ffffff',
                  border: isBot ? '1px solid var(--color-zinc-200)' : 'none',
                  boxShadow: 'var(--shadow-subtle-2)',
                  fontSize: '13px',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Box */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{ display: 'flex', gap: '8px' }}
      >
        <input 
          type="text"
          placeholder="Ask about alerts, cooling fan reasons, or voltage/temp trends..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-inputs)',
            border: '1px solid var(--color-zinc-300)',
            backgroundColor: '#ffffff',
            fontFamily: 'var(--font-inter-variable)',
            fontSize: '13px',
            color: 'var(--color-zinc-900)',
          }}
        />
        <Button 
          variant="primary" 
          size="md" 
          type="submit"
          icon={Send}
        >
          Ask
        </Button>
      </form>
    </Card>
  );
}
