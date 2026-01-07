-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password_hash" TEXT,
    "provider" TEXT DEFAULT 'google',
    "name" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "calibrationCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "tradingStyle" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "title" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'General',
    "category_confidence" DECIMAL(3,2) DEFAULT 0.0,
    "matched_keywords" JSONB DEFAULT '[]',
    "fetched_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(6),
    "word_count" INTEGER,
    "sentiment_score" DECIMAL(3,2),
    "importance_score" DECIMAL(3,2),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "why_it_matters" TEXT,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "keyword_count" INTEGER DEFAULT 0,
    "article_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER,
    "user_id" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_likes" (
    "user_id" VARCHAR(255) NOT NULL,
    "post_id" INTEGER NOT NULL,

    CONSTRAINT "community_likes_pkey" PRIMARY KEY ("user_id","post_id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "avatar" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "asset" JSONB,
    "likes_count" INTEGER DEFAULT 0,
    "comments_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_outcomes" (
    "id" SERIAL NOT NULL,
    "keyword" VARCHAR,
    "avg_price" DOUBLE PRECISION,
    "supplier_count" INTEGER,
    "listing_count" INTEGER,
    "predicted_opportunity" DOUBLE PRECISION,
    "confidence" VARCHAR,
    "is_red_ocean" BOOLEAN,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "product_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_stats" (
    "id" SERIAL NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "total_articles" INTEGER DEFAULT 0,
    "last_scraped" TIMESTAMP(6),
    "success_rate" DECIMAL(5,2) DEFAULT 100.0,
    "avg_confidence" DECIMAL(3,2) DEFAULT 0.0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_assets" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "asset_type" VARCHAR(20) NOT NULL,
    "current_price" DECIMAL(20,8) DEFAULT 0,
    "price_change_24h" DECIMAL(10,4) DEFAULT 0,
    "high_24h" DECIMAL(20,8) DEFAULT 0,
    "low_24h" DECIMAL(20,8) DEFAULT 0,
    "volume_24h" DECIMAL(20,2) DEFAULT 0,
    "market_cap" DECIMAL(25,2) DEFAULT 0,
    "last_updated" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    "max_leverage" INTEGER DEFAULT 5,

    CONSTRAINT "trading_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_holdings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "asset_id" INTEGER,
    "symbol" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "avg_buy_price" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "leverage" INTEGER DEFAULT 1,
    "margin_used" DECIMAL(20,2) DEFAULT 0,
    "entry_value" DECIMAL(20,2) DEFAULT 0,
    "current_value" DECIMAL(20,2) DEFAULT 0,
    "unrealized_pnl" DECIMAL(20,2) DEFAULT 0,
    "unrealized_pnl_percent" DECIMAL(10,4) DEFAULT 0,
    "stop_loss_price" DECIMAL(20,8),
    "take_profit_price" DECIMAL(20,8),
    "liquidation_price" DECIMAL(20,8),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_pending_orders" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "asset_id" INTEGER,
    "symbol" VARCHAR(20) NOT NULL,
    "order_type" VARCHAR(20) NOT NULL,
    "trade_type" VARCHAR(10) NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "leverage" INTEGER DEFAULT 1,
    "trigger_price" DECIMAL(20,8) NOT NULL,
    "limit_price" DECIMAL(20,8),
    "stop_loss_price" DECIMAL(20,8),
    "take_profit_price" DECIMAL(20,8),
    "margin_reserved" DECIMAL(20,2) DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'pending',
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "triggered_at" TIMESTAMP(6),
    "cancelled_at" TIMESTAMP(6),

    CONSTRAINT "trading_pending_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_portfolio_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "portfolio_value" DECIMAL(20,2) NOT NULL,
    "wallet_balance" DECIMAL(20,2) NOT NULL,
    "total_pnl" DECIMAL(20,2) DEFAULT 0,
    "recorded_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_portfolio_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_trades" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "asset_id" INTEGER,
    "symbol" VARCHAR(20) NOT NULL,
    "trade_type" VARCHAR(10) NOT NULL,
    "order_type" VARCHAR(20) DEFAULT 'market',
    "quantity" DECIMAL(20,8) NOT NULL,
    "leverage" INTEGER DEFAULT 1,
    "price_at_execution" DECIMAL(20,8) NOT NULL,
    "total_value" DECIMAL(20,2) NOT NULL,
    "margin_cost" DECIMAL(20,2) DEFAULT 0,
    "stop_loss_price" DECIMAL(20,8),
    "take_profit_price" DECIMAL(20,8),
    "realized_pnl" DECIMAL(20,2) DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'executed',
    "trigger_type" VARCHAR(20),
    "executed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_users" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50),
    "wallet_balance" DECIMAL(20,2) DEFAULT 10000.00,
    "margin_used" DECIMAL(20,2) DEFAULT 0.00,
    "available_margin" DECIMAL(20,2) DEFAULT 10000.00,
    "portfolio_value" DECIMAL(20,2) DEFAULT 10000.00,
    "total_pnl" DECIMAL(20,2) DEFAULT 0.00,
    "realized_pnl" DECIMAL(20,2) DEFAULT 0.00,
    "unrealized_pnl" DECIMAL(20,2) DEFAULT 0.00,
    "total_trades" INTEGER DEFAULT 0,
    "winning_trades" INTEGER DEFAULT 0,
    "losing_trades" INTEGER DEFAULT 0,
    "win_rate" DECIMAL(5,2) DEFAULT 0.00,
    "max_leverage" INTEGER DEFAULT 5,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_active" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_premium" BOOLEAN DEFAULT false,
    "premium_expires_at" TIMESTAMP(6),

    CONSTRAINT "trading_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "session_token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "google_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "profile_picture" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zenith_scores" (
    "symbol" VARCHAR(20) NOT NULL,
    "score" DECIMAL(5,2),
    "change_24h" DECIMAL(10,4),
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zenith_scores_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "UserTrait" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "analytical_depth" INTEGER NOT NULL DEFAULT 0,
    "risk_discipline" INTEGER NOT NULL DEFAULT 0,
    "adaptability" INTEGER NOT NULL DEFAULT 0,
    "consistency" INTEGER NOT NULL DEFAULT 0,
    "emotional_stability" INTEGER NOT NULL DEFAULT 0,
    "calibration_confidence" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathDefinition" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PathDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPathScore" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "path_id" VARCHAR(50) NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPathScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_follows" (
    "id" SERIAL NOT NULL,
    "follower_id" VARCHAR(255) NOT NULL,
    "following_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_trades" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "trade_id" INTEGER NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "trade_type" VARCHAR(10) NOT NULL,
    "entry_price" DECIMAL(20,8) NOT NULL,
    "exit_price" DECIMAL(20,8),
    "pnl" DECIMAL(20,2),
    "pnl_percent" DECIMAL(10,4),
    "caption" TEXT,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "shared_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(6),

    CONSTRAINT "shared_trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "icon" VARCHAR(10) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "rarity" VARCHAR(20) NOT NULL DEFAULT 'common',
    "requirement" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "badge_id" VARCHAR(50) NOT NULL,
    "earned_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100),
    "bio" TEXT,
    "career_path" VARCHAR(50),
    "experience_level" VARCHAR(20) DEFAULT 'beginner',
    "twitter_handle" VARCHAR(50),
    "discord_handle" VARCHAR(50),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "show_trades" BOOLEAN NOT NULL DEFAULT true,
    "show_badges" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingNote" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "sentiment" VARCHAR(20),
    "phase" VARCHAR(20),
    "asset" VARCHAR(20),
    "stressLevel" INTEGER DEFAULT 3,
    "mood" VARCHAR(10),
    "snapshotUrl" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskTolerance" INTEGER DEFAULT 5,
    "timeHorizon" TEXT,
    "analysisStyle" TEXT,
    "patienceLevel" INTEGER,
    "learningBias" INTEGER,
    "userArchetype" TEXT,
    "defaultView" TEXT DEFAULT 'market',
    "notifications" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAssetView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "lastViewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstViewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "userRating" INTEGER,
    "winLoss" BOOLEAN,

    CONSTRAINT "UserAssetView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWatchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "UserWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSignalInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "viewed" BOOLEAN NOT NULL DEFAULT true,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "actedUpon" BOOLEAN,
    "profitLoss" DOUBLE PRECISION,
    "confidence" INTEGER,
    "interactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSignalInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartCache" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "assetType" VARCHAR(10) NOT NULL,
    "timeframe" VARCHAR(5) NOT NULL,
    "range" VARCHAR(5) NOT NULL,
    "data" JSONB NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" SERIAL NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "assetType" VARCHAR(10) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "volume" DECIMAL(20,2),
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(20) NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLifetimeScore" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "launchDate" TIMESTAMP(3) NOT NULL,
    "firstPrice" DOUBLE PRECISION NOT NULL,
    "lifetimeReturn" DOUBLE PRECISION NOT NULL,
    "volatilityScore" DOUBLE PRECISION NOT NULL,
    "consistencyScore" DOUBLE PRECISION NOT NULL,
    "recoveryScore" DOUBLE PRECISION NOT NULL,
    "volumeScore" DOUBLE PRECISION NOT NULL,
    "weights" JSONB NOT NULL,
    "baseScore" DOUBLE PRECISION NOT NULL,
    "currentScore" DOUBLE PRECISION NOT NULL,
    "trendScore" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCalculated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetLifetimeScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeframeAnalysis" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TimeframeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketCandle" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(20,8) NOT NULL,
    "high" DECIMAL(20,8) NOT NULL,
    "low" DECIMAL(20,8) NOT NULL,
    "close" DECIMAL(20,8) NOT NULL,
    "volume" DECIMAL(20,2) NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketCandle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "articles_hash_key" ON "articles"("hash");

-- CreateIndex
CREATE INDEX "idx_articles_category" ON "articles"("category");

-- CreateIndex
CREATE INDEX "idx_articles_category_fetched" ON "articles"("category", "fetched_at" DESC);

-- CreateIndex
CREATE INDEX "idx_articles_fetched_at" ON "articles"("fetched_at" DESC);

-- CreateIndex
CREATE INDEX "idx_articles_hash" ON "articles"("hash");

-- CreateIndex
CREATE INDEX "idx_articles_keywords" ON "articles" USING GIN ("matched_keywords");

-- CreateIndex
CREATE INDEX "idx_articles_source" ON "articles"("source");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "ix_product_outcomes_id" ON "product_outcomes"("id");

-- CreateIndex
CREATE INDEX "ix_product_outcomes_keyword" ON "product_outcomes"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "source_stats_source_key" ON "source_stats"("source");

-- CreateIndex
CREATE UNIQUE INDEX "trading_assets_symbol_key" ON "trading_assets"("symbol");

-- CreateIndex
CREATE INDEX "idx_trading_assets_symbol" ON "trading_assets"("symbol");

-- CreateIndex
CREATE INDEX "idx_trading_assets_type" ON "trading_assets"("asset_type");

-- CreateIndex
CREATE INDEX "idx_trading_holdings_asset" ON "trading_holdings"("asset_id");

-- CreateIndex
CREATE INDEX "idx_trading_holdings_user" ON "trading_holdings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trading_holdings_user_id_asset_id_key" ON "trading_holdings"("user_id", "asset_id");

-- CreateIndex
CREATE INDEX "idx_pending_orders_user" ON "trading_pending_orders"("user_id");

-- CreateIndex
CREATE INDEX "idx_portfolio_history_user_time" ON "trading_portfolio_history"("user_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "idx_trading_trades_status" ON "trading_trades"("status");

-- CreateIndex
CREATE INDEX "idx_trading_trades_time" ON "trading_trades"("executed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_trading_trades_user" ON "trading_trades"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trading_users_session_id_key" ON "trading_users"("session_id");

-- CreateIndex
CREATE INDEX "idx_trading_users_portfolio" ON "trading_users"("portfolio_value" DESC);

-- CreateIndex
CREATE INDEX "idx_trading_users_session" ON "trading_users"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "idx_user_sessions_token" ON "user_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_google_id" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrait_user_id_key" ON "UserTrait"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_traits_user" ON "UserTrait"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_path_scores_user" ON "UserPathScore"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserPathScore_user_id_path_id_key" ON "UserPathScore"("user_id", "path_id");

-- CreateIndex
CREATE INDEX "idx_follows_follower" ON "community_follows"("follower_id");

-- CreateIndex
CREATE INDEX "idx_follows_following" ON "community_follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_follows_follower_id_following_id_key" ON "community_follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "idx_shared_trades_user" ON "shared_trades"("user_id");

-- CreateIndex
CREATE INDEX "idx_shared_trades_time" ON "shared_trades"("shared_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_badges_user" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_profiles_path" ON "user_profiles"("career_path");

-- CreateIndex
CREATE INDEX "idx_trading_notes_user" ON "TradingNote"("userId");

-- CreateIndex
CREATE INDEX "idx_trading_notes_time" ON "TradingNote"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserAssetView_userId_lastViewed_idx" ON "UserAssetView"("userId", "lastViewed");

-- CreateIndex
CREATE INDEX "UserAssetView_assetType_symbol_idx" ON "UserAssetView"("assetType", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "UserAssetView_userId_assetType_symbol_key" ON "UserAssetView"("userId", "assetType", "symbol");

-- CreateIndex
CREATE INDEX "UserWatchlist_userId_addedAt_idx" ON "UserWatchlist"("userId", "addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserWatchlist_userId_assetType_symbol_key" ON "UserWatchlist"("userId", "assetType", "symbol");

-- CreateIndex
CREATE INDEX "UserSignalInteraction_userId_interactedAt_idx" ON "UserSignalInteraction"("userId", "interactedAt");

-- CreateIndex
CREATE INDEX "UserSignalInteraction_signalId_idx" ON "UserSignalInteraction"("signalId");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "ChartCache_symbol_idx" ON "ChartCache"("symbol");

-- CreateIndex
CREATE INDEX "ChartCache_expiresAt_idx" ON "ChartCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChartCache_symbol_timeframe_range_key" ON "ChartCache"("symbol", "timeframe", "range");

-- CreateIndex
CREATE INDEX "idx_price_history_symbol_time" ON "PriceHistory"("symbol", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_price_history_type" ON "PriceHistory"("assetType");

-- CreateIndex
CREATE INDEX "idx_price_history_time" ON "PriceHistory"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "AssetLifetimeScore_symbol_key" ON "AssetLifetimeScore"("symbol");

-- CreateIndex
CREATE INDEX "AssetLifetimeScore_symbol_idx" ON "AssetLifetimeScore"("symbol");

-- CreateIndex
CREATE INDEX "AssetLifetimeScore_baseScore_idx" ON "AssetLifetimeScore"("baseScore");

-- CreateIndex
CREATE INDEX "AssetLifetimeScore_currentScore_idx" ON "AssetLifetimeScore"("currentScore");

-- CreateIndex
CREATE INDEX "TimeframeAnalysis_symbol_idx" ON "TimeframeAnalysis"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "TimeframeAnalysis_symbol_timeframe_key" ON "TimeframeAnalysis"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "MarketCandle_symbol_timeframe_timestamp_idx" ON "MarketCandle"("symbol", "timeframe", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketCandle_symbol_timeframe_timestamp_key" ON "MarketCandle"("symbol", "timeframe", "timestamp");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingNote" ADD CONSTRAINT "TradingNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAssetView" ADD CONSTRAINT "UserAssetView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWatchlist" ADD CONSTRAINT "UserWatchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSignalInteraction" ADD CONSTRAINT "UserSignalInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
