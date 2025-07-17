# TopDeck Circuit 🏆

**Live at:** [https://www.topdeckcircuit.com](https://www.topdeckcircuit.com)

A comprehensive tournament management platform built for competitive gaming communities. Create, manage, and participate in tournaments with support for both individual and team-based competitions.

## 🎯 What is TopDeck Circuit?

TopDeck Circuit is a full-featured tournament platform that streamlines the entire tournament lifecycle - from creation and registration to bracket management and prize distribution. Whether you're organizing small local events or large-scale competitive tournaments, TopDeck Circuit provides the tools you need for success.

## ✨ Key Features

### Tournament Management

- **Multiple Tournament Formats**: Swiss, Round Robin, and Single/Double Elimination brackets
- **Flexible Team Sizes**: Support for 1v1, 2v2, 3v3, and 5v5 tournaments
- **Real-time Bracket Updates**: Automatic bracket generation and live match progression
- **Comprehensive Registration**: Player and team registration with deck submission

### Player & Team Features

- **User Authentication**: Secure login with NextAuth.js
- **Team Management**: Create teams with unique codes and manage memberships
- **Deck Management**: Upload and manage tournament decks with S3 storage
- **Performance Tracking**: Detailed statistics and tournament history

### Live Tournament Experience

- **Real-time Notifications**: Match alerts and tournament updates
- **Live Bracket Viewing**: Follow tournament progression in real-time
- **Top 8 Tracking**: Automatic top 8 placement tracking and display
- **Match Reporting**: Streamlined match result submission

### Administrative Tools

- **Tournament Creation**: Intuitive tournament setup wizard
- **Participant Management**: Approve/reject registrations and manage waitlists
- **Prize Distribution**: Integrated prize management system
- **Analytics Dashboard**: Comprehensive tournament statistics and insights

## 🛠️ Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **tRPC** - End-to-end type-safe API
- **React Hook Form** - Form management
- **Zustand** - State management

### Backend

- **NextAuth.js** - Authentication
- **Prisma** - Database ORM with MongoDB
- **AWS S3** - File storage for decks
- **WebSocket** - Real-time updates
- **Zod** - Schema validation

### Database

- **MongoDB** - Primary database
- **Prisma Client** - Type-safe database access

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MongoDB database
- AWS S3 bucket (for deck storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd topdeck-circuit
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:

   ```env
   # Database
   DATABASE_URL="mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]"

   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # AWS S3 (for deck storage)
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_REGION="your-region"
   AWS_S3_BUCKET_NAME="your-bucket-name"

   # Optional: OAuth providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Database Setup**

   ```bash
   pnpm db:push
   pnpm db:generate
   ```

5. **Development Server**
   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── tournaments/       # Tournament browsing
│   ├── deck/              # Deck management
│   └── login/             # Authentication
├── components/            # React components
│   ├── tournament/        # Tournament-specific components
│   ├── deck/             # Deck-related components
│   ├── landing/          # Landing page components
│   └── ui/               # Reusable UI components
├── server/               # Server-side code
│   ├── api/              # tRPC routers
│   └── auth/             # Authentication
├── lib/                  # Utilities and helpers
└── styles/               # Global styles
```

## 🎯 Core Features Deep Dive

### Tournament Creation

Organizers can create tournaments with:

- Custom tournament names and descriptions
- Flexible bracket types (Swiss, Round Robin, Elimination)
- Configurable team sizes (1v1, 2v2, 3v3, 5v5)
- Prize pool management
- Registration deadlines and start dates

### Team Management

- Create teams with unique 6-character codes
- Invite members via team codes
- Manage team roles (leader/member)
- Submit multiple decks for team tournaments

### Deck Management

- Upload deck files (YDKE format supported)
- Automatic S3 storage with CDN delivery
- Deck validation and parsing
- Tournament-specific deck submission

### Bracket Systems

- **Swiss System**: Pairings based on win/loss records
- **Round Robin**: Every player plays every other player
- **Single Elimination**: Single loss elimination
- **Double Elimination**: Two-loss elimination system

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Type checking
- `pnpm db:studio` - Prisma Studio for database management

### Code Quality

- ESLint configuration for TypeScript
- Prettier for code formatting
- TypeScript strict mode enabled
- Husky for git hooks (optional)

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t topdeck-circuit .
docker run -p 3000:3000 --env-file .env topdeck-circuit
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [wiki](https://github.com/[username]/topdeck-circuit/wiki)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/[username]/topdeck-circuit/issues)
- **Discord**: Join our community [Discord server](https://discord.gg/[invite])

## 🙏 Acknowledgments

- Built with the [T3 Stack](https://create.t3.gg/)
- Icons from [Lucide React](https://lucide.dev/)
- UI components from [Radix UI](https://radix-ui.com/)
- Deployed on [Vercel](https://vercel.com)

---

Made with ❤️ by the TopDeck Circuit team
