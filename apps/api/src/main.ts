import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  // Validate required environment variables on startup
  const requiredEnvVars = [
    "DATABASE_URL",
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
  ];

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

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger("Bootstrap");

  // CORS
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Agentix API")
    .setDescription(
      "Complete API documentation for the Agentix SaaS platform.\n\n" +
        "**Authentication:** Most endpoints require a valid user session (via NextAuth JWT).\n\n" +
        "**Admin Endpoints:** Require `x-admin-key` header.",
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
