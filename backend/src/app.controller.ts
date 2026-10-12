import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/authentication/decorators/public.decorator";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Unauthenticated liveness probe for the platform health check. */
  @Public()
  @Get("health")
  getHealth(): { status: string } {
    return { status: "ok" };
  }
}
