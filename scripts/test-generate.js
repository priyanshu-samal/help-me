require('dotenv').config({ path: '.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testModel(modelName) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.log("No API Key");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    console.log(`Testing ${modelName}...`);
    const result = await model.generateContent("Hello");
    const response = await result.response;
    console.log(`SUCCESS: ${modelName} works! Response: ${response.text()}`);
    return true;
  } catch (error) {
    console.log(`FAILED: ${modelName} - ${error.message}`);
    return false;
  }
}

async function runTests() {
  const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro-001"
  ];

  for (const candidate of candidates) {
    const success = await testModel(candidate);
    if (success) break; // Stop after finding the first working one
  }
}

runTests();
