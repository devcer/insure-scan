"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

interface GmailConnection {
  email: string;
  updated_at: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [connection, setConnection] = useState<GmailConnection | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/insurance/gmail-connection");
      if (response.ok) {
        const data = await response.json();
        setConnection(data.connection);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail?")) return;

    try {
      const response = await fetch("/api/insurance/gmail-connection", {
        method: "DELETE",
      });
      if (response.ok) {
        setConnection(null);
        alert("Gmail disconnected successfully");
      }
    } catch (err) {
      alert("Failed to disconnect Gmail");
    }
  };

  const handleReconnect = () => {
    signIn("google");
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Account Information
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <p className="text-gray-900 dark:text-white">
              {session?.user?.name || "Not provided"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">
              {session?.user?.email || "Not provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Gmail Connection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gmail Connection
          </h2>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          ) : connection ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Connected Email
                </label>
                <p className="text-gray-900 dark:text-white">{connection.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Synced
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(connection.updated_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect Gmail
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">No Gmail account connected</p>
              <button
                onClick={handleReconnect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Gmail
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
