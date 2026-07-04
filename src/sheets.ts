import GoogleAuth, { GoogleKey } from './google-auth.ts';


export async function sheetsGet(range: string, env: Env): Promise<any[][]> {
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);
    const oauth = new GoogleAuth(googleAuth, ['https://www.googleapis.com/auth/spreadsheets']);
    const accessToken = await oauth.getGoogleAuthToken();

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}`, {
        method: "GET",
        headers: {Authorization: `Bearer ${accessToken}`}
    });
    if (!response.ok) {throw new Error(await response.text());}
    const data = await response.json();
    return data.values ?? [];
}


export async function sheetsSet(range: string, values: any[][], env: Env): Promise<Response> {
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);
    const oauth = new GoogleAuth(googleAuth, ['https://www.googleapis.com/auth/spreadsheets']);
    const accessToken = await oauth.getGoogleAuthToken();

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"},
        body: JSON.stringify({values})
    });
    if (!response.ok) {throw new Error(await response.text());}
    return await response;
}
