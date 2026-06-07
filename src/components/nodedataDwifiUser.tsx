"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import Link from "next/link";
import { BrowserProvider, Contract, formatUnits, parseEther } from "ethers";
import type { Eip1193Provider } from "ethers";

const contractAddress = "0x5940445e1e8A419ebea10B45c5d1C0F603926F41";

// Contract ABI - add the necessary methods you're using
const contractABI = [
  "function wifiNodeOperators(uint256) view returns (address user, string ssid, string location, bool isActive, uint256 pricePerMinute)",
  "function updateWifiNodeOperator(uint256 _operatorId, string _ssid, string _location, uint256 _pricePerMinute)",
];

// Custom type for ethereum provider
interface EthereumProvider extends Eip1193Provider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
}

// Type definitions for better type safety
interface WifiNodeOperator {
  id: number;
  user: string;
  ssid: string;
  location: string;
  isActive: boolean;
  pricePerMinute: string;
  connectedAt: string;
  lastChecked: string;
}

interface ExpandedLocations {
  [key: number]: boolean;
}

const NodeDwifiStreamUser = () => {
  const [data, setData] = useState<WifiNodeOperator[]>([]);
  const [noData, setNoData] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<WifiNodeOperator | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [expandedLocations, setExpandedLocations] = useState<ExpandedLocations>(
    {}
  );

  useEffect(() => {
    // Add SSR safety check
    if (typeof window !== "undefined") {
      checkConnection();
    }
  }, []);

  async function checkConnection() {
    // SSR safety: Ensure we're in browser environment
    if (typeof window === "undefined") {
      setError("This feature requires a browser environment.");
      return;
    }

    const ethereum = (window as any).ethereum as EthereumProvider;
    if (ethereum) {
      try {
        await ethereum.request({ method: "eth_requestAccounts" });
        setIsConnected(true);
        fetchOperators();
      } catch (error) {
        console.error("MetaMask connection error:", error);
        setIsConnected(false);
        setError("Failed to connect to MetaMask. Please try again.");
      }
    } else {
      setError("Please install MetaMask to use this feature.");
    }
  }

  async function fetchOperators() {
    setError(null);
    setData([]);
    setIsLoading(true);
    setNoData(false);

    // Enhanced wallet address validation
    const walletAddress = Cookies.get("erebrus_wallet");
    if (!walletAddress || walletAddress.trim() === "") {
      setError(
        "Wallet address not found. Please connect and authenticate your wallet first."
      );
      setIsLoading(false);
      setNoData(true);
      return;
    }

    // Validate wallet address format (basic Ethereum address validation)
    const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    if (!isValidEthAddress) {
      setError("Invalid wallet address format. Please reconnect your wallet.");
      setIsLoading(false);
      setNoData(true);
      return;
    }

    try {
      // Additional safety check for ethereum provider
      const ethereum = (window as any).ethereum as EthereumProvider;
      if (!ethereum) {
        throw new Error("Ethereum provider not available");
      }

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const operators: WifiNodeOperator[] = [];
      const maxRetries = 3;
      let consecutiveFailures = 0;

      // Dynamic loop instead of hardcoded limit
      // We'll fetch until we get consecutive failures (likely end of operators)
      for (let i = 0; i < 1000; i++) {
        // reasonable upper limit
        try {
          const result = await contract.wifiNodeOperators(i);

          // Reset failure count on success
          consecutiveFailures = 0;

          if (result.user.toLowerCase() === walletAddress.toLowerCase()) {
            operators.push({
              id: i,
              user: result.user,
              ssid: result.ssid,
              location: result.location,
              isActive: result.isActive,
              pricePerMinute: formatUnits(result.pricePerMinute, "ether"),
              connectedAt: new Date().toISOString(),
              lastChecked: new Date().toISOString(),
            });
          }
        } catch (error) {
          consecutiveFailures++;
          console.warn(`Failed to fetch operator at index ${i}:`, error);

          // If we get too many consecutive failures, likely reached the end
          if (consecutiveFailures >= maxRetries) {
            console.log(
              `Stopping after ${maxRetries} consecutive failures at index ${i}`
            );
            break;
          }
        }
      }

      if (operators.length > 0) {
        setData(operators);
      } else {
        setNoData(true);
      }
    } catch (error: any) {
      console.error("Error fetching operators:", error);

      // Provide more specific error messages
      let errorMessage =
        "An error occurred while fetching operators. Please try again later.";

      if (error?.code === "NETWORK_ERROR") {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error?.message?.includes("user rejected")) {
        errorMessage =
          "Transaction was rejected. Please approve the request in your wallet.";
      } else if (error?.message?.includes("insufficient funds")) {
        errorMessage =
          "Insufficient funds for transaction. Please add funds to your wallet.";
      } else if (error?.message?.includes("Ethereum provider")) {
        errorMessage =
          "Wallet connection lost. Please reconnect your MetaMask wallet.";
      }

      setError(errorMessage);
      setNoData(true);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (node: WifiNodeOperator) => {
    setEditingNode(node);
  };

  const toggleLocation = (id: number) => {
    setExpandedLocations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = async (updatedNode: WifiNodeOperator) => {
    setError(null);
    setIsSaving(true);
    try {
      const ethereum = (window as any).ethereum as EthereumProvider;
      if (!ethereum) {
        throw new Error("Ethereum provider not available");
      }

      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      // Convert price to wei
      const priceInWei = parseEther(updatedNode.pricePerMinute);

      // Call the smart contract function to update the node
      const tx = await contract.updateWiFiNode(
        updatedNode.id,
        updatedNode.ssid,
        updatedNode.location,
        priceInWei
      );

      // Wait for the transaction to be mined
      await tx.wait();

      // Update the local state immediately
      setData((prevData) =>
        prevData.map((node) =>
          node.id === updatedNode.id ? { ...node, ...updatedNode } : node
        )
      );

      // Update the editing node state
      setEditingNode({ ...updatedNode });

      // Re-fetch the operators data to get the updated information
      await fetchOperators();

      // Close the popup after successful update
      setEditingNode(null);
    } catch (error: any) {
      console.error("Error updating node:", error);

      if (
        error?.data?.message &&
        error.data.message.includes("Erebrus: Unauthorized")
      ) {
        setError(
          "You are not authorized to update this node. Only the node owner can make changes."
        );
      } else {
        setError("Failed to update node. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  interface EditPopupProps {
    node: WifiNodeOperator;
    onSave: (node: WifiNodeOperator) => void;
    onCancel: () => void;
  }

  const EditPopup = ({ node, onSave, onCancel }: EditPopupProps) => {
    const [editedNode, setEditedNode] = useState<WifiNodeOperator>(node);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditedNode({ ...editedNode, [e.target.name]: e.target.value });
    };
    return (
      <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center'>
        <div className='bg-gray-800 p-5 rounded-lg shadow-xl'>
          <h2 className='text-xl mb-4'>Edit Node (ID: {node.id})</h2>
          <div className='mb-4'>
            <label
              htmlFor='ssid'
              className='block text-sm font-medium text-gray-300 mb-1'
            >
              SSID
            </label>
            <input
              id='ssid'
              name='ssid'
              value={editedNode.ssid}
              onChange={handleChange}
              placeholder='SSID'
              className='mb-2 p-2 w-full bg-gray-700 text-white rounded'
              disabled={isSaving}
            />
          </div>
          <div className='mb-4'>
            <label
              htmlFor='location'
              className='block text-sm font-medium text-gray-300 mb-1'
            >
              Location
            </label>
            <input
              id='location'
              name='location'
              value={editedNode.location}
              onChange={handleChange}
              placeholder='Location'
              className='mb-2 p-2 w-full bg-gray-700 text-white rounded'
              disabled={isSaving}
            />
          </div>
          <div className='mb-4'>
            <label
              htmlFor='pricePerMinute'
              className='block text-sm font-medium text-gray-300 mb-1'
            >
              Price Per Minute
            </label>
            <input
              id='pricePerMinute'
              name='pricePerMinute'
              value={editedNode.pricePerMinute}
              onChange={handleChange}
              placeholder='Price Per Minute'
              className='mb-2 p-2 w-full bg-gray-700 text-white rounded'
              disabled={isSaving}
            />
          </div>
          <div className='flex justify-end mt-4'>
            <button
              onClick={() => onSave(editedNode)}
              className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
              disabled={isSaving}
              aria-label='Save node changes'
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onCancel}
              className='bg-gray-500 text-white px-4 py-2 rounded'
              disabled={isSaving}
              aria-label='Cancel editing node'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (noData) {
    return (
      <div className='bg-gray-900 text-white p-6 rounded-lg shadow-lg'>
        <h2 className='text-3xl font-bold mb-6'>DWifi Nodes Dashboard</h2>
        <div className='bg-gray-800 rounded-lg p-8 text-center'>
          <h3 className='mt-2 text-sm font-medium text-gray-400'>
            No dVPN Nodes
          </h3>
          {/* eslint-disable-next-line */}
          <p className='mt-1 text-sm text-gray-500'>
            You don't have any dVPN nodes running at the moment.
          </p>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 1 } }}
            className='mt-6'
          >
            <Link
              href='https://discord.com/invite/5uaFhNpRF6'
              target='_blank'
              rel='noopener noreferrer'
            >
              Run Your Node
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-900 text-white p-6 rounded-lg shadow-lg'>
      <h2 className='text-3xl font-bold mb-6'>DWifi Nodes Dashboard</h2>
      {!isConnected && (
        <button
          onClick={checkConnection}
          className='bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-500 transition duration-300'
          aria-label='Connect your wallet'
        >
          Connect Wallet
        </button>
      )}
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!noData && (
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-gray-800 rounded-lg overflow-hidden'>
            <thead className='bg-gray-700'>
              <tr>
                {[
                  "Node ID",
                  "SSID",
                  "User",
                  "Chain",
                  "Status",
                  "Location",
                  "Price Per Minute",
                  "Connected At",
                  "Last Pinged",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-600'>
              {data.map((item) => (
                <tr key={item.id} className='transition-colors duration-200'>
                  <td className='px-6 py-4 whitespace-nowrap'>{item.id}</td>
                  <td className='px-6 py-4 whitespace-nowrap'>{item.ssid}</td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {item.user.slice(0, 3)}...{item.user.slice(-3)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>peaq</td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.isActive ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {expandedLocations[item.id] ? (
                      <span>{item.location}</span>
                    ) : (
                      <span>
                        {item.location.length > 20
                          ? `${item.location.slice(0, 20)}...`
                          : item.location}
                      </span>
                    )}
                    {item.location.length > 20 && (
                      <button
                        onClick={() => toggleLocation(item.id)}
                        className='ml-2 text-blue-500 hover:text-blue-600'
                        aria-label={
                          expandedLocations[item.id]
                            ? "Show less location details"
                            : "Show more location details"
                        }
                      >
                        {expandedLocations[item.id] ? "Show less" : "Show more"}
                      </button>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {item.pricePerMinute} AGNG
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {new Date(item.connectedAt).toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {new Date(item.lastChecked).toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <button
                      onClick={() => handleEdit(item)}
                      className='bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-300'
                      aria-label={`Edit node with ID ${item.id}`}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editingNode && (
        <EditPopup
          node={editingNode}
          onSave={handleSave}
          onCancel={() => setEditingNode(null)}
        />
      )}
      {(isLoading || isSaving) && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm'>
          <div className=' bg-transparent rounded-lg p-8 flex flex-col items-center'>
            <div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500'></div>
            <p className='mt-4 text-xl font-semibold'>
              {isLoading ? "Loading..." : "Saving changes..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default NodeDwifiStreamUser;
