"use client";

import { useState, useEffect } from "react";

export default function EmailsPage() {
  const [messages, setMessages] = useState<{ id: string; subject: string; from: string; date: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("insuranceScannerEmails");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.messages)) {
          setMessages(parsed.messages);
          setHasFetched(true);
        }
      } catch { }
    }
  }, []);

  const handleFetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gmail/messages");
      const data = await response.json();
      if (response.status === 401) {
        window.location.href = "/api/auth/signin";
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }
      setMessages(data.messages);
      setHasFetched(true);
      // Store the entire API response in localStorage
      localStorage.setItem("insuranceScannerEmails", JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching emails");
    } finally {
      setLoading(false);
    }
  };

  const handleReAuthenticate = () => {
    window.location.href = "/api/auth/signin";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Insurance Emails
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage insurance-related emails from your Gmail account
        </p>
      </div>

      {/* Fetch/Refresh Button */}
      {!hasFetched && !loading && !error && (
        <div className="flex justify-center mb-8">
          <button
            onClick={handleFetchEmails}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Fetch Emails from Gmail
          </button>
        </div>
      )}

      {/* Skeleton Loader */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className={`h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${index % 2 === 0 ? "w-full" : "w-11/12"}`}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Error UI */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="text-red-500 w-12 h-12 mb-4">
              <svg
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
              Error Occurred
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 text-center mb-4 max-w-md">
              {error}
            </p>
            <button
              onClick={handleReAuthenticate}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Re-authenticate
            </button>
          </div>
        </div>
      )}

      {/* Message List */}
      {hasFetched && !loading && !error && messages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Insurance Emails ({messages.length})
            </h2>
            <button
              onClick={handleFetchEmails}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="max-h-[600px] overflow-y-auto scroll-smooth">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700" role="list" aria-label="Insurance emails">
              {messages.map((msg, index) => (
                <li
                  key={msg.id || index}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-base truncate">
                      {msg.subject || "(No Subject)"}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {msg.from}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {msg.date}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                      ID: {msg.id}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasFetched && !loading && !error && messages.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No emails found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              No insurance-related messages found in your Gmail account.
            </p>
            <button
              onClick={handleFetchEmails}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
