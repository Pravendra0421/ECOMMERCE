"use client";
import React, { useState } from "react";
import { HelpQueryApiRepository } from "@/infrastructure/frontend/repositories/HelpQueryApi";
import { useAuthStore } from "../../../store/authStore";
const helpQueryRepo = new HelpQueryApiRepository();

const HelpPage = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const userEmail = user?.email;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await helpQueryRepo.createHelpQuery({ query, userEmail });
      setSubmitted(true);
      setQuery("");
    } catch (err) {
      alert("Failed to submit query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Help & Support</h1>
      <p className="mb-4">
        Ask us anything! Our team will get back to you soon.
      </p>
      {submitted ? (
        <div className="text-green-600">Your query has been submitted!</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full border rounded p-2 mb-4"
            rows={5}
            placeholder="Type your question here..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
};

export default HelpPage;
