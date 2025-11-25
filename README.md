# motion

Motion is a centralized platform for event discovery at the University of Washington. It simplifies engagement and fosters connections by allowing UW students and registered student organizations (RSOs) to create, share, and RSVP to events.

## Table of Contents

- [motion](#motion)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
    - [Frontend:](#frontend)
    - [Backend:](#backend)
    - [Others:](#others)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running the Project](#running-the-project)

## Features

- **Event Feed**: Discover and filter events based on interests and tags.
- **Event Creation**: Create public or private events with customizable visibility.
- **RSVP Management**: RSVP to events and track attendance.
- **User Profiles**: View user and organization profiles with event history.

---

## Technologies Used

### Frontend:
- React with TypeScript
- CSS Framework: TBD

### Backend:
- Node.js with Express
- MongoDB with Mongoose
- TypeScript

### Others:
- CI/CD: GitHub Actions
- Deployment: TBD
- Authentication: JWT

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Docker (https://docs.docker.com/get-docker/)
- Node.js (v16+)
- npm
- MongoDB

### Installation

1. **Clone the repository**:
```
git clone https://github.com/hcp-uw/motion.git
cd motion
```
2. **Set up the backend**:
```
cd server
npm install
```
3. **Set up the the frontend**
```
cd ../client
npm install
```

### Running the Project

1. **Start MongoDB**: Ensure MongoDB is running locally or provide a connection string in your `.env`.

2. **Start the backend**
```
cd server
npm run dev
```
3. **Start the frontend**
```
cd ../client
npm run dev
```