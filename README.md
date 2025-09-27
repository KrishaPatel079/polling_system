# Polling System with Real-time Results Dashboard

A secure online polling system with real-time results, built with React, Node.js, MongoDB, and Socket.IO.

## 🚀 Features

### Core Functionality
- **Admin Features**: Create polls with multiple options
- **Student Features**: Vote once per poll with real-time validation
- **Real-time Updates**: Live results with Socket.IO integration
- **Data Visualization**: Interactive charts (Bar & Pie charts) using Recharts
- **Security**: JWT authentication, bcrypt password hashing
- **Responsive Design**: Modern UI with Tailwind CSS

### Technical Features
- Duplicate vote prevention with database constraints
- Real-time vote counting and result updates
- User role-based access control (Admin/Student)
- RESTful API architecture
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO
- **Environment**: dotenv for configuration

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts library
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/KrishaPatel079/polling_system.git
cd polling-system
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration:
# PORT=4000
# MONGO_URI=mongodb://localhost:27017/polling
# JWT_SECRET=your-super-secret-key
# FRONTEND_ORIGIN=http://localhost:5173

# Seed admin user
npm run seed

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:4000" > .env
echo "VITE_SOCKET_URL=http://localhost:4000" >> .env

# Start frontend development server
npm run dev
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# For macOS with Homebrew
brew services start mongodb-community

# For Ubuntu
sudo systemctl start mongod

# For Windows
net start MongoDB
```

## 🎯 Usage

### Admin Features
1. **Login** with admin credentials (admin@example.com / adminpass)
2. **Create Polls** with multiple options (2-10 options supported)
3. **Monitor Results** in real-time with interactive charts
4. **View Analytics** with detailed voting statistics

### Student Features
1. **Register** or login with student account
2. **Browse Polls** with search and filter options
3. **Cast Votes** (one vote per poll, enforced by database constraints)
4. **View Results** in real-time after voting

### Real-time Features
- Live vote updates without page refresh
- Real-time chart updates when new votes are cast
- Socket.IO rooms for poll-specific updates
- Instant feedback on voting actions

## 📁 Project Structure

```
polling-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Authentication middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── index.js         # Main server file
│   ├── .env.example         # Environment template
│   └── package.json         # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Auth/        # Authentication components
│   │   │   ├── Charts/      # Chart components
│   │   │   ├── Layout/      # Layout components
│   │   │   └── Polls/       # Poll-related components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API and Socket services
│   │   ├── App.jsx          # Main App component
│   │   └── main.jsx         # React entry point
│   ├── .env                 # Environment variables
│   └── package.json         # Frontend dependencies
└── README.md                # This file
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Server-side validation for all inputs
- **Duplicate Vote Prevention**: Database-level constraints
- **Role-based Access**: Admin/Student role separation

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Polls
- `GET /api/polls` - Get all polls
- `GET /api/polls/:id` - Get specific poll
- `POST /api/polls` - Create new poll (Admin only)
- `POST /api/polls/:id/vote` - Cast vote

## 🎨 UI Components

### Key Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Charts**: Bar and pie charts with hover effects
- **Real-time Updates**: Live data without page refresh
- **Modern UI**: Clean, professional interface
- **Accessibility**: Semantic HTML and proper ARIA labels

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/polling
JWT_SECRET=your-super-secret-key-here
FRONTEND_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and start: `npm start`
3. Ensure MongoDB is accessible
4. Configure reverse proxy (nginx/Apache)

### Frontend Deployment
1. Build the project: `npm run build`
2. Serve the `dist` folder
3. Update API URLs for production

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Admin poll creation
- [ ] Student voting (single vote per poll)
- [ ] Real-time result updates
- [ ] Chart visualization accuracy
- [ ] Responsive design on different devices

## 👥 Team Information

**Team Members:**
- Rutvi Gohil(D24DCS178) - Backend Developer
- Krisha Patel(23DCS79) - Frontend Developer
- Drashti Gaikwad (D24DCS171) - UI/UX Designer & Database Management

**Roles and Responsibilities:**
- Database Design & API Development
- Frontend UI/UX & React Components  
- Real-time Features & Socket.IO Integration
- Testing & Documentation

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify database permissions

2. **Socket.IO Connection Issues**
   - Check CORS configuration
   - Verify frontend/backend URLs match
   - Check firewall settings

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set
