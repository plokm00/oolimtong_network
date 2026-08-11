# Simple game creation

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/prokm00-4583s-projects/v0-simple-game-creation)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/hnTGuvexVOl)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/prokm00-4583s-projects/v0-simple-game-creation](https://vercel.com/prokm00-4583s-projects/v0-simple-game-creation)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/hnTGuvexVOl](https://v0.app/chat/hnTGuvexVOl)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Firebase setup

Firebase Authentication manages Google and email/password sign-in. A signed-in user's nickname profile is stored directly in Cloud Firestore from the browser; no Firebase service-account key is needed.

1. In the Firebase Console, enable **Authentication** (Google and Email/Password providers) and **Cloud Firestore**.
2. Copy your web-app configuration into `.env.local` using [`.env.example`](.env.example) as the template.
3. In Firestore **Rules**, publish the contents of [`firestore.rules`](firestore.rules). This permits each signed-in user to create and read only their own profile and nickname reservation.
4. Add the same `NEXT_PUBLIC_FIREBASE_*` values to your Vercel project's environment variables before deploying.
