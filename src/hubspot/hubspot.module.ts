import { Module } from '@nestjs/common'
import { HubSpotAuthService } from './hubspot-auth.service'
import { HubSpotApiService } from './hubspot-api.service'
import { HubSpotAuthController } from './hubspot-auth.controller'
import { ContactsModule } from '../crm/contacts/contacts.module'

@Module({
    imports: [ContactsModule],
    controllers: [HubSpotAuthController],
    providers: [HubSpotAuthService, HubSpotApiService],
    exports: [HubSpotAuthService, HubSpotApiService],
})
export class HubSpotModule {}
