import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set' },
        { status: 500 }
      );
    }

    // Revert to the requested preview model now that billing is enabled
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

    // For image generation models in the Gemini family, standard generateContent is often used 
    // but the response structure contains the image data. 
    // NOTE: If this is a pure text-to-image model via the Generative AI SDK, 
    // we expect it to return inline data or a similar structure.

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // There are different ways the API might return the image. 
    // Usually it's in candidates[0].content.parts[0].inlineData
    // We will attempt to parse it assuming it returns standard Gemini structure

    // Check if we have parts
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates returned from Gemini');
    }

    const parts = candidates[0].content.parts;
    const firstPart = parts[0];

    // If inlineData is present (base64)
    if (firstPart.inlineData) {
      const mimeType = firstPart.inlineData.mimeType;
      const data = firstPart.inlineData.data;
      // Construct a data URL
      const dataUrl = `data:${mimeType};base64,${data}`;

      return NextResponse.json({
        success: true,
        imageUrl: dataUrl
      });
    }

    // Fallback/Validation: If it didn't return an image in the expected format
    console.log('Unexpected response structure:', JSON.stringify(response, null, 2));

    return NextResponse.json(
      { error: 'Generation successful but no image data found in response' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('Gemini Image Gen Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
