import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";

interface InstaCharterSendRequest {
  owner: {
    id: string;
  };
  choices?: Array<{
    price: string;
    category: string;
    tailId: number;
  }>;
  haves?: number[];
  journey: Array<{
    depTime: string; // ISO datetime
    pax: number;
    from: {
      lat: number;
      long: number;
      name: string;
      timeZone: string;
    };
    to: {
      lat: number;
      long: number;
      name: string;
      timeZone: string;
    };
  }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: InstaCharterSendRequest = await request.json();

    // Validate required fields
    if (
      !body.owner?.id ||
      !body.journey ||
      !body.customer?.name ||
      !body.customer?.email
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: owner.id, journey, customer.name, customer.email",
        },
        { status: 400 },
      );
    }

    // Get InstaCharter API configuration
    const apiKey = process.env.INSTACHARTER_API_KEY;
    const baseUrl =
      process.env.INSTACHARTER_BASE_URL ||
      "https://server.instacharter.app/api/Markets";
    const clientId = process.env.INSTACHARTER_CLIENT_ID || body.owner.id;

    if (!apiKey) {
      return NextResponse.json(
        { error: "InstaCharter API not configured" },
        { status: 500 },
      );
    }

    // Prepare request payload
    const payloadToSend = {
      owner: {
        id: clientId,
      },
      choices: body.choices || [],
      haves: body.haves || [],
      journey: body.journey,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        message: body.customer.message,
      },
    };

    console.log(
      "Sending request to InstaCharter:",
      JSON.stringify(payloadToSend, null, 2),
    );

    // Send request to InstaCharter
    const response = await fetch(`${baseUrl}/Sendrequest`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadToSend),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("InstaCharter API error:", data);
      return NextResponse.json(
        {
          error: "Failed to send request to InstaCharter",
          details: data,
        },
        { status: response.status },
      );
    }

    console.log("InstaCharter response:", data);

    // Log activity
    // Note: You might want to create a specific activity log for this
    // await prisma.activityLog.create({
    //   data: {
    //     action: "INSTACHARTER_SEND_REQUEST",
    //     targetType: "InstaCharter",
    //     targetId: body.customer.email,
    //     adminId: payload.sub,
    //     description: `Sent charter request to InstaCharter for ${body.customer.name}`,
    //     ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    //     metadata: payloadToSend,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: "Request sent successfully to InstaCharter",
      data: data,
    });
  } catch (error: any) {
    console.error("InstaCharter SendRequest error:", error);
    return NextResponse.json(
      {
        error: "Failed to send request",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
