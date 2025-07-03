# 🏆 Gokaku: Tournament Bracket Management System

A modern **Next.js** web application for creating, managing, and tracking tournament brackets with real-time match progression and winner advancement.

This project is designed for **tournament organizers, esports communities, and competitive events**, making it easy to manage single-elimination tournaments with an intuitive bracket interface.

---

## 🔥 Features

- **Tournament Creation** 🎯: Create custom tournaments with configurable size, rules, and prize pools
- **Interactive Bracket System** 🧩: Visual bracket interface with click-to-advance functionality
- **Real-time Match Management** ⚡: Live match updates and winner progression
- **User Authentication** 🔐: Secure user accounts with NextAuth.js integration
- **Participant Management** 👥: Easy participant registration and management
- **Creator Controls** 🎮: Tournament creators can start, reset, and manage matches
- **Responsive Design** 📱: Works seamlessly on desktop and mobile devices
- **Dark Mode Support** 🌙: Beautiful dark/light theme switching
- **Type-safe API** 🛡️: Full-stack type safety with tRPC

---

## 🚧 Planned Features

### **I'm actively working on expanding the functionality of this project! Here are some exciting features in the pipeline:**

1. **Advanced Tournament Types**

   - Double elimination brackets
   - Round-robin tournaments
   - Swiss system tournaments
   - Custom bracket formats

2. **Enhanced Match Features**

   - Score tracking and match history
   - Best-of-X series support
   - Match scheduling and notifications
   - Live streaming integration

3. **Community Features**

   - Tournament discovery and public listings
   - Spectator mode for public tournaments
   - Tournament statistics and analytics
   - Social sharing and invitations

4. **Advanced Management**

   - Automated bracket seeding
   - Tournament templates
   - Multi-admin support
   - Export brackets to PDF/images

5. **Integration & API**
   - Discord bot integration
   - Webhook support for external systems
   - Public API for third-party integrations
   - Mobile app companion

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Custom CSS Variables
- **Backend**: Next.js API Routes, tRPC
- **Database**: Prisma ORM (configurable database)
- **Authentication**: NextAuth.js
- **State Management**: TanStack Query (React Query)
- **UI Components**: Custom components with Tailwind
- **Type Safety**: TypeScript throughout the entire stack

---

## 🏗️ Architecture

This project follows **modern full-stack patterns** with emphasis on type safety and developer experience.

### **Core Layers**

1. **Presentation Layer** - React components and pages
2. **API Layer** - tRPC routers and procedures
3. **Business Logic** - Tournament and match management
4. **Data Layer** - Prisma ORM with database abstraction

### **Key Components**

- **Bracket Component**: Interactive tournament bracket visualization
- **Tournament Management**: CRUD operations for tournaments
- **Match System**: Real-time match updates and progression
- **User System**: Authentication and authorization

---

## 🛠️ Installation & Setup

### **Prerequisites**

- Node.js 18+ and npm/yarn/pnpm
- Database (PostgreSQL, MySQL, or SQLite)
- Git

### **1️⃣ Clone the Repository**

```sh
git clone https://github.com/yourusername/gokaku.git
cd gokaku
```

### **2️⃣ Install Dependencies**

```sh
npm install
# or
yarn install
# or
pnpm install
```

### **3️⃣ Environment Setup**

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="your_database_connection_string"

# NextAuth.js
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### **4️⃣ Database Setup**

```sh
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### **5️⃣ Run the Development Server**

```sh
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Usage Guide

### **Creating a Tournament**

1. **Sign in** to your account
2. Navigate to **Dashboard > Tournaments**
3. Click **"Create Tournament"**
4. Fill in tournament details:
   - Name and description
   - Tournament size (4, 8, 16, 32, etc.)
   - Rules and prize information
   - Start and end dates
5. **Save** your tournament

### **Managing Participants**

1. Share your tournament link with participants
2. Participants can **join** through the tournament page
3. As creator, you can **start** the tournament once you have enough participants
4. The system automatically generates the bracket

### **Running Matches**

1. **Click on any match** in the bracket to set the winner
2. Choose winner by entering **"1"** or **"2"** in the prompt
3. Winners automatically **advance** to the next round
4. Use **"reset"** to clear match results if needed

### **Advanced Controls** (Tournament Creators)

- **Reset Match**: Clear individual match results
- **Reset Round**: Clear all matches in a specific round
- **Advance All Winners**: Automatically progress all completed matches
- **Reshuffle Bracket**: Randomize the entire bracket (resets all matches)

---

## 🎮 API Reference

### **Tournament Routes**

- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create new tournament
- `GET /api/tournaments/[id]` - Get tournament details
- `PUT /api/tournaments/[id]` - Update tournament
- `DELETE /api/tournaments/[id]` - Delete tournament

### **Match Routes**

- `GET /api/matches/tournament/[id]` - Get tournament matches
- `PUT /api/matches/[id]` - Update match result
- `POST /api/matches/advance` - Advance winners
- `POST /api/matches/reset` - Reset matches

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### **Getting Started**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design

### **Bug Reports**

Found a bug? Please open an issue with:

- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **tRPC** for type-safe APIs
- **Prisma** for the database toolkit
- **NextAuth.js** for authentication

---

## 📧 Contact

For questions, suggestions, or collaboration:

- **GitHub**: [Your GitHub Profile](https://github.com/yourusername)
- **Email**: your.email@example.com
- **Discord**: YourDiscord#1234

---

## 🌟 Star History

If you found this project helpful, please consider giving it a star! ⭐

![Star History Chart](https://api.star-history.com/svg?repos=yourusername/gokaku&type=Date)
