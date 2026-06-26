"use client";

import { useState } from "react";
import { AccentButton } from "@/components/v3/ui";

const inputClass =
  "w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-3)] outline-none transition-colors focus:border-[var(--accent)]/45 focus:ring-2 focus:ring-[var(--accent)]/20";

export function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    walletAddress: "",
    category: "",
    description: "",
  });
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPopup(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
        <div>
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-[var(--text-2)]">
            Full name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--text-2)]">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[var(--text-2)]">
            Phone number <span className="text-[var(--text-3)]">(optional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="walletAddress"
            className="mb-2 block text-sm font-medium text-[var(--text-2)]"
          >
            Wallet address <span className="text-[var(--text-3)]">(optional)</span>
          </label>
          <input
            type="text"
            id="walletAddress"
            name="walletAddress"
            value={formData.walletAddress}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-2 block text-sm font-medium text-[var(--text-2)]">
            Query category
          </label>
          <select
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select a category</option>
            <option value="profile">Profile</option>
            <option value="login">Login</option>
            <option value="payment">Payment</option>
            <option value="account-deletion">Account deletion</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-[var(--text-2)]"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Please provide detailed information about your query."
            rows={5}
            className={inputClass}
          />
        </div>

        <AccentButton type="submit" className="w-full !py-3.5 !text-base">
          Submit request
        </AccentButton>
      </form>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[var(--elevated)] p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <div className="mb-4 text-4xl">✓</div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight">Request submitted</h2>
            <p className="mb-6 text-sm leading-relaxed text-[var(--text-2)]">
              Your request has been received. We will review it and provide further updates via
              email.
            </p>
            <AccentButton type="button" className="w-full" onClick={() => setShowPopup(false)}>
              Close
            </AccentButton>
          </div>
        </div>
      )}
    </>
  );
}