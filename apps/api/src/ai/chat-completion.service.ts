import { Injectable, Logger } from "@nestjs/common";
import { ChatMessage, ModelRouter, ProviderConfig } from "./model-router.service";

interface CompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class ChatCompletionService {
  private readonly logger = new Logger(ChatCompletionService.name);

  constructor(private readonly modelRouter: ModelRouter) {}

  async complete(messages: ChatMessage[], temperature = 0.1): Promise<string> {
    const primary = this.modelRouter.getPrimaryChatProvider();
    const fallback = this.modelRouter.getFallbackChatProvider();

    try {
      this.modelRouter.logProvider(primary);
      return await this.callProvider(primary, messages, temperature);
    } catch (error: any) {
      this.logger.warn(
        `Primary provider ${primary.provider} failed: ${error.message}`,
      );

      if (!fallback) throw error;

      this.modelRouter.logProvider(fallback, true);
      return this.callProvider(fallback, messages, temperature);
    }
  }

  private async callProvider(
    config: ProviderConfig,
    messages: ChatMessage[],
    temperature: number,
  ): Promise<string> {
    if (!config.apiKey) {
      throw new Error(`Missing API key for ${config.provider}`);
    }

    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `${config.provider} returned ${response.status}: ${text.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as CompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error(`${config.provider} returned an empty response`);
    }

    return content;
  }
}
