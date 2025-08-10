"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 Smart Wallet API running on: http://localhost:${port}`);
    console.log(`📚 Health check: http://localhost:${port}/api/smart-wallet/health`);
    console.log(`💰 Check balances: http://localhost:${port}/api/smart-wallet/balances`);
}
bootstrap();
//# sourceMappingURL=main.js.map