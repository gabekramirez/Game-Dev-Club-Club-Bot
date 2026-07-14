import GoogleAuth, { GoogleKey } from './google-auth.ts';


export async function get(range: string, spreadsheet: string, env: Env): Promise<any[][]> {
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);
    const oauth = new GoogleAuth(googleAuth, ['https://www.googleapis.com/auth/spreadsheets']);
    const accessToken = await oauth.getGoogleAuthToken();

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}/values/${range}`, {
        method: "GET",
        headers: {Authorization: `Bearer ${accessToken}`}
    });
    if (!response.ok) {throw new Error(await response.text());}
    const data = await response.json();
    return data.values ?? [];
}


export async function set(range: string, spreadsheet: string, values: any[][], env: Env): Promise<Response> {
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);
    const oauth = new GoogleAuth(googleAuth, ['https://www.googleapis.com/auth/spreadsheets']);
    const accessToken = await oauth.getGoogleAuthToken();

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}/values/${range}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"},
        body: JSON.stringify({values})
    });
    if (!response.ok) {throw new Error(await response.text());}
    return await response;
}


export async function append(range: string, spreadsheet: string, values: any[][], env: Env): Promise<Response> {
    const googleAuth: GoogleKey = JSON.parse(env.GCP_SERVICE_ACCOUNT);
    const oauth = new GoogleAuth(googleAuth, ['https://www.googleapis.com/auth/spreadsheets']);
    const accessToken = await oauth.getGoogleAuthToken();

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
        method: "POST",
        headers: {Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"},
        body: JSON.stringify({values})
    });
    if (!response.ok) {throw new Error(await response.text());}
    return await response;
}
