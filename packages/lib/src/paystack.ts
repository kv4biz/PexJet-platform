const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface PaystackHeaders {
  Authorization: string;
  "Content-Type": string;
}

function getHeaders(): PaystackHeaders {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

interface InitializePaymentParams {
  email: string;
  amount: number; // Amount in kobo (NGN * 100)
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
  subaccount?: string; // For split payments
  bearer?: "account" | "subaccount";
  transactionCharge?: number; // Amount to charge the main account
}

interface InitializePaymentResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  error?: string;
}

/**
 * Initialize a payment transaction
 */
export async function initializePayment(
  params: InitializePaymentParams
): Promise<InitializePaymentResponse> {
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
        subaccount: params.subaccount,
        bearer: params.bearer,
        transaction_charge: params.transactionCharge,
      }),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference,
      };
    }

    return { success: false, error: data.message };
  } catch (error: any) {
    console.error("Paystack initialize error:", error);
    return { success: false, error: error.message };
  }
}

interface VerifyPaymentResponse {
  success: boolean;
  status?: string;
  amount?: number;
  reference?: string;
  paidAt?: string;
  channel?: string;
  error?: string;
}

/**
 * Verify a payment transaction
 */
export async function verifyPayment(
  reference: string
): Promise<VerifyPaymentResponse> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      return {
        success: true,
        status: data.data.status,
        amount: data.data.amount,
        reference: data.data.reference,
        paidAt: data.data.paid_at,
        channel: data.data.channel,
      };
    }

    return {
      success: false,
      status: data.data?.status,
      error: data.message || "Payment not successful",
    };
  } catch (error: any) {
    console.error("Paystack verify error:", error);
    return { success: false, error: error.message };
  }
}

interface CreateSubaccountParams {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge: number; // Percentage to charge (admin cut)
  description?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
}

interface CreateSubaccountResponse {
  success: boolean;
  subaccountCode?: string;
  error?: string;
}

/**
 * Create a subaccount for an operator
 */
export async function createSubaccount(
  params: CreateSubaccountParams
): Promise<CreateSubaccountResponse> {
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        business_name: params.businessName,
        bank_code: params.bankCode,
        account_number: params.accountNumber,
        percentage_charge: params.percentageCharge,
        description: params.description,
        primary_contact_email: params.primaryContactEmail,
        primary_contact_name: params.primaryContactName,
        primary_contact_phone: params.primaryContactPhone,
      }),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        subaccountCode: data.data.subaccount_code,
      };
    }

    return { success: false, error: data.message };
  } catch (error: any) {
    console.error("Paystack create subaccount error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a subaccount
 */
export async function updateSubaccount(
  subaccountCode: string,
  params: Partial<CreateSubaccountParams>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/subaccount/${subaccountCode}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          business_name: params.businessName,
          bank_code: params.bankCode,
          account_number: params.accountNumber,
          percentage_charge: params.percentageCharge,
          description: params.description,
        }),
      }
    );

    const data = await response.json();

    if (data.status) {
      return { success: true };
    }

    return { success: false, error: data.message };
  } catch (error: any) {
    console.error("Paystack update subaccount error:", error);
    return { success: false, error: error.message };
  }
}

interface ListBanksResponse {
  success: boolean;
  banks?: Array<{ code: string; name: string }>;
  error?: string;
}

/**
 * List all Nigerian banks
 */
export async function listBanks(): Promise<ListBanksResponse> {
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        banks: data.data.map((bank: any) => ({
          code: bank.code,
          name: bank.name,
        })),
      };
    }

    return { success: false, error: data.message };
  } catch (error: any) {
    console.error("Paystack list banks error:", error);
    return { success: false, error: error.message };
  }
}

interface ResolveAccountResponse {
  success: boolean;
  accountName?: string;
  accountNumber?: string;
  error?: string;
}

/**
 * Resolve/verify a bank account
 */
export async function resolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<ResolveAccountResponse> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        accountName: data.data.account_name,
        accountNumber: data.data.account_number,
      };
    }

    return { success: false, error: data.message };
  } catch (error: any) {
    console.error("Paystack resolve account error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize payment for charter quote (direct to PexJet)
 */
export async function initializeCharterPayment(params: {
  email: string;
  amountNgn: number;
  reference: string;
  quoteId: string;
  clientName: string;
  callbackUrl: string;
}): Promise<InitializePaymentResponse> {
  return initializePayment({
    email: params.email,
    amount: params.amountNgn * 100, // Convert to kobo
    reference: params.reference,
    callbackUrl: params.callbackUrl,
    metadata: {
      type: "charter",
      quoteId: params.quoteId,
      clientName: params.clientName,
    },
  });
}

/**
 * Initialize payment for empty leg (with split to operator)
 */
export async function initializeEmptyLegPayment(params: {
  email: string;
  amountNgn: number;
  reference: string;
  bookingId: string;
  clientName: string;
  callbackUrl: string;
  operatorSubaccountCode?: string;
  adminChargeNgn?: number;
}): Promise<InitializePaymentResponse> {
  const paymentParams: InitializePaymentParams = {
    email: params.email,
    amount: params.amountNgn * 100,
    reference: params.reference,
    callbackUrl: params.callbackUrl,
    metadata: {
      type: "empty_leg",
      bookingId: params.bookingId,
      clientName: params.clientName,
    },
  };

  // If operator subaccount exists, set up split payment
  if (params.operatorSubaccountCode) {
    paymentParams.subaccount = params.operatorSubaccountCode;
    paymentParams.bearer = "account"; // Main account pays Paystack fees
    if (params.adminChargeNgn) {
      paymentParams.transactionCharge = params.adminChargeNgn * 100;
    }
  }

  return initializePayment(paymentParams);
}

/**
 * Validate Paystack webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");
  return hash === signature;
}
