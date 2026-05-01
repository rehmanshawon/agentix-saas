import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("checkout")
  async createCheckout(
    @Body("email") email: string,
    @Body("priceId") priceId: string,
    @Body("successUrl") successUrl: string,
    @Body("cancelUrl") cancelUrl: string,
  ) {
    if (!email || !priceId) {
      throw new BadRequestException("Missing email or priceId");
    }
    return this.billingService.createCheckoutSession(
      email,
      priceId,
      successUrl,
      cancelUrl,
    );
  }
}
