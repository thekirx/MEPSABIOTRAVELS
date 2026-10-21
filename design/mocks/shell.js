// Shared top bar + footer. <body data-page="home"> marks the active page.
(function () {
  const items = [
    ["home", "Home", "home.html"],
    ["inquiries", "People asking", "inquiries.html"],
    ["quotes", "Quotes", "quotation.html"],
    ["payments", "Payments", "payments.html", "", true],
    ["visas", "Visas", "visas.html"],
  ];
  const page = document.body.dataset.page;
  const nav = items.map(([key, label, href, count, late]) =>
    `<a href="${href}" class="${key === page ? "active" : ""}"${key === page ? ' aria-current="page"' : ""}>${label}${late ? '<span class="dot" aria-label="has late payments"></span>' : ""}</a>`).join("");
  const bar = document.getElementById("appbar");
  if (bar) bar.outerHTML = `
  <header class="appbar"><div class="appbar-in">
    <a class="brand" href="home.html"><img src="assets/mep-mark.png" alt="MEP Sabio Travel" /></a>
    <nav class="topnav" aria-label="Main">${nav}</nav>
    <div class="appbar-right">
      <span class="demo">DEMO</span>
      <span class="me" title="Isabel Santos">IS</span>
    </div>
  </div></header>`;
  const foot = document.getElementById("footer");
  if (foot) foot.outerHTML = `
  <footer class="footer"><span><b>MEP Sabio Travel</b> · Quality travel for less</span><span>reservations@meptravel.com</span><span>mepsabiotravel.com</span><span style="margin-left:auto">DEMO — simulated data. No real customers or payments.</span>${window.MEP ? '<button class="reset" onclick="MEP.reset()">Reset demo</button>' : ""}</footer>`;
})();
