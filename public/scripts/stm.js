document.addEventListener("DOMContentLoaded", () => {
  const selector = ".point-container input[type='checkbox']";

  // ===============================================================
  // STATE
  // ===============================================================

  function setState(box, state) {
    box.dataset.state = state;

    // Keep native checkbox properties synchronized.
    switch (state) {
      case "checked":
        box.checked = true;
        box.indeterminate = false;
        break;

      case "indeterminate":
        box.checked = false;
        box.indeterminate = true;
        break;

      case "unchecked":
      case "off-limit":
      default:
        box.checked = false;
        box.indeterminate = false;
        break;
    }
  }

  function getBoxes(box) {
    return [
      ...box
        .closest(".point-container")
        .querySelectorAll("input[type='checkbox']"),
    ];
  }

  // ===============================================================
  // MOUSE DOWN
  // ===============================================================

  document.addEventListener("mousedown", (e) => {
    const box = e.target.closest(selector);

    if (!box) return;

    e.preventDefault();

    const boxes = getBoxes(box);
    const index = boxes.indexOf(box);
    const state = box.dataset.state;

    // =============================================================
    // LEFT MOUSE BUTTON
    // =============================================================

    if (e.button === 0) {
      // -----------------------------------------------------------
      // OFF-LIMIT
      //
      // Off-limit is NOT disabled.
      // LMB simply does nothing to the boundary.
      // -----------------------------------------------------------

      if (state === "off-limit") {
        return;
      }

      // -----------------------------------------------------------
      // INDETERMINATE
      //
      // If there is another indeterminate point to the right,
      // this point becomes CHECKED.
      //
      // If this is the LAST indeterminate point, clicking it
      // removes that temporary point instead.
      // -----------------------------------------------------------

      if (state === "indeterminate") {
        const hasIndeterminateRight = boxes
          .slice(index + 1)
          .some((b) => b.dataset.state === "indeterminate");

        if (hasIndeterminateRight) {
          setState(box, "checked");

          // Everything to the left remains checked.
          for (let i = 0; i < index; i++) {
            if (boxes[i].dataset.state === "off-limit") {
              break;
            }

            setState(boxes[i], "checked");
          }
        } else {
          // Last temporary point → remove it.
          setState(box, "unchecked");
        }

        return;
      }

      // -----------------------------------------------------------
      // CHECKED
      //
      // If there are CHECKED points to the right, clicking here
      // turns this point into the boundary between checked and
      // indeterminate.
      //
      // If there are NO checked points to the right, this is the
      // last checked point, so remove it.
      // -----------------------------------------------------------

      if (state === "checked") {
        const hasCheckedRight = boxes
          .slice(index + 1)
          .some((b) => b.dataset.state === "checked");

        if (!hasCheckedRight) {
          // Last checked point → unchecked.
          setState(box, "unchecked");

          return;
        }

        // There are checked points to the right.
        //
        // Normally the points to the right would be cleared.
        // If an indeterminate region already exists, preserve it.
        const hasIndeterminateRight = boxes
          .slice(index + 1)
          .some((b) => b.dataset.state === "indeterminate");

        for (let i = index + 1; i < boxes.length; i++) {
          const b = boxes[i];

          if (b.dataset.state === "off-limit") {
            break;
          }

          if (
            b.dataset.state === "checked" ||
            b.dataset.state === "indeterminate"
          ) {
            setState(b, hasIndeterminateRight ? "indeterminate" : "unchecked");
          }
        }

        return;
      }

      // -----------------------------------------------------------
      // UNCHECKED
      //
      // Fill from the left through this point.
      // -----------------------------------------------------------

      if (state === "unchecked") {
        for (let i = 0; i <= index; i++) {
          if (boxes[i].dataset.state === "off-limit") {
            break;
          }

          setState(boxes[i], "checked");
        }

        return;
      }
    }

    // =============================================================
    // MIDDLE MOUSE BUTTON
    // =============================================================

    if (e.button === 1) {
      // -----------------------------------------------------------
      // OFF-LIMIT
      //
      // It remains editable; MMB simply has no defined transition.
      // -----------------------------------------------------------

      if (state === "off-limit") {
        return;
      }

      // -----------------------------------------------------------
      // CHECKED → INDETERMINATE
      //
      // This and every consecutive CHECKED point to the right
      // become temporary.
      // -----------------------------------------------------------

      if (state === "checked") {
        for (let i = index; i < boxes.length; i++) {
          if (boxes[i].dataset.state === "off-limit") {
            break;
          }

          if (boxes[i].dataset.state === "checked") {
            setState(boxes[i], "indeterminate");
          }
        }

        return;
      }

      // -----------------------------------------------------------
      // INDETERMINATE
      //
      // No MMB transition.
      // -----------------------------------------------------------

      if (state === "indeterminate") {
        return;
      }

      // -----------------------------------------------------------
      // UNCHECKED
      //
      // Make available unchecked points through this point
      // indeterminate.
      // -----------------------------------------------------------

      if (state === "unchecked") {
        for (let i = 0; i <= index; i++) {
          if (boxes[i].dataset.state === "off-limit") {
            break;
          }

          if (boxes[i].dataset.state === "unchecked") {
            setState(boxes[i], "indeterminate");
          }
        }

        return;
      }
    }

    // =============================================================
    // RIGHT MOUSE BUTTON
    // =============================================================

    if (e.button === 2) {
      // -----------------------------------------------------------
      // RMB creates the off-limit boundary.
      //
      // This point and everything after it become off-limit.
      // -----------------------------------------------------------

      for (let i = index; i < boxes.length; i++) {
        setState(boxes[i], "off-limit");
      }

      return;
    }
  });

  // ===============================================================
  // Prevent native checkbox activation.
  // ===============================================================

  document.addEventListener("click", (e) => {
    const box = e.target.closest(selector);

    if (!box) return;

    e.preventDefault();
  });

  // ===============================================================
  // Prevent context menu.
  // ===============================================================

  document.addEventListener("contextmenu", (e) => {
    const box = e.target.closest(selector);

    if (!box) return;

    e.preventDefault();
  });

  // ===============================================================
  // Prevent middle-click auxclick/autoscroll behavior.
  // ===============================================================

  document.addEventListener("auxclick", (e) => {
    const box = e.target.closest(selector);

    if (!box) return;

    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
