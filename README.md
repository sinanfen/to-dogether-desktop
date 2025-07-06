# To-Dogether Desktop

A modern Electron.js desktop application for couples to manage shared to-do lists with real-time synchronization and secure authentication.

## 🚀 Features

- **Couple Management**: Create and manage shared to-do lists with your partner
- **Real-time Sync**: Changes sync automatically between partners
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Profile Management**: Customize your profile with color themes
- **Priority System**: Organize tasks with priority levels
- **Drag & Drop**: Intuitive task management with drag-and-drop interface
- **Modern UI**: Beautiful interface built with TailwindCSS

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, TailwindCSS
- **Desktop**: Electron.js
- **Backend**: ASP.NET Core Web API
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket support (planned)

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- ASP.NET Core backend running

### Setup

1. Clone the repository:
```bash
git clone https://github.com/sinanfen/to-dogether-desktop.git
cd to-dogether-desktop
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API endpoint in `src/js/config.js`:
```javascript
const API_BASE_URL = 'https://your-api-url.com/api';
```

4. Run the application:
```bash
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
API_BASE_URL=https://your-api-url.com/api
NODE_ENV=development
```

### API Configuration

The app expects the following API endpoints:

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `GET /users/me` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /todo-lists` - Get user's todo lists
- `POST /todo-lists` - Create new todo list
- `GET /todo-lists/{id}/items` - Get todo items
- `POST /todo-lists/{id}/items` - Create todo item
- `PUT /todo-items/{id}` - Update todo item
- `DELETE /todo-items/{id}` - Delete todo item

## 🎯 Usage

### Getting Started

1. **Register/Login**: Create an account or login with existing credentials
2. **Invite Partner**: Use invite codes to connect with your partner
3. **Create Lists**: Create shared to-do lists for different projects
4. **Add Tasks**: Add tasks with priorities and descriptions
5. **Collaborate**: Both partners can view and edit shared lists

### Features

- **Profile Management**: Click the settings icon to edit your profile
- **Color Themes**: Choose your favorite color for personalization
- **Priority Badges**: Use priority levels to organize tasks
- **Real-time Updates**: Changes appear instantly for both partners

## 🏗️ Project Structure

```
to-dogether-desktop/
├── src/
│   ├── js/
│   │   ├── app.js          # Main application logic
│   │   ├── auth.js         # Authentication service
│   │   ├── config.js       # Configuration settings
│   │   └── utils.js        # Utility functions
│   └── css/
│       └── styles.css      # Custom styles
├── index.html              # Main application window
├── main.js                 # Electron main process
├── renderer.js             # Electron renderer process
├── package.json            # Project dependencies
└── README.md              # This file
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials
2. **Token Storage**: JWT tokens stored securely
3. **Auto Refresh**: Access tokens automatically refreshed
4. **Session Management**: Persistent login sessions
5. **Logout**: Secure token cleanup

## 🚀 Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Packaging

```bash
npm run package
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Electron.js for cross-platform desktop support
- Styled with TailwindCSS for modern UI
- Integrated with ASP.NET Core backend for robust API support

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

Made with ❤️ for couples who want to stay organized together.
