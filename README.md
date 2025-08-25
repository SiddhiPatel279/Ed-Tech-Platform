# Ed-Tech-Platform Backend (Node.js/Express/MongoDB)

A production-ready backend for an e-learning platform inspired by StudyNotion-style apps. It provides user authentication with OTP email verification, role-based access (Student/Instructor/Admin), course/catalog management (courses, sections, subsections & media uploads), ratings & reviews, payments via Razorpay, profile management (including avatars), and rich email notifications. The stack uses **Node.js**, **Express**, **MongoDB (Mongoose)**, **JWT**, **Cloudinary**, **Nodemailer**, and **Razorpay**.

---

## Table of Contents

* [Features](#features)
* [Tech Stack & Dependencies](#tech-stack--dependencies)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)

  * [Requirements](#requirements)
  * [Installation](#installation)
  * [Environment Variables](#environment-variables)
  * [Run the Server](#run-the-server)
* [Usage](#usage)

  * [Auth](#auth)
  * [Profile](#profile)
  * [Courses & Content](#courses--content)
  * [Categories](#categories)
  * [Ratings & Reviews](#ratings--reviews)
  * [Payments (Razorpay)](#payments-razorpay)
* [Contributing](#contributing)
* [License](#license)
* [Support](#support)

---

## Features

* 🔐 **Auth & OTP**: Email OTP for sign-up, JWT auth, password reset flows.
* 👥 **RBAC**: Role-based access control for **Student**, **Instructor**, **Admin** (middleware).
* 🎓 **Course Management**: Create courses with thumbnail upload (Cloudinary), sections & subsections with video upload; fetch full course details.
* 🏷️ **Categories**: Create & list categories, category landing data.
* ⭐ **Ratings & Reviews**: Post reviews, compute average ratings, list all reviews.
* 💳 **Payments**: Capture order and verify signature via Razorpay; auto-enroll learner + email confirmation.
* 👤 **Profile**: Update profile & avatar, fetch enrolled courses, delete account.
* 📧 **Emails**: Nodemailer templates for password updates, email verification and course enrollment.
* ☁️ **Media**: Cloudinary integration for images/video (via `express-fileupload` temp files).
* 🍪 **Cookies**: JWT set in `httpOnly` cookie; also supports `Authorization: Bearer <token>` header.
* 🔒 **Security Ready**: Secrets via `.env`; CORS configured; input validation at controllers.

---

## Tech Stack & Dependencies

**Runtime & Core**

* Node.js (Express), MongoDB (Mongoose), JWT

**Key Libraries**

* **bcrypt**: ^5.1.1
* **bcryptjs**: ^3.0.2
* **cloudinary**: ^2.6.0
* **cookie-parser**: ^1.4.7
* **cors**: ^2.8.5
* **crypto-random-string**: ^5.0.0
* **dotenv**: ^16.4.7
* **express**: ^4.21.2
* **express-fileupload**: ^1.5.1
* **jsonwebtoken**: ^9.0.2
* **mongoose**: ^8.10.1
* **nodemailer**: ^6.10.0
* **nodemon**: ^3.1.9
* **otp-generator**: ^4.0.1
* **razorpay**: ^2.9.6

**Dev**

* `nodemon` for hot-reload in development

---


Key folders:

* `config/` → DB, Cloudinary, Razorpay config
* `controllers/` → Route handlers (Auth, Course, Payments, Profile, etc.)
* `middlewares/` → `auth`, `isStudent`, `isInstructor`, `isAdmin`
* `models/` → Mongoose schemas (User, Course, Section, SubSection, Category, RatingAndReview, OTP, CourseProgress)
* `routes/` → Route modules bound in `index.js`
* `utils/` → `mailSender`, `imageUploader`
* `mail/templates/` → HTML email templates

---

## Getting Started

### Requirements

* **Node.js** v18+ and **npm**
* A **MongoDB** instance (Atlas or local)
* **Cloudinary** account (for media)
* **Razorpay** account (test keys for sandbox)
* SMTP creds (e.g., Gmail or any mail provider)

### Installation

```bash
# From the repository root, enter the server:
cd server

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file inside `server/` with the following keys (sample names only — insert your own values):

```bash
# Server
PORT=4000

# Database
MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Auth
JWT_SECRET=<super-secret-string>

# Cloudinary
CLOUD_NAME=<cloud-name>
API_KEY=<cloudinary-api-key>
API_SECRET=<cloudinary-api-secret>
FOLDER_NAME=<cloudinary-folder-for-uploads>

# Mail
MAIL_HOST=<smtp-host>
MAIL_USER=<smtp-user>
MAIL_PASS=<smtp-pass>

# Razorpay
RAZORPAY_KEY=<razorpay-key-id>
RAZORPAY_SECRET=<razorpay-key-secret>
```

> **Security Tips**
>
> * Do **not** log OTPs or secrets in production.
> * Restrict CORS to your deployed front-end origin(s).
> * Use per-environment `.env` files and secret stores in CI/CD.

### Run the Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

By default, the API listens on `http://localhost:$PORT`.

---

## Usage

**Base URL:** `http://localhost:4000` (or your configured `PORT`)

**Auth:** JWT is returned on login and also set as an `httpOnly` cookie named `token`.

* You may pass the token via header: `Authorization: Bearer <token>`.
* Or rely on the cookie (attach cookie jar in clients like Postman).

### Auth

* **POST** `/api/v1/user/sendotp`

  ```json
  { "email": "learner@example.com" }
  ```

* **POST** `/api/v1/user/signup`

  ```json
  {
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com",
    "password": "P@ssw0rd!",
    "confirmPassword": "P@ssw0rd!",
    "accountType": "Student",      // or "Instructor", "Admin"
    "contactNumber": "9999999999",
    "otp": "123456"
  }
  ```

* **POST** `/api/v1/user/login`

  ```json
  { "email": "ada@example.com", "password": "P@ssw0rd!" }
  ```

* **POST** `/api/v1/user/changepassword` (auth)

  ```json
  {
    "oldPassword": "P@ssw0rd!",
    "newPassword": "N3wP@ss!",
    "confirmNewPassword": "N3wP@ss!"
  }
  ```

* **POST** `/api/v1/user/reset-password-token`

  ```json
  { "email": "ada@example.com" }
  ```

* **POST** `/api/v1/user/reset-password`

  ```json
  {
    "password": "N3wP@ss!",
    "confirmPassword": "N3wP@ss!",
    "token": "<token-from-link>"
  }
  ```

### Profile

* **GET** `/api/v1/profile/getUserDetails` (auth)
* **PUT** `/api/v1/profile/updateProfile` (auth)

  ```json
  {
    "dateOfBirth": "2000-01-01",
    "about": "Love building things.",
    "contactNumber": "9999999999"
  }
  ```
* **PUT** `/api/v1/profile/updateDisplayPicture` (auth, multipart)

  ```bash
  curl -X PUT http://localhost:4000/api/v1/profile/updateDisplayPicture \
    -H "Authorization: Bearer $TOKEN" \
    -F "displayPicture=@/path/to/avatar.png"
  ```
* **GET** `/api/v1/profile/getEnrolledCourses` (auth)
* **DELETE** `/api/v1/profile/deleteProfile` (auth)

### Courses & Content

* **GET** `/api/v1/course/getAllCourses`

* **POST** `/api/v1/course/getCourseDetails`

  ```json
  { "courseId": "<course-id>" }
  ```

* **POST** `/api/v1/course/createCourse` (auth + Instructor, multipart)

  ```bash
  curl -X POST http://localhost:4000/api/v1/course/createCourse \
    -H "Authorization: Bearer $TOKEN" \
    -F "courseName=Intro to ML" \
    -F "courseDescription=Learn ML from scratch" \
    -F "whatYouWillLearn=Supervised, Unsupervised, Hands-on" \
    -F "price=999" \
    -F "tag[]=ml" -F "tag[]=ai" \
    -F "category=<category-id>" \
    -F "status=Published" \
    -F "instructions[]=Complete prereqs" \
    -F "thumbnail=@/path/to/cover.jpg"
  ```

* **POST** `/api/v1/course/addSection` (auth + Instructor)

  ```json
  { "courseId": "<course-id>", "sectionName": "Getting Started" }
  ```

* **POST** `/api/v1/course/updateSection` (auth + Instructor)

  ```json
  { "sectionId": "<section-id>", "sectionName": "Basics" }
  ```

* **(Typical)** `/api/v1/course/addSubSection` (auth + Instructor, multipart)

  ```bash
  curl -X POST http://localhost:4000/api/v1/course/addSubSection \
    -H "Authorization: Bearer $TOKEN" \
    -F "sectionId=<section-id>" \
    -F "title=Intro Video" \
    -F "timeDuration=05:00" \
    -F "description=Welcome to the course" \
    -F "videoFile=@/path/to/video.mp4"
  ```

### Categories

* **POST** `/api/v1/course/createCategory` (auth + Admin)

  ```json
  { "name": "Data Science", "description": "All things DS" }
  ```
* **GET** `/api/v1/course/showAllCategories`
* **POST** `/api/v1/course/getCategoryPageDetails`

  ```json
  { "categoryId": "<category-id>" }
  ```

### Ratings & Reviews

* **POST** `/api/v1/course/createRating` (auth + Student)

  ```json
  { "courseId": "<course-id>", "rating": 5, "review": "Fantastic!" }
  ```
* **GET** `/api/v1/course/getAverageRating?courseId=<course-id>`
* **GET** `/api/v1/course/getReviews`

### Payments (Razorpay)

* **POST** `/api/v1/payment/capturePayment` (auth + Student)

  ```json
  { "course_id": "<course-id>" }
  ```

  Response includes `{ orderId, currency, amount, ... }` for Razorpay Checkout.

* **POST** `/api/v1/payment/verifySignature` (webhook)

  * Header: `x-razorpay-signature: <signature>`
  * Body: Razorpay payload; uses `payload.payment.entity.notes.courseId` and `userId` to enroll user and send confirmation email.

> **Note:** Configure your Razorpay webhook to point to this endpoint and keep the webhook secret in sync with the controller.

---

## Contributing

1. **Fork** the repo and create your feature branch: `git checkout -b feat/awesome-thing`
2. **Install** dependencies in `server/` and set up your `.env`.
3. **Commit** with conventional messages (e.g., `feat(auth): add OTP rate-limit`).
4. **Open a PR** with a clear description and testing notes.

### Code Style & Quality

* Use meaningful variable names and controller extraction for clarity.
* Validate all inputs in controllers; prefer returning consistent JSON shapes.
* Avoid committing `.env`, secrets, or personal data.

### Roadmap Ideas

* Unit/integration tests (Jest + Supertest).
* Rate limiting and request validation (e.g., `express-rate-limit`, `zod/joi`).
* Pagination and search for catalog endpoints.
* Admin dashboards and analytics.

---

## License

This project is licensed under the **ISC** license (see `package.json`).

---

## Support

For questions, issues, or feature requests, please open a GitHub **Issue** or **Discussion**.

**Contact (replace with your details):**

* Email: `patelsiddhi279@gmail.com`
* Maintainer: `Siddhi Patel`

---
