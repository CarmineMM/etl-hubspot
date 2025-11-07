import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContactsService } from './contacts.service'
import { ContactsController } from './contacts.controller'
import { Contact } from './entities/contact.entity'
import { HubSpotApiService } from '../../hubspot/hubspot-api.service'
import { HubSpotAuthService } from '../../hubspot/hubspot-auth.service'

@Module({
    imports: [TypeOrmModule.forFeature([Contact])],
    controllers: [ContactsController],
    providers: [ContactsService, HubSpotApiService, HubSpotAuthService],
    exports: [ContactsService],
})
export class ContactsModule {}
