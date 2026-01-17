import { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

function Settings() {
  const [settings, setSettings] = useState({
    whatsapp_number: '',
    checkout_message_template: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    setMessage('');

    try {
      await adminAPI.updateSetting(key, value);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={message.includes('success') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
              {message}
            </p>
          </div>
        )}

        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">WhatsApp Configuration</h2>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              WhatsApp Number
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Enter your WhatsApp number (with country code, no + sign). Example: 6281234567890
            </p>
            <input
              type="text"
              className="input-field mb-4"
              value={settings.whatsapp_number}
              onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
              placeholder="6281234567890"
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSave('whatsapp_number', settings.whatsapp_number)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save WhatsApp Number'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Checkout Message Template</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Customize the WhatsApp message template. Use these placeholders:
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{'{product_name}'}</code>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{'{category_name}'}</code>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{'{package_name}'}</code>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{'{price}'}</code>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{'{user_data}'}</code>
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{'{order_time}'}</code>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Message Template
            </label>
            <textarea
              className="input-field mb-4"
              rows={10}
              value={settings.checkout_message_template}
              onChange={(e) => setSettings({ ...settings, checkout_message_template: e.target.value })}
              placeholder="Enter your message template here..."
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSave('checkout_message_template', settings.checkout_message_template)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Message Template'}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono">
                {settings.checkout_message_template
                  .replace('{product_name}', 'Sample Product')
                  .replace('{category_name}', 'Game')
                  .replace('{package_name}', 'Basic Package')
                  .replace('{price}', '50,000')
                  .replace('{user_data}', '*User ID:* 123456\n*Server:* Asia')
                  .replace('{order_time}', new Date().toLocaleString('id-ID'))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
