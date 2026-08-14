(() => {
  const sourcePattern = /^[a-z0-9][a-z0-9._-]{0,63}$/;

  for (const form of document.querySelectorAll("[data-beta-signup-form]")) {
    const emailInput = form.elements.email;
    const companyInput = form.elements.company;
    const status = form.querySelector("[data-form-status]");
    const buttons = [...form.querySelectorAll("button[type='submit']")];

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) {
        setStatus("error", form.dataset.invalid);
        return;
      }

      const channel = event.submitter?.dataset.channel;
      if (channel !== "email" && channel !== "whatsapp") return;
      const ref = new URLSearchParams(window.location.search).get("ref")?.toLowerCase() ?? "direct";
      const source = sourcePattern.test(ref) ? ref : "other";

      setBusy(true);
      setStatus("pending", channel === "whatsapp" ? form.dataset.whatsapp : form.dataset.pending);
      try {
        const response = await fetch(form.dataset.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.value,
            company: companyInput.value,
            locale: form.dataset.locale,
            channel,
            source
          })
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(result.error ?? "request_failed");
        if (channel === "whatsapp" && typeof result.whatsappUrl === "string") {
          window.location.assign(result.whatsappUrl);
          return;
        }
        emailInput.value = "";
        setStatus("success", form.dataset.success);
      } catch {
        setStatus("error", form.dataset.error);
      } finally {
        setBusy(false);
      }
    });

    function setBusy(busy) {
      emailInput.disabled = busy;
      for (const button of buttons) button.disabled = busy;
    }

    function setStatus(state, message) {
      status.dataset.state = state;
      status.textContent = message ?? "";
    }
  }
})();
