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
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed with status: ${response.status}`);
    }

    const data = await response.text();

    // Parse the response
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // If not JSON, treat as plain text
      return NextResponse.json({
        content: data,
      });
    }

    // Handle n8n response structure with 'output' field
    if (parsedData.output) {
      let content = parsedData.output;
      let structuredData = null;

      // Check if the output contains JSON in markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[1]);

          // If it's a results structure, extract it
          if (extractedJson.results) {
            structuredData = extractedJson;

            // Create a more natural response message
            if (extractedJson.results.length > 0) {
              const resultCount = extractedJson.total_found || extractedJson.results.length;

              // Determine what type of data we're showing
              const firstResult = extractedJson.results[0];
              let dataType = 'entries';

              if (firstResult.instagram && !firstResult.email && !firstResult.telegram) {
                dataType = 'Instagram accounts';
              } else if (firstResult.email && !firstResult.instagram && !firstResult.telegram) {
                dataType = 'email addresses';
              } else if (firstResult.telegram && !firstResult.instagram && !firstResult.email) {
                dataType = 'Telegram IDs';
              }

              content = `Here are ${resultCount} ${dataType} I found:`;
            } else {
              content = 'No matching entries found.';
            }
          } else {
            // For other JSON structures, just show a generic message
            content = content.replace(/```json[\s\S]*?```/g, '').trim() || 'Here are the results:';
            structuredData = extractedJson;
          }
        } catch (jsonError) {
          console.error('Error parsing extracted JSON:', jsonError);
          // Remove the JSON block and show the remaining text
          content = content.replace(/```json[\s\S]*?```/g, '').trim();
        }
      }

      return NextResponse.json({
        content: content || 'I processed your request.',
        data: structuredData,
      });
    }

    // Handle direct structured responses
    if (parsedData.results || parsedData.entries) {
      const results = parsedData.results || parsedData.entries;
      const count = parsedData.total_found || results.length;

      return NextResponse.json({
        content: `Found ${count} entries:`,
        data: {
          results: results,
          total_found: count,
        },
      });
    }

    // Handle simple text responses
    if (parsedData.content || parsedData.message) {
      return NextResponse.json({
        content: parsedData.content || parsedData.message,
      });
    }

    // Fallback for other response structures
    return NextResponse.json({
      content: JSON.stringify(parsedData, null, 2),
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
