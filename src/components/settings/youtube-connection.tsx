"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Video, Check, AlertCircle, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface YouTubeChannel {
  id: string
  title: string
  thumbnail: string | null
}

interface ConnectionStatus {
  connected: boolean
  channel?: YouTubeChannel
  tokenExpired?: boolean
  lastUpdated?: string
  error?: string
}

export function YouTubeConnection() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [imgError, setImgError] = useState(false)
  const searchParams = useSearchParams()

  // Check for OAuth result from URL params
  const youtubeResult = searchParams.get("youtube")
  const channelName = searchParams.get("channel")
  const errorMessage = searchParams.get("message")

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const response = await fetch("/api/auth/youtube/status")
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setStatus({ connected: false, error: "Failed to check connection status" })
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const response = await fetch("/api/auth/youtube/status", {
        method: "DELETE",
      })
      if (response.ok) {
        setStatus({ connected: false })
      }
    } catch (err) {
      console.error("Failed to disconnect:", err)
    } finally {
      setDisconnecting(false)
    }
  }

  function handleConnect() {
    // Redirect to OAuth initiation endpoint
    window.location.href = "/api/auth/youtube"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <Video className="w-5 h-5 text-red-500" />
          <div>
            <h4 className="font-medium text-foreground">YouTube</h4>
            <p className="text-sm text-muted-foreground">Checking connection...</p>
          </div>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show success/error message from OAuth callback
  if (youtubeResult === "success" && channelName) {
    return (
      <div className="flex items-center justify-between p-4 border border-green-500/50 bg-green-500/10 rounded-lg">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500" />
          <div>
            <h4 className="font-medium text-foreground">YouTube Connected!</h4>
            <p className="text-sm text-muted-foreground">
              Successfully connected to {decodeURIComponent(channelName)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/settings"}>
          Done
        </Button>
      </div>
    )
  }

  if (youtubeResult === "error") {
    return (
      <div className="flex items-center justify-between p-4 border border-red-500/50 bg-red-500/10 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <h4 className="font-medium text-foreground">Connection Failed</h4>
            <p className="text-sm text-muted-foreground">
              {errorMessage ? decodeURIComponent(errorMessage) : "Failed to connect YouTube"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleConnect}>
          Try Again
        </Button>
      </div>
    )
  }

  if (status?.connected && status.channel) {
    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3">
          {status.channel.thumbnail && !imgError ? (
            <img
              src={status.channel.thumbnail}
              alt={status.channel.title}
              className="w-10 h-10 rounded-full object-cover bg-muted"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-red-500" />
            </div>
          )}
          <div>
            <h4 className="font-medium text-foreground">{status.channel.title}</h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Connected
              {status.tokenExpired && (
                <span className="text-yellow-500 ml-2">(Token expired - reconnect required)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {status.tokenExpired && (
            <Button variant="outline" size="sm" onClick={handleConnect}>
              Reconnect
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Disconnect"
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
      <div>
        <h4 className="font-medium text-foreground">YouTube</h4>
        <p className="text-sm text-muted-foreground">Video publishing</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleConnect}>
        Connect
      </Button>
    </div>
  )
}
