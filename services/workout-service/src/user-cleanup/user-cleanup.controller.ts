import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { UserCleanupService } from "./user-cleanup.service.js";
import { InternalTokenGuard } from "./internal-token.guard.js";

@Controller('internal/users')
@UseGuards(InternalTokenGuard)
export class UserCleanupController {
    constructor(private readonly userCleanupService: UserCleanupService) {}

    @Delete(':userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteUserData(@Param('userId', new ParseUUIDPipe()) userId: string): Promise<void> {
        await this.userCleanupService.deleteUserData(userId);
    }
}