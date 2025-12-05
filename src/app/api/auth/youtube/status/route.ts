import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { YouTubeConnection } from "@/types/database"

/**
 * GET /api/auth/youtube/status
 * Returns the current YouTube connection status
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from("youtube_connections")
      .select("channel_id, channel_title, channel_thumbnail, token_expires_at, updated_at")
      .eq("id", "default")
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      console.error("Error fetching YouTube connection:", error)
      return NextResponse.json({ connected: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ connected: false })
    }

    // Check if token is expired
    const isExpired = new Date(data.token_expires_at) < new Date()

    return NextResponse.json({
      connected: true,
      channel: {
        id: data.channel_id,
        title: data.channel_title,
        thumbnail: data.channel_thumbnail,
      },
      tokenExpired: isExpired,
      lastUpdated: data.updated_at,
    })
  } catch (err: any) {
    console.error("YouTube status check error:", err)
    return NextResponse.json(
      { connected: false, error: err.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/youtube/status
 * Disconnects the YouTube account
 */
export async function DELETE() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from("youtube_connections")
      .delete()
      .eq("id", "default")

    if (error) {
      console.error("Error disconnecting YouTube:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("YouTube disconnect error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
