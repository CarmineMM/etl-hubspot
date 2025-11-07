import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { HubSpotAuthService } from './hubspot-auth.service'

export interface HubSpotContact {
    id: string
    properties: {
        createdate: string
        email: string
        firstname: string
        lastname: string
        hs_object_id: string
        lastmodifieddate: string
        [key: string]: string
    }
    createdAt: string
    updatedAt: string
    archived: boolean
}

export interface HubSpotContactsResponse {
    results: HubSpotContact[]
    paging?: {
        next?: {
            after: string
        }
    }
}

@Injectable()
export class HubSpotApiService {
    private readonly logger = new Logger(HubSpotApiService.name)
    private readonly baseUrl = 'https://api.hubapi.com'

    constructor(private readonly authService: HubSpotAuthService) {}

    /**
     * Obtiene todos los contactos de HubSpot (con paginación)
     */
    async getAllContacts(): Promise<HubSpotContact[]> {
        const allContacts: HubSpotContact[] = []
        let after: string | undefined = undefined

        try {
            do {
                const response = await this.fetchContactsPage(after)
                allContacts.push(...response.results)

                after = response.paging?.next?.after
                this.logger.log(
                    `Obtenidos ${response.results.length} contactos. Total: ${allContacts.length}`,
                )
            } while (after)

            this.logger.log(
                `Extracción completa: ${allContacts.length} contactos totales`,
            )
            return allContacts
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(
                'Error al obtener contactos de HubSpot',
                errorMessage,
            )
            throw new Error('Error al obtener contactos de HubSpot')
        }
    }

    /**
     * Obtiene una página de contactos
     */
    private async fetchContactsPage(
        after?: string,
    ): Promise<HubSpotContactsResponse> {
        this.logger.log('Obteniendo token de acceso válido...')
        const accessToken = await this.authService.getValidAccessToken()
        this.logger.log('Token de acceso obtenido correctamente')

        const params: Record<string, string> = {
            limit: '100',
            properties: 'email,firstname,lastname,createdate,lastmodifieddate',
        }

        if (after) {
            params.after = after
            this.logger.log(
                `Solicitando página de contactos después del ID: ${after}`,
            )
        } else {
            this.logger.log('Solicitando primera página de contactos')
        }

        const response = await axios.get<HubSpotContactsResponse>(
            `${this.baseUrl}/crm/v3/objects/contacts`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params,
            },
        )

        return response.data
    }

    /**
     * Obtiene un contacto específico por ID
     */
    async getContactById(contactId: string): Promise<HubSpotContact> {
        const accessToken = await this.authService.getValidAccessToken()

        try {
            const response = await axios.get<HubSpotContact>(
                `${this.baseUrl}/crm/v3/objects/contacts/${contactId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            )

            return response.data
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(
                `Error al obtener contacto ${contactId}`,
                errorMessage,
            )
            throw new Error(`Error al obtener contacto ${contactId}`)
        }
    }
}
