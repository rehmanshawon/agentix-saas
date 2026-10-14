import * as fs from "fs";
import * as path from "path";

function loadEnvFiles() {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      break;
    }
  }
}
loadEnvFiles();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  // Validate required environment variables on startup
  const isDev = process.env.NODE_ENV !== "production";
  const requiredEnvVars = [
    "DATABASE_URL",
    "API_INTERNAL_SECRET",
    "ADMIN_PASSWORD",
  ];

  if (!isDev) {
    requiredEnvVars.push("PINECONE_API_KEY", "PINECONE_INDEX_NAME");
    const defaultProvider =
      process.env.DEFAULT_AI_PROVIDER?.toLowerCase() || "deepseek";
    if (defaultProvider === "deepseek") {
      requiredEnvVars.push("DEEPSEEK_API_KEY");
    } else {
      requiredEnvVars.push("OPENAI_API_KEY");
    }
    if (!process.env.OPENAI_API_KEY) {
      requiredEnvVars.push("OPENAI_API_KEY");
    }
  }

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missingVars.join(", ")}`,
    );
    console.error(
      "Please check your .env file and ensure all required variables are set.",
    );
    process.exit(1);
  }

  if (isDev) {
    const aiVars = ["DEEPSEEK_API_KEY", "OPENAI_API_KEY", "PINECONE_API_KEY"];
    const missingAi = aiVars.filter(
      (v) => !process.env[v] || process.env[v]?.startsWith("your-"),
    );
    if (missingAi.length > 0) {
      console.warn(
        `⚠️ Running in development mode with placeholder AI keys (${missingAi.join(", ")}). Fallback mock replies will be provided until real keys are added.`,
      );
    }
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger("Bootstrap");

  // CORS
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: false,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Agentix API")
    .setDescription(
      "Complete API documentation for the Agentix SaaS platform.\n\n" +
        "**Authentication:** Private endpoints are available through the authenticated Agentix web app proxy. Direct API requests require the server-only `x-agentix-internal-token` header.\n\n" +
        "**Public endpoints:** Password reset and public widget chat/configuration endpoints remain available without an internal token.\n\n" +
        "**Admin endpoints:** Also require the server-injected `x-admin-key` header.",
    )
    .setVersion("1.0")
    .addTag("Chat", "Chat widget and agent configuration")
    .addTag("Knowledge", "Document upload and management")
    .addTag("Billing", "Stripe checkout and subscription management")
    .addTag("Auth", "Password reset and authentication")
    .addTag("Admin", "Admin panel endpoints (requires admin key)")
    .addTag("Workspace", "Workspace information")
    .setContact("Agentix Support", "https://agentix.dev", "support@agentix.dev")
    .addServer("http://localhost:3001", "Local development")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "Agentix API Documentation",
    customCss: ".swagger-ui .topbar { display: none }",
    customfavIcon: "https://agentix.dev/favicon.ico",
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Agentix Backend is running on: http://localhost:${port}`);
  logger.log(`📚 API Docs available at: http://localhost:${port}/api/docs`);
  logger.log(`CORS is enabled for the external Chat Widget.`);
}

bootstrap();
