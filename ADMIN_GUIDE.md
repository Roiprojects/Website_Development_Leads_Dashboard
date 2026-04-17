# Admin Guide: Website Development Leads Dashboard

This document provides instructions for managing your dashboard and using the recovery system.

## 1. Accessing the Admin Panel
- **Login URL:** `/login` (Hidden from the main dashboard for security)
- **Default Username:** `admin`
- **Default Password:** `admin123`

## 2. Security Recovery PIN (Forgot Password)
If you forget your admin password, you can reset it using the **Security Recovery PIN**.
- **Default PIN:** `1234`
- **How to use:** 
  1. Go to the login page.
  2. Click "Forgot Password?".
  3. Enter your username, your **Security PIN**, and a new password.

**⚠️ IMPORTANT:** It is highly recommended to change your default password and PIN immediately after your first login.

## 3. How to Change Password & PIN
1. Log in to the Admin Panel.
2. Go to the **Settings** tab.
3. Use the **Reset Password** section to change your login password.
4. Use the **Security Recovery PIN** section to set a new 4-6 digit recovery PIN.

## 4. Real-Time Synchronization
The dashboard automatically fetches new data and settings every **10 seconds**. Any changes you make in the Admin Panel (like updating the project title or enquiry numbers) will reflect on the public dashboard automatically.

## 5. Deployment Information
This project is connected to GitHub:
- **Repository:** `https://github.com/Roiprojects/Website_Development_Leads_Dashboard`
- **Database:** The `database.sqlite` file is tracked in Git, ensuring your 1000 names and settings are preserved.
