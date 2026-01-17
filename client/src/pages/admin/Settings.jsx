import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminAPI, getImageUrl } from '../../utils/api';

function Settings() {
  const [settings, setSettings] = useState({
    whatsapp_number: '',
    checkout_message_template: '',
    payment_bank_name: '',
    payment_account_number: '',
    payment_account_name: '',
    payment_qr_code: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [qrUploading, setQrUploading] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      setSettings(response.data);
      // Set QR preview if exists
      if (response.data.payment_qr_code) {
        setQrPreview(getImageUrl(response.data.payment_qr_code));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    setQrUploading(true);
    setMessage('');

    try {
      const response = await adminAPI.uploadImage(file);
      setSettings({ ...settings, payment_qr_code: response.data.url });
      setQrPreview(getImageUrl(response.data.url));
      setMessage('QR Code uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to upload QR code');
    } finally {
      setQrUploading(false);
    }
  };

  const handleRemoveQr = () => {
    setSettings({ ...settings, payment_qr_code: '' });
    setQrPreview(null);
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

        {/* Payment Configuration */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Configuration</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure your bank account or e-wallet details for receiving payments. You can also upload a QR code.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bank / E-Wallet Name
              </label>
              <input
                type="text"
                className="input-field"
                value={settings.payment_bank_name || ''}
                onChange={(e) => setSettings({ ...settings, payment_bank_name: e.target.value })}
                placeholder="e.g., BCA, Mandiri, GoPay, OVO, DANA"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Account Number
              </label>
              <input
                type="text"
                className="input-field font-mono"
                value={settings.payment_account_number || ''}
                onChange={(e) => setSettings({ ...settings, payment_account_number: e.target.value })}
                placeholder="e.g., 1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                className="input-field"
                value={settings.payment_account_name || ''}
                onChange={(e) => setSettings({ ...settings, payment_account_name: e.target.value })}
                placeholder="e.g., PT Game Twenti"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                QR Code (Optional)
              </label>
              
              <div className="flex items-start gap-4">
                {/* Upload area */}
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4">
                    {qrUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                          Upload QR Code
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleQrUpload}
                    disabled={qrUploading}
                  />
                </label>

                {/* Preview */}
                {qrPreview && (
                  <div className="relative">
                    <img
                      src={qrPreview}
                      alt="QR Code"
                      className="w-40 h-40 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveQr}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              className="btn btn-primary mt-4"
              onClick={() => {
                handleSave('payment_bank_name', settings.payment_bank_name);
                handleSave('payment_account_number', settings.payment_account_number);
                handleSave('payment_account_name', settings.payment_account_name);
                handleSave('payment_qr_code', settings.payment_qr_code);
              }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Payment Settings'}
            </button>
          </div>
        </div>

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
            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{'{payment_proof}'}</code>
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
                  .replace('{payment_proof}', '*Bukti Pembayaran:* https://example.com/uploads/proof.jpg')
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
