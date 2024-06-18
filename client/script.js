document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in
  function checkAuth() {
    return localStorage.getItem("user") !== null;
  }

  function getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  function updateNav() {
    const navLinks = document.getElementById("nav-links");
    if (checkAuth()) {
      navLinks.innerHTML = `
                <a href="/reserve.html">Reserve</a>
                <a href="/view.html">Reserved</a>
                <a href="#" id="logout-link">Logout</a>
            `;
      document.getElementById("logout-link").addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "/";
      });
    } else {
      navLinks.innerHTML = `
                <a href="/login.html">Login</a>
                <a href="/signup.html">Sign Up</a>
            `;
    }
  }

  updateNav();

  // Book a Table button functionality
  const bookTableBtn = document.getElementById("book-table-btn");
  if (bookTableBtn) {
    bookTableBtn.addEventListener("click", function () {
      if (checkAuth()) {
        window.location.href = "/reserve.html";
      } else {
        window.location.href = "/login.html";
      }
    });
  }

  // Handle login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const loginData = {};
      formData.forEach((value, key) => {
        loginData[key] = value;
      });

      try {
        const response = await fetch("http://localhost:3000/user/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        });
        const result = await response.json();
        console.log('Login Response:', result);
        if (result.success === false) {
          alert(result.message);
        } else {
          alert("Login Successful");
          localStorage.setItem(
            "user",
            JSON.stringify({ token: result.token, userRef: result._id })
          );
          window.location.href = "/reserve.html";
        }
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Handle sign up
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(signupForm);
      const signupData = {};
      formData.forEach((value, key) => {
        signupData[key] = value;
      });

      try {
        const response = await fetch("http://localhost:3000/user/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signupData),
        });
        const result = await response.json();
        if (result.success === false) {
          alert(result.message);
        } else {
          alert("Sign Up Successful");
          window.location.href = "/login.html";
        }
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Handle reservation
  const reservationForm = document.getElementById("reservation-form");
  if (reservationForm) {
    reservationForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(reservationForm);
      const reservationData = {};
      formData.forEach((value, key) => {
        reservationData[key] = value;
      });

      const user = getUser();
      console.log('User Object:', user);

      reservationData.userRef = user.userRef;
      console.log('Reservation Data:', reservationData); 

      try {
        const response = await fetch("http://localhost:3000/reserve/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify( reservationData ),
        });
        const result = await response.json();
        console.log('Response:', result);
        if (result.success === false) {
          alert(result.message);
        } else {
          alert("Reservation Successful");
          window.location.href = "/view.html";
          reservationForm.reset();
        }
      } catch (error) {
        alert(error.message);
      }
    });
  }

 // Fetch and display reservation details
 const reservationDetailsDiv = document.getElementById("reservation-details");
 const user = getUser();

 if (reservationDetailsDiv) {
   fetch(`http://localhost:3000/user/getReservation/${user.userRef}`)
     .then((response) => response.json())
     .then((data) => {
       console.log('Reservation Data:', data); // Log the data for debugging
       if (!data || data.length === 0) {
         reservationDetailsDiv.innerHTML = "<p>No reservation details found</p>";
       } else {
         const reservationsHTML = data.map(reservation => `
           <div class="reservation">
             <p>Name: ${reservation.name || 'N/A'}</p>
             <p>Guests: ${reservation.guests || 'N/A'}</p>
             <p>Date: ${reservation.date ? new Date(reservation.date).toLocaleDateString() : 'N/A'}</p>
             <p>Time: ${reservation.time || 'N/A'}</p>
             <p>Menu: ${reservation.menu || 'N/A'}</p>
             <p>Table: ${reservation.tableType || 'N/A'}</p>
           </div>
         `).join('');
         reservationDetailsDiv.innerHTML = reservationsHTML;
       }
     })
     .catch((error) => {
       console.error("Error fetching reservation details:", error);
       reservationDetailsDiv.innerHTML = "<p>Error fetching reservation details</p>";
     });
 }
});
