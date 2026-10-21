// Working-prototype helpers for the front screens: saved state, a simple form dialog, and a toast.
// State lives in this browser only (localStorage), so the demo flow carries across pages.
window.MEP = (function () {
  const KEY = "mep-mock-v1";
  const fresh = () => ({
    jobs: { ticket: null, camillePaid: 0 },  // ticket = airline reference once recorded
    leads: null,                              // per-person stage overrides + added people
    trip: null,                               // Andrea's booking once "Yes, book it" is pressed
  });
  let state;
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { state = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const reset = () => { try { localStorage.removeItem(KEY); } catch {} location.reload(); };

  const peso = (n) => "₱" + Number(n).toLocaleString("en-PH", { maximumFractionDigits: 2 });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Parse a peso amount typed by staff: digits, optional commas, up to 2 decimals.
  function amount(raw) {
    const s = String(raw).replace(/[₱,\s]/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
    return Number(s);
  }

  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3200);
  }

  // fields: [{ id, label, type: "text"|"number"|"select", options, hint, value, placeholder }]
  // validate(values) -> { fieldId: "message" } ; onSubmit(values) runs only when there are no errors.
  function dialog({ title, intro = "", fields = [], submit = "Save", danger = false, validate = () => ({}), onSubmit }) {
    const d = document.createElement("dialog");
    d.className = "dlg";
    d.innerHTML = `<form method="dialog" novalidate>
      <h2>${esc(title)}</h2>${intro ? `<p class="intro">${intro}</p>` : ""}
      ${fields.map((f) => `<div class="fld"><label for="f-${f.id}">${esc(f.label)}</label>
        ${f.type === "select"
          ? `<select id="f-${f.id}" name="${f.id}">${f.options.map((o) => `<option${o === f.value ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`
          : `<input id="f-${f.id}" name="${f.id}" ${f.type === "number" ? 'inputmode="decimal"' : ""} value="${esc(f.value ?? "")}" placeholder="${esc(f.placeholder ?? "")}" autocomplete="off" aria-describedby="e-${f.id} h-${f.id}" />`}
        ${f.hint ? `<span class="hint" id="h-${f.id}">${f.hint}</span>` : ""}
        <span class="err" id="e-${f.id}" role="alert"></span></div>`).join("")}
      <div class="dlg-acts"><button type="button" class="btn ghost small" value="cancel">Cancel</button><button type="submit" class="btn ${danger ? "" : "lime"} small">${esc(submit)}</button></div>
    </form>`;
    document.body.appendChild(d);
    const form = d.querySelector("form");
    d.querySelector('[value="cancel"]').onclick = () => d.close();
    d.addEventListener("close", () => d.remove());
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      const errs = validate(values) || {};
      fields.forEach((f) => { const el = d.querySelector("#e-" + f.id); el.textContent = errs[f.id] || ""; d.querySelector("#f-" + f.id).toggleAttribute("aria-invalid", !!errs[f.id]); });
      const first = fields.find((f) => errs[f.id]);
      if (first) { d.querySelector("#f-" + first.id).focus(); return; }
      d.close();
      onSubmit(values);
    });
    d.showModal();
    const firstInput = d.querySelector("input, select");
    if (firstInput) firstInput.focus();
  }

  function confirmBox({ title, body, yes = "Yes", onYes }) {
    dialog({ title, intro: body, fields: [], submit: yes, onSubmit: onYes });
  }

  return { state, save, reset, peso, esc, amount, toast, dialog, confirm: confirmBox };
})();
