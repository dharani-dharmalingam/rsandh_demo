# RS&H Benefit Hub

The **RS&H Benefit Hub** is a centralized platform for employees to access, manage, and understand their benefits. It features an automated data extraction pipeline using **LlamaExtract** to pull structured benefit information directly from PDFs into a **Sanity CMS** backend, rendered with a modern **Next.js** frontend.

## 🚀 Key Features
- **Automated PDF Extraction**: Seamlessly import benefit data from PDF guides.
- **Dynamic Content Management**: Managed through Sanity Studio with live previews.
- **Responsive Frontend**: Mobile-friendly benefits portal built with React and Tailwind CSS.
- **Multi-Client Support**: Architected to handle multiple distinct client configurations.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **CMS**: Sanity (Studio v4)
- **Styling**: Tailwind CSS
- **AI/Extraction**: LlamaExtract (by LlamaIndex)
- **UI Components**: Radix UI & Lucide Icons

## 📖 Documentation
Detailed documentation is available in the following files:
- [About the Project](.brain/a3a13939-290d-4984-88e8-b498160a33d0/about_project.md) - High-level overview and architecture.
- [Usage Guide](.brain/a3a13939-290d-4984-88e8-b498160a33d0/usage_guide.md) - Setup, running locally, seeding, and using the import tool.

## ⚡ Quick Start
1. **Install dependencies**: `npm install`
2. **Setup environment**: Copy `.env.example` to `.env.local` and fill in credentials.
3. **Run local server**: `npm run dev`
4. **Access Sanity Studio**: `http://localhost:3000/sanity`
5. **Seed data**: `node scripts/seed-all.mjs`