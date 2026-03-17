import { useState } from 'react';
import { Bell, X, Mail } from 'lucide-react';
import axios from 'axios';

interface ReminderSettingsProps {
  deadlineId: string;
  currentSettings: {
    reminderEnabled: boolean;
    reminderDays: number[];
  };
  onClose: () => void;
  onUpdate: () => void;
  isHearing?: boolean;
}

export function ReminderSettings({ deadlineId, currentSettings, onClose, onUpdate, isHearing = false }: ReminderSettingsProps) {
  const [reminderEnabled, setReminderEnabled] = useState(currentSettings.reminderEnabled);
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    // Ensure reminderDays is always an array
    const days = currentSettings.reminderDays;
    if (Array.isArray(days)) return days;
    return [1, 3, 7]; // Default fallback
  });
  const [saving, setSaving] = useState(false);
  const [testingSending, setTestSending] = useState(false);

  const entityType = isHearing ? 'hearing' : 'deadline';
  const entityLabel = isHearing ? 'Hearing' : 'Deadline';

  const dayOptions = isHearing
    ? [
        { value: 0, label: 'On Hearing Date' },
        { value: 1, label: '1 Day Before' },
        { value: 2, label: '2 Days Before' },
        { value: 3, label: '3 Days Before' },
        { value: 7, label: '1 Week Before' },
        { value: 14, label: '2 Weeks Before' },
        { value: 30, label: '1 Month Before' },
      ]
    : [
        { value: 0, label: 'On Due Date' },
        { value: 1, label: '1 Day Before' },
        { value: 2, label: '2 Days Before' },
        { value: 3, label: '3 Days Before' },
        { value: 7, label: '1 Week Before' },
        { value: 14, label: '2 Weeks Before' },
        { value: 30, label: '1 Month Before' },
      ];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = isHearing 
        ? `https://legaledge-backend-production.up.railway.app/api/hearing-reminders/${deadlineId}/settings`
        : `https://legaledge-backend-production.up.railway.app/api/reminders/${deadlineId}/settings`;
      
      await axios.put(
        endpoint,
        {
          reminderEnabled,
          reminderDays: selectedDays,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestReminder = async () => {
    setTestSending(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = isHearing
        ? `https://legaledge-backend-production.up.railway.app/api/hearing-reminders/${deadlineId}/test`
        : `https://legaledge-backend-production.up.railway.app/api/reminders/${deadlineId}/test`;
      
      await axios.post(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Test reminder sent! Check your email.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send test reminder');
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {entityLabel} Reminder Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Enable/Disable Reminders */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Email Reminders</div>
              <div className="text-sm text-gray-600">
                {isHearing ? 'Send automated reminder emails for court appearances' : 'Send automated reminder emails'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
            </label>
          </div>

          {/* Reminder Days Selection */}
          {reminderEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Send Reminders
              </label>
              <div className="space-y-2">
                {dayOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(option.value)}
                      onChange={() => toggleDay(option.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
              {selectedDays.length === 0 && reminderEnabled && (
                <p className="mt-2 text-sm text-yellow-600">
                  ⚠️ Please select at least one reminder day
                </p>
              )}
            </div>
          )}

          {/* Test Reminder Button */}
          {reminderEnabled && (
            <button
              onClick={handleTestReminder}
              disabled={testingSending}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:bg-gray-50 disabled:text-gray-400 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {testingSending ? 'Sending...' : 'Send Test Reminder'}
            </button>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg flex-shrink-0 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (reminderEnabled && selectedDays.length === 0)}
            className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:bg-blue-300"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
