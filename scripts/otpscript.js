function generateFourDigitNumber() {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCredentialInput() {
  return document.querySelector('.auth-input') || document.querySelector('.email-box');
}

function rollDisplayFromEmail(email) {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[0].toUpperCase();
}

let otpSendInFlight = false;

document.addEventListener("DOMContentLoaded", function () {
  const credentialBox = getCredentialInput();
  const otpBox = document.querySelector('.otp-box');

  if (credentialBox) {
    credentialBox.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendOTP();
      }
    });
  }

  if (otpBox) {
    otpBox.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        verifyOTP();
      }
    });
  }
});

function sendOTP() {
  const emailEl = getCredentialInput();
  if (!emailEl) {
    alert("Roll number or email field not found.");
    return;
  }

  const raw = emailEl.value.trim();
  if (!raw) {
    alert("Please enter your roll number or full @nitrkl.ac.in email");
    return;
  }

  let email = raw;
  if (!email.includes('@')) {
    email = email.toLowerCase() + '@nitrkl.ac.in';
  } else {
    email = email.toLowerCase();
  }

  if (!email.endsWith('@nitrkl.ac.in')) {
    alert("Use your NIT Rourkela roll number or an @nitrkl.ac.in email address");
    return;
  }

  const storedOtp = localStorage.getItem('otp');
  const storedExpiry = parseInt(localStorage.getItem('otpExpiry') || '0', 10);
  const storedEmail = (localStorage.getItem('otpEmail') || '').toLowerCase();

  if (storedOtp && storedExpiry && Date.now() < storedExpiry && storedEmail === email) {
    alert('An OTP was already sent to this address. Check your email, or wait until it expires before requesting again.');
    return;
  }

  if (otpSendInFlight) {
    return;
  }

  const sendBtn = document.getElementById('send-otp-btn');
  otpSendInFlight = true;
  if (sendBtn) {
    sendBtn.disabled = true;
  }

  const rollDisplay = rollDisplayFromEmail(email);
  const otpCode = generateFourDigitNumber();
  const expiry = Date.now() + 15 * 60 * 1000;

  localStorage.setItem('otp', otpCode.toString());
  localStorage.setItem('otpExpiry', expiry.toString());
  localStorage.setItem('otpEmail', email);
  localStorage.setItem('Username', rollDisplay);

  const parms = {
    passcode: otpCode,
    email: email,
    time: new Date(expiry).toLocaleString()
  };

  emailjs.send("service_otp", "template_fe1awch", parms)
    .then(function () {
      alert("OTP sent to your email!");
      window.location.href = "otpindex.html";
    })
    .catch(function (error) {
      console.error("Failed to Send OTP", error);
      alert("Failed to send OTP. Try again.");
      localStorage.removeItem("otp");
      localStorage.removeItem("otpExpiry");
      localStorage.removeItem("otpEmail");
      localStorage.removeItem("Username");
    })
    .finally(function () {
      otpSendInFlight = false;
      if (sendBtn) {
        sendBtn.disabled = false;
      }
    });
}


function verifyOTP() {
  const otpInput = document.querySelector('.otp-box');
  if (!otpInput) {
    alert("OTP input not found.");
    return;
  }

  const enteredOTP = otpInput.value.trim();
  if (enteredOTP === "") {
    alert("Please enter the OTP");
    return;
  }

  const storedOTP = localStorage.getItem("otp");
  const storedExpiry = parseInt(localStorage.getItem("otpExpiry") || "0", 10);
  const otpEmail = localStorage.getItem("otpEmail");

  if (!storedOTP || !storedExpiry) {
    alert("No OTP found. Please request a new OTP.");
    window.location.href = "/signin.html";
    return;
  }

  if (Date.now() > storedExpiry) {
    alert("OTP expired. Please request a new OTP.");
    localStorage.removeItem("otp");
    localStorage.removeItem("otpExpiry");
    localStorage.removeItem("otpEmail");
    window.location.href = "/signin.html";
    return;
  }

  if (enteredOTP === storedOTP) {
    if (otpEmail) {
      localStorage.setItem("Username", rollDisplayFromEmail(otpEmail));
    }
    alert("Login Successful");
    localStorage.removeItem("otp");
    localStorage.removeItem("otpExpiry");
    localStorage.removeItem("otpEmail");
    window.location.href = "/home.html";
  } else {
    alert("Invalid OTP. Please try again.");
  }
}
