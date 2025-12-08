"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  thumbnail?: string | null
  autoPlay?: boolean
  controls?: boolean
  className?: string
}

export function VideoPlayer({ 
  src, 
  thumbnail, 
  autoPlay = false, 
  controls = true,
  className 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [showThumbnail, setShowThumbnail] = useState(!!thumbnail)

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play()
    }
  }, [autoPlay])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
      setShowThumbnail(false)
    }
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {showThumbnail && thumbnail && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <img 
            src={thumbnail} 
            alt="Video thumbnail" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="z-20 rounded-full w-16 h-16"
            variant="secondary"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        controls={controls}
        className="w-full h-full object-contain"
        onPlay={() => {
          setIsPlaying(true)
          setShowThumbnail(false)
        }}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  )
}









