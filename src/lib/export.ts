export function exportIdeasToCSV(ideas: any[]) {
  const headers = [
    "Title",
    "Status",
    "Format",
    "Hook",
    "Description",
    "Confidence Score",
    "Estimated Length",
    "Created At",
    "Updated At",
  ]

  const rows = ideas.map((idea) => [
    idea.title || "",
    idea.status || "",
    idea.format || "",
    idea.hook || "",
    idea.description || "",
    idea.confidence_score || "",
    idea.estimated_length || "",
    idea.created_at || "",
    idea.updated_at || "",
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `content-ideas-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportIdeasToJSON(ideas: any[]) {
  const dataStr = JSON.stringify(ideas, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `content-ideas-${new Date().toISOString().split("T")[0]}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}



