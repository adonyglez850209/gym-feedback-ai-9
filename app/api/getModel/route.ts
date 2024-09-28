// app/api/model/route.js
import { NextResponse } from "next/server";

export async function GET(request: Request) {

    const apiUrl = process.env.NEXT_PUBLIC_UPLOADTHING_URL || "";
    const apiKey = process.env.UPLOADTHING_API_KEY || "";

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch the model file 1');
        }

        const modelBlob = await response.blob();
        const modelUrl = URL.createObjectURL(modelBlob);

        return NextResponse.json({ message: "Model fetched successfully", modelUrl });
    } catch (error) {
        console.error("Error fetching model:", error);
        return NextResponse.json({ message: "Error fetching model", error: error }, { status: 500 });
    }
}
