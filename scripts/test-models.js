require('dotenv').config({ path: '.env' });
const fs = require('fs');

async function listModels() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
      console.log("NO_API_KEY");
      return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
        const modelNames = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", ""));
        
        fs.writeFileSync('available_models.json', JSON.stringify(modelNames, null, 2));
        console.log("Models written to available_models.json");
    } else {
        console.log("NO_MODELS_FOUND");
        fs.writeFileSync('available_models.json', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log("ERROR");
    console.error(error);
  }
}

listModels();
