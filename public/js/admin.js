(function () {
  // Sidebar toggle on small screens.
  var sidebarToggle = document.getElementById("sidebarToggle");
  var sidebar = document.getElementById("adminSidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  // Live image preview for file inputs marked with data-preview="<id>".
  document.querySelectorAll(".image-input").forEach(function (input) {
    input.addEventListener("change", function () {
      var previewId = input.getAttribute("data-preview");
      var preview = previewId && document.getElementById(previewId);
      if (!preview || !input.files || !input.files[0]) return;
      preview.src = URL.createObjectURL(input.files[0]);
      preview.style.display = "block";
    });
  });

  // Add / remove dynamic social link rows on the profile form.
  var addSocialBtn = document.getElementById("addSocialLink");
  var socialList = document.getElementById("socialLinksList");
  var socialTemplate = document.getElementById("socialLinkTemplate");
  if (addSocialBtn && socialList && socialTemplate) {
    addSocialBtn.addEventListener("click", function () {
      socialList.appendChild(socialTemplate.content.cloneNode(true));
    });
  }
  document.addEventListener("click", function (e) {
    if (e.target.classList && e.target.classList.contains("remove-row")) {
      var row = e.target.closest(".social-link-row");
      if (row) row.remove();
    }
  });

  // Portfolio gallery: drag-and-drop reordering, persisted via fetch.
  var sortable = document.getElementById("portfolioSortable");
  if (sortable) {
    var dragged = null;

    sortable.addEventListener("dragstart", function (e) {
      dragged = e.target.closest(".portfolio-admin-tile");
      if (dragged) dragged.classList.add("dragging");
    });

    sortable.addEventListener("dragend", function () {
      if (dragged) dragged.classList.remove("dragging");
      dragged = null;
      persistOrder();
    });

    sortable.addEventListener("dragover", function (e) {
      e.preventDefault();
      var target = e.target.closest(".portfolio-admin-tile");
      if (!target || target === dragged || !dragged) return;
      var rect = target.getBoundingClientRect();
      var before = e.clientY - rect.top < rect.height / 2;
      sortable.insertBefore(dragged, before ? target : target.nextSibling);
    });

    function persistOrder() {
      var ids = Array.prototype.map.call(
        sortable.querySelectorAll(".portfolio-admin-tile"),
        function (tile) { return Number(tile.getAttribute("data-id")); }
      );
      fetch(sortable.getAttribute("data-reorder-url"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: ids }),
      }).catch(function () {});
    }

    // Edit-item modal: prefill fields and point the form at this item.
    var dialog = document.getElementById("editPortfolioDialog");
    var editForm = document.getElementById("editPortfolioForm");
    var closeBtn = document.getElementById("closeEditDialog");
    var basePath = sortable.getAttribute("data-reorder-url").replace(/\/reorder$/, "");

    document.querySelectorAll(".edit-portfolio-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        editForm.action = basePath + "/" + btn.getAttribute("data-id") + "?_method=PUT";
        document.getElementById("editTitle").value = btn.getAttribute("data-title") || "";
        document.getElementById("editCategory").value = btn.getAttribute("data-category") || "";
        document.getElementById("editDescription").value = btn.getAttribute("data-description") || "";
        document.getElementById("editFeatured").checked = btn.getAttribute("data-featured") === "true";
        if (typeof dialog.showModal === "function") dialog.showModal();
      });
    });
    if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });
  }
})();
