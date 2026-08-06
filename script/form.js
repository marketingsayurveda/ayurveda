// La configuración vive en script/config.js, ignorado por git.
// Si falta, copia script/config.example.js a script/config.js.
const CONFIG = window.APP_CONFIG || {};
const WEB3FORMS_ACCESS_KEY = CONFIG.WEB3FORMS_ACCESS_KEY || "";
const WEB3FORMS_ENDPOINT =
  CONFIG.WEB3FORMS_ENDPOINT || "https://api.web3forms.com/submit";

const MESSAGES = {
  nameRequired: "Zadajte vaše meno a priezvisko.",
  nameShort: "Meno musí mať aspoň 2 znaky.",
  emailRequired: "Zadajte váš email.",
  emailInvalid: "Zadajte platnú emailovú adresu.",
  phoneInvalid: "Zadajte platné telefónne číslo.",
  messageLong: "Správa je príliš dlhá (max. 2000 znakov).",
  sending: "Odosielam…",
  success: "Ďakujeme! Vašu správu sme prijali a ozveme sa vám do 24 hodín.",
  error:
    "Správu sa nepodarilo odoslať. Skúste to znova alebo nám napíšte na info@ayurvedskepobyty.sk.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]{9,20}$/;
const MESSAGE_MAX_LENGTH = 2000;

const validateField = (input) => {
  const value = input.value.trim();

  if (input.name === "name") {
    if (!value) return MESSAGES.nameRequired;
    if (value.length < 2) return MESSAGES.nameShort;
  }

  if (input.name === "email") {
    if (!value) return MESSAGES.emailRequired;
    if (!EMAIL_PATTERN.test(value)) return MESSAGES.emailInvalid;
  }

  if (input.name === "phone") {
    if (value && !PHONE_PATTERN.test(value)) return MESSAGES.phoneInvalid;
  }

  if (input.name === "message") {
    if (value.length > MESSAGE_MAX_LENGTH) return MESSAGES.messageLong;
  }

  return "";
};

const pushEvent = (payload) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = form.querySelector("#form-status");
  const submitButton = form.querySelector(".submit-button");
  const submitLabel = submitButton.textContent.trim();
  const fields = ["name", "email", "phone", "message"]
    .map((name) => form.querySelector(`[name="${name}"]`))
    .filter(Boolean);

  const showError = (input, message) => {
    const errorNode = form.querySelector(`#${input.name}-error`);
    if (errorNode) {
      errorNode.textContent = message;
      errorNode.classList.toggle("is-visible", Boolean(message));
    }
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", String(Boolean(message)));
  };

  const clearErrors = () => {
    fields.forEach((input) => showError(input, ""));
  };

  const setStatus = (message, variant) => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("form-status--success", "form-status--error");
    if (message) {
      status.classList.add(`form-status--${variant}`);
    }
    status.classList.toggle("is-visible", Boolean(message));
  };

  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? MESSAGES.sending : submitLabel;
  };

  // Revalidación progresiva: solo se actualiza el error de un campo que ya
  // estaba marcado como inválido, para no molestar mientras se escribe.
  fields.forEach((input) => {
    const revalidate = () => {
      if (!input.classList.contains("is-invalid")) return;
      showError(input, validateField(input));
    };

    input.addEventListener("input", revalidate);
    input.addEventListener("change", revalidate);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("", "error");

    let firstInvalid = null;

    fields.forEach((input) => {
      const message = validateField(input);
      showError(input, message);
      if (message && !firstInvalid) {
        firstInvalid = input;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "TU_ACCESS_KEY_AQUI") {
      console.error(
        "form.js: falta configurar WEB3FORMS_ACCESS_KEY en script/config.js (plantilla: script/config.example.js). Crea la clave en https://web3forms.com con info@ayurvedskepobyty.sk."
      );
      setStatus(MESSAGES.error, "error");
      pushEvent({ event: "form_submit_error", form_name: "contact", error_type: "api" });
      return;
    }

    const retreatType = form.querySelector("[name='type']").value;

    pushEvent({ event: "form_submit_attempt", form_name: "contact" });
    setLoading(true);

    const payload = {
      ...Object.fromEntries(new FormData(form)),
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "Nová žiadosť o rezerváciu — ayurvedskepobyty.sk",
      from_name: "Ayurvédske pobyty — web",
    };

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!data.success) {
        setStatus(MESSAGES.error, "error");
        pushEvent({ event: "form_submit_error", form_name: "contact", error_type: "api" });
        return;
      }

      form.reset();
      clearErrors();
      setStatus(MESSAGES.success, "success");
      pushEvent({
        event: "form_submit_success",
        form_name: "contact",
        retreat_type: retreatType,
      });
    } catch (error) {
      setStatus(MESSAGES.error, "error");
      pushEvent({ event: "form_submit_error", form_name: "contact", error_type: "network" });
    } finally {
      setLoading(false);
    }
  });
});
