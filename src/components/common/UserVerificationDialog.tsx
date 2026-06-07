"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Wallet,
  Loader2,
  Send,
  CheckCircle2,
  Shield,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface UserVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess: (userData: any) => void;
}

export const UserVerificationDialog: React.FC<UserVerificationDialogProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    wallet_address: walletAddress,
    avatar_url: "",
    x_account: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarHash, setAvatarHash] = useState<string>("");

  // OTP related state - FIXED: Changed to string and proper implementation
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(""); // Store the generated OTP
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      wallet_address: walletAddress,
    }));
  }, [walletAddress]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Stop countdown if email is verified
    if (isOtpVerified) {
      setOtpCountdown(0);
      setCanResendOtp(true);
      return;
    }

    if (otpCountdown > 0) {
      timer = setTimeout(() => {
        setOtpCountdown(otpCountdown - 1);
      }, 1000);
    } else if (otpCountdown === 0 && isOtpSent) {
      setCanResendOtp(true);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown, isOtpSent, isOtpVerified]);

  const uploadToIPFS = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const res = await fetch("/api/uploadToIPFS", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed with ${res.status}`);
      }

      const data = await res.json();
      // data should contain { Hash, Url }
      if (!data?.Hash) throw new Error("Invalid response from IPFS upload");
      return data.Hash as string;
    } catch (error) {
      toast.error("We couldn't upload the image. Please try again.");
      throw error;
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to IPFS via server proxy
      try {
        const hash = await uploadToIPFS(file);
        setAvatarHash(hash);
        toast.success("Avatar image uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload avatar image");
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Make username mandatory
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    // Make email mandatory and verified
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (!isOtpVerified) {
      newErrors.email_verification = "Please verify your email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Generate random 6-digit OTP
  const getRandomSixDigit = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  };

  // Validate required fields before sending OTP (only username and email)
  const validateFieldsForOtp = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send OTP after validating required fields
  const sendEmail = async () => {
    // Validate only username and email before sending OTP
    if (!validateFieldsForOtp()) {
      toast.error("Add your username and email to get an OTP.");
      return;
    }

    setIsSendingOtp(true);

    try {
      // Get PASETO token from cookies based on chain type
      // Check for both solana and evm tokens
      const solanaToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("erebrus_token_solana="))
        ?.split("=")[1];

      const evmToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("erebrus_token_evm="))
        ?.split("=")[1];

      const pasetoToken = solanaToken || evmToken;

      if (!pasetoToken) {
        toast.error("Please connect and sign in with your wallet first.");
        setIsSendingOtp(false);
        return;
      }

      // console.log("Sending OTP to:", formData.email);

      // Try using the same endpoint as authentication for consistency
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GATEWAY_URL}api/v1.1/profile/email/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pasetoToken}`,
          },
          body: JSON.stringify({
            email: formData.email,
          }),
        }
      );

      const result = await response.json();
      // console.log("🔍 OTP API Response Status:", response.status);
      // console.log("🔍 OTP API Response Body:", result);

      if (response.ok) {
        // OTP sent successfully
        setIsOtpSent(true);
        setCanResendOtp(false);
        setOtpCountdown(30); // 30 second countdown
        toast.success("We’ve sent an OTP to your email.");
        // console.log("✅ OTP sent successfully:", result);

        // Store any OTP reference if provided by API
        if (result.otpId || result.reference || result.id) {
          setGeneratedOtp(result.otpId || result.reference || result.id);
        }
      } else {
        // Handle API errors
        const errorMessage =
          result.message || result.error || "Failed to send OTP";

        // Check if it's an email already used error
        if (
          errorMessage.toLowerCase().includes("email") &&
          (errorMessage.toLowerCase().includes("already") ||
            errorMessage.toLowerCase().includes("exists") ||
            // errorMessage.toLowerCase().includes("taken") ||
            errorMessage.toLowerCase().includes("registered"))
        ) {
          // Set email error in form state
          setErrors((prev) => ({
            ...prev,
            email: errorMessage,
          }));
          toast.error("That email is already registered.");
        } else {
          toast.error(`We couldn’t send the OTP. ${errorMessage}`);
        }

        // console.error("❌ Send OTP API error:", {
        //   status: response.status,
        //   statusText: response.statusText,
        //   error: result,
        // });
      }
    } catch (error) {
      // console.error("Send OTP error:", error);
      if (
        error instanceof TypeError &&
        (error as any).message.includes("fetch")
      ) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("We couldn’t send the OTP. Please try again.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP with backend - REAL API CALL
  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Enter the OTP code.");
      return;
    }

    if (otp.length !== 6) {
      toast.error("OTP should be 6 digits.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // Get PASETO token from cookies
      const solanaToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("erebrus_token_solana="))
        ?.split("=")[1];

      const evmToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("erebrus_token_evm="))
        ?.split("=")[1];

      const pasetoToken = solanaToken || evmToken;

      if (!pasetoToken) {
        toast.error("Please reconnect your wallet to continue.");
        setIsVerifyingOtp(false);
        return;
      }

      // Make real API call to verify OTP
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GATEWAY_URL}api/v1.1/profile/email/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pasetoToken}`,
          },
          body: JSON.stringify({
            // email: formData.email,
            otp: otp.trim(),
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setIsOtpVerified(true);
        // Stop the countdown immediately
        setOtpCountdown(0);
        setCanResendOtp(true);
        toast.success("Your email is verified.");
        // Clear any email-related errors
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email_verification;
          delete newErrors.email; // Also clear email field errors
          return newErrors;
        });
      } else {
        const errorMessage =
          result.message ||
          result.error ||
          "That OTP didn’t work. Please try again.";
        toast.error(errorMessage);
      }
    } catch (error) {
      if (
        error instanceof TypeError &&
        (error as any).message.includes("fetch")
      ) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("We couldn’t verify the OTP. Please try again.");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get PASETO token from cookies
      const solanaToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("erebrus_token_solana="))
        ?.split("=")[1];

      const evmToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("erebrus_token_evm="))
        ?.split("=")[1];

      const pasetoToken = solanaToken || evmToken;

      if (!pasetoToken) {
        toast.error("Please reconnect your wallet to continue.");
        setIsSubmitting(false);
        return;
      }

      // Create user profile using the profile update API (email already verified, so only update name and other fields)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_GATEWAY_URL}api/v1.0/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pasetoToken}`,
          },
          body: JSON.stringify({
            name: formData.username,
            // Note: email is NOT included here as it's already verified through OTP process
            profilePictureUrl: avatarHash || formData.avatar_url || "",
            twitter: formData.x_account || "",
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Profile created successfully
        const userData = result.data || {
          id: Date.now().toString(),
          username: formData.username,
          email: formData.email,
          wallet_address: formData.wallet_address,
          x_account: formData.x_account,
          avatar_url: avatarHash || formData.avatar_url,
          email_verified: true,
          created_at: new Date().toISOString(),
        };

        toast.success("Account created successfully!");
        onSuccess(userData);
        onClose();
        // Reset form
        resetForm();
      } else {
        // Handle API errors
        const errorMessage =
          result.message || result.error || "Failed to create profile";
        toast.error(`We couldn't create your account: ${errorMessage}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      wallet_address: walletAddress,
      avatar_url: "",
      x_account: "",
    });
    setOtp("");
    setGeneratedOtp("");
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpCountdown(0);
    setCanResendOtp(true);
    setErrors({});
    setAvatarPreview(null);
    setAvatarHash("");
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "username" && isOtpVerified) {
      toast.warning(
        "You can’t change the username after verifying your email."
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Reset OTP verification if critical fields (username or email) change after OTP is sent
    if ((field === "email" || field === "username") && isOtpSent) {
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setOtp("");
      setGeneratedOtp("");
      setOtpCountdown(0);
      setCanResendOtp(true);
      toast.info(
        "Please send a new OTP after changing your username or email."
      );
    }

    // Clear email errors when email field is being modified
    if (field === "email" && errors.email) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-bold text-white">Verify Your Account</h2>
          <button
            onClick={handleClose}
            className="text-[#8A8A8A] hover:text-white transition-colors"
            disabled={isSubmitting}
            title="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#AAAAAA] mb-6">
            Welcome! Please provide your details to complete account setup.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] ${
                    errors.username ? "border-red-500" : "border-[#333333]"
                  } ${
                    isOtpVerified
                      ? "border-green-500 bg-[#2A2A2A] cursor-not-allowed"
                      : ""
                  }`}
                  placeholder="Enter your username"
                  disabled={isSubmitting || isOtpVerified}
                />
                {isOtpVerified && (
                  <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                )}
              </div>
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
              {isOtpVerified && (
                <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Username
                </p>
              )}
            </div>

            {/* Email Field with Send OTP Button */}
            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Email Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] ${
                      errors.email ? "border-red-500" : "border-[#333333]"
                    } ${isOtpVerified ? "border-green-500" : ""}`}
                    placeholder="Enter your email"
                    disabled={isSubmitting || isOtpVerified}
                  />
                  {isOtpVerified && (
                    <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={
                    isSendingOtp ||
                    !canResendOtp ||
                    isOtpVerified ||
                    !formData.email.trim() ||
                    !formData.username.trim()
                  }
                  className="px-4 py-3 bg-[#00A3FF] hover:bg-[#0088CC] disabled:bg-[#333333] disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 min-w-[120px] justify-center"
                >
                  {isSendingOtp ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {isOtpSent && !canResendOtp
                        ? `${otpCountdown}s`
                        : isOtpSent
                        ? "Resend"
                        : "Send OTP"}
                    </>
                  )}
                </button>
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
              {isOtpVerified && (
                <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Email verified successfully
                </p>
              )}
            </div>

            {/* OTP Input Section */}
            {isOtpSent && !isOtpVerified && (
              <div>
                <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                  Email Verification Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Shield className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="w-full pl-10 pr-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={isSubmitting || isVerifyingOtp}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={isVerifyingOtp || otp.length !== 6}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-[#333333] disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 min-w-[100px] justify-center"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
                <p className="text-[#666666] text-xs mt-1">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
            )}

            {/* Show verification requirement error */}
            {errors.email_verification && (
              <p className="text-red-400 text-sm">
                {errors.email_verification}
              </p>
            )}

            {/* Wallet Address Field (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Wallet Address
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                <input
                  type="text"
                  value={formData.wallet_address}
                  readOnly
                  placeholder="Wallet address"
                  className="w-full pl-10 pr-4 py-3 bg-[#2A2A2A] border border-[#333333] rounded-lg text-[#AAAAAA] cursor-not-allowed"
                />
              </div>
              <p className="text-[#666666] text-xs mt-1">
                This is automatically filled from your connected wallet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Profile Picture
                <span className="text-xs text-[#888888] ml-2">(Optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#333333]">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Avatar Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#222222] flex items-center justify-center">
                      <User className="h-8 w-8 text-[#666666]" />
                    </div>
                  )}
                </div>
                <label className="flex-1">
                  <div className="cursor-pointer bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] rounded-lg px-4 py-3 text-sm text-white transition-colors flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {avatarHash ? "Change Avatar" : "Upload Avatar"}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {avatarHash && (
                <p className="text-xs text-green-400 mt-2">
                  Avatar uploaded successfully!
                </p>
              )}
              <p className="text-[#666666] text-xs mt-1">
                You can skip this and upload a profile picture later
              </p>
            </div>
            {/* X (Twitter) Handle - Optional */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#AAAAAA] mb-2">
                X Account
                <span className="text-xs text-[#888888]">(Optional)</span>
                <svg width="18" height="18" fill="none" aria-hidden="true">
                  <g>
                    <path
                      fill="white"
                      d="M7.51 7.98.78 0h5.61l3.65 4.2L17.31 0h-.56l-6.41 7.15ZM0 17.98h5.68l3.67-4.26 3.59 4.26h5.59l-6.22-7.32-.91 1.06-.5.58-.5-.57L0 17.98Z"
                    />
                    <path
                      fill="white"
                      d="m7.19 10.24.44.5L0 18h2.57l7.73-8.62-1.83-2.1-1.83 2.1Z"
                    />
                    <path
                      fill="white"
                      d="M17.23 0l-7.61 8.48.04.05 1.83 2.09L18 0h-.77Z"
                    />
                  </g>
                </svg>
              </label>
              <input
                type="text"
                value={formData.x_account}
                onChange={(e) => handleInputChange("x_account", e.target.value)}
                className={`w-full pl-4 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] ${
                  errors.x_account ? "border-red-500" : "border-[#333333]"
                }`}
                placeholder="e.g. @yourhandle (you can add this later)"
                disabled={isSubmitting}
                maxLength={16} // @ + 15 chars
                inputMode="text"
                pattern="^@\w{1,15}$"
              />
              {errors.x_account && (
                <p className="text-red-400 text-sm mt-1">{errors.x_account}</p>
              )}
              <p className="text-[#666666] text-xs mt-1">
                You can skip this and add your X account later in your profile
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2A2A2A] flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isOtpVerified}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-[#00A3FF] to-[#00F0FF] hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Creating...
              </>
            ) : (
              "Verify Account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
