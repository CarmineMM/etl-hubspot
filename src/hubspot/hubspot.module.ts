import { Module } from '@nestjs/common'
import { HubSpotAuthService } from './hubspot-auth.service'
import { HubSpotApiService } from './hubspot-api.service'
import { HubSpotAuthController } from './hubspot-auth.controller'
import { ContactsModule } from '../crm/contacts/contacts.module'

/**
 * HubSpot Module
 * This module handles authentication and API integration with HubSpot's OAuth 2.0 flow.
 * It provides services for:
 * - OAuth 2.0 authentication flow
 * - Token management and refresh
 * - API client initialization
 *
 * Environment variables required:
 * - HUBSPOT_CLIENT_ID
 * - HUBSPOT_CLIENT_SECRET
 * - HUBSPOT_REDIRECT_URI
 * - HUBSPOT_SCOPES
 */
@Module({
    imports: [ContactsModule],
    controllers: [HubSpotAuthController],
    providers: [HubSpotAuthService, HubSpotApiService],
    exports: [HubSpotAuthService, HubSpotApiService],
})
export class HubSpotModule {}
