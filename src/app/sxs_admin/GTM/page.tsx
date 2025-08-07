// src/app/sxs_admin/GTM/page.tsx
"use client"; // This is a client component for the form

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface AppSettings {
  metaPixelId: string | null; // Allow null as per Prisma schema
  metaCapiToken: string | null; // Allow null
  googleTagManagerId: string | null; // Allow null
  isMetaPixelEnabled: boolean;
  isGoogleAnalyticsEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    metaPixelId: "", // Initial state for controlled input
    metaCapiToken: "",
    googleTagManagerId: "",
    isMetaPixelEnabled: false, // Initialized as boolean
    isGoogleAnalyticsEnabled: false, // Initialized as boolean
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current settings when component mounts
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/GTM/admin"); // Calls your new admin API
        if (!res.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data: AppSettings = await res.json();
        // Ensure that any null/undefined values from the backend are converted to appropriate types
        setSettings({
          metaPixelId: data.metaPixelId ?? "", // Fix: Use ?? '' to ensure it's always a string
          metaCapiToken: data.metaCapiToken ?? "", // Fix
          googleTagManagerId: data.googleTagManagerId ?? "", // Fix
          isMetaPixelEnabled: data.isMetaPixelEnabled ?? false, // Fix: Default to false if undefined
          isGoogleAnalyticsEnabled: data.isGoogleAnalyticsEnabled ?? false, // Fix: Default to false if undefined
        });
        toast.success("Settings loaded!");
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/GTM/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Tracking Settings
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="metaPixelId"
              className="block text-sm font-medium text-gray-700"
            >
              Meta Pixel ID:
            </label>
            <input
              type="text"
              id="metaPixelId"
              name="metaPixelId"
              value={settings.metaPixelId ?? ""} // Ensure value is always a string
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., 1234567890"
            />
          </div>

          <div>
            <label
              htmlFor="metaCapiToken"
              className="block text-sm font-medium text-gray-700"
            >
              Meta Conversion API Token:
            </label>
            <input
              type="text"
              id="metaCapiToken"
              name="metaCapiToken"
              value={settings.metaCapiToken ?? ""} // Ensure value is always a string
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., EAA..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Keep this token secure. It is used on the server-side only.
            </p>
          </div>

          <div>
            <label
              htmlFor="googleTagManagerId"
              className="block text-sm font-medium text-gray-700"
            >
              Google Tag Manager ID:
            </label>
            <input
              type="text"
              id="googleTagManagerId"
              name="googleTagManagerId"
              value={settings.googleTagManagerId ?? ""} // Ensure value is always a string
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., GTM-XXXXXXX"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isMetaPixelEnabled"
              name="isMetaPixelEnabled"
              checked={settings.isMetaPixelEnabled}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isMetaPixelEnabled"
              className="ml-2 block text-sm font-medium text-gray-700"
            >
              Enable Meta Pixel (Client & Server)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isGoogleAnalyticsEnabled"
              name="isGoogleAnalyticsEnabled"
              checked={settings.isGoogleAnalyticsEnabled}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isGoogleAnalyticsEnabled"
              className="ml-2 block text-sm font-medium text-gray-700"
            >
              Enable Google Analytics (via GTM)
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
