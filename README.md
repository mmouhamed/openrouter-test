# AI Chat Hub

A modern 2025 UI/UX chat interface for interacting with multiple AI models through OpenRouter API, built with Next.js and deployed on Cloudflare Pages.

## ✨ Features

- **Modern 2025 Design**: Glassmorphism effects, gradient backgrounds, and smooth animations
- **Dark Mode Support**: Automatic dark mode with high contrast for excellent visibility
- **Multiple AI Models**: Support for GPT, Claude, Llama, Gemini, and more via OpenRouter
- **Mobile Responsive**: Perfect experience on all devices
- **Real-time Chat**: Instant responses with typing indicators
- **Accessibility**: WCAG compliant with proper contrast ratios and keyboard navigation

## 🚀 Quick Deploy to Cloudflare Pages

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Modern AI Chat Hub"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-chat-hub.git
   git push -u origin main
   ```

2. **Create Cloudflare Pages Project**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to Pages > Create a project
   - Connect your GitHub account and select the repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Build output directory**: `.next`
     - **Framework preset**: Next.js

3. **Environment Variables**:
   In Cloudflare Pages settings, add:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

### Method 2: Direct Upload

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload to Cloudflare Pages**:
   - Zip the `.next` folder
   - Go to Cloudflare Pages > Create a project > Upload assets
   - Upload the zip file

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Add your OpenRouter API key
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

## 🧪 Testing

- **Unit Tests**: `npm run test` (if added)
- **UI Tests**: `npm run test:playwright`
- **Lint Check**: `npm run lint`

## 🎨 UI/UX Features

- **Glassmorphism**: Modern frosted glass effects
- **2025 Color Palette**: Purple-indigo gradients with high contrast
- **Micro-animations**: Smooth transitions and hover effects
- **Custom Scrollbars**: Styled for both light and dark modes
- **Mobile-First**: Responsive design starting from 320px

## 🔧 Configuration

### Supported AI Models

The app supports all OpenRouter models including:
- GPT-3.5 Turbo, GPT-4, GPT-4o
- Claude 3 Haiku, Claude 3.5 Sonnet
- Llama 3.1, Gemini Flash
- And many more!

### Build Commands

- `npm run build` - Production build
- `npm run dev` - Development server
- `npm run lint` - Code linting
- `npm run preview` - Preview build locally

## 🚀 Deployment Tips

1. **Environment Variables**: Always set `OPENROUTER_API_KEY` in your Cloudflare Pages environment
2. **Domain**: Update the HTTP-Referer in `src/app/api/chat/route.ts` to match your domain
3. **Performance**: The app is optimized for Cloudflare's edge network

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with modern JavaScript support

## 🎯 Performance

- **First Load JS**: ~105 kB
- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Edge Runtime**: Fast API responses worldwide

## 🔒 Security

- API key secured server-side
- No sensitive data in client bundle
- HTTPS enforced in production
- Input sanitization and validation

---

Built with ❤️ using Next.js 15, Tailwind CSS, and modern web standards.