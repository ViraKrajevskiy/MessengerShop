import React, { useState, useEffect, useRef } from 'react';
import './ChatPanel.css';
import { v4 as uuidv4 } from 'uuid';
import { API_ORIGIN } from '../config/api';

function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Инициализируем чат при загрузке
  useEffect(() => {
    // Загружаем сохранённую сессию из localStorage
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadChatHistory(savedSessionId);
    } else {
      initializeNewChat();
    }
  }, []);

  // Скролл к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Инициализация новой сессии
  const initializeNewChat = async () => {
    try {
      const response = await fetch(`${API_ORIGIN}/api/chat/`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setMessages(data.messages || []);
        // Сохраняем в localStorage
        localStorage.setItem('chatSessionId', data.session_id);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Если сервер недоступен, используем локальный ID
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }
  };

  // Загрузить историю чата
  const loadChatHistory = async (id) => {
    try {
      const response = await fetch(`${API_ORIGIN}/api/chat/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Отправить сообщение
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage = input;

    // Добавляем сообщение пользователя в UI сразу
    setMessages([...messages, { role: 'user', content: userMessage, created_at: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      // 1. Сохраняем в БД
      await fetch(`${API_ORIGIN}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage
        })
      });

      // 2. Получаем ответ от Qwen через Puter.js
      let qwenResponse = '';

      if (window.puter && window.puter.ai) {
        try {
          const response = await window.puter.ai.chat(userMessage, {
            model: "qwen/qwen3.6-plus"
          });
          qwenResponse = response.message ? response.message.content[0].text : 'Ошибка ответа';
        } catch (error) {
          console.error('Puter.js error:', error);
          qwenResponse = '⚠️ Ошибка AI';
        }
      } else {
        qwenResponse = '⚠️ Puter.js не загружен';
      }

      // 3. Добавляем ответ бота
      setMessages(prev => [...prev, {
        role: 'bot',
        content: qwenResponse,
        created_at: new Date()
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '❌ Произошла ошибка',
        created_at: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Новый чат
  const startNewChat = () => {
    localStorage.removeItem('chatSessionId');
    setMessages([]);
    setInput('');
    initializeNewChat();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Плавающая кнопка чата */}
      <button
        className="chat-float-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Закрыть чат' : 'Открыть чат'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Мини-панель чата */}
      {isOpen && (
        <div className="chat-panel">
          {/* Заголовок */}
          <div className="chat-header">
            <h3>AI Помощник</h3>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Сообщения */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>👋 Привет! Как дела?</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="msg-text">{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg bot">
                <div className="msg-avatar">🤖</div>
                <div className="msg-text">⏳ Генерирую ответ...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Ввод */}
          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напиши вопрос..."
              disabled={loading || !sessionId}
              className="chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !sessionId}
              className="chat-send-btn"
            >
              ➤
            </button>
            <button
              onClick={startNewChat}
              className="chat-new-btn"
              title="Новый чат"
            >
              ↻
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatPanel;