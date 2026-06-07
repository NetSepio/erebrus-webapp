"use client";

import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import NodesData from "@/components/nodes-data";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Server, Globe, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the map component with no SSR
const DvpnMap = dynamic(() => import("@/components/dvpn-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center text-white bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Loading interactive map...</p>
      </div>
    </div>
  ),
});

export default function Explorer() {
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    regions: 0,
  });

  // Handle initial load
  useEffect(() => {
    // Delay rendering the map to ensure proper client-side hydration
    const timer = setTimeout(() => {
      setShouldRenderMap(true);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Fetch nodes data
  useEffect(() => {
    async function fetchNodes() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_GATEWAY_URL}api/v1.0/nodes/all`
        );
        const data = await response.json();
        if (data && Array.isArray(data.payload)) {
          setNodes(data.payload);

          // Calculate stats
          const activeNodes = data.payload.filter(
            (node: { status: string }) => node.status === "active"
          ).length;
          const uniqueRegions = new Set(
            data.payload.map(
              (node: { ipinfocountry: any; region: any }) =>
                node.ipinfocountry || node.region
            )
          ).size;

          setStats({
            total: data.payload.length,
            active: activeNodes,
            regions: uniqueRegions,
          });
        } else {
          setNodes([]);
          console.warn("Received invalid data payload from API.");
        }
      } catch (error) {
        console.error("Error fetching nodes data:", error);
        setNodes([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNodes();

    // Handle route changes
    const handleRouteChange = () => {
      // Toggle the map rendering state to force a remount
      setShouldRenderMap(false);
      setTimeout(() => {
        setShouldRenderMap(true);
      }, 500);
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Head>
        <title>Erebrus Explorer</title>
        <meta
          name="description"
          content="Explore the Erebrus decentralized VPN network with our interactive map."
        />
        <link rel="canonical" href="https://erebrus.io/explorer" />
      </Head>
      <div className="explorer-page font-sans">
        {/* Hero Section */} 
        <div
          className="relative flex flex-col items-center justify-center min-h-[60vh] w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/explorerhero.webp")',
            backgroundBlendMode: "overlay",
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/70 to-slate-900/90"></div>

          <div className="container relative z-10 px-4 py-20 md:py-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-4xl font-another-xanadu text-white mb-6">
                Decentralized Access with
                <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-blue-500">
                  Erebrus ÐVPN
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 mb-10">
                Unrestricted Uncensored Web Access
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-white text-slate-900 font-bold py-3 px-10 text-lg"
                >
                  <Link
                    href="https://discord.com/invite/5uaFhNpRF6"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Run Your Node
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-indigo-600 text-white font-bold py-3 px-10 text-lg cursor-pointer"
                  onClick={scrollToMap}
                >
                  <MapPin className="inline-block mr-2 animate-bounce duration-1000 ease-in-out" />{" "}
                  Active Node Map
                </motion.div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16"
            >
              <Card className="bg-slate-900/60 backdrop-blur-md border-indigo-900/30">
                <CardContent className="p-6 flex items-center gap-4">
                  <Badge className="bg-indigo-600 text-white h-12 w-12 flex items-center justify-center p-0 rounded-full">
                    <Server className="h-6 w-6" />
                  </Badge>
                  <div>
                    <p className="text-slate-400 text-sm">Total Nodes</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 bg-slate-700" />
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        {stats.total}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-md border-green-900/30">
                <CardContent className="p-6 flex items-center gap-4">
                  <Badge className="bg-green-600 text-white h-12 w-12 flex items-center justify-center p-0 rounded-full">
                    <Activity className="h-6 w-6" />
                  </Badge>
                  <div>
                    <p className="text-slate-400 text-sm">Active Nodes</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 bg-slate-700" />
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        {stats.active}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 backdrop-blur-md border-blue-900/30">
                <CardContent className="p-6 flex items-center gap-4">
                  <Badge className="bg-blue-600 text-white h-12 w-12 flex items-center justify-center p-0 rounded-full">
                    <Globe className="h-6 w-6" />
                  </Badge>
                  <div>
                    <p className="text-slate-400 text-sm">Regions Covered</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 bg-slate-700" />
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        {stats.regions}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-linear-to-b from-slate-900 to-[#20253A] py-16 px-4 lg:px-20">
          <div className="container mx-auto">
            <div className="mb-8">
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-4"
                ref={mapRef}
              >
                Erebrus Decentralized VPN (ÐVPN) Network Nodes Map
              </h2>
              <p className="text-slate-300 max-w-3xl">
                Explore the Erebrus decentralized VPN network with our
                interactive map. View detailed information on active nodes,
                including their location, network performance, and status. This
                map provides real-time insights into the global distribution and
                operation of our secure and private VPN infrastructure.
              </p>
            </div>

            <div className="h-[600px] rounded-xl overflow-hidden shadow-2xl shadow-indigo-900/20 border border-slate-800">
              {shouldRenderMap ? (
                <DvpnMap nodes={nodes} />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white bg-slate-900">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading interactive map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nodes Data Table Section */}
        <div className="bg-[#20253A] py-16">
          <div className="container mx-auto px-4 lg:px-20">
            <NodesData />
          </div>
        </div>
      </div>
    </>
  );
}
