"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, Globe, Download, Upload, Clock, Server, Users, MapPin, Cpu } from "lucide-react"

const EREBRUS_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL

interface Node {
  id: string
  name: string
  nodename?: string
  status: string
  chainName?: string
  region?: string
  ipinfocountry?: string
  ipinfocity?: string
  ipinfolocation?: string
  downloadSpeed: number
  uploadSpeed: number
  startTimeStamp?: number
  lastPingedTimeStamp?: number
  walletAddress?: string
  walletAddressSol?: string
  totalUptime?: number
  upTimeUnit?: string
  httpPort?: string
  domain?: string
  address?: string
  ipinfoip?: string
  ipinfoorg?: string
  ipinfopostal?: string
  ipinfotimezone?: string
}

interface Client {
  UUID: string
  name: string
  walletAddress: string
  userId: string
  region: string
  nodeId: string
  domain: string
  collectionId: string
  created_at: string
  chainName: string
  blobId: string
}

export default function NodeDetailPage() {
  const params = useParams()
  const nodeId = params.id as string

  const [node, setNode] = useState<Node | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientsLoading, setClientsLoading] = useState(true)

  useEffect(() => {
    async function fetchNodeData() {
      setLoading(true)
      try {
        const response = await fetch(`${EREBRUS_GATEWAY_URL}api/v1.0/nodes/all`)
        const data = await response.json()

        if (data && Array.isArray(data.payload)) {
          const foundNode = data.payload.find((n: Node) => n.id === nodeId)
          if (foundNode) {
            setNode(foundNode)
          }
        }
      } catch (error) {
        console.error("Error fetching node data:", error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchNodeClients() {
      setClientsLoading(true)
      try {
        const response = await fetch(`${EREBRUS_GATEWAY_URL}api/v1.0/erebrus/clients/node/${nodeId}`)
        const data = await response.json()

        if (data && Array.isArray(data.payload)) {
          setClients(data.payload)
        } else {
          setClients([])
        }
      } catch (error) {
        console.error("Error fetching node clients:", error)
        setClients([])
      } finally {
        setClientsLoading(false)
      }
    }

    if (nodeId) {
      fetchNodeData()
      fetchNodeClients()
    }
  }, [nodeId])

  // Format uptime
  const formatUptime = (timestamp?: number) => {
    if (!timestamp) return "N/A"

    const now = Math.floor(Date.now() / 1000)
    const uptimeSeconds = now - timestamp

    if (uptimeSeconds < 60) return `${uptimeSeconds} seconds`
    if (uptimeSeconds < 3600) return `${Math.floor(uptimeSeconds / 60)} minutes`
    if (uptimeSeconds < 86400) return `${Math.floor(uptimeSeconds / 3600)} hours`
    return `${Math.floor(uptimeSeconds / 86400)} days`
  }

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp * 1000).toLocaleString()
  }

  // Format client date
  const formatClientDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="node-detail-page pt-16 px-4 lg:px-20 bg-[#20253A] min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {loading ? <Skeleton className="h-10 w-64 bg-gray-800/50" /> : node?.nodename || node?.name || "Node Details"}
        </h1>
        <p className="text-gray-400">
          {loading ? <Skeleton className="h-6 w-96 bg-gray-800/50" /> : `Node ID: ${nodeId}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {/* Node Details Card */}
          <Card className="bg-linear-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 overflow-hidden">
            <CardHeader className="border-b border-gray-700/50 bg-gray-800/30">
              <CardTitle className="text-xl text-white flex items-center">
                <Server className="mr-2 h-5 w-5" /> Node Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full bg-gray-800/50" />
                    ))}
                </div>
              ) : node ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Status</p>
                    {node.status === "active" ? (
                      <Badge className="bg-green-900/30 text-green-300 border-green-700/30">
                        <CheckCircle className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-900/30 text-red-300 border-red-700/30">
                        <XCircle className="mr-1 h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Chain</p>
                    <p className="text-white font-medium">{node.chainName || "Unknown"}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="text-white font-medium flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-blue-400" />
                      {node.ipinfocity && node.ipinfocountry
                        ? `${node.ipinfocity}, ${node.ipinfocountry}`
                        : node.ipinfocountry || node.region || "Unknown"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">IP Address</p>
                    <p className="text-white font-medium">{node.ipinfoip || "Unknown"}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Domain</p>
                    <p className="text-white font-medium truncate">{node.domain || "Unknown"}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Wallet Address</p>
                    <p className="text-white font-medium truncate">
                      {node.walletAddress || node.walletAddressSol || "Unknown"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Download Speed</p>
                    <p className="text-white font-medium flex items-center">
                      <Download className="mr-2 h-4 w-4 text-green-400" />
                      {node.downloadSpeed ? `${node.downloadSpeed.toFixed(2)} Mbps` : "N/A"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Upload Speed</p>
                    <p className="text-white font-medium flex items-center">
                      <Upload className="mr-2 h-4 w-4 text-blue-400" />
                      {node.uploadSpeed ? `${node.uploadSpeed.toFixed(2)} Mbps` : "N/A"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Start Time</p>
                    <p className="text-white font-medium">{formatDate(node.startTimeStamp)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Last Pinged</p>
                    <p className="text-white font-medium">{formatDate(node.lastPingedTimeStamp)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Uptime</p>
                    <p className="text-white font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-yellow-400" />
                      {formatUptime(node.startTimeStamp)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Organization</p>
                    <p className="text-white font-medium">{node.ipinfoorg || "Unknown"}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">Node not found</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Location Card */}
          <Card className="bg-linear-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 mb-6">
            <CardHeader className="border-b border-gray-700/50 bg-gray-800/30">
              <CardTitle className="text-xl text-white flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-48 w-full bg-gray-800/50 rounded-lg" />
              ) : node?.ipinfolocation ? (
                <div className="relative h-48 w-full bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${node.ipinfolocation}&zoom=5&size=600x300&markers=color:red%7C${node.ipinfolocation}&key=YOUR_API_KEY`}
                    alt="Node location map"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center bg-gray-900/70 px-4 py-2 rounded-lg">
                      <p className="font-medium">
                        {node.ipinfocity}, {node.ipinfocountry}
                      </p>
                      <p className="text-sm text-gray-300">{node.ipinfolocation}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 w-full bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                  No location data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="bg-linear-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50">
            <CardHeader className="border-b border-gray-700/50 bg-gray-800/30">
              <CardTitle className="text-xl text-white flex items-center">
                <Cpu className="mr-2 h-5 w-5" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full bg-gray-800/50" />
                  <Skeleton className="h-6 w-full bg-gray-800/50" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">Download Speed</span>
                      <span className="text-sm text-gray-300">{node?.downloadSpeed.toFixed(2)} Mbps</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((node?.downloadSpeed || 0) / 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">Upload Speed</span>
                      <span className="text-sm text-gray-300">{node?.uploadSpeed.toFixed(2)} Mbps</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((node?.uploadSpeed || 0) / 20, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connected Clients */}
      <Card className="bg-linear-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 mb-8">
        <CardHeader className="border-b border-gray-700/50 bg-gray-800/30">
          <CardTitle className="text-xl text-white flex items-center">
            <Users className="mr-2 h-5 w-5" /> Connected Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-800/50">
                <TableRow>
                  <TableHead className="text-gray-300">Client Name</TableHead>
                  <TableHead className="text-gray-300">User ID</TableHead>
                  <TableHead className="text-gray-300">Region</TableHead>
                  <TableHead className="text-gray-300">Chain</TableHead>
                  <TableHead className="text-gray-300">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i} className="bg-gray-900/30 border-gray-800">
                        <TableCell>
                          <Skeleton className="h-6 w-24 bg-gray-800/50" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32 bg-gray-800/50" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 bg-gray-800/50" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 bg-gray-800/50" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32 bg-gray-800/50" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.UUID} className="bg-gray-900/30 border-gray-800 hover:bg-gray-800/30">
                      <TableCell className="font-medium text-white">{client.name}</TableCell>
                      <TableCell className="text-gray-300 truncate max-w-[200px]">{client.userId}</TableCell>
                      <TableCell className="text-gray-300">{client.region}</TableCell>
                      <TableCell className="text-gray-300">{client.chainName}</TableCell>
                      <TableCell className="text-gray-300">{formatClientDate(client.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      No clients connected to this node
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
