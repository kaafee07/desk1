#!/bin/bash

# Build script for Vercel deployment
echo "🚀 Starting build process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is not set"
    exit 1
fi

echo "✅ Environment variables check passed"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated successfully"

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Database migration failed"
    exit 1
fi

echo "✅ Database migrations completed"

# Build Next.js application
echo "🏗️ Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Next.js build failed"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "🎉 Ready for deployment!"
