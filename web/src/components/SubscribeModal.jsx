import { useState } from 'react';
import { subscribe, unsubscribe } from '../api/client';

export default function SubscribeModal({ isOpen, onClose, item }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage(null);
    try {
      const filters = item ? { keyword: item.title } : {};
      const res = await subscribe(email, filters);
      setMessage({ type: 'success', text: res.message || '订阅成功！' });
      setTimeout(() => {
        onClose();
        setMessage(null);
        setEmail('');
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || '订阅失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setIsUnsubscribing(true);
    setMessage(null);
    try {
      const res = await unsubscribe(email);
      setMessage({ type: 'success', text: res.message || '取消订阅成功' });
      setTimeout(() => {
        onClose();
        setMessage(null);
        setEmail('');
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || '取消订阅失败' });
    } finally {
      setLoading(false);
      setIsUnsubscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-industrial-dark border border-industrial-light rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-industrial-light">
          <h3 className="text-white font-medium">
            {item ? `订阅: ${item.title.slice(0, 20)}...` : '邮件订阅'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={isUnsubscribing ? handleUnsubscribe : handleSubscribe} className="p-4">
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-industrial-mid border border-industrial-light rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>
          {item && (
            <div className="mb-4 p-3 bg-industrial-mid rounded border border-industrial-light">
              <div className="text-gray-400 text-xs mb-1">订阅条件</div>
              <div className="text-white text-sm">关键词: {item.title}</div>
            </div>
          )}
          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : (isUnsubscribing ? '取消订阅' : '确认订阅')}
            </button>
            <button
              type="button"
              onClick={() => setIsUnsubscribing(!isUnsubscribing)}
              className="px-4 py-2 bg-industrial-light text-gray-300 rounded hover:bg-industrial-mid transition-colors"
            >
              {isUnsubscribing ? '切换到订阅' : '切换到取消'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}