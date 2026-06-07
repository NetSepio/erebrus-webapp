"use client";

import { useState } from "react";
import { Shield, Users, Tag, Award, Info, CheckCircle } from "lucide-react";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { BrowserProvider, Contract } from "ethers";
import { monadNftAbi } from "@/contracts/monadNftAbi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function MintPage() {
  const [isHovering, setIsHovering] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const { walletProvider } = useAppKitProvider("eip155");
  const { isConnected, address } = useAppKitAccount();
  const router = useRouter();

  const handleMint = async () => {
    setIsMinting(true);
    try {
      if (!isConnected || !address) {
        toast.error("Please connect your wallet first");
        throw new Error("Wallet not connected");
      }

      if (!walletProvider) {
        toast.error("Wallet provider not available");
        throw new Error("Wallet provider not available");
      }

      const ethersProvider = new BrowserProvider(walletProvider as any);
      const signer = await ethersProvider.getSigner();
      const contract = new Contract(
        "0x35ec701d9d99c34417378742ba0aa568c65ec016",
        monadNftAbi,
        signer
      );

      toast.loading("Minting your Erebrus VPN NFT...", { id: "minting" });

      const tx = await contract.safeMint(
        "https://erebrus.io/nft/metadata.json"
      );

      toast.loading("Confirming transaction...", { id: "minting" });
      await tx.wait();

      // Success feedback
      setMintSuccess(true);
      toast.success(
        "NFT minted successfully! Redirecting to your dashboard...",
        {
          id: "minting",
          duration: 3000,
        }
      );

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Minting failed:", error);
      toast.error(
        error?.reason ||
          error?.message ||
          "Failed to mint NFT. Please try again.",
        { id: "minting" }
      );
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className='min-h-screen bg-linear-to-b from-black to-gray-900 text-white'>
      <div className='container mx-auto px-4 py-16 md:py-24'>
        <div className='mb-12 text-center'>
          <h1 className='text-3xl md:text-4xl font-bold mb-4 bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
            Mint Your VPN NFT
          </h1>
          <p className='text-xl font-sans text-gray-300 max-w-2xl mx-auto'>
            Secure, Private, Exclusive Access to Erebrus Decentralized VPN
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto font-sans'>
          {/* NFT Preview Card */}
          <Card className='bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-xl'>
            <CardContent className='p-0 relative'>
              <div
                className='relative aspect-square w-full overflow-hidden'
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                role='img'
                aria-label='Erebrus VPN NFT Preview'
              >
                {/* Replace with your actual NFT image */}
                <div className='w-full h-full bg-linear-to-br from-blue-900 to-purple-900 flex items-center justify-center'>
                  <p className='text-lg text-center px-4'>vpn-nft-image.webp</p>
                </div>

                {/* Hover overlay with animation */}
                <div
                  className={`absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-6 transition-opacity duration-300 ${
                    isHovering ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className='text-center'>
                    <h3 className='text-xl font-bold mb-2'>
                      Erebrus VPN Access NFT
                    </h3>
                    <p className='text-sm text-gray-300'>
                      This NFT grants you exclusive access to our decentralized
                      VPN service
                    </p>
                  </div>
                </div>
              </div>

              {/* NFT Collection Info */}
              <div className='p-6 border-t border-gray-800'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-lg font-bold'>Erebrus Access Pass</h3>
                  <Badge
                    variant='outline'
                    className='bg-blue-900/30 text-blue-300 border-blue-800'
                  >
                    Limited Edition
                  </Badge>
                </div>
                <div className='flex items-center text-sm text-gray-400'>
                  <span>Powered by NetSepio</span>
                  <span className='mx-2'>•</span>
                  <span>Monad Blockchain</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mint Details Card */}
          <Card className='bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-xl'>
            <CardContent className='p-8'>
              <h2 className='text-2xl font-bold mb-6 text-center'>
                NFT Benefits
              </h2>

              <div className='space-y-6 mb-8'>
                <div className='flex items-start'>
                  <div className='bg-blue-900/30 p-3 rounded-full mr-4'>
                    <Shield className='h-6 w-6 text-blue-400' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg'>3-Month Coverage</h3>
                    <p className='text-gray-400'>
                      Full access to our premium VPN service for 3 months
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-blue-900/30 p-3 rounded-full mr-4'>
                    <Users className='h-6 w-6 text-blue-400' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg'>Unlimited Clients</h3>
                    <p className='text-gray-400'>
                      Connect all your devices with a single NFT
                    </p>
                  </div>
                </div>

                <div
                  className='flex items-start'
                  aria-label='NFT Price Information'
                >
                  <div className='bg-blue-900/30 p-3 rounded-full mr-4'>
                    <Tag className='h-6 w-6 text-blue-400' aria-hidden='true' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg'>
                      0.035 MON{" "}
                      <span className='text-sm text-gray-400'>($5.99)</span>
                    </h3>
                    <p className='text-gray-400'>
                      One-time payment, no subscription required
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-blue-900/30 p-3 rounded-full mr-4'>
                    <Award className='h-6 w-6 text-blue-400' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg'>Exceptional Value</h3>
                    <p className='text-gray-400'>
                      Unmatched security and privacy features
                    </p>
                  </div>
                </div>
              </div>

              <div
                className='bg-gray-800/50 rounded-lg p-4 mb-8 flex items-center'
                role='alert'
                aria-label='Important information about NFT minting'
              >
                <Info
                  className='h-5 w-5 text-amber-400 mr-3 shrink-0'
                  aria-hidden='true'
                />
                <p className='text-sm text-gray-300'>
                  <span className='text-amber-400 font-medium'>Note:</span> One
                  wallet address can only mint one NFT
                </p>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleMint}
                      disabled={isMinting || mintSuccess}
                      className={`cursor-pointer w-full py-6 text-lg transition-all duration-300 ${
                        mintSuccess
                          ? "bg-green-600 hover:bg-green-600"
                          : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                      }`}
                      aria-label={
                        mintSuccess
                          ? "NFT minted successfully"
                          : isMinting
                          ? "Minting Erebrus VPN NFT in progress"
                          : "Mint Erebrus VPN NFT"
                      }
                    >
                      {mintSuccess ? (
                        <>
                          <CheckCircle className='mr-3 h-5 w-5 text-white' />
                          <span>Minted Successfully!</span>
                        </>
                      ) : isMinting ? (
                        <>
                          <svg
                            className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            aria-hidden='true'
                            role='status'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                          <span>Minting...</span>
                        </>
                      ) : (
                        "Mint Erebrus NFT"
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connect your wallet to mint</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className='mt-16 max-w-4xl mx-auto text-center'>
          <h2 className='text-2xl font-bold mb-6'>
            Why Choose Erebrus VPN NFT?
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 font-sans'>
            <div className='bg-gray-900/30 border border-gray-800 rounded-lg p-6 hover:bg-gray-800/30 transition-colors duration-300'>
              <div className='bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Shield className='h-6 w-6 text-blue-400' />
              </div>
              <h3 className='font-bold mb-2'>Enhanced Privacy</h3>
              <p className='text-gray-400 text-sm'>
                Military-grade encryption and zero-knowledge protocols
              </p>
            </div>
            <div className='bg-gray-900/30 border border-gray-800 rounded-lg p-6 hover:bg-gray-800/30 transition-colors duration-300'>
              <div className='bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-6 w-6 text-blue-400'
                >
                  <path d='M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4'></path>
                  <path d='M4 6v12c0 1.1.9 2 2 2h14v-4'></path>
                  <path d='M18 12a2 2 0 0 0 0 4h4v-4Z'></path>
                </svg>
              </div>
              <h3 className='font-bold mb-2'>Tradable Asset</h3>
              <p className='text-gray-400 text-sm'>
                Sell or transfer your VPN access when you no longer need it
              </p>
            </div>
            <div className='bg-gray-900/30 border border-gray-800 rounded-lg p-6 hover:bg-gray-800/30 transition-colors duration-300'>
              <div className='bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-6 w-6 text-blue-400'
                >
                  <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'></path>
                  <path d='m9 12 2 2 4-4'></path>
                </svg>
              </div>
              <h3 className='font-bold mb-2'>Decentralized Network</h3>
              <p className='text-gray-400 text-sm'>
                Access a global network of nodes for optimal performance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
