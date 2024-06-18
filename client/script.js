document.addEventListener("DOMContentLoaded", function () {
  

  // Check if user is logged in
  function checkAuth() {
    return localStorage.getItem("user") !== null;
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
        if (response.ok) {
          alert("Login Successful");
          localStorage.setItem("user", JSON.stringify(result.user));
          window.location.href = "/reserve.html";
        } else {
          alert("Login Failed: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to login");
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
        if (response.ok) {
          alert("Sign Up Successful");
          localStorage.setItem("user", JSON.stringify(result.user));
          window.location.href = "/login.html";
        } else {
          alert("Sign Up Failed: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to sign up");
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

      const user = JSON.parse(localStorage.getItem("user"));
      reservationData.userRef = user.id;

      try {
        const response = await fetch("http://localhost:3000/reserve/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(reservationData),
        });
        const result = await response.json();
        if (response.ok) {
          alert("Reservation Successful: " + JSON.stringify(result));
          window.location.href = "/view.html";
          reservationForm.reset();
        } else {
          alert("Reservation Failed: " + result.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to make reservation");
      }
    });
  }

  // Display reservation details
  const reservationDetailsDiv = document.getElementById("reservation-details");
  if (reservationDetailsDiv) {
    const urlParams = new URLSearchParams(window.location.search);
    const reservationId = urlParams.get("id");

    if (reservationId) {
      fetch(`http://localhost:3000/reserve/get/${reservationId}`)
        .then((response) => response.json())
        .then((data) => {
          reservationDetailsDiv.innerHTML = `
                        <p>Name: ${data.name}</p>
                        <p>Guests: ${data.guests}</p>
                        <p>Date: ${new Date(data.date).toLocaleDateString()}</p>
                        <p>Time: ${data.time}</p>
                        <p>Menu: ${data.menu}</p>
                        <p>Table: ${data.tableSeat}</p>
                    `;
        })
        .catch((error) => {
          console.error("Error:", error);
          reservationDetailsDiv.innerHTML =
            "<p>Error fetching reservation details</p>";
        });
    }
  }
  router.put("/update/:id", verifyToken, async (req, res, next) => {
    const { name, guests, date, time, menu, tableSeat } = req.body;
    try {
      const reservation = await Reservation.findById(req.params.id);
      if (!reservation) {
        return next(errorHandler(404, "Reservation not found"));
      }
      if (new Date(reservation.date) - new Date() < 86400000) {
        return res
          .status(400)
          .json({
            message: "Cannot update reservation less than a day in advance",
          });
      }
      if (req.user.id !== reservation.userRef.toString()) {
        return next(
          errorHandler(401, "You can only update your own reservation")
        );
      }
      reservation.name = name;
      reservation.guests = guests;
      reservation.date = date;
      reservation.time = time;
      reservation.menu = menu;
      reservation.tableSeat = tableSeat;

      await reservation.save();
      res
        .status(200)
        .json({ message: "Reservation updated successfully", reservation });
    } catch (error) {
      next(error);
    }
  });

  // Delete a reservation
  router.delete("/delete/:id", verifyToken, async (req, res, next) => {
    try {
      const reservation = await Reservation.findById(req.params.id);
      if (!reservation) {
        return next(errorHandler(404, "Reservation not found"));
      }
      if (req.user.id !== reservation.userRef.toString()) {
        return next(
          errorHandler(401, "You can only delete your own reservation")
        );
      }
      await Reservation.findByIdAndDelete(req.params.id);
      res.status(200).json("Reservation has been deleted");
    } catch (error) {
      next(error);
    }
  });
});
