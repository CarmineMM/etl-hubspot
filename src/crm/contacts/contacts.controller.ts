import { Controller, Get, Param } from '@nestjs/common'
import { ContactsService } from './contacts.service'

@Controller('crm/contacts')
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) {}

    @Get()
    findAll() {
        return this.contactsService.findAll()
    }

    @Get('stats')
    getStats() {
        return this.contactsService.getStats()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contactsService.findOne(id)
    }
}
