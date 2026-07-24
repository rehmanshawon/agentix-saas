import { Injectable, Logger } from "@nestjs/common";

export type AIProvider = "deepseek" | "openai";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

@Injectable()
export class ModelRouter {
  private readonly logger = new Logger(ModelRouter.name);

  getPrimaryChatProvider(): ProviderConfig {
    const provider = this.normalizeProvider(process.env.DEFAULT_AI_PROVIDER);

    if (provider === "openai") {
      return this.getOpenAIProvider();
    }

    return this.getDeepSeekProvider();
  }

  getFallbackChatProvider(): ProviderConfig | null {
    const fallback = this.normalizeProvider(
      process.env.FALLBACK_AI_PROVIDER || "openai",
    );

    const primary = this.getPrimaryChatProvider().provider;
    if (fallback === primary) return null;

    if (fallback === "deepseek") return this.getDeepSeekProvider();
    return this.getOpenAIProvider();
  }

  private normalizeProvider(provider?: string): AIProvider {
    return provider?.toLowerCase() === "openai" ? "openai" : "deepseek";
  }

  private getDeepSeekProvider(): ProviderConfig {
    return {
      provider: "deepseek",
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: this.chatCompletionsUrl(
        process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
      ),
      model: process.env.DEEPSEEK_CHAT_MODEL || "deepseek-v4-flash",
    };
  }

  private getOpenAIProvider(): ProviderConfig {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: this.chatCompletionsUrl(
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      ),
      model: process.env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini",
    };
  }

  private chatCompletionsUrl(baseUrl: string): string {
    const trimmed = baseUrl.replace(/\/$/, "");
    if (trimmed.endsWith("/chat/completions")) return trimmed;
    return `${trimmed}/chat/completions`;
  }

  logProvider(provider: ProviderConfig, fallback = false) {
    this.logger.log(
      `${fallback ? "Fallback" : "Primary"} chat provider: ${provider.provider}/${provider.model}`,
    );
  }
}
