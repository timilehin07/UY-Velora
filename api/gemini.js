export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }

    // Get API key from environment variables
    const API_KEY = process.env.GEMINI_API_KEY

    if (!API_KEY) {
      return res.status(500).json({
        error: "API key not configured. Please set GEMINI_API_KEY environment variable.",
      })
    }

    // Replace this line:
    // const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

    // With this updated code:
    const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"]

    let response
    let lastError
    let data

    const requestBody = {
      contents: [
        {
          parts: [{ text: message }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        topP: 0.8,
        topK: 10,
      },
    }

    // Try each model until one works
    for (const modelName of modelNames) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

        console.log(`Trying model: ${modelName}`)

        response = await fetch(`${endpoint}?key=${API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        if (response.ok) {
          console.log(`Success with model: ${modelName}`)
          data = await response.json()
          break // Found a working model
        } else {
          const errorText = await response.text()
          console.log(`Model ${modelName} failed:`, response.status, errorText)
          lastError = errorText
        }
      } catch (error) {
        console.log(`Model ${modelName} error:`, error.message)
        lastError = error.message
      }
    }

    if (!response || !response.ok) {
      console.error("All models failed. Last error:", lastError)
      return res.status(500).json({
        error: "All Gemini models failed",
        details: lastError,
      })
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const aiResponse = data.candidates[0].content.parts[0].text
      return res.status(200).json({ response: aiResponse })
    } else {
      console.error("Invalid response format:", data)
      return res.status(500).json({
        error: "Invalid response format from Gemini API",
        details: data,
      })
    }
  } catch (error) {
    console.error("Server error:", error)
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    })
  }
}
