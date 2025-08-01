import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Use your actual n8n webhook URL
    const n8nWebhookUrl = 'https://sabbirsami.app.n8n.cloud/webhook-test/chat';

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
      console.error(`n8n webhook failed with status: ${response.status}`);
      return NextResponse.json(
        {
          content: `Sorry, the webhook service returned an error (${response.status}). Please try again.`,
        },
        { status: 500 },
      );
    }

    const data = await response.text();
    console.log('Raw n8n response:', data);

    // Try to parse as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.log('Response is not JSON, treating as plain text');
      return NextResponse.json({
        content: data,
      });
    }

    console.log('Parsed n8n data:', parsedData);

    // Handle the exact format you showed: { "output": "```json\n{...}\n```" }
    if (parsedData.output) {
      const content = parsedData.output;

      // Extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
      if (jsonMatch) {
        try {
          const jsonString = jsonMatch[1].trim();
          console.log('Extracted JSON string:', jsonString);

          const extractedJson = JSON.parse(jsonString);
          console.log('Parsed extracted JSON:', extractedJson);

          // Handle the results structure you showed
          if (extractedJson.results && Array.isArray(extractedJson.results)) {
            const resultCount = extractedJson.total_found || extractedJson.results.length;

            return NextResponse.json({
              content: `Found ${resultCount} results:`,
              data: {
                results: extractedJson.results,
                total_found: resultCount,
              },
            });
          }

          // Handle other JSON structures
          return NextResponse.json({
            content: 'Here are the results:',
            data: extractedJson,
          });
        } catch (jsonError) {
          console.error('Error parsing extracted JSON:', jsonError);
          // If JSON parsing fails, just show the text without code blocks
          const cleanContent = content.replace(/```json[\s\S]*?```/g, '').trim();
          return NextResponse.json({
            content: cleanContent || parsedData.output,
          });
        }
      } else {
        // No JSON code block found, return the output as is
        return NextResponse.json({
          content: parsedData.output,
        });
      }
    }

    // Handle other response structures
    if (parsedData.results) {
      return NextResponse.json({
        content: `Found ${parsedData.results.length} results:`,
        data: parsedData,
      });
    }

    if (parsedData.content || parsedData.message) {
      return NextResponse.json({
        content: parsedData.content || parsedData.message,
      });
    }

    // Fallback - return whatever we got
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
