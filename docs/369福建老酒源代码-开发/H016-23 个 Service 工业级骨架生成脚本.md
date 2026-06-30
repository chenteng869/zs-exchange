# H016\-23 个 Service 工业级骨架生成脚本

对。现在开始按 **23 个 Service 的工业级职责顺序生产代码**。



我们不再继续写规划，直接进入代码。  

第一步先生成 **23 个 Service 的统一 NestJS 工业级骨架**。



这一批代码的目标是：



```Plain Text
1. 23 个 service 目录全部建立
2. 每个 service 都有 main.ts
3. 每个 service 都有 app.module.ts
4. 每个 service 都有 health check
5. 每个 service 都有 package.json
6. 每个 service 都有 tsconfig.json
7. 每个 service 都有 Dockerfile
8. 所有 service 命名统一
9. 后面可以逐个填业务代码
```



---



# 第一批代码：23 个 Service 工业级骨架生成脚本



在项目根目录创建：



```Bash
scripts/generate-services.sh
```



内容如下：



```Bash
#!/bin/bash

set -e

SERVICES=(
  "api-gateway"
  "identity-service"
  "kyc-service"
  "product-service"
  "order-service"
  "payment-service"
  "revenue-service"
  "points-service"
  "tradable-points-service"
  "nft-service"
  "eco-power-service"
  "release-service"
  "referral-service"
  "team-reward-service"
  "node-service"
  "dappx-mall-service"
  "finance-service"
  "tax-service"
  "risk-service"
  "approval-service"
  "audit-service"
  "blockchain-service"
  "notification-service"
  "reporting-service"
)

mkdir -p apps

for SERVICE in "${SERVICES[@]}"
do
  echo "Generating $SERVICE..."

  SERVICE_DIR="apps/$SERVICE"

  mkdir -p "$SERVICE_DIR/src/health"
  mkdir -p "$SERVICE_DIR/src/config"
  mkdir -p "$SERVICE_DIR/src/modules"
  mkdir -p "$SERVICE_DIR/test"

  cat > "$SERVICE_DIR/package.json"  "$SERVICE_DIR/tsconfig.json"  "$SERVICE_DIR/src/main.ts"  "$SERVICE_DIR/src/app.module.ts"  "$SERVICE_DIR/src/health/health.module.ts"  "$SERVICE_DIR/src/health/health.controller.ts"  "$SERVICE_DIR/Dockerfile" =20.0.0",
    "pnpm": ">=9.0.0"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.15",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^10.4.15",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.4.15",
    "@nestjs/swagger": "^8.1.0",
    "@prisma/client": "^6.1.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "decimal.js": "^10.4.3",
    "ioredis": "^5.4.1",
    "kafkajs": "^2.2.4",
    "nestjs-pino": "^4.2.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pino": "^9.5.0",
    "pino-pretty": "^13.0.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "ulid": "^2.3.0",
    "uuid": "^11.0.3",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.4.15",
    "@types/bcrypt": "^5.0.2",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "@types/passport-jwt": "^4.0.1",
    "eslint": "^9.17.0",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "prisma": "^6.1.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.7.2"
  }
}
```



---



## 3\. `tsconfig.base.json`



```JSON
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "declaration": true,
    "sourceMap": true,
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@fj369/common": ["libs/common/src"],
      "@fj369/errors": ["libs/errors/src"],
      "@fj369/logger": ["libs/logger/src"],
      "@fj369/database": ["libs/database/src"],
      "@fj369/decimal": ["libs/decimal/src"],
      "@fj369/auth": ["libs/auth/src"],
      "@fj369/permissions": ["libs/permissions/src"],
      "@fj369/audit": ["libs/audit/src"],
      "@fj369/risk": ["libs/risk/src"],
      "@fj369/approval": ["libs/approval/src"],
      "@fj369/idempotency": ["libs/idempotency/src"],
      "@fj369/events": ["libs/events/src"],
      "@fj369/redis": ["libs/redis/src"],
      "@fj369/blockchain": ["libs/blockchain/src"]
    }
  }
}
```



---



## 4\. `.env.example`



```Plain Text
NODE_ENV=development

DATABASE_URL=postgresql://fj369:fj369@localhost:5432/fj369

REDIS_HOST=localhost
REDIS_PORT=6379

KAFKA_BROKERS=localhost:9092

JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=30d

LOG_LEVEL=debug
SERVICE_NAME=identity-service
```



---



# 第三批代码：23 个 Service 端口规划



创建：



```Plain Text
docs/service-ports.md
```



```Markdown
# FJ369 Service Ports

| Service | Port |
|---|---:|
| api-gateway | 3000 |
| identity-service | 3001 |
| kyc-service | 3002 |
| product-service | 3003 |
| order-service | 3004 |
| payment-service | 3005 |
| revenue-service | 3006 |
| points-service | 3007 |
| tradable-points-service | 3008 |
| nft-service | 3009 |
| eco-power-service | 3010 |
| release-service | 3011 |
| referral-service | 3012 |
| team-reward-service | 3013 |
| node-service | 3014 |
| dappx-mall-service | 3015 |
| finance-service | 3016 |
| tax-service | 3017 |
| risk-service | 3018 |
| approval-service | 3019 |
| audit-service | 3020 |
| blockchain-service | 3021 |
| notification-service | 3022 |
| reporting-service | 3023 |
```



---



# 第四批代码：docker\-compose 基础设施



创建：



```Plain Text
docker-compose.yml
```



```YAML
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: fj369-postgres
    restart: always
    environment:
      POSTGRES_USER: fj369
      POSTGRES_PASSWORD: fj369
      POSTGRES_DB: fj369
    ports:
      - "5432:5432"
    volumes:
      - fj369_postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: fj369-redis
    restart: always
    ports:
      - "6379:6379"

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.1
    container_name: fj369-zookeeper
    restart: always
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.6.1
    container_name: fj369-kafka
    restart: always
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: fj369-zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: fj369-kafka-ui
    restart: always
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: fj369-local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: fj369-kafka:9092

  pgadmin:
    image: dpage/pgadmin4
    container_name: fj369-pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@fj369.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"

volumes:
  fj369_postgres_data:
```



---



# 第五批代码：统一 Service 启动约定



所有服务启动时统一使用：



```Bash
PORT=3001 SERVICE_NAME=identity-service pnpm --filter @fj369/identity-service start:dev
```



例如：



```Bash
PORT=3003 SERVICE_NAME=product-service pnpm --filter @fj369/product-service start:dev
PORT=3004 SERVICE_NAME=order-service pnpm --filter @fj369/order-service start:dev
PORT=3005 SERVICE_NAME=payment-service pnpm --filter @fj369/payment-service start:dev
```



---



# 当前完成内容



这一批代码完成后，系统具备：



```Plain Text
1. 23 个工业级 service 目录
2. 每个 service 都能独立启动
3. 每个 service 都有 health / ready 接口
4. 根目录支持 pnpm workspace
5. 本地基础设施支持 PostgreSQL / Redis / Kafka
6. 后续可以按 service 顺序填充业务模块
```



---



# 下一步：开始写第 1 个 Service



按照你给的顺序，下一步正式写：



```Plain Text
1. Identity Service 用户与身份服务
```



第一批 Identity Service 代码会包含：



```Plain Text
users module
auth module
wallet module
referral-binding module
DTO
controller
service
repository
Prisma model
register API
login API
get me API
bind wallet API
bind referrer API
UserRegistered event
WalletBound event
ReferrerBound event
```



也就是从第一个服务开始真正进入业务代码。

