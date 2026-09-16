$(function () {
  const selector = ".point-container input[type='checkbox']";

  // ---------------------------------------------------------------
  // Keep native checkbox properties synchronized with data-state.
  // ---------------------------------------------------------------
  function setState(box, state) {
    box.dataset.state = state;

    switch (state) {
      case "checked":
        box.checked = true;
        box.indeterminate = false;
        break;

      case "indeterminate":
        box.checked = false;
        box.indeterminate = true;
        break;

      case "off-limit":
        box.checked = false;
        box.indeterminate = false;
        break;

      case "unchecked":
      default:
        box.checked = false;
        box.indeterminate = false;
        break;
    }
  }

  // ---------------------------------------------------------------
  // LEFT CLICK
  // ---------------------------------------------------------------
  $(document).on("mousedown", selector, function (e) {
    if (e.button !== 0) return;

    e.preventDefault();

    const $boxes = $(this).closest(".point-container").find(selector);

    const index = $boxes.index(this);
    const state = this.dataset.state;

    // =============================================================
    // LMB on INDETERMINATE
    //
    // This point becomes CHECKED.
    // Indeterminate points to the right remain indeterminate.
    // =============================================================
    if (state === "indeterminate") {
      setState(this, "checked");

      // Everything to the left remains checked.
      $boxes.slice(0, index).each(function () {
        if (this.dataset.state !== "off-limit") {
          setState(this, "checked");
        }
      });

      return;
    }

    // =============================================================
    // LMB on CHECKED
    //
    // Normally, everything to the right becomes UNCHECKED.
    //
    // If an INDETERMINATE section exists to the right, everything
    // that would normally become unchecked instead becomes
    // INDETERMINATE.
    // =============================================================
    if (state === "checked") {
      const boxesRight = $boxes.slice(index + 1);

      const hasIndeterminateRight = boxesRight
        .toArray()
        .some((box) => box.dataset.state === "indeterminate");

      boxesRight.each(function () {
        // Off-limit defines the hard maximum and remains untouched.
        if (this.dataset.state === "off-limit") return;

        setState(this, hasIndeterminateRight ? "indeterminate" : "unchecked");
      });

      return;
    }

    // =============================================================
    // LMB on UNCHECKED
    //
    // Fill every available point from the left through this point.
    // =============================================================
    if (state === "unchecked") {
      $boxes.slice(0, index + 1).each(function () {
        if (this.dataset.state === "off-limit") return;

        setState(this, "checked");
      });

      return;
    }

    // =============================================================
    // LMB on OFF-LIMIT
    //
    // Nothing happens.
    // =============================================================
  });

  // ---------------------------------------------------------------
  // MIDDLE CLICK
  // ---------------------------------------------------------------
  $(document).on("mousedown", selector, function (e) {
    if (e.button !== 1) return;

    e.preventDefault();

    const $boxes = $(this).closest(".point-container").find(selector);

    const index = $boxes.index(this);
    const state = this.dataset.state;

    // =============================================================
    // MMB on CHECKED
    //
    // This point and every CHECKED point to its right become
    // INDETERMINATE.
    // =============================================================
    if (state === "checked") {
      $boxes.slice(index).each(function () {
        if (this.dataset.state === "checked") {
          setState(this, "indeterminate");
        }
      });

      return;
    }

    // =============================================================
    // MMB on INDETERMINATE
    //
    // Already temporary, so leave it alone.
    // =============================================================
    if (state === "indeterminate") {
      return;
    }

    // =============================================================
    // MMB on UNCHECKED
    //
    // Make available unchecked points from the left through this
    // point INDETERMINATE.
    // =============================================================
    if (state === "unchecked") {
      $boxes.slice(0, index + 1).each(function () {
        if (this.dataset.state === "unchecked") {
          setState(this, "indeterminate");
        }
      });

      return;
    }

    // =============================================================
    // MMB on OFF-LIMIT
    //
    // Nothing happens.
    // =============================================================
  });

  // ---------------------------------------------------------------
  // RIGHT CLICK
  // ---------------------------------------------------------------
  $(document).on("contextmenu", ".point-container", function (e) {
    e.preventDefault();

    const element = document.elementFromPoint(e.clientX, e.clientY);

    if (!element || !element.matches(selector)) {
      return;
    }

    const $boxes = $(this).find(selector);
    const index = $boxes.index(element);

    if (index === -1) return;

    // =============================================================
    // RMB:
    //
    // This point and everything to its RIGHT become OFF-LIMIT.
    //
    // Nothing to the left is changed.
    // =============================================================
    $boxes.slice(index).each(function () {
      setState(this, "off-limit");
    });
  });

  // ---------------------------------------------------------------
  // Prevent middle-click browser behavior.
  // ---------------------------------------------------------------
  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
