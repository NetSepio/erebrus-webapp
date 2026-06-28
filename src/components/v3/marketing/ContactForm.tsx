"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccentButton } from "@/components/v3/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-3)] outline-none transition-colors focus:border-[var(--accent)]/45 focus:ring-2 focus:ring-[var(--accent)]/20";

const selectTriggerClass = cn(
  inputClass,
  "flex h-auto items-center justify-between text-left"
);

const selectContentClass =
  "rounded-xl border border-white/[0.1] bg-[#131318] text-[var(--text)] shadow-[0_16px_40px_rgba(0,0,0,0.5)]";

const selectItemClass =
  "rounded-lg py-2.5 pl-8 pr-3 text-sm text-[var(--text-2)] focus:bg-[var(--accent)]/15 focus:text-[var(--text)] data-[highlighted]:bg-[var(--accent)]/15 data-[highlighted]:text-[var(--text)]";

const CATEGORIES = [
  { value: "profile", label: "Profile" },
  { value: "login", label: "Login" },
  { value: "payment", label: "Payment" },
  { value: "account-deletion", label: "Account deletion" },
  { value: "feedback", label: "Feedback" },
  { value: "enterprise", label: "Enterprise / Sovereign Infrastructure" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

function getInitialCategory(searchParams: URLSearchParams | null): CategoryValue | "" {
  const raw = searchParams?.get("category")?.toLowerCase();
  if (raw === "enterprise") return "enterprise";
  return "";
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    walletAddress: "",
    category: getInitialCategory(searchParams),
    description: "",
  });
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPopup(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
          <Select
            value={formData.category || undefined}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, category: value as CategoryValue }))
            }
            required
          >
            <SelectTrigger id="category" className={selectTriggerClass}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className={selectItemClass}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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