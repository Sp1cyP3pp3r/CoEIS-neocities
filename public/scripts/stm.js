$(function () {
  // ===============================================================
  // SELECTOR
  // ===============================================================

  const selector = ".point-container input[type='checkbox']";

  // ===============================================================
  // STATE MANAGEMENT
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
  // ===============================================================

  $(document).on("click", selector, function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MOUSE INPUT
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
      // OFF-LIMIT

      if (state === "off-limit") {
        return;
      }

      // UNCHECKED → CHECKED

      if (state === "unchecked") {
        $boxes.slice(0, index + 1).each(function () {
          if ($(this).attr("data-state") === "off-limit") {
            return false;
          }

          setState(this, "checked");
        });

        return;
      }

      // CHECKED → UNCHECKED

      if (state === "checked") {
        $boxes.slice(index).each(function () {
          const currentState = $(this).attr("data-state");

          if (currentState === "off-limit") {
            return false;
          }

          if (currentState === "checked") {
            setState(this, "unchecked");
          }
        });

        return;
      }

      // INDETERMINATE → CHECKED

      if (state === "indeterminate") {
        setState(this, "checked");

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
      // OFF-LIMIT

      if (state === "off-limit") {
        return;
      }

      // UNCHECKED → INDETERMINATE

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

      // CHECKED → INDETERMINATE

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

      // INDETERMINATE → UNCHECKED

      if (state === "indeterminate") {
        $boxes.slice(index).each(function () {
          const currentState = $(this).attr("data-state");

          if (currentState === "off-limit") {
            return false;
          }

          if (currentState === "indeterminate") {
            setState(this, "unchecked");
          }
        });

        return;
      }
    }

    // =============================================================
    // RIGHT MOUSE BUTTON
    // =============================================================

    if (e.button === 2) {
      // OFF-LIMIT → REMOVE PREVIOUS OFF-LIMIT POINTS

      if (state === "off-limit") {
        if (
          index > 0 &&
          $boxes.eq(index - 1).attr("data-state") === "off-limit"
        ) {
          for (let i = index - 1; i >= 0; i--) {
            if ($boxes.eq(i).attr("data-state") !== "off-limit") {
              break;
            }

            setState($boxes[i], "unchecked");
          }
        } else {
          setState(this, "unchecked");
        }

        return;
      }

      // SET OFF-LIMIT FROM CURRENT POINT

      $boxes.slice(index).each(function () {
        setState(this, "off-limit");
      });

      return;
    }
  });

  // ===============================================================
  // CONTEXT MENU
  // ===============================================================

  $(document).on("contextmenu", selector, function (e) {
    e.preventDefault();
  });

  // ===============================================================
  // MIDDLE-CLICK AUXILIARY EVENT
  // ===============================================================

  $(document).on("auxclick", selector, function (e) {
    if (e.button === 1) {
      e.preventDefault();
    }
  });
});
