import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Replace this URL with your actual n8n webhook URL
    const n8nWebhookUrl = 'https://sabbirsami.app.n8n.cloud/webhook-test/sheets';

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Remove the nested 'body' structure - send the message directly
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed with status: ${response.status}`);
    }

    const data = await response.text();

    // Try to parse as JSON first (for structured responses)
    let parsedData;
    try {
      parsedData = JSON.parse(data);

      // Handle n8n response structure with 'output' field
      if (parsedData.output) {
        // Extract JSON from markdown code block if present
        let jsonString = parsedData.output;
        if (jsonString.includes('```json')) {
          jsonString = jsonString.replace(/```json\n?/, '').replace(/\n?```$/, '');
        }

        try {
          const extractedData = JSON.parse(jsonString);
          if (extractedData.entries) {
            return NextResponse.json({
              content: `Found ${extractedData.entries.length} Instagram entries:`,
              entries: extractedData.entries,
            });
          }
        } catch (innerError) {
          console.error('Error parsing extracted JSON:', innerError);
          return NextResponse.json({
            content: parsedData.output || 'Received response from workflow',
          });
        }
      }

      // If the response contains entries directly, return them structured
      if (parsedData.entries) {
        return NextResponse.json({
          content: `Found ${parsedData.entries.length} Instagram entries:`,
          entries: parsedData.entries,
        });
      }
    } catch (e) {
      // If not JSON, treat as plain text
      parsedData = { content: data };
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error),
      },
      { status: 500 },
    );
  }
}
