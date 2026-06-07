"use client";

import { Button } from "@/components/ui/button";
import { useWalletAuth, getCurrentAuthToken } from "../context/appkit";
import { Loader2, ShieldCheck, Lock, Pen } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { UserVerificationDialog } from "./common/UserVerificationDialog";
import { toast } from "sonner";

export function AuthButton() {
  const {
    isConnected,
    address,
    isAuthenticated,
    isVerified,
    isAuthenticating,
    authenticate,
  } = useWalletAuth();

  const [userStatus, setUserStatus] = useState<
    "checking" | "new" | "existing" | "signing" | "verified"
  >("checking");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showVerified, setShowVerified] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Check if user exists without authentication (fallback for canceled signings)
  const checkUserExistsWithoutAuth = async (walletAddress: string) => {
    try {
      // Try both Solana and EVM chains to check if user exists
      const chains = ["sol", "evm"];

      for (const chain of chains) {
        try {
          const response = await fetch(
            `https://gateway.netsepio.com/api/v1.0/flowid?walletAddress=${walletAddress}&chain=${chain}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const result = await response.json();

            // If we can get a flowId, the user exists in the system
            if (result.payload?.flowId) {
              return true;
            }
          }
        } catch (chainError) {
          continue;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  // Check if user exists and needs verification when wallet connects
  const checkUserExists = async (walletAddress: string) => {
    try {
      setUserStatus("checking");

      // Try to authenticate to determine user status
      const authResult = await authenticate();

      if (authResult) {
        if (isVerified) {
          // User is authenticated and verified - get profile data
          const pasetoToken = getCurrentAuthToken();

          if (pasetoToken) {
            try {
              const response = await fetch(
                `https://gateway.netsepio.com/api/v1.0/profile`,
                {
                  method: "GET",
                  headers: {
                    "Authorization": `Bearer ${pasetoToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                const result = await response.json();
                const userData = result.data || result;
                setUserData(userData);
                setUserStatus("existing");
                return true;
              }
            } catch (profileError) {
              // Handle profile fetch error silently
            }
          }

          // User is verified but we couldn't get profile - treat as existing
          setUserStatus("existing");
          return true;
        } else {
          // User is authenticated but not verified - show verification dialog
          setUserStatus("new");
          return false;
        }
      } else {
        // Authentication failed - check if user exists without auth (they might have canceled signing)
        const userExists = await checkUserExistsWithoutAuth(walletAddress);

        if (userExists) {
          setUserStatus("existing");
          setUserData(null);
          return false; // Not authenticated yet, but they exist
        } else {
          setUserStatus("new");
          setUserData(null);
          return false;
        }
      }
    } catch (error) {
      setUserStatus("new");
      setUserData(null);
      return false;
    }
  };

  // Handle user verification (for new users) - Authentication already done in checkUserExists
  const handleVerify = async () => {
    if (!address) return;

    try {
      setShowVerificationDialog(true);
    } catch (error) {
      toast.error("Failed to open verification dialog. Please try again.");
    }
  };

  // Handle successful verification (after user registration)
  const handleVerificationSuccess = async (newUserData: any) => {
    setUserData(newUserData);

    // Update verification status in cookies after successful verification
    const isSolanaChain =
      window.location.href.includes("solana") ||
      document.cookie.includes("erebrus_token_solana");
    const chainType = isSolanaChain ? "solana" : "evm";
    document.cookie = `erebrus_verified_${chainType}=true; path=/; secure=${
      process.env.NODE_ENV === "production"
    }; samesite=strict`;

    setUserStatus("verified");
    setShowVerified(true);
    setShowVerificationDialog(false);
    toast.success(
      `Welcome, ${
        newUserData?.username || "User"
      }! Account created and verified.`
    );

    // Hide the verified animation after 3 seconds
    setTimeout(() => {
      setShowVerified(false);
    }, 3000);
  };

  // Handle existing user login - Need to authenticate first
  const handleExistingUserLogin = async () => {
    if (!address) return;

    try {
      setUserStatus("signing");

      const authResult = await authenticate();

      if (authResult) {
        if (isVerified) {
          // Existing verified user - success
          setUserStatus("verified");
          setShowVerified(true);

          // Try to get their profile data
          const pasetoToken = getCurrentAuthToken();

          if (pasetoToken) {
            try {
              const response = await fetch(
                `https://gateway.netsepio.com/api/v1.0/profile`,
                {
                  method: "GET",
                  headers: {
                    "Authorization": `Bearer ${pasetoToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                const result = await response.json();
                const userData = result.data || result;
                setUserData(userData);
                toast.success(`Welcome back, ${userData?.username || "User"}!`);
              } else {
                toast.success("Welcome back!");
              }
            } catch (profileError) {
              toast.success("Welcome back!");
            }
          } else {
            toast.success("Welcome back!");
          }

          setTimeout(() => {
            setShowVerified(false);
          }, 3000);
        } else {
          // User authenticated but not verified - should not happen for existing users
          setUserStatus("new");
          setShowVerificationDialog(true);
        }
      } else {
        // Authentication failed - user canceled or error occurred
        setUserStatus("existing");
        toast.error("Authentication failed. Please try again.");
      }
    } catch (error) {
      setUserStatus("existing");
      toast.error("Login failed. Please try again.");
    }
  };

  // Reset state when wallet disconnects
  const resetAuthState = () => {
    setUserStatus("checking");
    setUserData(null);
    setShowVerified(false);
    setShowVerificationDialog(false);
  };

  // Check user status when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && address) {
      checkUserExists(address);
    } else {
      resetAuthState();
    }
  }, [isConnected, address]);

  // Auto-show verification dialog for authenticated but unverified users
  useEffect(() => {
    if (isAuthenticated && isVerified === false && userStatus === "new") {
      setShowVerificationDialog(true);
    }
  }, [isAuthenticated, isVerified, userStatus]);

  // Don't show anything if wallet is not connected
  if (!isConnected || !address) {
    return null;
  }

  // Don't show button if user is verified and animation is not showing
  if (userStatus === "verified" && !showVerified && isAuthenticated) {
    return null;
  }

  const getButtonProps = () => {
    // If currently authenticating with wallet
    if (isAuthenticating || userStatus === "signing") {
      return {
        content: (
          <div className='flex items-center gap-2 px-2'>
            <Loader2 size={18} className='animate-spin' />
            <span className='text-sm'>Signing...</span>
          </div>
        ),
        className:
          "bg-yellow-500 hover:bg-yellow-600 text-white cursor-not-allowed",
        disabled: true,
        onClick: () => {},
      };
    }

    switch (userStatus) {
      case "checking":
        return {
          content: <Loader2 size={20} className='animate-spin mx-auto' />,
          className: "p-2 w-12 bg-blue-500 text-white",
          disabled: true,
          onClick: () => {},
        };

      case "new":
        return {
          content: (
            <div className='flex items-center gap-2 px-2'>
              <Lock size={18} />
              <span className='text-sm'>Verify</span>
            </div>
          ),
          className: "bg-orange-500 hover:bg-orange-600 text-white",
          disabled: false,
          onClick: handleVerify,
        };

      case "existing":
        return {
          content: (
            <div className='flex items-center gap-2 px-2'>
              <Pen size={18} />
              <span className='text-sm'>Sign In</span>
            </div>
          ),
          className: "bg-green-500 hover:bg-green-600 text-white",
          disabled: false,
          onClick: handleExistingUserLogin,
        };

      case "verified":
        return {
          content: (
            <div className='flex items-center gap-2 px-2'>
              <ShieldCheck size={18} className='animate-pulse' />
              <span className='text-sm'>Verified!</span>
            </div>
          ),
          className: "bg-green-500 text-white",
          disabled: true,
          onClick: () => {},
        };

      default:
        return {
          content: <span className='text-sm'>Error</span>,
          className: "bg-red-500 text-white",
          disabled: true,
          onClick: () => {},
        };
    }
  };

  const { content, className, disabled, onClick } = getButtonProps();

  return (
    <>
      <Button
        onClick={onClick}
        disabled={disabled}
        size='sm'
        className={cn(
          "ml-2 transition-all duration-200 font-medium rounded-none",
          className
        )}
      >
        {content}
      </Button>

      {/* Verification Dialog */}
      <UserVerificationDialog
        isOpen={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        walletAddress={address || ""}
        onSuccess={handleVerificationSuccess}
      />
    </>
  );
}
