window.addEventListener("load", async () => {
  // --- Elementos de reserva ---
  const professionalSelect = document.getElementById("professionalSelect");
  const daySelect = document.getElementById("daySelect");
  const hoursContainer = document.getElementById("hoursContainer");
  const bookingForm = document.getElementById("booking-form");
  const slotText = document.getElementById("slotText");
  const clientName = document.getElementById("clientName");
  const clientEmail = document.getElementById("clientEmail");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const bookingMsg = document.getElementById("bookingMsg");

  let selectedProfessional = null;
  let selectedDate = null;
  let selectedHour = null;

  // --- Cargar profesionales desde disponibilidad admin ---
  const loadProfessionals = async () => {
    const res = await fetch("/api/admin/availability");
    const availability = await res.json();
    Object.keys(availability).forEach(pro => {
      const option = document.createElement("option");
      option.value = pro;
      option.textContent = pro;
      professionalSelect.appendChild(option);
    });
  };
  await loadProfessionals();

  // --- Selección de profesional ---
  professionalSelect.addEventListener("change", () => {
    selectedProfessional = professionalSelect.value;
    daySelect.disabled = !selectedProfessional;
    hoursContainer.innerHTML = "";
    bookingForm.classList.add("hidden");
  });

  // --- Selección de día ---
  daySelect.addEventListener("change", async () => {
    selectedDate = daySelect.value;
    hoursContainer.innerHTML = "";
    bookingForm.classList.add("hidden");
    bookingMsg.textContent = "";

    if (!selectedProfessional || !selectedDate) return;

    const resAvailability = await fetch("/api/admin/availability");
    const availability = await resAvailability.json();
    const allSlots = availability[selectedProfessional]?.[selectedDate] || [];

    const resBookings = await fetch("/api/bookings");
    const bookings = await resBookings.json();

    const availableSlots = allSlots.filter(hour => {
      const datetime = `${selectedDate}T${hour}:00`;
      return !bookings.some(b => b.professional === selectedProfessional && b.datetime === datetime);
    });

    if (availableSlots.length === 0) {
      hoursContainer.textContent = "No hay horas disponibles para este día.";
      return;
    }

    availableSlots.forEach(hour => {
      const btn = document.createElement("button");
      btn.textContent = hour;
      btn.addEventListener("click", () => {
        selectedHour = hour;
        slotText.textContent = `Seleccionaste: ${selectedDate} a las ${selectedHour}`;
        bookingForm.classList.remove("hidden");
      });
      hoursContainer.appendChild(btn);
    });
  });

  // --- Cancelar reserva ---
  cancelBtn.addEventListener("click", () => {
    bookingForm.classList.add("hidden");
    bookingMsg.textContent = "";
    clientName.value = "";
    clientEmail.value = "";
  });

  // --- Confirmar reserva ---
  confirmBtn.addEventListener("click", async () => {
    if (!clientName.value.trim()) {
      bookingMsg.textContent = "Debes ingresar tu nombre";
      return;
    }
    const datetime = `${selectedDate}T${selectedHour}:00`;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: clientName.value.trim(),
        email: clientEmail.value.trim(),
        professional: selectedProfessional,
        datetime
      })
    });

    if (res.ok) {
      alert("Reserva creada ✅");
      bookingForm.classList.add("hidden");
      clientName.value = "";
      clientEmail.value = "";
      daySelect.dispatchEvent(new Event("change")); // refrescar slots
    } else {
      bookingMsg.textContent = "Error al crear la reserva";
    }
  });

  // ---------------- Admin login modal ----------------
  const adminBtn = document.getElementById("adminLoginBtn");
  const modal = document.getElementById("adminModal");
  const closeModal = document.getElementById("closeModal");
  const loginBtn = document.getElementById("loginBtn");
  const loginMsg = document.getElementById("loginMsg");

  // Abrir modal
  adminBtn.addEventListener("click", () => modal.classList.remove("hidden"));

  // Cerrar modal
  closeModal.addEventListener("click", () => modal.classList.add("hidden"));

  // Login admin (prototipo)
  loginBtn.addEventListener("click", () => {
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;

    // Credenciales hardcodeadas
    if (user === "admin" && pass === "1234") {
      window.location.href = "/admin/bookings"; // Redirige al admin
    } else {
      loginMsg.textContent = "Usuario o contraseña incorrectos";
      loginMsg.style.color = "red";
    }
  });
});
