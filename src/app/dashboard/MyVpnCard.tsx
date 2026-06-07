"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { FaDownload } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { QRCodeSVG } from "qrcode.react";

const EREBRUS_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

// Environment variable validation
if (!EREBRUS_GATEWAY_URL) {
  console.error(
    "NEXT_PUBLIC_GATEWAY_URL environment variable is not set in MyVpnCard"
  );
}

interface ReviewCardProps {
  metaData: {
    created_at: string;
    UUID: string;
    name: string;
    region: string;
    walletAddress: number;
  } | null;
}

const backgroundbutton = {
  backgroundColor: "#0162FF",
};

const MyVpnCard: React.FC<ReviewCardProps> = ({ metaData }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [delvpn, setdelvpn] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadPin, setDownloadPin] = useState("");
  const [configFile, setConfigFile] = useState<string>("");
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);

  useEffect(() => {
    if (metaData) {
      const date = new Date(metaData.created_at);
      setFormattedDate(date.toLocaleString());
    }
  }, [metaData]);

  if (!metaData) {
    return (
      <div className='flex flex-col items-center justify-center w-full mx-auto py-8'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400'></div>
        <p className='text-white mt-4'>Loading VPN details...</p>
      </div>
    );
  }

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
    setDownloadPin(""); // Reset PIN when opening modal
  };

  const downloadConfig = async () => {
    if (downloadPin.length !== 6) {
      alert("Please enter a valid 6-digit PIN");
      return;
    }

    // Environment variable safety check
    if (!EREBRUS_GATEWAY_URL) {
      alert(
        "Configuration error: Gateway URL not found. Please contact support."
      );
      return;
    }

    try {
      setLoading(true);
      const auth = Cookies.get("erebrus_token");
      const walletAddress = Cookies.get("erebrus_wallet");

      // Enhanced wallet address validation
      if (!walletAddress || walletAddress.trim() === "") {
        throw new Error(
          "Wallet address not found. Please reconnect your wallet."
        );
      }

      // Validate auth token
      if (!auth || auth.trim() === "") {
        throw new Error(
          "Authentication token not found. Please sign in again."
        );
      }

      // Basic Ethereum address validation
      const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
      if (!isValidEthAddress) {
        throw new Error(
          "Invalid wallet address format. Please reconnect your wallet."
        );
      }

      // Fetch the encrypted blobId from Erebrus
      const response = await axios.get(
        `${EREBRUS_GATEWAY_URL}api/v1.0/erebrus/client/${metaData.UUID}/blobId`,
        {
          headers: {
            Authorization: `Bearer ${auth}`,
          },
        }
      );

      if (!response.data.payload || !response.data.payload.blobId) {
        throw new Error("No blob ID found for this client");
      }

      const encryptedBlobId = response.data.payload.blobId;
      const decryptedBlobId = decryptBlobId(
        encryptedBlobId,
        walletAddress,
        downloadPin
      );

      // Fetch the config from Walrus
      const walrusResponse = await axios.get(
        `https://aggregator-devnet.walrus.space/v1/${decryptedBlobId}`,
        {
          responseType: "text", // Changed to text to get the config content
        }
      );

      // Store the config file content
      setConfigFile(walrusResponse.data);

      // Close the PIN modal and show the QR code modal
      setShowDownloadModal(false);
      setShowQrCodeModal(true);
    } catch (error) {
      console.error("Error downloading config:", error);
      alert("Failed to download config. Please check your PIN and try again.");
    } finally {
      setLoading(false);
    }
  };

  const decryptBlobId = (
    encryptedBlobId: string,
    walletAddress: string,
    pin: string
  ) => {
    const key = `${walletAddress}-${pin}`;
    const bytes = CryptoJS.AES.decrypt(encryptedBlobId, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const deletevpn = async (id: string) => {
    setLoading(true);
    const auth = Cookies.get("erebrus_token");

    try {
      const response = await fetch(
        `${EREBRUS_GATEWAY_URL}api/v1.0/erebrus/client/${id}`,
        {
          method: "DELETE",
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth}`,
          },
        }
      );

      if (response.status === 200) {
        setdelvpn(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full mb-2'>
      <div
        className='rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all'
        style={{ backgroundColor: "#1a1d2e" }}
      >
        <div className='w-full p-4'>
          <div className='flex flex-col lg:flex-row md:flex-row justify-between items-center gap-4'>
            <div className='text-white text-sm lg:text-base font-medium'>
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4 text-blue-400 mr-2'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span>{formattedDate}</span>
              </div>
            </div>

            <div className='flex items-center justify-center'>
              <div className='bg-gray-800 px-4 py-2 rounded-full text-white font-medium'>
                {metaData.name}
              </div>
            </div>

            <div className='flex items-center justify-center'>
              <div className='flex items-center bg-gray-800 px-4 py-2 rounded-full'>
                <span className='text-white mr-2'>{metaData.region}</span>
                <img
                  src={`https://flagsapi.com/${metaData.region}/shiny/64.webp`}
                  className='w-6 h-6'
                  alt={`${metaData.region} flag`}
                />
              </div>
            </div>

            <div className='flex gap-3'>
              {/* Download Config button */}
              <button
                className='flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition-colors p-2 rounded-full'
                onClick={handleDownloadClick}
                title='Download Config'
                aria-label='Download VPN configuration'
              >
                <FaDownload className='w-4 h-4 text-white' />
              </button>

              {/* Delete VPN button */}
              <button
                className='flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors p-2 rounded-full'
                onClick={() => setdelvpn(true)}
                title='Delete VPN'
                aria-label='Delete VPN client'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-4 h-4 text-white'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {delvpn && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
          <div className='relative w-full max-w-md mx-4'>
            <div
              className='relative rounded-xl shadow-lg p-6'
              style={{
                backgroundColor: "#202333",
                border: "1px solid #0162FF",
              }}
            >
              <div className='mb-6'>
                <p className='text-2xl text-center text-white font-bold'>
                  Are you sure?
                </p>
                <p className='text-sm text-center text-gray-400 mt-2'>
                  Do you really want to delete this client? This process cannot
                  be undone.
                </p>
              </div>
              <div className='flex items-center gap-4'>
                {/* Cancel Delete button */}
                <button
                  style={{ border: "1px solid #5696FF" }}
                  onClick={() => setdelvpn(false)}
                  type='button'
                  className='w-full text-white font-medium focus:ring-4 focus:outline-none focus:ring-blue-800 rounded-full text-sm px-5 py-2.5 text-center hover:bg-blue-900 transition-colors'
                  aria-label='Cancel VPN deletion'
                >
                  Cancel
                </button>
                <button
                  style={backgroundbutton}
                  onClick={() => deletevpn(metaData.UUID)}
                  type='button'
                  className='w-full text-white font-medium focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full text-sm px-5 py-2.5 text-center hover:bg-blue-700 transition-colors'
                  aria-label='Confirm VPN deletion'
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDownloadModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
          <div className='relative w-full max-w-md mx-4'>
            <div
              className='relative rounded-xl shadow-lg p-6'
              style={{
                backgroundColor: "#202333",
                border: "1px solid #0162FF",
              }}
            >
              <div className='mb-6'>
                <p className='text-xl text-center text-white font-bold'>
                  Enter PIN to Download
                </p>
                <div className='mt-4'>
                  <label htmlFor='download-pin' className='sr-only'>
                    Enter 6-digit PIN for download
                  </label>
                  <input
                    id='download-pin'
                    type='password'
                    value={downloadPin}
                    onChange={(e) => setDownloadPin(e.target.value)}
                    maxLength={6}
                    placeholder='Enter 6-digit PIN'
                    className='w-full p-2 rounded-md text-black bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                    autoFocus
                  />
                </div>
              </div>
              <div className='flex items-center gap-4'>
                {/* Modal Cancel button */}
                <button
                  style={{ border: "1px solid #5696FF" }}
                  onClick={() => setShowDownloadModal(false)}
                  type='button'
                  className='w-full text-white font-medium focus:ring-4 focus:outline-none focus:ring-blue-800 rounded-full text-sm px-5 py-2.5 text-center hover:bg-blue-900 transition-colors'
                  aria-label='Cancel download'
                >
                  Cancel
                </button>
                <button
                  style={backgroundbutton}
                  onClick={downloadConfig}
                  type='button'
                  className='w-full text-white font-medium focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full text-sm px-5 py-2.5 text-center hover:bg-blue-700 transition-colors'
                  aria-label='Download configuration file'
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQrCodeModal && configFile && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
          <div className='relative w-full max-w-md mx-4'>
            <div
              className='relative rounded-xl shadow-lg p-6'
              style={{
                backgroundColor: "#202333",
                border: "1px solid #0162FF",
              }}
            >
              <div className='py-4 space-y-4 mt-4'>
                {/* Add cross icon */}
                <button
                  onClick={() => {
                    setShowQrCodeModal(false);
                  }}
                  className='absolute top-4 right-4 text-white hover:text-gray-300'
                  aria-label='Close QR code modal'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>

                <p className='text-3xl text-center font-semibold text-white mb-10'>
                  Download Configuration
                </p>

                <div className='bg-white lg:mx-auto lg:my-4 lg:w-1/2 lg:p-6 p-6 justify-center flex rounded-3xl'>
                  <div className='mx-auto' style={{ padding: 8 }}>
                    <QRCodeSVG value={configFile} size={300} />
                  </div>
                </div>

                <div className='text-center text-white text-xs font-light w-2/3 mt-2'>
                  Open{" "}
                  <a
                    href='https://www.wireguard.com/'
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{ color: "#5696FF" }}
                  >
                    WireGuard
                  </a>
                  &nbsp;app on mobile, scan the QR code to add a new connection,
                  and instantly connect to Erebrus VPN.
                </div>

                <div className='flex gap-4 w-3/4 mt-4'>
                  {/* Download Configuration button in QR modal */}
                  <button
                    className='text-md rounded-lg text-white flex btn bg-blue-gray-700 flex-1'
                    onClick={() => {
                      const blob = new Blob([configFile], {
                        type: "text/plain;charSet=utf-8",
                      });
                      saveAs(blob, `${metaData.name}.conf`);
                    }}
                    aria-label={`Download configuration file for ${metaData.name}`}
                  >
                    <div
                      className='flex cursor-pointer p-2 rounded-full gap-2 justify-center w-full hover:opacity-80 mb-5'
                      style={{
                        backgroundColor: "#0162FF",
                      }}
                    >
                      <div style={{ color: "white" }}>Download</div>
                    </div>
                  </button>
                </div>

                {/* If you have the SaveToWalrusButton component, you can add it here */}
                {/* <div className="flex items-center pb-10 rounded-b w-3/4">
                    <SaveToWalrusButton
                      configFile={configFile}
                      vpnName={metaData.name}
                      clientUUID={metaData.UUID}
                    />
                  </div> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'>
          <div className='bg-gray-800 rounded-lg p-6 flex items-center gap-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-2 border-t-blue-500 border-blue-200'></div>
            <span className='text-white'>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyVpnCard;
