import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Contact } from './entities/contact.entity'
import {
    HubSpotApiService,
    HubSpotContact,
} from '../../hubspot/hubspot-api.service'

export interface SyncResult {
    synced: number
    updated: number
    failed: number
    total: number
}

@Injectable()
export class ContactsService {
    private readonly logger = new Logger(ContactsService.name)

    constructor(
        @InjectRepository(Contact)
        private readonly contactRepository: Repository<Contact>,
        private readonly hubspotApiService: HubSpotApiService,
    ) {}

    /**
     * Sincroniza contactos desde HubSpot a la base de datos
     */
    async syncContactsFromHubSpot(): Promise<SyncResult> {
        const result: SyncResult = {
            synced: 0,
            updated: 0,
            failed: 0,
            total: 0,
        }

        try {
            this.logger.log(
                'Iniciando sincronización de contactos desde HubSpot',
            )
            const hubspotContacts =
                await this.hubspotApiService.getAllContacts()
            result.total = hubspotContacts.length

            for (const hubspotContact of hubspotContacts) {
                try {
                    await this.saveOrUpdateContact(hubspotContact)

                    // Verificar si es nuevo o actualizado
                    const existing = await this.contactRepository.findOne({
                        where: { id: hubspotContact.id },
                    })

                    if (existing) {
                        result.updated++
                    } else {
                        result.synced++
                    }
                } catch (error) {
                    this.logger.error(
                        `Error al guardar contacto ${hubspotContact.id}`,
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    )
                    result.failed++
                }
            }

            this.logger.log(
                `Sincronización completada: ${result.synced} nuevos, ${result.updated} actualizados, ${result.failed} fallidos`,
            )
            return result
        } catch (error) {
            this.logger.error(
                'Error en sincronización de contactos',
                error instanceof Error ? error.message : 'Unknown error',
            )
            throw error
        }
    }

    /**
     * Guarda o actualiza un contacto en la base de datos
     */
    private async saveOrUpdateContact(
        hubspotContact: HubSpotContact,
    ): Promise<Contact> {
        const contact = this.contactRepository.create({
            id: hubspotContact.id,
            email: hubspotContact.properties.email,
            firstname: hubspotContact.properties.firstname,
            lastname: hubspotContact.properties.lastname,
            hsObjectId: hubspotContact.properties.hs_object_id,
            hubspotCreatedAt: new Date(hubspotContact.createdAt),
            hubspotUpdatedAt: new Date(hubspotContact.updatedAt),
            archived: hubspotContact.archived,
            properties: hubspotContact.properties,
        })

        return await this.contactRepository.save(contact)
    }

    /**
     * Obtiene todos los contactos de la base de datos
     */
    async findAll(): Promise<Contact[]> {
        return await this.contactRepository.find({
            order: { createdAt: 'DESC' },
        })
    }

    /**
     * Obtiene un contacto por ID
     */
    async findOne(id: string): Promise<Contact | null> {
        return await this.contactRepository.findOne({ where: { id } })
    }

    /**
     * Obtiene estadísticas de contactos
     */
    async getStats() {
        const total = await this.contactRepository.count()
        const archived = await this.contactRepository.count({
            where: { archived: true },
        })
        const active = total - archived

        return {
            total,
            active,
            archived,
        }
    }
}
