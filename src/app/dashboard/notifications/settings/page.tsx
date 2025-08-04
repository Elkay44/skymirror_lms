'use client';

import React from "react";

import { useEffect, useState } from "react";

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({ email: false, push: false, sms: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/notifications/preferences")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load preferences");
        const data = await res.json();
        setPrefs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load preferences");
        setLoading(false);
      });
  }, []);

  const handleChange = (key: keyof NotificationPreferences) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefs((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4 break-words">Notification Settings</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
          <div>
            <label className="flex items-center space-x-2 min-w-0">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={prefs.email}
                onChange={handleChange("email")}
                disabled={saving}
              />
              <span>Email Notifications</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2 min-w-0">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={prefs.push}
                onChange={handleChange("push")}
                disabled={saving}
              />
              <span>Push Notifications</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2 min-w-0">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={prefs.sms}
                onChange={handleChange("sms")}
                disabled={saving}
              />
              <span>SMS Notifications</span>
            </label>
          </div>
          {error && <div className="text-red-600 text-sm break-words">{error}</div>}
          {success && <div className="text-green-600 text-sm break-words">Preferences saved!</div>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}
    </div>
  );
}

