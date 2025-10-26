# 🎬 CineVerse - Modern Movie Booking Platform

A full-stack movie booking application built with React, Supabase, and modern web technologies. CineVerse provides a seamless experience for users to browse movies, book tickets, and manage their cinema experience.

![CineVerse Logo](client/src/assets/logo.svg)

## ✨ Features

### 🎭 User Features
- **Movie Discovery**: Browse movies by genre, rating, and release date
- **Interactive Seat Selection**: Real-time seat booking with visual seat layout
- **Secure Booking System**: Complete booking flow with payment integration
- **User Dashboard**: Manage bookings, favorites, and profile
- **Movie Trailers**: Watch trailers and get detailed movie information
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 🎬 Admin Features
- **Movie Management**: Add, edit, and manage movie catalog
- **Show Scheduling**: Create and manage movie showtimes
- **Booking Analytics**: View booking statistics and revenue reports
- **User Management**: Monitor user activity and bookings
- **Real-time Dashboard**: Live updates on bookings and system status

### 🔧 Technical Features
- **Real-time Updates**: Live seat availability and booking status
- **Authentication**: Secure user authentication with Supabase Auth
- **Database Security**: Row Level Security (RLS) for data protection
- **Payment Integration**: Secure payment processing
- **Responsive UI**: Modern, mobile-first design with Tailwind CSS

## 🚀 Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Elegant notifications
- **React Player** - Video player for trailers

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security
  - Storage for images

### Development Tools
- **ESLint** - Code linting
- **Vite** - Build tooling
- **Git** - Version control

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/CineVerse.git
cd CineVerse
```

### 2. Database Setup
1. Create a new project on [Supabase](https://supabase.com)
2. Go to your Supabase project dashboard
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `database/supabase_schema.sql`
5. Execute the script to create all tables and functions

### 3. Environment Configuration
Create a `.env` file in the `client` directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies
```bash
cd client
npm install
```

### 5. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄️ Database Schema

The database includes the following main entities:

### Core Tables
- **users** - User profiles and authentication
- **movies** - Movie catalog with metadata
- **genres** - Movie categorization
- **cinema_halls** - Theater infrastructure
- **shows** - Movie showtimes and scheduling
- **bookings** - Ticket reservations
- **seat_reservations** - Real-time seat locking

### Key Features
- **Row Level Security (RLS)** - Data access control
- **Real-time subscriptions** - Live updates
- **Automatic timestamps** - Created/updated tracking
- **Unique booking references** - Auto-generated booking IDs
- **Seat reservation expiry** - Prevents double booking

For detailed database documentation, see [database/README.md](database/README.md)

## 🎯 Project Structure

```
CineVerse/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── lib/            # Utilities and API clients
│   │   ├── assets/         # Static assets
│   │   └── utils/          # Helper functions
│   ├── public/             # Public assets
│   └── package.json        # Dependencies and scripts
├── database/               # Database schema and migrations
│   ├── supabase_schema.sql # Complete database schema
│   ├── sample_data.sql     # Sample data for testing
│   └── README.md          # Database documentation
└── README.md              # This file
```

## 🎮 Usage

### For Users
1. **Browse Movies**: Visit the home page to see featured movies
2. **Select Movie**: Click on a movie to view details and showtimes
3. **Choose Showtime**: Select date and time for your preferred show
4. **Select Seats**: Use the interactive seat map to choose your seats
5. **Complete Booking**: Enter payment details and confirm your booking
6. **Manage Bookings**: View and manage your bookings in "My Bookings"

### For Admins
1. **Access Admin Panel**: Navigate to `/admin` (requires admin privileges)
2. **Add Movies**: Use the movie management interface
3. **Schedule Shows**: Create showtimes for movies
4. **Monitor Bookings**: View booking analytics and user activity
5. **Manage System**: Access system-wide settings and reports

## 🔐 Authentication & Security

### User Authentication
- **Supabase Auth** - Secure authentication system
- **Multiple Providers** - Email, Google, and social logins
- **Session Management** - Automatic session handling
- **Password Security** - Secure password hashing

### Data Security
- **Row Level Security (RLS)** - Database-level access control
- **API Security** - Secure API endpoints
- **Input Validation** - Client and server-side validation
- **CORS Configuration** - Proper cross-origin settings

## 🎨 UI/UX Features

### Design System
- **Modern Interface** - Clean, intuitive design
- **Responsive Layout** - Works on all device sizes
- **Dark/Light Theme** - User preference support
- **Accessibility** - WCAG compliant components

### User Experience
- **Loading States** - Smooth loading indicators
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Non-intrusive feedback
- **Smooth Animations** - Enhanced user interactions

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting platform

### Database Deployment
- Supabase handles database hosting automatically
- Configure production environment variables
- Set up proper CORS settings for your domain

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 API Documentation

### Key API Endpoints

#### Movies
```javascript
// Get all movies
GET /movies

// Get movie details
GET /movies/:id

// Get movie shows
GET /movies/:id/shows
```

#### Bookings
```javascript
// Create booking
POST /bookings

// Get user bookings
GET /bookings/user/:userId

// Update booking status
PUT /bookings/:id
```

#### Admin
```javascript
// Add new movie
POST /admin/movies

// Create show
POST /admin/shows

// Get booking analytics
GET /admin/analytics
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
- Verify Supabase URL and API key
- Check network connectivity
- Ensure RLS policies are properly configured

#### Authentication Issues
- Clear browser cache and cookies
- Verify email confirmation (if required)
- Check Supabase auth settings

#### Build Issues
- Clear node_modules and reinstall dependencies
- Check Node.js version compatibility
- Verify environment variables

## 📊 Performance

### Optimization Features
- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Compressed and responsive images
- **Database Indexing** - Optimized database queries
- **Caching** - Efficient data caching strategies

### Monitoring
- **Real-time Analytics** - Booking and user metrics
- **Error Tracking** - Comprehensive error logging
- **Performance Metrics** - Load time and response monitoring

## 🔮 Future Enhancements

### Planned Features
- **Mobile App** - React Native application
- **Advanced Analytics** - Detailed reporting dashboard
- **Social Features** - User reviews and ratings
- **Loyalty Program** - Points and rewards system
- **Multi-language Support** - Internationalization
- **Advanced Search** - AI-powered movie recommendations

### Technical Improvements
- **Microservices Architecture** - Scalable backend services
- **GraphQL API** - More efficient data fetching
- **Progressive Web App** - Offline functionality
- **Advanced Caching** - Redis integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Mahmudur Rahman Moin**
- **Sadman Shihab**

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [database documentation](database/README.md)
- Review the troubleshooting section above

## 📞 Contact
- mrmoin529@gmail.com
- sadmanshihab716@gmail.com

## 🙏 Acknowledgments

- **Supabase** - For the amazing backend platform
- **React Team** - For the excellent frontend framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Vite** - For the fast build tooling

---

**CineVerse** - Bringing the magic of cinema to the digital world! 🎬✨

Made with ❤️ for movie lovers everywhere.
