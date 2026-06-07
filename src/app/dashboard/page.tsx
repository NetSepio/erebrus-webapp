"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type FormEvent,
  type ChangeEvent,
} from "react";
import Head from "next/head";
import { Cloud, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Lock, Database, Zap, Smartphone } from "lucide-react";
import { lib, enc } from "crypto-js";
import { generateKeyPair } from "curve25519-js";
import crypto from "crypto";
import { QRCodeSVG } from "qrcode.react";
import { saveAs } from "file-saver";
import { BackgroundBeams } from "@/components/ui/background-beams";
import FileUploadDemo from "@/components/file-upload-demo";
import Cookies from "js-cookie";
import axios from "axios";
import MyVpnCard from "./MyVpnCard";
import { useWalletAuth } from "@/context/appkit";
import { useAppKitNetworkCore } from "@reown/appkit/react";
import { toast } from "sonner";

// Interfaces
export interface FlowIdResponse {
  eula: string;
  flowId: string;
}

export interface WalletData {
  walletAddress: string | undefined;
}

interface FormData {
  name: string;
  region: string;
}

interface Subscription {
  type: string;
  startTime: string;
  endTime: string;
}

interface ProjectData {
  id: string;
  name: string;
  region: string;
  createdAt: string;
  created_at: string;
  UUID: string;
  walletAddress: number;
  [key: string]: any;
}

interface Node {
  id: string;
  status: string;
  region: string;
  walletAddress: string;
  chainName: string;
}

export default function DashboardPage() {
  // Environment variable validation
  const EREBRUS_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL;

  if (!EREBRUS_GATEWAY_URL) {
    console.error("NEXT_PUBLIC_GATEWAY_URL environment variable is not set");
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-950 text-white'>
        <div className='text-center'>
          <h2 className='text-2xl font-semibold text-red-400 mb-4'>
            Configuration Error
          </h2>
          <p className='text-gray-300'>
            Gateway URL is not configured. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Hooks
  const { isConnected, isAuthenticating } = useWalletAuth();
  const { caipNetworkId } = useAppKitNetworkCore();

  // States
  const [showClients, setShowClients] = useState(false);
  const [showFileStorage, setShowFileStorage] = useState(false);
  const [clients, setClients] = useState([
    { id: 1, name: "tejas22", region: "DE", createdAt: "4/8/2025, 7:59:20 PM" },
  ]);
  const [verify, setverify] = useState<boolean>(false);
  const [buttonset, setbuttonset] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    region: "",
  });
  const [collectionsPage, setcollectionsPage] = useState<boolean>(true);
  const [collectionId, setcollectionId] = useState<string>();
  const [collectionName, setcollectionName] = useState<string>();
  const [collectionImage, setcollectionImage] = useState<string>();
  const [vpnPage, setvpnPage] = useState<boolean>(false);
  const [clientUUID, setClientUUID] = useState<string>("");
  const [valueFromChild2, setValueFromChild2] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<any>(null);
  const [regionname, setregionname] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ConfigFile, setConfigFile] = useState<string>("");
  const [VpnName, setVpnName] = useState<string>("");
  const [projectsData, setprojectsData] = useState<ProjectData[] | null>(null);
  const [activeNodesData, setActiveNodesData] = useState<Node[]>([]);
  const [nodesdata, setNodesData] = useState([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Refs
  const subscriptionFetchTokenRef = useRef<string | null>(null);
  const nodesFetchedRef = useRef(false);

  // Constants
  const initialFormData: FormData = {
    name: "",
    region: "",
  };

  // Helper functions
  const getAuthToken = () => {
    const isSolanaChain = caipNetworkId?.startsWith("solana:");
    const chainType = isSolanaChain ? "solana" : "evm";
    const chainToken = Cookies.get(`erebrus_token_${chainType}`);
    const basicToken = Cookies.get("erebrus_token");
    return chainToken || basicToken || null;
  };

  const token = getAuthToken();
  const canViewDashboard = isConnected;

  // Note: Do not auto-authenticate here to avoid double signing.

  // Functions
  const handleCollectionClick = (
    collection: string,
    collectionName: string,
    collectionImage: string
  ) => {
    setcollectionId(collection);
    setcollectionName(collectionName);
    setcollectionImage(collectionImage);
    setvpnPage(true);
    setcollectionsPage(false);
  };

  const handleChildValue = (value: string) => {
    // Callback function to update the state in the parent component
    setValueFromChild2(value);
  };

  // Effects
  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // Skip if we've already fetched for this exact token (dev StrictMode calls effects twice)
      if (subscriptionFetchTokenRef.current === token) {
        return;
      }
      subscriptionFetchTokenRef.current = token;

      try {
        const url = `${EREBRUS_GATEWAY_URL}api/v1.0/subscription`;

        const response = await fetch(url, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          setSubscriptionStatus("notFound");
          setLoading(false);
          return;
        }
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText };
          }

          if (
            response.status === 400 &&
            typeof errorData.error === "string" &&
            errorData.error.toLowerCase().includes("authorization")
          ) {
            setError("Authentication failed. Please reconnect your wallet.");
            setLoading(false);
            return;
          }

          if (
            errorData.error === "subscription not found" ||
            errorData.status === "subscription not found"
          ) {
            setSubscriptionStatus("notFound");
            setLoading(false);
            return;
          }

          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const data = await response.json();

        if (
          data.status === "notFound" ||
          data.status === "subscription not found"
        ) {
          setSubscriptionStatus("notFound");
        } else if (data.subscription) {
          setSubscription(data.subscription);
          setSubscriptionStatus(data.status);
        } else {
          setSubscriptionStatus("notFound");
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [token]);

  // Fetch metadata for collection image
  useEffect(() => {
    const fetchMetaData = async () => {
      const ipfsCid = collectionImage?.replace("ipfs://", "");

      // Guard against undefined/empty CID
      if (!ipfsCid) {
        setImageSrc(null);
        return;
      }

      // Fetching metadata from IPFS via Erebrus gateway
      const metadataResponse = await axios.get(
        `https://ipfs.erebrus.io/ipfs/${ipfsCid}`
      );
      const metadata = metadataResponse.data;
      const imagePath = metadata?.image?.replace?.("ipfs://", "");
      setImageSrc(imagePath || null);
    };
    fetchMetaData();
  }, [collectionImage]);

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const auth = getAuthToken();

      const response = await axios.get(
        `${EREBRUS_GATEWAY_URL}api/v1.0/erebrus/clients`,
        {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth}`,
          },
        }
      );

      if (response.status === 200) {
        // Filter the data based on the domain ID
        const wallet = Cookies.get("erebrus_userid");
        const payload: any[] = response.data.payload;
        const filteredData = payload.filter(
          (item: any) => item?.userId === wallet
        );
        filteredData.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setprojectsData(filteredData);
      }
    } catch (error) {
      // Error fetching profile data
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (showClients === true) {
      fetchProjectsData();
    }
  }, [showClients]); // 👈 Only run when showClients changes
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  };
  // map of known region codes to human friendly names
  const regionNames: Record<string, string> = {
    SG: "Singapore",
    IN: "India",
    US: "United States",
    JP: "Japan",
    CA: "Canada",
    GB: "United Kingdom",
    AU: "Australia",
    DE: "Germany",
    NO: "Norway",
    IT: "Italy",
    FI: "Finland",
    FR: "France",
    HK: "Hong Kong",
    KR: "South Korea",
    NL: "Netherlands",
    QA: "Qatar",
    ZA: "South Africa",
  };

  // Compute available regions from active nodes only (deduplicated and normalized)

  const handleRegionChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { value } = e.target;
    // normalize to upper case so filtering of nodes matches
    setregionname(value ? value.toString().toUpperCase() : "");
  };
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [id]: value,
    }));
  };
  interface Node {
    id: string;
    status: string;
    region: string;
    walletAddress: string;
    chainName: string;
  }

  // Compute available regions from active nodes only (deduplicated and normalized)
  const availableRegions = useMemo(() => {
    if (!activeNodesData || activeNodesData.length === 0)
      return [] as { id: string; region: string }[];
    const regions = Array.from(
      new Set(
        activeNodesData
          .map((n: any) => (n.region || "").toString().toUpperCase().trim())
          .filter(Boolean)
      )
    );
    return regions.map((id) => ({ id, region: regionNames[id] || id }));
  }, [activeNodesData]);

  // Prevent duplicate fetches in StrictMode using a guard
  useEffect(() => {
    if (nodesFetchedRef.current) return;
    nodesFetchedRef.current = true;
    const fetchNodesData = async () => {
      try {
        const auth = getAuthToken();

        const response = await axios.get(
          `${EREBRUS_GATEWAY_URL}api/v1.0/nodes/all`,
          {
            headers: {
              "Accept": "application/json, text/plain, */*",
              "Content-Type": "application/json",
              "Authorization": `Bearer ${auth}`,
            },
          }
        );

        if (response.status === 200) {
          const payload = response.data.payload;
          setNodesData(payload);
          interface Node {
            id: string;
            status: string;
            region: string;
          }

          const filteredNodes = payload.filter(
            (node: Node) =>
              node.status === "active" &&
              node.region !== undefined &&
              node.region !== null &&
              node.region.trim()
          );
          setActiveNodesData(filteredNodes);

          // Extract and store unique regions
          const regions = Array.from(
            new Set(filteredNodes.map((node: Node) => node.region))
          );

          // nodes payload fetched
        }
      } catch (error) {
        // Error fetching nodes data
      } finally {
      }
    };

    fetchNodesData();
  }, []);
  const generateSerialNumber = (region: string, index: number): string => {
    const number = (index + 1).toString().padStart(3, "0");
    return `${region}${number}`;
  };
  const sliceWalletAddress = (walletAddress: string) => {
    return `${walletAddress.slice(0, 3)}...${walletAddress.slice(-3)}`;
  };
  const sliceNodeId = (nodeId: string) => {
    return `${nodeId.slice(0, 3)}...${nodeId.slice(-3)}`;
  };
  const handleDropdownToggle = () => {
    setIsOpen(!isOpen);
  };
  const genKeys = () => {
    const preSharedKey = lib.WordArray.random(32);
    // Encode the keys in base64

    const preSharedKeyB64 = preSharedKey.toString(enc.Base64);

    const keyPair = generateKeyPair(crypto.randomBytes(32));
    const privKey = Buffer.from(keyPair.private).toString("base64");
    const pubKey = Buffer.from(keyPair.public).toString("base64");
    const keys = {
      preSharedKey: preSharedKeyB64,
      privKey: privKey,
      pubKey: pubKey,
    };

    return keys;
  };
  const handleOptionClick = (option: { id: string; [key: string]: any }) => {
    setSelectedOption(option); // Ensuring option is an object
    setFormData((prevData) => ({ ...prevData, region: option.id }));
    setIsOpen(false);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedOption(null);
    setSelectedIndex(null);
    setregionname("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const auth = getAuthToken();
    try {
      const keys = genKeys();
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("presharedKey", keys.preSharedKey);
      formDataObj.append("publicKey", keys.pubKey);

      // Convert FormData to JavaScript Object
      const formDataObject: { [key: string]: string | File | null } = {};
      formDataObj.forEach((value, key) => {
        formDataObject[key] = value;
      });

      // Convert JavaScript Object to JSON string
      const jsonData = JSON.stringify(formDataObject);

      const response = await fetch(
        `${EREBRUS_GATEWAY_URL}api/v1.0/erebrus/client/${formData.region}`,
        {
          method: "POST",
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${auth}`,
          },
          body: jsonData,
        }
      );

      if (response.status === 200) {
        const responseData = await response.json();
        setVpnName(responseData.payload.client.Name);
        setClientUUID(responseData.payload.client.UUID);
        setFormData(initialFormData);

        const configFile = `
        [Interface]
        Address = ${responseData.payload.client.Address}
        PrivateKey = ${keys.privKey}
        DNS = 1.1.1.1

        [Peer]
        PublicKey = ${responseData.payload.serverPublicKey}
        PresharedKey = ${responseData.payload.client.PresharedKey} 
        AllowedIPs = 0.0.0.0/0, ::/0
        Endpoint = ${responseData.payload.endpoint}:51820
        PersistentKeepalive = 16`;
        setConfigFile(configFile);
        setverify(true);
        setShowQrCodeModal(true);
        setValueFromChild2("refreshafterclientcreate");

        fetchProjectsData();
        resetForm();
        // Close the form modal
        setbuttonset(false);
      } else {
        setMsg("Failed to create VPN. Try with unique name.");
      }
    } catch (error) {
      setMsg("Failed to create VPN. Try with unique name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Erebrus Dashboard</title>
        <meta
          name='description'
          content='Manage your Erebrus VPN connections and clients.'
        />
        <link rel='canonical' href='https://erebrus.io/dashboard' />
      </Head>
      <div className='flex min-h-screen flex-col bg-slate-950 text-white relative font-sans'>
        <div className='absolute inset-0 z-0'>
          <BackgroundBeams />
        </div>
        {!canViewDashboard ? (
          <div className='flex min-h-screen items-center justify-center'>
            <div className='text-center text-gray-300 px-4'>
              <h2 className='text-2xl font-semibold'>
                {isAuthenticating ? "Signing message…" : "Connect Your Wallet"}
              </h2>
              <p className='mt-2 text-sm'>
                {isAuthenticating
                  ? "Please approve the signature in your wallet to continue."
                  : "Please use the Connect / Sign In button in the navbar to access the dashboard."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main content */}
            <main className='relative z-10 flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 mt-20'>
              {subscriptionStatus === "notFound" ? (
                <>
                  <div className='grid gap-4 max-w-6xl mx-auto w-full justify-center items-center'>
                    <Card className='bg-slate-900/60 border-slate-800 text-white'>
                      <CardHeader>
                        <CardTitle>Upgrade Your Subscription</CardTitle>
                        <CardDescription className='text-slate-400'>
                          Get access to premium features with our Quantum Tier
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='p-6'>
                        <div className='rounded-lg bg-slate-800/50 p-6'>
                          <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 mb-2'>
                            PREMIUM
                          </span>
                          <h2 className='text-gray-100 text-2xl font-bold mb-2'>
                            Quantum Tier Subscription
                          </h2>
                          <p className='text-gray-400 text-sm mb-6'>
                            Advanced security & networking features
                          </p>

                          <div className='flex items-baseline mb-8'>
                            <span className='text-white text-4xl font-bold'>
                              $5.99
                            </span>
                            <span className='text-gray-500 ml-2'>/month</span>
                            <span className='ml-3 text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded'>
                              SAVE 40%
                            </span>
                          </div>

                          <Button
                            className='w-full bg-linear-to-r from-blue-700 to-blue-600 py-3 px-4 text-center text-white font-medium shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all duration-300 cursor-pointer'
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={async () => {
                              const auth = getAuthToken();
                              try {
                                const response = await fetch(
                                  `${EREBRUS_GATEWAY_URL}api/v1.0/subscription/trial`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Accept":
                                        "application/json, text/plain, */*",
                                      "Content-Type": "application/json",
                                      "Authorization": `Bearer ${auth}`,
                                    },
                                    // body: jsonData,
                                  }
                                );

                                if (response.status === 200) {
                                  const responseData = await response.json();
                                  window.location.reload();
                                  // settrialbuytrue(true);
                                  // for alert
                                  setTimeout(() => {
                                    window.location.href = "/dashboard";
                                  }, 3000);
                                }
                              } catch (error) {
                              } finally {
                              }
                            }}
                            aria-label='Start 7-day free trial'
                          >
                            <span
                              className={`inline-block transition-transform duration-300 ${
                                isHovered ? "scale-105" : ""
                              }`}
                            >
                              Start 7-Day Free Trial
                            </span>
                          </Button>

                          <ul className='space-y-4 mt-8'>
                            {[
                              {
                                icon: <Lock size={16} />,
                                text: "Decentralized Zero-Trust Network",
                              },
                              {
                                icon: <Shield size={16} />,
                                text: "Multi-layer Quantum Encryption",
                              },
                              {
                                icon: <Database size={16} />,
                                text: "Real-time Threat Analysis & Prevention",
                              },
                              {
                                icon: <Zap size={16} />,
                                text: "AI-powered Security Insights",
                              },
                              {
                                icon: <Smartphone size={16} />,
                                text: "Cross-platform Secure Access",
                              },
                            ].map((item, index) => (
                              <li
                                key={index}
                                className={`flex items-center text-gray-400 transition-all duration-300 ${
                                  isHovered ? "translate-x-1" : ""
                                }`}
                                style={{ transitionDelay: `${index * 50}ms` }}
                              >
                                <div className='flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/30 text-blue-400 mr-3'>
                                  {item.icon}
                                </div>
                                {item.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <>
                  {showClients ? (
                    <div className='max-w-6xl w-full mx-auto'>
                      <div className='flex justify-between items-center mb-6'>
                        <h1 className='text-2xl font-bold'>My VPN Clients</h1>
                        <div className='flex gap-2'>
                          {/* 1. View Subscriptions Button */}
                          <Button
                            variant='outline'
                            className='border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                            onClick={() => setShowClients(false)}
                            aria-label='View subscription details'
                          >
                            View Subscriptions
                          </Button>

                          {/* 2. Add More Clients Button */}
                          <Button
                            onClick={() => {
                              setbuttonset(true);
                            }}
                            className='bg-blue-600 hover:bg-blue-700 cursor-pointer'
                            aria-label='Add new VPN client'
                          >
                            <Plus className='mr-2 h-4 w-4' />
                            Add More Clients
                          </Button>
                        </div>
                      </div>

                      <Card className='bg-slate-900/60 border-slate-800 text-white'>
                        <CardHeader>
                          <div className='flex items-center gap-4'>
                            {imageSrc ? (
                              <img
                                src={`https://ipfs.erebrus.io/ipfs/${imageSrc}`}
                                className='w-14 h-14 rounded-full'
                              />
                            ) : (
                              <img
                                src='subscriptionprofile.webp'
                                className='w-14 h-14 rounded-full'
                              />
                            )}{" "}
                            <div>
                              <CardTitle>
                                {subscription
                                  ? `${subscription.type.toUpperCase()} Subscription`
                                  : "Loading..."}
                              </CardTitle>
                            </div>
                          </div>
                          <div className='mx-auto'>
                            <appkit-button />
                          </div>
                        </CardHeader>
                        <CardContent>
                          {projectsData && projectsData?.length !== 0 ? (
                            <>
                              {projectsData.map((metaData, index) => (
                                <div key={index} className='flex'>
                                  <MyVpnCard metaData={metaData} />
                                </div>
                              ))}{" "}
                            </>
                          ) : (
                            <>
                              <div className='text-center text-slate-400'>
                                Add Client
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2 max-w-6xl mx-auto w-full'>
                      <Card className='bg-slate-900/60 border-slate-800 text-white'>
                        <CardHeader>
                          <CardTitle>Subscription</CardTitle>
                          <CardDescription className='text-slate-400'>
                            Your current plan and usage
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='p-6'>
                          {loading ? (
                            <p className='text-slate-300'>
                              Loading subscription...
                            </p>
                          ) : error ? (
                            <p className='text-red-400'>{error}</p>
                          ) : subscription ? (
                            <div className='rounded-lg bg-slate-800/50 p-6'>
                              <div className='flex items-center justify-between mb-4'>
                                <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400'>
                                  ACTIVE
                                </span>
                                {/* Debug fetch button removed for production */}
                              </div>

                              {/* Debug section removed for production */}
                              <div className='flex items-center justify-between'>
                                <div>
                                  <h3 className='text-xl font-bold'>
                                    {subscription.type.toUpperCase()}{" "}
                                    SUBSCRIPTION
                                  </h3>
                                  <p className='text-sm text-slate-400'>
                                    (
                                    {subscriptionStatus === "expired"
                                      ? "Expired"
                                      : "Valid for 7 days"}
                                    )
                                  </p>
                                </div>
                                {/* 4. Upgrade/Renew Plan Button */}
                                <Button
                                  className='bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                  aria-label={
                                    subscriptionStatus === "expired"
                                      ? "Renew subscription plan"
                                      : "Upgrade subscription plan"
                                  }
                                >
                                  {subscriptionStatus === "expired"
                                    ? "Renew Plan"
                                    : "Upgrade Plan"}
                                </Button>
                              </div>
                              <div className='mt-6 space-y-2'>
                                <div className='flex justify-between text-sm'>
                                  <span className='text-slate-400'>
                                    Start time:
                                  </span>
                                  <span>
                                    {formatDate(subscription.startTime)}
                                  </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                  <span className='text-slate-400'>
                                    End time:
                                  </span>
                                  <span>
                                    {formatDate(subscription.endTime)}
                                  </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                  <span className='text-slate-400'>
                                    Status:
                                  </span>
                                  <span>
                                    {subscriptionStatus.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className='text-slate-300'>
                              No subscription found
                            </p>
                          )}
                          <div className='mt-6 flex gap-3'>
                            {/* 5. Create Clients Button */}
                            <Button
                              variant='outline'
                              className='border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                              onClick={() => setShowClients(true)}
                              aria-label='Create new VPN clients'
                            >
                              <Plus className='mr-2 h-4 w-4' />
                              Create Clients
                            </Button>
                            {/* 6. File Storage Button */}
                            <Button
                              variant='outline'
                              className='border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                              onClick={() => setShowFileStorage(true)}
                              aria-label='Access file storage'
                            >
                              <Cloud className='mr-2 h-4 w-4' />
                              File Storage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className='bg-slate-900/60 border-slate-800 text-white'>
                        <CardHeader>
                          <CardTitle>Mint</CardTitle>
                          <CardDescription className='text-slate-400'>
                            Create and manage your digital assets
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='flex items-center justify-center p-6'>
                          <div
                            className='rounded-lg border border-dashed border-blue-500 bg-slate-800/30 p-10 text-center w-full cursor-pointer'
                            onClick={() => (window.location.href = "/mint")}
                          >
                            <div className='flex flex-col items-center justify-center'>
                              <Plus className='h-10 w-10 text-blue-500 mb-4' />
                              <p className='text-slate-300'>
                                Click to navigate to Mint page
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {buttonset && (
                    <>
                      <div
                        style={{ backgroundColor: "#222944E5" }}
                        className='flex overflow-y-auto overflow-x-hidden fixed inset-0 z-50 justify-center items-center w-full max-h-full'
                        id='popupmodal'
                      >
                        <div className='relative p-4 w-full max-w-2xl max-h-full'>
                          <div
                            className='relative rounded-3xl shadow dark:bg-gray-700 mx-auto w-full lg:w-3/4'
                            style={{
                              backgroundColor: "#202333",
                              border: "1px solid #0162FF",
                            }}
                          >
                            <div className='flex items-center justify-end p-4 md:p-5 rounded-t dark:border-gray-600'>
                              {/* 3. Modal Close Button */}
                              <button
                                onClick={() => {
                                  setbuttonset(false);
                                }}
                                type='button'
                                className='text-white bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer'
                                aria-label='Close modal'
                              >
                                <svg
                                  className='w-3 h-3'
                                  aria-hidden='true'
                                  xmlns='http://www.w3.org/2000/svg'
                                  fill='none'
                                  viewBox='0 0 14 14'
                                >
                                  <path
                                    stroke='currentColor'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6'
                                  />
                                </svg>
                                <span className='sr-only'>Close modal</span>
                              </button>
                            </div>
                            <section>
                              <div className='mx-auto max-w-3xl'>
                                <div className='w-full mx-auto text-left px-6 md:px-10 pb-6 md:pb-10'>
                                  <div className='flex justify-between items-center mb-6'>
                                    <h2 className='text-3xl font-bold'>
                                      Create your client
                                    </h2>
                                  </div>

                                  <form onSubmit={handleSubmit}>
                                    <div className='space-y-6'>
                                      {/* Client Name Input */}
                                      <div>
                                        <label
                                          htmlFor='name'
                                          className='block text-sm font-medium text-gray-300 mb-2'
                                        >
                                          Client Name
                                        </label>
                                        <input
                                          type='text'
                                          id='name'
                                          className='w-full bg-gray-800 border border-gray-700 rounded-full py-3 px-6 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                          placeholder='Enter Client Name (Max 8 characters)'
                                          value={formData.name}
                                          onChange={handleInputChange}
                                          maxLength={8}
                                          required
                                        />
                                      </div>

                                      {/* Region Selector */}
                                      <div className='relative'>
                                        <label
                                          htmlFor='regionname'
                                          className='block text-sm font-medium text-gray-300 mb-2'
                                        >
                                          Region
                                        </label>
                                        <select
                                          id='regionname'
                                          className='w-full bg-gray-800 border border-gray-700 rounded-full py-3 px-6 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500'
                                          value={regionname}
                                          onChange={handleRegionChange}
                                          required
                                        >
                                          <option value='' disabled>
                                            Select Region
                                          </option>
                                          {availableRegions.length === 0 ? (
                                            <option value='' disabled>
                                              No active regions available
                                            </option>
                                          ) : (
                                            availableRegions.map((node) => (
                                              <option
                                                key={node.id}
                                                value={node.id}
                                              >
                                                {node.region}
                                              </option>
                                            ))
                                          )}
                                        </select>
                                        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-4'>
                                          <svg
                                            className='w-5 h-5 text-gray-400'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth='2'
                                              d='M19 9l-7 7-7-7'
                                            />
                                          </svg>
                                        </div>
                                      </div>

                                      {/* Node Selector */}
                                      <div className='relative'>
                                        <div
                                          className='w-full bg-gray-800 border border-gray-700 rounded-full py-3 px-6 text-white cursor-pointer flex items-center justify-between'
                                          onClick={handleDropdownToggle}
                                        >
                                          {selectedOption ? (
                                            <div className='flex items-center'>
                                              <span className='mr-2'>
                                                {generateSerialNumber(
                                                  regionname,
                                                  selectedIndex
                                                )}
                                                -
                                              </span>
                                              <span>
                                                {sliceNodeId(selectedOption.id)}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className='text-gray-400'>
                                              Select Node ID
                                            </span>
                                          )}
                                          <svg
                                            className={`w-5 h-5 transition-transform duration-200 ${
                                              isOpen ? "rotate-180" : ""
                                            }`}
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth='2'
                                              d='M19 9l-7 7-7-7'
                                            />
                                          </svg>
                                        </div>

                                        {isOpen && (
                                          <div className='absolute w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto'>
                                            <div className='grid grid-cols-4 p-3 font-medium text-gray-300 border-b border-gray-700 sticky top-0 bg-gray-800'>
                                              <div>S.No</div>
                                              <div>Node ID</div>
                                              <div>Wallet Address</div>
                                              <div>Chain</div>
                                            </div>

                                            {activeNodesData
                                              .filter((node) => {
                                                const nodeRegion = (
                                                  node.region || ""
                                                )
                                                  .toString()
                                                  .toUpperCase()
                                                  .trim();
                                                const selectedRegion = (
                                                  regionname || ""
                                                )
                                                  .toString()
                                                  .toUpperCase()
                                                  .trim();
                                                return (
                                                  !selectedRegion ||
                                                  nodeRegion === selectedRegion
                                                );
                                              })
                                              .map((option, index) => (
                                                <div
                                                  key={option.id}
                                                  className='grid grid-cols-4 p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0'
                                                  onClick={() => {
                                                    handleOptionClick(option);
                                                    setSelectedIndex(index);
                                                  }}
                                                >
                                                  <div>
                                                    {generateSerialNumber(
                                                      regionname,
                                                      index
                                                    )}
                                                  </div>
                                                  <div>
                                                    {sliceNodeId(option.id)}
                                                  </div>
                                                  <div>
                                                    {sliceWalletAddress(
                                                      option.walletAddress
                                                    )}
                                                  </div>
                                                  <div>{option.chainName}</div>
                                                </div>
                                              ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Submit Button */}
                                      <div className='mt-8'>
                                        <button
                                          type='submit'
                                          className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer'
                                          aria-label='Create new VPN client'
                                        >
                                          Create Client
                                        </button>
                                        {msg && (
                                          <p
                                            className={`mt-3 text-center ${
                                              msg.includes("successful")
                                                ? "text-green-400"
                                                : "text-red-400"
                                            }`}
                                          >
                                            {msg}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            </section>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {showQrCodeModal && ConfigFile && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center'>
                      {/* subtle backdrop so page remains visible but modal is prominent */}
                      <div
                        className='absolute inset-0 bg-black opacity-40'
                        onClick={() => setShowQrCodeModal(false)}
                      />

                      <div className='relative w-full max-w-4xl mx-4'>
                        {/* Modal card with proper styling */}
                        <div className='mx-auto bg-[#202333] border border-[#0162FF] rounded-xl shadow-2xl overflow-hidden'>
                          <div className='flex justify-between items-center p-4 border-b border-[#0162FF]/30'>
                            <h2 className='text-2xl font-semibold text-white px-2'>
                              Download Configuration
                            </h2>
                            <button
                              onClick={() => setShowQrCodeModal(false)}
                              className='text-gray-300 hover:text-white cursor-pointer'
                              aria-label='Close QR code modal'
                            >
                              <svg
                                className='w-6 h-6'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M6 18L18 6M6 6l12 12'
                                />
                              </svg>
                            </button>
                          </div>

                          <div className='p-6'>
                            <div className='flex flex-col lg:flex-row items-center gap-8'>
                              {/* QR Code section with fixed width */}
                              <div className='bg-white p-4 rounded-lg shrink-0 w-80 h-80 flex items-center justify-center'>
                                <QRCodeSVG
                                  value={ConfigFile}
                                  size={300}
                                  className='block'
                                  style={{
                                    background: "#ffffff",
                                    display: "block",
                                  }}
                                />
                              </div>

                              {/* Instructions section with proper width constraints */}
                              <div className='flex-1 text-white max-w-md'>
                                <div className='space-y-4'>
                                  <p className='text-lg'>
                                    Open{" "}
                                    <a
                                      href='https://www.wireguard.com/'
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-400 font-medium hover:underline'
                                    >
                                      WireGuard
                                    </a>{" "}
                                    on your mobile device and scan the QR code
                                    to import the configuration.
                                  </p>

                                  <p className='text-sm text-gray-300'>
                                    If scanning fails, you can download the
                                    configuration or copy it to your clipboard
                                    and import manually.
                                  </p>

                                  <div className='flex gap-3'>
                                    <button
                                      onClick={() => {
                                        const blob = new Blob([ConfigFile], {
                                          type: "text/plain;charset=utf-8",
                                        });
                                        saveAs(
                                          blob,
                                          `${VpnName || "erebrus"}.conf`
                                        );
                                      }}
                                      className='px-6 py-2 rounded-lg bg-[#0162FF] text-white font-medium hover:bg-[#0152DD] transition-colors cursor-pointer'
                                      aria-label='Download VPN configuration file'
                                    >
                                      Download
                                    </button>

                                    <button
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(
                                            ConfigFile
                                          );
                                          toast(
                                            "Configuration copied to clipboard"
                                          );
                                        } catch (e) {
                                          toast(
                                            "Copy failed — please download the file instead"
                                          );
                                        }
                                      }}
                                      className='cursor-pointer'
                                      aria-label='Copy VPN configuration to clipboard'
                                    >
                                      Copy
                                    </button>
                                  </div>

                                  <div className='mt-4'>
                                    <p className='text-sm text-gray-400'>
                                      VPN Name:{" "}
                                      <span className='text-white font-medium'>
                                        {VpnName}
                                      </span>
                                    </p>
                                    <p className='text-sm text-gray-400'>
                                      Client ID:{" "}
                                      <span className='text-white font-medium'>
                                        {clientUUID.substring(0, 8)}...
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showFileStorage && !showClients && (
                    <Card className='bg-slate-900/60 border-slate-800 text-white mt-4 max-w-6xl mx-auto w-full'>
                      <CardHeader className='flex flex-row items-center justify-between'>
                        <div>
                          <CardTitle>File Storage</CardTitle>
                          <CardDescription className='text-slate-400'>
                            Securely store files on the decentralized network
                          </CardDescription>
                        </div>
                        {/* 7. Close File Storage Button */}
                        <Button
                          variant='outline'
                          className='border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
                          onClick={() => setShowFileStorage(false)}
                          aria-label='Close file storage section'
                        >
                          Close
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <FileUploadDemo />
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </main>
          </>
        )}
      </div>
    </>
  );
}
