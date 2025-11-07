import { Controller, Get, Query, Res, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { HubSpotAuthService } from './hubspot-auth.service'
import { ContactsService } from '../crm/contacts/contacts.service'

@Controller('hubspot/auth')
export class HubSpotAuthController {
    private readonly logger = new Logger(HubSpotAuthController.name)

    constructor(
        private readonly authService: HubSpotAuthService,
        private readonly contactsService: ContactsService,
    ) { }

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
    async callback(
        @Query('code') code: string,
        @Res() res: Response,
    ): Promise<void> {
        if (!code) {
            this.logger.error('No se recibió código de autorización')
            res.status(400).json({
                success: false,
                message: 'Código de autorización no recibido',
            })
            return
        }

        try {
            this.logger.log(
                'Código de autorización recibido, intercambiando...',
            )

            // Intercambiar código por token
            await this.authService.exchangeCodeForToken(code)

            // Iniciar proceso ETL automáticamente
            this.logger.log('Iniciando proceso ETL de contactos...')
            const result = await this.contactsService.syncContactsFromHubSpot()

            res.status(200).json({
                success: true,
                message: 'Autenticación exitosa y ETL completado',
                data: {
                    contactsSynced: result.synced,
                    contactsUpdated: result.updated,
                    contactsFailed: result.failed,
                    totalProcessed: result.total,
                },
            })
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(
                'Error en el proceso de autenticación/ETL',
                errorMessage,
            )
            res.status(500).json({
                success: false,
                message: 'Error en el proceso de autenticación/ETL',
                error: errorMessage,
            })
        }
    }

    /**
     * Endpoint para verificar el estado de autenticación
     */
    @Get('status')
    getStatus() {
        const hasToken = this.authService.hasValidToken()
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
            if (!this.authService.hasValidToken()) {
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
