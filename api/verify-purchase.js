// Vercel Serverless Function: Verify Paddle Purchase
// Endpoint: /api/verify-purchase
// Method: POST
// Body: { email: "customer@example.com" }

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    console.error('PADDLE_API_KEY environment variable not set');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    // Query Paddle API for transactions with this email
    // Paddle Billing API v1 endpoint
    const paddleUrl = new URL('https://api.paddle.com/transactions');
    paddleUrl.searchParams.set('customer_email', email.toLowerCase().trim());
    paddleUrl.searchParams.set('status', 'completed');

    const response = await fetch(paddleUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paddle API error:', response.status, errorText);
      return res.status(500).json({ success: false, error: 'Unable to verify purchase' });
    }

    const data = await response.json();

    // Check if any completed transactions exist for this email
    if (data.data && data.data.length > 0) {
      // Found at least one completed transaction
      return res.status(200).json({ 
        success: true, 
        message: 'Purchase verified',
        transactionCount: data.data.length
      });
    } else {
      // No transactions found
      return res.status(200).json({ 
        success: false, 
        error: 'No purchase found for this email' 
      });
    }

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
}
