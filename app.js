const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
// console.log(process.env); // Debugging
console.log('Email User:', process.env.EMAIL_USER  ? 'Exists' : 'Missing'); // Debugging
console.log('Email Pass:', process.env.EMAIL_PASS ? 'Exists' : 'Missing');



const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Email rate limiter
const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests
    message: 'Too many emails sent from this IP, please try again later.',
});

// Email configuration with nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Specify the email service provider
    auth: {
        user: process.env.EMAIL_USER, // Load from .env
        pass: process.env.EMAIL_PASS, // Load from .env 
    },
});

// Debugging the transporter configuration
transporter.verify()
    .then(() => console.log('Email transporter is ready to send messages.'))
    .catch((error) => {
        console.error('Error configuring email transporter:', error);
        process.exit(1); // Exit the process if the transporter isn't configured properly
    });

// POST request to send an email
app.post('/send-email', emailLimiter, async (req, res) => {
    const { name, email, designation, subject, message } = req.body;

    // Validate input fields
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Validate email format
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Email content and options
    const mailOptions = {
        from: `"${name}" <babysneha69@gmail.com>`,  // Must be your verified email
        replyTo: email,  // This makes sure replies go to the sender
        to: 'jeeth.enterprises108@gmail.com',
        subject: subject,
        text: message, // Fallback plain text version
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; max-width: 600px;">
                <h2 style="color: #0056b3;">${subject}</h2>
                <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                <p><strong>Designation:</strong> ${designation || 'N/A'}</p>
                <hr>
                <p>${message}</p>
                <br>
                <p>Best regards,<br><strong>${name}</strong></p>
            </div>
        `,
    };
    
    

    try {
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        res.status(200).json({ success: true, message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
