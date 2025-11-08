import { Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import axios from 'axios'

export interface HubSpotTokenResponse {
    access_token: string
    refresh_token: string
    expires_in: number
}

interface CachedTokenData {
    accessToken: string
    refreshToken: string
    expiresAt: number
}

/**
 * HubSpot Authentication Service
 *
 * Manages OAuth 2.0 authentication flow and token lifecycle for HubSpot API.
 * Uses NestJS cache manager for persistent token storage across application instances.
 *
 * Features:
 * - OAuth 2.0 authorization flow
 * - Automatic token refresh before expiration
 * - Cache-based token persistence
 * - Token validation and lifecycle management
 */
@Injectable()
export class HubSpotAuthService {
    private readonly logger = new Logger(HubSpotAuthService.name)
    private readonly CACHE_KEY = 'hubspot_tokens'

    constructor(
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}

    /**
     * Generates HubSpot OAuth authorization URL
     * @returns Authorization URL for user to grant access
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
     * Exchanges authorization code for access token
     * Stores tokens in cache for application-wide access
     * @param code - Authorization code from OAuth callback
     * @returns Token response with access_token, refresh_token, and expires_in
     */
    async exchangeCodeForToken(code: string): Promise<HubSpotTokenResponse> {
        const clientId =
            this.configService.get<string>('HUBSPOT_CLIENT_ID') ?? ''
        const clientSecret =
            this.configService.get<string>('HUBSPOT_CLIENT_SECRET') ?? ''
        const redirectUri =
            this.configService.get<string>('HUBSPOT_REDIRECT_URI') ?? ''

        this.logger.log('Iniciando intercambio de código por token')
        this.logger.debug(
            `Client ID: ${clientId ? '***' + clientId.slice(-4) : 'No configurado'}`,
        )
        this.logger.debug(`Redirect URI: ${redirectUri}`)

        if (!clientId || !clientSecret || !redirectUri) {
            this.logger.error(
                'Faltan credenciales de HubSpot en la configuración',
            )
            throw new Error('Configuración de HubSpot incompleta')
        }

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

            const expiresAt = Date.now() + response.data.expires_in * 1000

            // Store tokens in cache
            await this.cacheManager.set(this.CACHE_KEY, {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresAt,
            })

            this.logger.log('Token de acceso obtenido exitosamente')
            this.logger.debug(
                `Token expira en: ${new Date(expiresAt).toISOString()}`,
            )
            this.logger.debug(
                `Refresh token: ${response.data.refresh_token ? '***' + response.data.refresh_token.slice(-8) : 'No disponible'}`,
            )
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
     * Retrieves valid access token from cache
     * Automatically refreshes token if expiring within 5 minutes
     * @returns Valid access token
     * @throws Error if no token exists in cache
     */
    async getValidAccessToken(): Promise<string> {
        const cachedData = await this.cacheManager.get<CachedTokenData>(
            this.CACHE_KEY,
        )

        // Si no hay token en cache, lanzar error
        if (!cachedData) {
            this.logger.warn(
                'No hay token de acceso en cache. Se requiere autenticación.',
            )
            throw new Error(
                'No hay token de acceso. Debe autenticarse primero.',
            )
        }

        // Si el token expira en menos de 5 minutos, refrescarlo
        const fiveMinutesInMs = 5 * 60 * 1000
        if (cachedData.expiresAt - Date.now() < fiveMinutesInMs) {
            this.logger.log('El token está por expirar, refrescando...')
            await this.refreshAccessToken()
            const refreshedData = await this.cacheManager.get<CachedTokenData>(
                this.CACHE_KEY,
            )
            return refreshedData!.accessToken
        }

        this.logger.log('Devolviendo token de acceso válido desde cache')
        return cachedData.accessToken
    }

    /**
     * Refreshes access token using refresh token from cache
     * Updates cache with new tokens
     * @throws Error if no refresh token available in cache
     */
    private async refreshAccessToken(): Promise<void> {
        const cachedData = await this.cacheManager.get<CachedTokenData>(
            this.CACHE_KEY,
        )

        if (!cachedData?.refreshToken) {
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
                        refresh_token: cachedData.refreshToken,
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            )

            const expiresAt = Date.now() + response.data.expires_in * 1000

            // Update cache with new tokens
            await this.cacheManager.set(this.CACHE_KEY, {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresAt,
            })

            this.logger.log('Token de acceso refrescado exitosamente')
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            this.logger.error('Error al refrescar token', errorMessage)
            throw new Error('Error al refrescar token de HubSpot')
        }
    }

    /**
     * Checks if valid token exists in cache
     * @returns True if valid non-expired token exists
     */
    async hasValidToken(): Promise<boolean> {
        const cachedData = await this.cacheManager.get<CachedTokenData>(
            this.CACHE_KEY,
        )
        return (
            !!cachedData?.accessToken &&
            !!cachedData?.expiresAt &&
            cachedData.expiresAt > Date.now()
        )
    }
}
