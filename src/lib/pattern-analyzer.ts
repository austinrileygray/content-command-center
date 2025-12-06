/**
 * Pattern Analyzer
 * Uses Claude AI to analyze high-performing videos and extract patterns
 */

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1'

export interface VideoPattern {
  patternType: 'topic' | 'format' | 'hook' | 'thumbnail' | 'title_structure'
  patternName: string
  patternData: Record<string, any>
  performanceImpact: string
  videoCount: number
  averagePerformanceScore: number
}

export interface TopVideo {
  videoId: string
  title: string
  description: string
  views: number
  likes: number
  comments: number
  engagementRate: number
  performanceScore: number
  publishedAt: string
  tags?: string[]
}

/**
 * Analyze top performing videos and extract patterns using Claude AI
 */
export async function analyzeVideoPatterns(
  apiKey: string,
  topVideos: TopVideo[],
  limit: number = 10
): Promise<VideoPattern[]> {
  if (topVideos.length === 0) {
    return []
  }

  // Prepare video data for Claude
  const videoData = topVideos.slice(0, limit).map(video => ({
    title: video.title,
    description: video.description,
    views: video.views,
    likes: video.likes,
    comments: video.comments,
    engagementRate: video.engagementRate,
    performanceScore: video.performanceScore,
    tags: video.tags || [],
  }))

  const prompt = `You are analyzing ${topVideos.length} high-performing YouTube videos to identify patterns that make them successful.

VIDEO DATA:
${JSON.stringify(videoData, null, 2)}

TASK: Analyze these videos and identify patterns across these categories:
1. **Topics** - What topics/themes appear most frequently?
2. **Title Structures** - What title patterns work best? (e.g., "How I...", "I Analyzed...", "The [Number]...")
3. **Hook Patterns** - What hook structures grab attention?
4. **Formats** - What content formats perform best? (solo, interview, tutorial, etc.)
5. **Thumbnail Styles** - Based on titles, what thumbnail approaches might work?

For each pattern, provide:
- patternType: one of 'topic', 'title_structure', 'hook', 'format', 'thumbnail'
- patternName: a descriptive name
- patternData: detailed information about the pattern (examples, structure, characteristics)
- performanceImpact: how this pattern affects performance
- videoCount: how many videos use this pattern
- averagePerformanceScore: average performance score for videos with this pattern

Return ONLY a valid JSON array of patterns. Example format:
[
  {
    "patternType": "title_structure",
    "patternName": "How I [Achievement]",
    "patternData": {
      "structure": "How I [verb] [noun]",
      "examples": ["How I Built a $100k Business", "How I Automated My Content"],
      "characteristics": ["Personal achievement", "Specific numbers", "Action-oriented"]
    },
    "performanceImpact": "High - Personal achievement stories with specific numbers perform 2x better",
    "videoCount": 3,
    "averagePerformanceScore": 87.5
  }
]

Return ONLY the JSON array, no other text.`

  try {
    // Try latest models first, fallback to older if needed
    const modelsToTry = [
      "claude-opus-4-5-20251101",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620",
    ]

    let lastError: any = null
    let response: Response | null = null
    let data: any = null

    for (const model of modelsToTry) {
      try {
        response = await fetch(`${ANTHROPIC_API_BASE}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 8000,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        })

        if (response.ok) {
          data = await response.json()
          break
        } else {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: { message: errorText } }
          }
          lastError = errorData
          console.log(`❌ Model ${model} failed:`, errorData.error?.message)
        }
      } catch (error: any) {
        lastError = error
        console.log(`❌ Model ${model} threw error:`, error.message)
      }
    }

    if (!data || !response || !response.ok) {
      throw new Error(lastError?.error?.message || "Failed to analyze patterns")
    }

    const content = data.content[0].text

    // Parse JSON from response
    let patterns: VideoPattern[]
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        patterns = JSON.parse(jsonMatch[0])
      } else {
        patterns = JSON.parse(content)
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", parseError)
      throw new Error("Failed to parse pattern analysis response")
    }

    return patterns
  } catch (error: any) {
    console.error("Pattern analysis error:", error)
    throw error
  }
}


