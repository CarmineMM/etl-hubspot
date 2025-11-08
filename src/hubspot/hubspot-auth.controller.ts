import { Controller, Get, Query, Res, Logger, HttpCode } from '@nestjs/common'
import type { Response } from 'express'
import { HubSpotAuthService } from './hubspot-auth.service'
import { ContactsService } from '../crm/contacts/contacts.service'

@Controller('hubspot/auth')
export class HubSpotAuthController {
    private readonly logger = new Logger(HubSpotAuthController.name)

    constructor(
        private readonly authService: HubSpotAuthService,
        private readonly contactsService: ContactsService,
    ) {}

    /**
     * Endpoint para iniciar el flujo de OAuth
     * El usuario debe visitar esta URL para autorizar la aplicación
     */
    @Get('authorize')
    authorize(@Res() res: Response): void {
        const authUrl = this.authService.getAuthorizationUrl()
        this.logger.log('Redirigiendo a HubSpot para autorización')
        return res.redirect(authUrl)
    }

    /**
     * Endpoint de callback de OAuth
     * HubSpot redirige aquí después de que el usuario autoriza
     */
    @Get('callback')
    @HttpCode(200)
    async callback(@Query('code') code: string): Promise<{
        success: boolean
        message: string
        data?: any
        statusCode?: number
        error?: string
    }> {
        this.logger.log('Código de autorización recibido, intercambiando...')
        this.logger.debug(
            `Código recibido: ${code ? '***' + code.slice(-8) : 'No proporcionado'}`,
        )

        if (!code) {
            const errorMsg = 'No se recibió el código de autorización en la URL'
            this.logger.error(errorMsg)
            return {
                statusCode: 400,
                success: false,
                message: errorMsg,
            }
        }

        try {
            this.logger.log('Iniciando intercambio de código por token...')
            const tokenData = await this.authService.exchangeCodeForToken(code)
            this.logger.log('Token de acceso obtenido exitosamente')
            console.log({ tokenData })

            // Iniciar el proceso ETL
            this.logger.log('Iniciando proceso ETL de contactos...')
            const result = await this.contactsService.syncContactsFromHubSpot()

            this.logger.log('Proceso ETL completado exitosamente')

            return {
                success: true,
                message: 'Autenticación y sincronización completadas',
                data: {
                    ...result,
                    tokenExpiresAt: tokenData.expires_in
                        ? new Date(
                              Date.now() + tokenData.expires_in * 1000,
                          ).toISOString()
                        : 'No disponible',
                },
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Error desconocido'
            this.logger.error(
                'Error en el proceso de autenticación/ETL',
                errorMessage,
            )

            if (error instanceof Error && 'response' in error) {
                this.logger.error(
                    'Detalles del error de la API:',
                    JSON.stringify((error as any).response?.data, null, 2),
                )
            }

            return {
                statusCode: 500,
                success: false,
                message: 'Error en el proceso de autenticación/ETL',
                error: errorMessage,
            }
        }
    }

    /**
     * Endpoint para verificar el estado de autenticación
     */
    @Get('status')
    async getStatus() {
        const hasToken = await this.authService.hasValidToken()
        return {
            authenticated: hasToken,
            message: hasToken
                ? 'Autenticado con HubSpot'
                : 'No autenticado. Visite /hubspot/auth/authorize',
        }
    }

    /**
     * Endpoint manual para iniciar sincronización (requiere autenticación previa)
     */
    @Get('sync')
    async manualSync() {
        try {
            if (!(await this.authService.hasValidToken())) {
                return {
                    success: false,
                    message:
                        'No autenticado. Visite /hubspot/auth/authorize primero',
                }
            }

            this.logger.log('Iniciando sincronización manual de contactos...')
            const result = await this.contactsService.syncContactsFromHubSpot()

            return {
                success: true,
                message: 'Sincronización completada',
                data: {
                    contactsSynced: result.synced,
                    contactsUpdated: result.updated,
                    contactsFailed: result.failed,
                    totalProcessed: result.total,
                },
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            this.logger.error('Error en sincronización manual', errorMessage)
            return {
                success: false,
                message: 'Error en la sincronización',
                error: errorMessage,
            }
        }
    }
}
