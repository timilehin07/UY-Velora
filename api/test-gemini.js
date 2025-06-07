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

  try {
    const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY"

    // Test different model endpoints to see which one works
    const modelsToTest = [
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent",
    ]

    const testMessage = {
      contents: [{ parts: [{ text: "Hello, respond with just 'OK'" }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 10 },
    }

    const results = []

    for (const endpoint of modelsToTest) {
      try {
        console.log(`Testing endpoint: ${endpoint}`)

        const response = await fetch(`${endpoint}?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testMessage),
        })

        const result = {
          endpoint,
          status: response.status,
          ok: response.ok,
        }

        if (response.ok) {
          const data = await response.json()
          result.success = true
          result.response = data.candidates?.[0]?.content?.parts?.[0]?.text || "No text found"
        } else {
          const errorText = await response.text()
          result.success = false
          result.error = errorText
        }

        results.push(result)

        // If we found a working endpoint, break
        if (response.ok) {
          break
        }
      } catch (error) {
        results.push({
          endpoint,
          success: false,
          error: error.message,
        })
      }
    }

    return res.status(200).json({
      message: "API Key and endpoint test results",
      results,
      workingEndpoint: results.find((r) => r.success)?.endpoint || null,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Test failed",
      details: error.message,
    })
  }
}
