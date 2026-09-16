$(function () {
  const selector = ".point-container input[type='checkbox']";

  // ===============================================================
  // STATE
  // ===============================================================

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

  // ===============================================================
  // NATIVE CHECKBOX CLICK
  //
  // We handle everything ourselves with mousedown.
  // This prevents the browser from toggling the checkbox afterward.
  // ===============================================================

  $(document).on("click", selector, function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MOUSE BUTTONS
  // ===============================================================

  $(document).on("mousedown", selector, function (e) {
    const $boxes = $(this).closest(".point-container").find(selector);

    const index = $boxes.index(this);

    // ---------------------------------------------------------------
    // LEFT MOUSE BUTTON
    // ---------------------------------------------------------------

    if (e.button === 0) {
      e.preventDefault();

      const state = this.dataset.state;

      // -------------------------------------------------------------
      // LMB: INDETERMINATE → CHECKED
      //
      // Right-side indeterminate points stay untouched.
      // -------------------------------------------------------------

      if (state === "indeterminate") {
        setState(this, "checked");

        // Everything to the left stays checked.
        $boxes.slice(0, index).each(function () {
          if (this.dataset.state !== "off-limit") {
            setState(this, "checked");
          }
        });

        return;
      }

      // -------------------------------------------------------------
      // LMB: CHECKED
      //
      // Normally everything to the right becomes unchecked.
      //
      // If there are temporary points to the right, however,
      // everything that would normally be removed becomes
      // indeterminate instead.
      // -------------------------------------------------------------

      if (state === "checked") {
        const $right = $boxes.slice(index + 1);

        const hasIndeterminateRight = $right
          .toArray()
          .some((box) => box.dataset.state === "indeterminate");

        $right.each(function () {
          if (this.dataset.state === "off-limit") {
            return;
          }

          setState(this, hasIndeterminateRight ? "indeterminate" : "unchecked");
        });

        return;
      }

      // -------------------------------------------------------------
      // LMB: UNCHECKED → CHECKED
      //
      // Fill from the left through this point.
      // -------------------------------------------------------------

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if (this.dataset.state !== "off-limit") {
            setState(this, "checked");
          }
        });

        return;
      }

      // -------------------------------------------------------------
      // LMB: OFF-LIMIT
      //
      // Nothing happens.
      // -------------------------------------------------------------

      return;
    }

    // ---------------------------------------------------------------
    // MIDDLE MOUSE BUTTON
    // ---------------------------------------------------------------

    if (e.button === 1) {
      e.preventDefault();

      const state = this.dataset.state;

      // -------------------------------------------------------------
      // MMB: CHECKED → INDETERMINATE
      //
      // This box and every CHECKED box to its right become temporary.
      // -------------------------------------------------------------

      if (state === "checked") {
        $boxes.slice(index).each(function () {
          if (this.dataset.state === "checked") {
            setState(this, "indeterminate");
          }
        });

        return;
      }

      // -------------------------------------------------------------
      // MMB: INDETERMINATE
      //
      // Already temporary; nothing changes.
      // -------------------------------------------------------------

      if (state === "indeterminate") {
        return;
      }

      // -------------------------------------------------------------
      // MMB: UNCHECKED
      //
      // Make unchecked points from the left through this point
      // temporary.
      // -------------------------------------------------------------

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if (this.dataset.state === "unchecked") {
            setState(this, "indeterminate");
          }
        });

        return;
      }

      // -------------------------------------------------------------
      // MMB: OFF-LIMIT
      // -------------------------------------------------------------

      return;
    }

    // ---------------------------------------------------------------
    // RIGHT MOUSE BUTTON
    // ---------------------------------------------------------------

    if (e.button === 2) {
      e.preventDefault();

      // This point and everything to its right become OFF-LIMIT.
      $boxes.slice(index).each(function () {
        setState(this, "off-limit");
      });

      return;
    }
  });

  // ===============================================================
  // RIGHT-CLICK CONTEXT MENU
  //
  // Prevent the browser menu from appearing.
  // The actual state change is already handled by mousedown above.
  // ===============================================================

  $(document).on("contextmenu", ".point-container", function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MIDDLE-CLICK AUTOSCROLL / AUXCLICK
  // ===============================================================

  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
