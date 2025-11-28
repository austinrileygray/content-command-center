"use client"

import { useState, useEffect, Suspense } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { User, Video, Bell, Key, CheckCircle, ExternalLink } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

function SettingsContent() {
  const searchParams = useSearchParams()
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    // Check if YouTube is connected
    // This would check the profile metadata in a real implementation
    const connected = searchParams.get("youtube_connected") === "true"
    if (connected) {
      setYoutubeConnected(true)
      toast.success("YouTube connected successfully!")
    }

    const error = searchParams.get("error")
    if (error) {
      toast.error(`YouTube connection failed: ${error}`)
    }
  }, [searchParams])

  const connectYouTube = async () => {
    setConnecting(true)
    try {
      const response = await fetch("/api/youtube/auth")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate YouTube auth")
      }

      if (data.authUrl) {
        // Log redirect URI for debugging
        console.log("Redirect URI being used:", data.redirectUri)
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || "Failed to initiate YouTube auth")
      }
    } catch (error: any) {
      console.error("YouTube connection error:", error)
      toast.error(error.message || "Failed to connect YouTube")
      setConnecting(false)
    }
  }

  // Note: Profile fetching moved to client component if needed
  // For now, using static values
  const profile = {
    name: "The Owner Operator",
    email: "owner@theownerop.com",
    avatar_url: null,
    youtube_channel_id: null,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-brand/10 text-brand">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Profile Information</h3>
                <p className="text-sm text-muted-foreground">Update your personal details</p>
              </div>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  defaultValue={profile?.name || ""}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={profile?.email || ""}
                  placeholder="your@email.com"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  type="url"
                  defaultValue={profile?.avatar_url || ""}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube Channel ID</Label>
                <Input
                  id="youtube"
                  defaultValue={profile?.youtube_channel_id || ""}
                  placeholder="UC..."
                />
              </div>

              <Button type="submit" className="bg-brand hover:bg-brand/90">
                Save Changes
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recording Platforms</h3>
                <p className="text-sm text-muted-foreground">Connect your recording tools</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">Loom</h4>
                  <p className="text-sm text-muted-foreground">Solo video recordings</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">SquadCast</h4>
                  <p className="text-sm text-muted-foreground">Guest interviews</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">Restream</h4>
                  <p className="text-sm text-muted-foreground">Live streaming</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Content Platforms</h3>
                <p className="text-sm text-muted-foreground">Connect publishing destinations</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">YouTube</h4>
                    {youtubeConnected && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {youtubeConnected
                      ? "Connected - Ready to publish videos"
                      : "Connect to publish videos directly to YouTube"}
                  </p>
                </div>
                <Button
                  variant={youtubeConnected ? "outline" : "default"}
                  size="sm"
                  onClick={connectYouTube}
                  disabled={connecting}
                  className={youtubeConnected ? "gap-2" : ""}
                >
                  {connecting
                    ? "Connecting..."
                    : youtubeConnected
                    ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Connected
                        </>
                      )
                    : "Connect"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">LinkedIn</h4>
                  <p className="text-sm text-muted-foreground">Professional network</p>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">Twitter/X</h4>
                  <p className="text-sm text-muted-foreground">Social media</p>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">Control how you receive updates</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Recording Complete</h4>
                  <p className="text-sm text-muted-foreground">When a recording finishes</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Asset Ready</h4>
                  <p className="text-sm text-muted-foreground">When clips are generated</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Webhooks & API Keys</h3>
                <p className="text-sm text-muted-foreground">Manage your webhook URLs and API integrations</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submagic-key">Submagic API Key</Label>
                <Input
                  id="submagic-key"
                  type="password"
                  placeholder="sk-your-submagic-api-key-here"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://app.submagic.co" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">app.submagic.co</a> → Settings → API. Used for Magic Clips generation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key (Optional)</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                />
                <p className="text-xs text-muted-foreground">
                  For AI-powered idea generation and content creation. Get from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">OpenAI Platform</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic (Claude) API Key (Optional)</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                />
                <p className="text-xs text-muted-foreground">
                  Alternative to OpenAI for AI-powered features. Get from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Anthropic Console</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zapier-webhook">Zapier Webhook URL (Optional)</Label>
                <Input
                  id="zapier-webhook"
                  type="url"
                  placeholder="https://hooks.zapier.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  For automation triggers. Create a Zap in Zapier and copy the webhook URL.
                </p>
              </div>

              <Button className="bg-brand hover:bg-brand/90">Save Settings</Button>
              <p className="text-xs text-muted-foreground">
                Note: API keys are stored securely. They are used only for the features you enable.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  )
}
