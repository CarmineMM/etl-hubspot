import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm'

@Entity('contacts')
export class Contact {
    @PrimaryColumn({ type: 'varchar', length: 255 })
    id: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    firstname: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    lastname: string

    @Column({ type: 'varchar', length: 255, name: 'hs_object_id' })
    hsObjectId: string

    @Column({ type: 'timestamp', name: 'hubspot_created_at', nullable: true })
    hubspotCreatedAt: Date

    @Column({ type: 'timestamp', name: 'hubspot_updated_at', nullable: true })
    hubspotUpdatedAt: Date

    @Column({ type: 'boolean', default: false })
    archived: boolean

    @Column({ type: 'jsonb', nullable: true })
    properties: Record<string, unknown>

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date
}
