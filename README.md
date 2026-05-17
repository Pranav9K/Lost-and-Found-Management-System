# 🔍 NITR Lost & Found Portal

[![Node.js](https://img.shields.io/badge/Node.js-Backend-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Framework-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-success.svg)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Image_Hosting-blue.svg)](https://cloudinary.com/)
[![Render](https://img.shields.io/badge/Render-Deployed-purple.svg)](https://render.com/)

**🔗 Live Website:** [https://nitrlostandfound.onrender.com](https://nitrlostandfound.onrender.com)

## 📖 Project Overview
A secure, full-stack **Lost & Found Web Application** built exclusively for the students and faculty of the **National Institute of Technology, Rourkela (NITR)**. 

The platform provides a centralized, secure environment for the campus community to report lost items, post found belongings, and communicate to coordinate returns. By leveraging domain-restricted email authentication, the app ensures that only verified campus residents can access the database, maintaining privacy and trust.

## 🎯 Motivation
On a large university campus, lost belongings (IDs, keys, electronics) are often reported in fragmented WhatsApp groups or physical notice boards, leading to low recovery rates and potential privacy risks. This project was built to solve that problem by creating a **centralized, searchable, and secure database** that streamlines the recovery process while protecting student identity.

## 🛠️ Tech Stack & Architecture
This project is built using a modern **Node.js/Express** backend with a lightweight, fast vanilla JavaScript frontend.

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (Fully responsive & mobile-first).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB (via Mongoose for schema modeling).
* **Image Hosting:** Cloudinary (via Multer middleware for secure image uploads).
* **Authentication:** Custom OTP-based email authentication (Nodemailer).

## 🔐 Key Features & Security 
This application prioritizes security and spam prevention to ensure a safe user experience:

* **Domain-Restricted Auth:** Custom login system that strictly allows registration and access *only* via `@nitrkl.ac.in` email addresses using OTP verification. No passwords required.
* **Rate Limiting:** Implemented `express-rate-limit` to prevent brute-force OTP attacks and spam item submissions (e.g., max 25 submissions per 15 minutes).
* **HTTP Security:** Integrated `helmet.js` to secure Express apps by setting various HTTP headers and preventing common cross-site scripting (XSS) vulnerabilities.
* **Media Management:** Automated image uploading and optimization via Cloudinary, keeping the primary database lightweight and fast.
* **Contact & Response System:** Built-in messaging/response board allowing users to safely reach out to finders/owners.

# How to Run the NITR Lost & Found Portal Locally

Follow these steps to run the application on your own machine.

### Step 1: Clone the Repository
Open your terminal and clone the repository using the following commands:

git clone https://github.com/yourusername/nitr-lost-and-found.git

cd nitr-lost-and-found

### Step 2: Install Dependencies
Install all required Node modules by running:
npm install

### Step 3: Set Up Environment Variables
Create a file named `.env` in the root folder of the project.
Open the `.env` file and add the following configuration, replacing the placeholders with your actual keys:

PORT=3019
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_nodemailer_email
EMAIL_PASS=your_nodemailer_password

### Step 4: Start the Server
Run the application using:
npm start

The server should now be running. Open your browser and go to:
http://localhost:3019

