$(function () {
  const selector = ".point-container input[type='checkbox']";

  // ===============================================================
  // STATE
  // ===============================================================

  function setState(box, state) {
    $(box).attr("data-state", state);

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
        box.checked = false;
        box.indeterminate = false;
        break;
    }
  }

  function getBoxes(box) {
    return $(box).closest(".point-container").find("input[type='checkbox']");
  }

  // ===============================================================
  // PREVENT NATIVE CHECKBOX BEHAVIOR
  //
  // All state changes are handled by mousedown.
  // ===============================================================

  $(document).on("click", selector, function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MOUSE DOWN
  // ===============================================================

  $(document).on("mousedown", selector, function (e) {
    e.preventDefault();

    const $boxes = getBoxes(this);
    const index = $boxes.index(this);
    const state = $(this).attr("data-state");

    // =============================================================
    // LEFT MOUSE BUTTON
    // =============================================================

    if (e.button === 0) {
      // -----------------------------------------------------------
      // OFF-LIMIT
      //
      // LMB does nothing to an off-limit point.
      // -----------------------------------------------------------

      if (state === "off-limit") {
        return;
      }

      // -----------------------------------------------------------
      // UNCHECKED → CHECKED
      //
      // Fill from the left through this point.
      // -----------------------------------------------------------

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          setState(this, "checked");
        });

        return;
      }

      // -----------------------------------------------------------
      // CHECKED
      //
      // Remove CHECKED points past this point.
      //
      // If there are no CHECKED points to the right, remove this
      // point itself.
      //
      // INDETERMINATE points to the right are preserved.
      // -----------------------------------------------------------

      if (state === "checked") {
        const $right = $boxes.slice(index + 1);

        const hasCheckedRight =
          $right.filter(function () {
            return $(this).attr("data-state") === "checked";
          }).length > 0;

        if (hasCheckedRight) {
          $right.each(function () {
            const rightState = $(this).attr("data-state");

            if (rightState === "off-limit") {
              return false;
            }

            if (rightState === "checked") {
              setState(this, "unchecked");
            }
          });
        } else {
          setState(this, "unchecked");
        }

        return;
      }

      // -----------------------------------------------------------
      // INDETERMINATE → CHECKED
      //
      // Promote this point to CHECKED.
      //
      // Indeterminate points to the right remain indeterminate.
      // -----------------------------------------------------------

      if (state === "indeterminate") {
        setState(this, "checked");

        // Everything to the left remains permanent.
        $boxes.slice(0, index).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          setState(this, "checked");
        });

        return;
      }
    }

    // =============================================================
    // MIDDLE MOUSE BUTTON
    // =============================================================

    if (e.button === 1) {
      // -----------------------------------------------------------
      // OFF-LIMIT
      // -----------------------------------------------------------

      if (state === "off-limit") {
        return;
      }

      // -----------------------------------------------------------
      // UNCHECKED → INDETERMINATE
      //
      // Fill from the left through this point temporarily.
      // -----------------------------------------------------------

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          if ($(this).attr("data-state") === "unchecked") {
            setState(this, "indeterminate");
          }
        });

        return;
      }

      // -----------------------------------------------------------
      // CHECKED → INDETERMINATE
      //
      // This point and all CHECKED points to the right become
      // INDETERMINATE.
      // -----------------------------------------------------------

      if (state === "checked") {
        $boxes.slice(index).each(function () {
          const currentState = $(this).attr("data-state");

          if (currentState === "off-limit") {
            return false;
          }

          if (currentState === "checked") {
            setState(this, "indeterminate");
          }
        });

        return;
      }

      // -----------------------------------------------------------
      // INDETERMINATE
      //
      // Remove INDETERMINATE points past this point.
      //
      // If there are no INDETERMINATE points to the right,
      // remove this point itself.
      // -----------------------------------------------------------

      if (state === "indeterminate") {
        const $right = $boxes.slice(index + 1);

        const hasIndeterminateRight =
          $right.filter(function () {
            return $(this).attr("data-state") === "indeterminate";
          }).length > 0;

        if (hasIndeterminateRight) {
          $right.each(function () {
            const rightState = $(this).attr("data-state");

            if (rightState === "off-limit") {
              return false;
            }

            if (rightState === "indeterminate") {
              setState(this, "unchecked");
            }
          });
        } else {
          setState(this, "unchecked");
        }

        return;
      }
    }

    // =============================================================
// RIGHT MOUSE BUTTON
// =============================================================

if (e.button === 2) {

  // -----------------------------------------------------------
  // CLICKING AN OFF-LIMIT POINT
  //
  // Remove THIS off-limit point and everything to its LEFT
  // that is also off-limit.
  //
  // Example:
  //
  //   ■ ■ ■ □ ╳ ╳
  //           RMB
  //   → ■ ■ ■ □ □ ╳
  //
  // -----------------------------------------------------------

  if (state === "off-limit") {
    for (let i = index; i >= 0; i--) {
      if ($boxes.eq(i).attr("data-state") !== "off-limit") {
        break;
      }

      setState($boxes[i], "unchecked");
    }

    return;
  }


  // -----------------------------------------------------------
  // CLICKING ANY NON-OFF-LIMIT POINT
  //
  // This point and everything to its RIGHT become off-limit.
  //
  // Example:
  //
  //   ■ ■ ■ □ □
  //       RMB
  //   → ■ ■ ■ ╳ ╳
  //
  // -----------------------------------------------------------

  $boxes.slice(index).each(function () {
    setState(this, "off-limit");
  });

  return;
}

  // ===============================================================
  // PREVENT RIGHT-CLICK CONTEXT MENU
  // ===============================================================

  $(document).on("contextmenu", selector, function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // PREVENT MIDDLE-CLICK AUXCLICK
  // ===============================================================

  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
