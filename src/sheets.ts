import GoogleAuth, { GoogleKey } from './google-auth.ts';


export async function getFirstCell(env: Env): Promise<string> {
    // Parse the JSON GCP_SERVICE_ACCOUNT secret key
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);

    // Create an instance of GoogleOAuth
    const oauth = new GoogleAuth(googleAuth, ['https://www.googleapis.com/auth/spreadsheets']);

    // Obtain an OAuth access token
    const accessToken = await oauth.getGoogleAuthToken();

    // Make a GET request to the Google Sheets API for Sheet1!A1
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/Sheet1!A1`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        }
    );

    // Return error
    if (!response.ok) {
        const error = await response.text();
        return new Response(error, { status: response.status });
    }

    // Return response
    const data = await response.json();
    return data.values?.[0]?.[0] ?? "";
}
