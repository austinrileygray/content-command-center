import { NextRequest, NextResponse } from "next/server"
import { getSubmagicClient } from "@/lib/submagic"

/**
 * GET /api/submagic/templates
 * Fetch available Submagic caption templates dynamically
 */
export async function GET(request: NextRequest) {
  try {
    const submagic = getSubmagicClient()
    const templatesResponse = await submagic.getTemplates()

    // Return templates as array of options
    const templates = templatesResponse.templates || []
    
    // Format with descriptions if available
    const formattedTemplates = templates.map(template => ({
      value: template,
      label: template,
      description: `Submagic ${template} style template`,
    }))

    return NextResponse.json({
      success: true,
      templates: formattedTemplates,
    })
  } catch (error: any) {
    console.error("Failed to fetch Submagic templates:", error)
    
    // Fallback to hardcoded templates if API fails
    return NextResponse.json({
      success: true,
      templates: [
        { value: "Hormozi 1", label: "Hormozi Style 1", description: "Bold, high-contrast captions" },
        { value: "Hormozi 2", label: "Hormozi Style 2", description: "Clean professional look" },
        { value: "Beast", label: "MrBeast Style", description: "Energetic, colorful captions" },
        { value: "Ali", label: "Ali Abdaal Style", description: "Minimal, educational look" },
        { value: "Sara", label: "Sara (Default)", description: "Balanced, versatile style" },
      ],
      fallback: true,
    })
  }
}









