# Apna College Cookie Sharing System

This project enhances the Apna College Cookie Manager Chrome extension to automatically share cookies with a friend through a web server, allowing both of you to stay logged in without manual cookie file transfers.

## Components

1. **Chrome Extension**: Automatically exports cookies and sends them to the server when you log in
2. **Web Server**: Stores the cookies in MongoDB and provides a status API
3. **Web App**: Allows your friend to check your login status and download the latest cookies

## Setup Instructions

### 1. Install MongoDB

If you don't have MongoDB installed:
- Download and install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
- Start the MongoDB service

### 2. Set Up the Server

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The server will run on http://localhost:3000 by default.

### 3. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the extension directory
4. The extension should now appear in your browser toolbar

### 4. How to Use

#### For You (The Person Logging In):
1. Log in to Apna College normally
2. Click the extension icon in your browser toolbar
3. Click "Export Cookies" - this will:
   - Download the cookies file to your computer
   - Automatically send the cookies to the server for your friend to use
4. When you log out, click "Clear and Refresh" in the extension to notify your friend

#### For Your Friend:
1. Open the web app at http://localhost:3000
2. Check if you're currently logged in (green status dot)
3. Click "Get Cookies" to fetch the latest cookies
4. Download the cookies file
5. Use the extension to import the cookies (click "Import Cookies")

## Deployment

For production use, you should:

1. Deploy the server to a hosting service (like Heroku, Render, or DigitalOcean)
2. Update the SERVER_URL in popup.js to point to your deployed server
3. Update the content_security_policy in manifest.json with your deployed domain
4. Set up a MongoDB database service (like MongoDB Atlas)
5. Update the MONGODB_URI in the .env file

## Security Considerations

- This system is designed for sharing between trusted individuals
- The cookies provide full account access, so be careful who you share with
- Consider adding authentication to the web app in a production environment
