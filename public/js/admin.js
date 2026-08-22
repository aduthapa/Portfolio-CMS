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

  // Page builder: drag-and-drop reordering of blocks, and the shared
  // edit dialog that shows only the fields relevant to each block's type.
  var blockList = document.getElementById("blockList");
  if (blockList) {
    var draggedBlock = null;

    blockList.addEventListener("dragstart", function (e) {
      draggedBlock = e.target.closest(".block-row");
      if (draggedBlock) draggedBlock.classList.add("dragging");
    });

    blockList.addEventListener("dragend", function () {
      if (draggedBlock) draggedBlock.classList.remove("dragging");
      draggedBlock = null;
      persistBlockOrder();
    });

    blockList.addEventListener("dragover", function (e) {
      e.preventDefault();
      var target = e.target.closest(".block-row");
      if (!target || target === draggedBlock || !draggedBlock) return;
      var rect = target.getBoundingClientRect();
      var before = e.clientY - rect.top < rect.height / 2;
      blockList.insertBefore(draggedBlock, before ? target : target.nextSibling);
    });

    function persistBlockOrder() {
      var ids = Array.prototype.map.call(
        blockList.querySelectorAll(".block-row"),
        function (row) { return Number(row.getAttribute("data-id")); }
      );
      fetch(blockList.getAttribute("data-reorder-url"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: ids }),
      }).catch(function () {});
    }

    var blockDialog = document.getElementById("editBlockDialog");
    var blockForm = document.getElementById("editBlockForm");
    var closeBlockBtn = document.getElementById("closeEditBlockDialog");
    var fieldGroups = blockDialog.querySelectorAll("[data-fields]");

    function renderGalleryExisting(images) {
      var container = document.getElementById("f-gallery-existing");
      container.innerHTML = "";
      images.forEach(function (img) {
        var wrap = document.createElement("label");
        wrap.className = "gallery-edit-item";
        wrap.innerHTML =
          '<img src="' + img.url + '" alt="" />' +
          '<span><input type="checkbox" name="removeUrls" value="' + img.url + '" /> Remove</span>';
        container.appendChild(wrap);
      });
    }

    document.querySelectorAll(".edit-block-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var type = btn.getAttribute("data-type");
        var content = JSON.parse(btn.getAttribute("data-content") || "{}");

        blockForm.action = "/admin/builder/" + id + "?_method=PUT";

        fieldGroups.forEach(function (group) {
          group.style.display = group.getAttribute("data-fields") === type ? "" : "none";
        });

        if (type === "HEADING") {
          document.getElementById("f-heading-text").value = content.text || "";
          document.getElementById("f-heading-level").value = content.level || "h2";
        } else if (type === "TEXT") {
          document.getElementById("f-text-text").value = content.text || "";
        } else if (type === "IMAGE") {
          var preview = document.getElementById("f-image-preview");
          if (content.url) {
            preview.src = content.url;
            preview.style.display = "block";
          } else {
            preview.style.display = "none";
          }
          document.getElementById("f-image-caption").value = content.caption || "";
        } else if (type === "GALLERY") {
          renderGalleryExisting(content.images || []);
          var existingField = blockForm.querySelector('input[name="existingImages"]');
          if (!existingField) {
            existingField = document.createElement("input");
            existingField.type = "hidden";
            existingField.name = "existingImages";
            blockForm.appendChild(existingField);
          }
          existingField.value = JSON.stringify(content.images || []);
        } else if (type === "BUTTON") {
          document.getElementById("f-button-label").value = content.label || "";
          document.getElementById("f-button-url").value = content.url || "";
          document.getElementById("f-button-style").value = content.style || "primary";
        } else if (type === "VIDEO") {
          document.getElementById("f-video-url").value = content.url || "";
        }

        if (typeof blockDialog.showModal === "function") blockDialog.showModal();
      });
    });

    if (closeBlockBtn) closeBlockBtn.addEventListener("click", function () { blockDialog.close(); });
  }
})();
