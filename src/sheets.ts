import GoogleAuth, { GoogleKey } from './google-auth.ts';


export async function sheetsGet(query: string, env: Env): Promise<any[][]> {
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);
    const oauth = new GoogleAuth(googleAuth, ['https://www.googleapis.com/auth/spreadsheets']);
    const accessToken = await oauth.getGoogleAuthToken();

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${query}`,
        {
            method: "GET",
            headers: {Authorization: `Bearer ${accessToken}`}
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    const data = await response.json();
    return data.values ?? [];
}
