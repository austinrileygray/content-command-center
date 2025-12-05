"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Upload,
  Image as ImageIcon,
  User,
  Sparkles,
  Palette,
  Trash2,
  Download,
  Loader2,
  Plus,
  Check,
  X,
  Wand2,
  Grid3X3,
} from "lucide-react"
import { toast } from "sonner"
import { ThumbnailIngredient, GeneratedThumbnail, IngredientType } from "@/types/database"

interface ThumbnailsClientProps {
  initialIngredients: ThumbnailIngredient[]
  initialGenerations: GeneratedThumbnail[]
  initialPrompt?: string
  contentIdeaId?: string
}

const ingredientTypeConfig: Record<IngredientType, { label: string; icon: any; color: string }> = {
  face: { label: "Face/Person", icon: User, color: "bg-blue-500/20 text-blue-400" },
  inspiration: { label: "Inspiration", icon: Sparkles, color: "bg-purple-500/20 text-purple-400" },
  logo: { label: "Logo", icon: Grid3X3, color: "bg-green-500/20 text-green-400" },
  background: { label: "Background", icon: ImageIcon, color: "bg-yellow-500/20 text-yellow-400" },
  other: { label: "Other", icon: Palette, color: "bg-gray-500/20 text-gray-400" },
}

const aspectRatios = [
  { value: "16:9", label: "16:9 (YouTube)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "9:16", label: "9:16 (Vertical)" },
]

const thumbnailStyles = [
  { value: "default", label: "Default" },
  { value: "bold-text", label: "Bold Text Focus" },
  { value: "minimal", label: "Minimal/Clean" },
  { value: "dramatic", label: "Dramatic/High Contrast" },
  { value: "colorful", label: "Colorful/Vibrant" },
  { value: "professional", label: "Professional/Corporate" },
]

export function ThumbnailsClient({ initialIngredients, initialGenerations, initialPrompt, contentIdeaId }: ThumbnailsClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ingredients state
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())
  const [uploadingIngredient, setUploadingIngredient] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadName, setUploadName] = useState("")
  const [uploadType, setUploadType] = useState<IngredientType>("inspiration")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)

  // Generation state
  const [generations, setGenerations] = useState(initialGenerations)
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt || "")
  const [style, setStyle] = useState("default")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [ideaId] = useState(contentIdeaId)

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload ingredient
  const uploadIngredient = async () => {
    if (!uploadFile || !uploadName || !uploadType) {
      toast.error("Please fill in all fields")
      return
    }

    setUploadingIngredient(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("name", uploadName)
      formData.append("type", uploadType)

      const response = await fetch("/api/thumbnails/ingredients", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload")
      }

      setIngredients([data.ingredient, ...ingredients])
      toast.success("Ingredient uploaded!")
      setShowUploadDialog(false)
      resetUploadForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to upload ingredient")
    } finally {
      setUploadingIngredient(false)
    }
  }

  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadPreview(null)
    setUploadName("")
    setUploadType("inspiration")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Delete ingredient
  const deleteIngredient = async (id: string) => {
    if (!confirm("Delete this ingredient?")) return

    try {
      const response = await fetch("/api/thumbnails/ingredients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      setIngredients(ingredients.filter((i) => i.id !== id))
      setSelectedIngredients((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success("Ingredient deleted")
    } catch (error: any) {
      toast.error("Failed to delete ingredient")
    }
  }

  // Toggle ingredient selection
  const toggleIngredient = (id: string) => {
    setSelectedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= 14) {
          toast.error("Maximum 14 ingredients can be selected")
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  // Generate thumbnail
  const generateThumbnail = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setGenerating(true)
    setGeneratedImage(null)

    try {
      const response = await fetch("/api/thumbnails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          ingredientIds: Array.from(selectedIngredients),
          aspectRatio,
          style,
          contentIdeaId: ideaId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate thumbnail")
      }

      setGeneratedImage(data.imageUrl || `data:${data.mimeType};base64,${data.imageBase64}`)
      toast.success("Thumbnail generated!")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to generate thumbnail")
    } finally {
      setGenerating(false)
    }
  }

  // Download generated image
  const downloadImage = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `thumbnail-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients Library</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-6">
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-brand" />
                  Thumbnail Settings
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Describe your thumbnail</Label>
                    <Textarea
                      id="prompt"
                      placeholder="E.g., A surprised face looking at a pile of money with bold text saying 'I Made $10K in One Day'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              {ratio.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          {thumbnailStyles.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Selected Ingredients */}
              <Card className="p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-brand" />
                    Selected Ingredients ({selectedIngredients.size}/14)
                  </h3>
                </div>

                {selectedIngredients.size === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Select ingredients from the library to include reference images (faces, inspiration, logos)
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from(selectedIngredients).map((id) => {
                      const ingredient = ingredients.find((i) => i.id === id)
                      if (!ingredient) return null
                      return (
                        <div
                          key={id}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                        >
                          <img
                            src={ingredient.file_url}
                            alt={ingredient.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => toggleIngredient(id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Quick select from library:</p>
                  <div className="flex flex-wrap gap-2">
                    {ingredients.slice(0, 8).map((ingredient) => (
                      <button
                        key={ingredient.id}
                        onClick={() => toggleIngredient(ingredient.id)}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedIngredients.has(ingredient.id)
                            ? "border-brand ring-2 ring-brand/30"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <img
                          src={ingredient.file_url}
                          alt={ingredient.name}
                          className="w-full h-full object-cover"
                        />
                        {selectedIngredients.has(ingredient.id) && (
                          <div className="absolute inset-0 bg-brand/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <Button
                onClick={generateThumbnail}
                disabled={generating || !prompt.trim()}
                className="w-full bg-brand hover:bg-brand/90 h-12 text-lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Thumbnail
                  </>
                )}
              </Button>
            </div>

            {/* Right: Preview */}
            <div>
              <Card className="p-6 bg-card border-border h-full">
                <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>

                {generatedImage ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-secondary">
                      <img
                        src={generatedImage}
                        alt="Generated thumbnail"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadImage} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setGeneratedImage(null)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/30">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Your generated thumbnail will appear here
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Ingredients Tab */}
        <TabsContent value="ingredients" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ingredients Library</h3>
              <p className="text-sm text-muted-foreground">
                Upload faces, inspiration thumbnails, logos, and more
              </p>
            </div>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-brand hover:bg-brand/90">
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Ingredient</DialogTitle>
                  <DialogDescription>
                    Add a new image to your ingredients library
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadPreview ? (
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="max-h-40 mx-auto rounded"
                        />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ingredient-name">Name</Label>
                    <Input
                      id="ingredient-name"
                      placeholder="E.g., My Headshot, MrBeast Style Thumbnail"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={uploadType} onValueChange={(v) => setUploadType(v as IngredientType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ingredientTypeConfig).map(([type, config]) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={uploadIngredient}
                    disabled={uploadingIngredient || !uploadFile || !uploadName}
                    className="w-full bg-brand hover:bg-brand/90"
                  >
                    {uploadingIngredient ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Ingredient
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Ingredients Grid */}
          {ingredients.length === 0 ? (
            <Card className="p-12 bg-card border-border">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-secondary mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No ingredients yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Upload your face, inspiration thumbnails, logos, and other images to use when generating thumbnails.
                </p>
                <Button onClick={() => setShowUploadDialog(true)} className="gap-2 bg-brand hover:bg-brand/90">
                  <Plus className="w-4 h-4" />
                  Add Your First Ingredient
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {ingredients.map((ingredient) => {
                const typeConfig = ingredientTypeConfig[ingredient.type]
                const Icon = typeConfig?.icon || ImageIcon

                return (
                  <Card
                    key={ingredient.id}
                    className={`group relative overflow-hidden bg-card border-border hover:border-muted-foreground transition-all cursor-pointer ${
                      selectedIngredients.has(ingredient.id) ? "ring-2 ring-brand" : ""
                    }`}
                    onClick={() => toggleIngredient(ingredient.id)}
                  >
                    <div className="aspect-square">
                      <img
                        src={ingredient.file_url}
                        alt={ingredient.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <Badge className={typeConfig?.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {typeConfig?.label}
                        </Badge>
                        {selectedIngredients.has(ingredient.id) && (
                          <Check className="w-4 h-4 text-brand" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mt-2 truncate">
                        {ingredient.name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteIngredient(ingredient.id)
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Generation History</h3>

          {generations.length === 0 ? (
            <Card className="p-12 bg-card border-border">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-secondary mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No generations yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your generated thumbnails will appear here.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((gen) => (
                <Card key={gen.id} className="overflow-hidden bg-card border-border">
                  <div className="aspect-video bg-secondary">
                    {gen.result_url ? (
                      <img
                        src={gen.result_url}
                        alt={gen.prompt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {gen.status === "generating" ? (
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : gen.status === "failed" ? (
                          <X className="w-6 h-6 text-red-500" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-foreground line-clamp-2">{gen.prompt}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        variant="outline"
                        className={
                          gen.status === "completed"
                            ? "text-green-400"
                            : gen.status === "failed"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }
                      >
                        {gen.status}
                      </Badge>
                      {gen.result_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={gen.result_url} download>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
