// cloudflare-google-auth.ts
const PEM_HEADER: string = '-----BEGIN PRIVATE KEY-----'
const PEM_FOOTER: string = '-----END PRIVATE KEY-----'

// Simplify binding the env var to a typed object
export interface GoogleKey {
    type: string,
    project_id: string,
    private_key_id: string,
    private_key: string,
    client_email: string,
    client_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_x509_cert_url: string
}

// Inspiration: https://gist.github.com/markelliot/6627143be1fc8209c9662c504d0ff205
//
// GoogleOAuth encapsulates the logic required to retrieve an access token
// for the OAuth flow.
export default class GoogleOAuth {
    constructor(public googleKey: GoogleKey, public scopes: string[]) { }

    public async getGoogleAuthToken(
    ): Promise<string | undefined> {
        const { client_email: user, private_key: key } = this.googleKey
        const scope = this.formatScopes(this.scopes)
        const jwtHeader = this.objectToBase64url({ alg: 'RS256', typ: 'JWT' })

        try {
            const assertiontime = Math.round(Date.now() / 1000)
            const expirytime = assertiontime + 3600
            const claimset = this.objectToBase64url({
                iss: user,
                scope,
                aud: 'https://oauth2.googleapis.com/token',
                exp: expirytime,
                iat: assertiontime,
            })

            const jwtUnsigned = `${jwtHeader}.${claimset}`
            const signedJwt = `${jwtUnsigned}.${await this.sign(jwtUnsigned, key)}`
            const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedJwt}`

            const response = await fetch(this.googleKey.token_uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache',
                    Host: 'oauth2.googleapis.com',
                },
                body,
            })

            const resp = await response.json()
            return resp.access_token
        } catch (err) {
            console.error(err)
            return undefined
        }
    }

    private objectToBase64url(object: object): string {
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(JSON.stringify(object));
        return this.arrayBufferToBase64Url(uint8Array.buffer);
    }

    private arrayBufferToBase64Url(buffer: ArrayBufferLike): string {
        const uint8Array = new Uint8Array(buffer);
        let str = '';
        for (let i = 0; i < uint8Array.length; i++) {
            str += String.fromCharCode(uint8Array[i]);
        }
        return btoa(str)
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    private async sign(content: string, signingKey: string): Promise<string> {
        // Convert content to ArrayBuffer
        const contentArray = new TextEncoder().encode(content);

        const plainKey = signingKey
            .replace(/(\r\n|\n|\r)/gm, '')
            .replace(/\\n/g, '')
            .replace(PEM_HEADER, '')
            .replace(PEM_FOOTER, '')
            .trim()

        // Convert base64 string to binary and then to Uint8Array
        const binaryKey = atob(plainKey)
        const keyArray = new Uint8Array(binaryKey.length)
        for (let i = 0; i < binaryKey.length; i++) {
            keyArray[i] = binaryKey.charCodeAt(i)
        }

        const signer = await crypto.subtle.importKey(
            'pkcs8',
            keyArray,
            {
                name: 'RSASSA-PKCS1-V1_5',
                hash: { name: 'SHA-256' },
            },
            false,
            ['sign'],
        )
        const binarySignature = await crypto.subtle.sign(
            { name: 'RSASSA-PKCS1-V1_5' },
            signer,
            contentArray,
        )
        return this.arrayBufferToBase64Url(binarySignature)
    }

    // formatScopes will create a scopes string that is formatted for the Google API
    private formatScopes(scopes: string[]): string {
        return scopes.join(' ')
    }

}
