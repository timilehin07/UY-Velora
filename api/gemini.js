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

    // Your Gemini API key
    const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCrzBcmTtgIdtZQqSI7UCcq5dac0gee_Vw"

    // UPDATED: Fixed API endpoint with correct model name and version
    const endpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent"

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

    console.log("Making request to Gemini API with message:", message)

    const response = await fetch(`${endpoint}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("Gemini API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Gemini API Error:", response.status, errorData)
      return res.status(response.status).json({
        error: `Gemini API error: ${response.status} - ${errorData}`,
      })
    }

    const data = await response.json()
    console.log("Gemini API response data:", JSON.stringify(data).substring(0, 200) + "...")

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
