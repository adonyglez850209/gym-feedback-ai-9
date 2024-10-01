import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const fileUrl = process.env.BLOB_MODEL_PROCESS || "";

        const response = await fetch(fileUrl, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error('Error al descargar el archivo');
        }

        const fileBlob = await response.blob();

        return NextResponse.json({
            status: 200,
            modelURL: URL.createObjectURL(fileBlob)
        });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}