document.addEventListener("DOMContentLoaded", () => {
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

    const boxes = getBoxes(box);
    const index = boxes.indexOf(box);
    const state = box.dataset.state;

    // =============================================================
    // LEFT MOUSE BUTTON
    // =============================================================

    if (e.button === 0) {
      e.preventDefault();

      // -----------------------------------------------------------
      // LMB ON OFF-LIMIT
      // -----------------------------------------------------------

      if (state === "off-limit") {
        return;
      }

      // -----------------------------------------------------------
      // LMB ON INDETERMINATE
      //
      // This point becomes CHECKED.
      // Indeterminate points to the right remain untouched.
      // -----------------------------------------------------------

      if (state === "indeterminate") {
        setState(box, "checked");

        // Everything before it should remain checked.
        for (let i = 0; i < index; i++) {
          if (boxes[i].dataset.state === "off-limit") {
            break;
          }

          setState(boxes[i], "checked");
        }

        return;
      }

      // -----------------------------------------------------------
      // LMB ON CHECKED
      //
      // If an indeterminate region exists to the right, the points
      // that would normally be cleared become indeterminate.
      //
      // Otherwise they become unchecked.
      // -----------------------------------------------------------

      if (state === "checked") {
        const right = boxes.slice(index + 1);

        const hasIndeterminate = right.some(
          (b) => b.dataset.state === "indeterminate",
        );

        for (const b of right) {
          if (b.dataset.state === "off-limit") {
            break;
          }

          setState(b, hasIndeterminate ? "indeterminate" : "unchecked");
        }

        return;
      }

      // -----------------------------------------------------------
      // LMB ON UNCHECKED
      //
      // Fill points from the left through this point.
      // Stop at the off-limit boundary.
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
      e.preventDefault();

      // -----------------------------------------------------------
      // MMB ON OFF-LIMIT
      // -----------------------------------------------------------

      if (state === "off-limit") {
        return;
      }

      // -----------------------------------------------------------
      // MMB ON CHECKED
      //
      // This box and every checked box to its RIGHT become
      // indeterminate.
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
      // MMB ON INDETERMINATE
      //
      // Already temporary; do nothing.
      // -----------------------------------------------------------

      if (state === "indeterminate") {
        return;
      }

      // -----------------------------------------------------------
      // MMB ON UNCHECKED
      //
      // Turn available unchecked points from the left through this
      // point into indeterminate.
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
      e.preventDefault();

      // -----------------------------------------------------------
      // RMB:
      //
      // This point and everything to its RIGHT become off-limit.
      // -----------------------------------------------------------

      for (let i = index; i < boxes.length; i++) {
        setState(boxes[i], "off-limit");
      }

      return;
    }
  });

  // ===============================================================
  // STOP THE BROWSER FROM PERFORMING THE NATIVE CHECKBOX ACTION
  // ===============================================================

  document.addEventListener("click", (e) => {
    const box = e.target.closest(selector);

    if (!box) return;

    e.preventDefault();
  });

  // ===============================================================
  // STOP THE CONTEXT MENU
  // ===============================================================

  document.addEventListener("contextmenu", (e) => {
    const box = e.target.closest(selector);

    if (!box) return;

    e.preventDefault();
  });

  // ===============================================================
  // STOP MIDDLE-CLICK AUXCLICK
  // ===============================================================

  document.addEventListener("auxclick", (e) => {
    const box = e.target.closest(selector);

    if (!box) return;

    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
