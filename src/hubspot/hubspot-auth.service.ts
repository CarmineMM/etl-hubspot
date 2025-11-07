import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export interface HubSpotTokenResponse {
    access_token: string
    refresh_token: string
    expires_in: number
}

@Injectable()
export class HubSpotAuthService {
    private readonly logger = new Logger(HubSpotAuthService.name)
    private accessToken: string | null = null
    private refreshToken: string | null = null
    private tokenExpiresAt: number | null = null

    constructor(private readonly configService: ConfigService) { }

    /**
     * Genera la URL de autorización de HubSpot
     */
    getAuthorizationUrl(): string {
        const clientId =
            this.configService.get<string>('HUBSPOT_CLIENT_ID') ?? ''
        const redirectUri =
            this.configService.get<string>('HUBSPOT_REDIRECT_URI') ?? ''
        const scopes = this.configService.get<string>('HUBSPOT_SCOPES') ?? ''

        const authUrl = new URL('https://app.hubspot.com/oauth/authorize')
        authUrl.searchParams.append('client_id', clientId)
        authUrl.searchParams.append('redirect_uri', redirectUri)
        authUrl.searchParams.append('scope', scopes)
        console.log(authUrl.toString())


        return authUrl.toString()
    }

    /**
     * Intercambia el código de autorización por un access token
     */
    async exchangeCodeForToken(code: string): Promise<HubSpotTokenResponse> {
        const clientId =
            this.configService.get<string>('HUBSPOT_CLIENT_ID') ?? ''
        const clientSecret =
            this.configService.get<string>('HUBSPOT_CLIENT_SECRET') ?? ''
        const redirectUri =
            this.configService.get<string>('HUBSPOT_REDIRECT_URI') ?? ''

        try {
            const response = await axios.post<HubSpotTokenResponse>(
                'https://api.hubapi.com/oauth/v1/token',
                null,
                {
                    params: {
                        grant_type: 'authorization_code',
                        client_id: clientId,
                        client_secret: clientSecret,
                        redirect_uri: redirectUri,
                        code,
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            )

            this.accessToken = response.data.access_token
            this.refreshToken = response.data.refresh_token
            this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000

            this.logger.log('Token de acceso obtenido exitosamente')
            return response.data
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(
                'Error al intercambiar código por token',
                errorMessage,
            )
            throw new Error('Error al obtener token de HubSpot')
        }
    }

    /**
     * Obtiene un access token válido (refresca si es necesario)
     */
    async getValidAccessToken(): Promise<string> {
        // Si no hay token o está expirado, lanzar error
        if (!this.accessToken || !this.tokenExpiresAt) {
            throw new Error(
                'No hay token de acceso. Debe autenticarse primero.',
            )
        }

        // Si el token expira en menos de 5 minutos, refrescarlo
        if (this.tokenExpiresAt - Date.now() < 5 * 60 * 1000) {
            await this.refreshAccessToken()
        }

        return this.accessToken
    }

    /**
     * Refresca el access token usando el refresh token
     */
    private async refreshAccessToken(): Promise<void> {
        if (!this.refreshToken) {
            throw new Error('No hay refresh token disponible')
        }

        const clientId =
            this.configService.get<string>('HUBSPOT_CLIENT_ID') ?? ''
        const clientSecret =
            this.configService.get<string>('HUBSPOT_CLIENT_SECRET') ?? ''

        try {
            const response = await axios.post<HubSpotTokenResponse>(
                'https://api.hubapi.com/oauth/v1/token',
                null,
                {
                    params: {
                        grant_type: 'refresh_token',
                        client_id: clientId,
                        client_secret: clientSecret,
                        refresh_token: this.refreshToken,
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            )

            this.accessToken = response.data.access_token
            this.refreshToken = response.data.refresh_token
            this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000

            this.logger.log('Token de acceso refrescado exitosamente')
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            this.logger.error('Error al refrescar token', errorMessage)
            throw new Error('Error al refrescar token de HubSpot')
        }
    }

    /**
     * Verifica si hay un token válido
     */
    hasValidToken(): boolean {
        return (
            !!this.accessToken &&
            !!this.tokenExpiresAt &&
            this.tokenExpiresAt > Date.now()
        )
    }
}
