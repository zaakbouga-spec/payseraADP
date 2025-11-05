# P-Advisor

Your AI-powered assistant for navigating Paysera's financial services.

## 🚀 Features

P-Advisor provides three powerful tools to help you navigate Paysera's financial services:

### 1. 💸 Transfer Check
Validates whether a money transfer is possible between countries and currencies, considering:
- Sender nationality and recipient country
- Currency restrictions and sanctions
- Transfer systems (SEPA, SWIFT, Local)
- Fees and processing times
- Enhanced monitoring requirements

**Data Source**: Paysera Intranet API (Confluence page ID: 58238300)

### 2. 🏢 Company Validation
Determines if a company can open a Paysera account based on:
- Company registration country
- Business activity type
- Compliance and risk policies
- Prohibited and restricted activities
- Country-specific requirements

**Data Source**: Paysera Intranet API (Compliance database)

### 3. 🔍 IBAN & SWIFT Validator
Validates and analyzes IBAN and SWIFT/BIC codes:
- Format validation for 70+ countries
- Country and bank information extraction
- Supported transfer types identification
- Client-side processing (no API calls)

**Data Source**: Client-side validation logic

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Paysera Intranet API credentials

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd padvisor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your credentials:
   ```env
   VITE_PAYSERA_API_KEY=your_api_key_here
   VITE_PAYSERA_EMAIL=your_email@paysera.net
   VITE_PAYSERA_INTRANET_URL=https://intranet.paysera.net
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🏗️ Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🌐 Deployment to Vercel

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy P-Advisor"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Environment Variables**
   
   In Vercel Project Settings → Environment Variables, add:
   
   | Variable | Value |
   |----------|-------|
   | `VITE_PAYSERA_API_KEY` | `your_api_key_here` |
   | `VITE_PAYSERA_EMAIL` | `your_email@paysera.net` |
   | `VITE_PAYSERA_INTRANET_URL` | `https://intranet.paysera.net` |

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 Documentation

- **[FEATURES.md](./FEATURES.md)** - Comprehensive guide to each feature's workflow
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment instructions for Vercel
- **[CHANGELOG.md](#changelog)** - Version history and changes

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                      │
│                   (React Components)                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Service Layer                           │
│              (companyApiService.ts)                      │
│         - Transfer Check Logic                           │
│         - Company Validation Logic                       │
│         - IBAN/SWIFT Validation                          │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼──────────┐   ┌───────▼────────────┐
│ Intranet Service  │   │  Client-side       │
│ (API Integration) │   │  Validation        │
│ - Fetch Rules     │   │  - IBAN Check      │
│ - Cache Data      │   │  - SWIFT Check     │
│ - Fallback Logic  │   │  - No API calls    │
└────────┬──────────┘   └────────────────────┘
         │
┌────────▼──────────────────────────────────┐
│      Paysera Intranet Confluence API      │
│   - Transfer Rules (Page ID: 58238300)    │
│   - Company Restrictions Database         │
└───────────────────────────────────────────┘
```

### Key Components

**Frontend Layer**
- `App.tsx` - Main application component
- `components/Tools.tsx` - Feature implementations
- `components/ToolCard.tsx` - UI cards for each tool
- `components/Modal.tsx` - Modal wrapper for tools

**Service Layer**
- `services/companyApiService.ts` - Business logic and API orchestration
- `services/payseraIntranetService.ts` - Paysera Intranet API integration
- `utils/iban.ts` - IBAN validation utilities

**Data Layer**
- `constants.ts` - Countries and currencies lists
- `types.ts` - TypeScript type definitions

## 🔧 Technology Stack

- **Framework**: React 19.2.0
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **API**: Paysera Intranet Confluence REST API
- **Deployment**: Vercel
- **Styling**: Tailwind CSS (via CDN)

## 📖 Usage Examples

### Transfer Check

1. Select sender nationality (e.g., "Austria")
2. Select recipient country (e.g., "Germany")
3. Select currency (e.g., "EUR")
4. Click "Check Transfer"
5. View results:
   - Transfer system (SEPA/SWIFT/Local)
   - Fees
   - Processing time
   - Any restrictions or requirements

### Company Validation

1. Select company registration country (e.g., "Lithuania")
2. Enter company activity (e.g., "E-commerce store selling clothing")
3. Click "Validate Company"
4. View results:
   - Account opening status
   - Country requirements
   - Activity status
   - Conditions (if any)

### IBAN & SWIFT Validator

1. Enter an IBAN (e.g., "LT121000011101001000")
   OR a SWIFT code (e.g., "DEUTDEFF")
2. Click "Validate & Analyze"
3. View results:
   - Validation status
   - Country information
   - Bank details
   - Supported transfer types

## 🔒 Security

- API credentials are stored as environment variables
- API key has read-only access to specific Confluence pages
- No sensitive data is stored client-side
- IBAN/SWIFT validation is fully client-side (no external API calls)

**Production Recommendation**: Implement a backend proxy to hide API credentials from the frontend.

## 🐛 Troubleshooting

### Common Issues

**Build fails with environment variable errors**
- Ensure all `VITE_` prefixed variables are set
- Restart dev server after changing `.env`
- Check Vercel environment variables are saved correctly

**API calls fail with CORS errors**
- Verify Paysera Intranet allows requests from your domain
- Contact IT team to whitelist your domain
- Check if API credentials are correct

**TypeScript errors**
- Run `npm install` to ensure all dependencies are installed
- Check that `@types/node` is in devDependencies
- Restart VSCode TypeScript server

For more troubleshooting help, see [FEATURES.md](./FEATURES.md#support--troubleshooting)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for Paysera internal use.

## 👥 Authors

- Development Team - Paysera

## 📞 Support

For support or questions:
- Check [FEATURES.md](./FEATURES.md) for feature documentation
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Contact the development team

## 🔄 Changelog

### Version 2.0.0 (2025-01-05)

**Major Refactoring**
- ✨ Integrated Paysera Intranet Confluence API for real-time data
- 🔄 Refactored Transfer Check to use API data (Page ID: 58238300)
- 🔄 Refactored Company Validation to use API data
- 📦 Added caching layer (1-hour TTL) to reduce API calls
- 🛡️ Implemented fallback data for offline/API failure scenarios
- 🔧 Updated environment variable configuration
- 📚 Created comprehensive documentation (FEATURES.md, DEPLOYMENT.md)

**Technical Improvements**
- Created `payseraIntranetService.ts` for API integration
- Updated `companyApiService.ts` with business logic
- Fixed TypeScript configuration issues
- Added proper error handling and user feedback
- Improved code organization and maintainability

**Features Maintained**
- ✅ Transfer Check - Now with real-time API data
- ✅ Company Validation - Now with real-time API data  
- ✅ IBAN & SWIFT Validator - Client-side validation (unchanged)
- ✅ Maintained original UI/UX design

---

Made with ❤️ by Paysera Development Team
