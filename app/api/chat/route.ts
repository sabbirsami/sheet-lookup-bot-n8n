/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server';

interface InstagramEntry {
  date?: string;
  instagram_account?: string;
  email?: string;
  telegram_username?: string;
  country?: string;
  followers?: number;
  post_type?: string;
  reward_status?: string;
  engagement_rate?: string;
  language?: string;
  age?: number;
  gender?: string;
  platform_joined?: string;
  bio_category?: string;
  verification_status?: string;
  payment_amount?: string;
  submission_time?: string;
  review_date?: string;
  reviewer_notes?: string;
}

interface ApiResponse {
  results?: InstagramEntry[];
  total_found?: number;
  message?: string;
  summary?: any;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Use your actual n8n webhook URL
    const n8nWebhookUrl = 'https://sabbirsami.app.n8n.cloud/webhook/chat';

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        query: message,
        text: message,
      }),
    });

    if (!response.ok) {
      console.error(`n8n webhook failed with status: ${response.status}`);
      return NextResponse.json(
        {
          content: `Sorry, the service is temporarily unavailable (${response.status}). Please try again in a moment.`,
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
      // If it's plain text and looks like it might be JSON, try to extract it
      const jsonMatch = data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (jsonError) {
          return NextResponse.json({
            content: data,
          });
        }
      } else {
        return NextResponse.json({
          content: data,
        });
      }
    }

    console.log('Parsed n8n data:', parsedData);

    // Handle the n8n agent response format
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

          // Handle the results structure
          if (extractedJson.results && Array.isArray(extractedJson.results)) {
            const resultCount = extractedJson.total_found || extractedJson.results.length;

            return NextResponse.json({
              content: extractedJson.message || `Found ${resultCount} Instagram entries:`,
              data: {
                results: extractedJson.results,
                total_found: resultCount,
                summary: extractedJson.summary,
              },
            });
          }

          // Handle summary/analytics responses
          if (extractedJson.summary) {
            return NextResponse.json({
              content: extractedJson.message || "Here's the analysis:",
              data: extractedJson,
            });
          }

          // Handle other JSON structures
          return NextResponse.json({
            content: extractedJson.message || 'Here are the results:',
            data: extractedJson,
          });
        } catch (jsonError) {
          console.error('Error parsing extracted JSON:', jsonError);
          // If JSON parsing fails, clean up the text
          const cleanContent = content
            .replace(/```json[\s\S]*?```/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .trim();
          return NextResponse.json({
            content: cleanContent || parsedData.output,
          });
        }
      } else {
        // Check if the content itself is JSON (without code blocks)
        try {
          const directJson = JSON.parse(content);
          if (directJson.results && Array.isArray(directJson.results)) {
            return NextResponse.json({
              content: directJson.message || `Found ${directJson.results.length} results:`,
              data: directJson,
            });
          }
          return NextResponse.json({
            content: directJson.message || 'Here are the results:',
            data: directJson,
          });
        } catch (e) {
          // Not JSON, return as plain text
          return NextResponse.json({
            content: parsedData.output,
          });
        }
      }
    }

    // Handle direct results structure (without output wrapper)
    if (parsedData.results && Array.isArray(parsedData.results)) {
      return NextResponse.json({
        content: parsedData.message || `Found ${parsedData.results.length} Instagram entries:`,
        data: {
          results: parsedData.results,
          total_found: parsedData.total_found || parsedData.results.length,
          summary: parsedData.summary,
        },
      });
    }

    // Handle summary/analytics without results array
    if (parsedData.summary) {
      return NextResponse.json({
        content: parsedData.message || "Here's the analysis:",
        data: parsedData,
      });
    }

    // Handle simple message responses
    if (parsedData.content || parsedData.message) {
      return NextResponse.json({
        content: parsedData.content || parsedData.message,
        data: parsedData.data,
      });
    }

    // Fallback - return whatever we got
    return NextResponse.json({
      content: typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData, null, 2),
      data: typeof parsedData === 'object' ? parsedData : undefined,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      {
        content:
          "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}
